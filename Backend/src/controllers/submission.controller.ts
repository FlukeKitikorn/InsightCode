import type { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import vm from "node:vm";
import { performance } from "node:perf_hooks";
import { isDeepStrictEqual } from "node:util";
import { judgeQueue } from "../queue/judgeQueue.js";
import { openRouterChat } from "../lib/openrouter.js";

type SupportedLanguage = "javascript" | "typescript";

function parseMaybeJson(value: string | null): unknown {
  if (value == null) return null;
  const trimmed = value.trim();
  if (!trimmed) return "";
  try {
    return JSON.parse(trimmed);
  } catch {
    return trimmed;
  }
}

function safeStringify(value: unknown): string {
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function analyzeCode(
  code: string,
  language: string,
  evalResult?: { passedCount: number; totalCount: number; executionTimeMs: number }
) {
  const lines = code.split(/\r?\n/);
  const nonEmpty = lines.filter((l) => l.trim().length > 0);
  const hasNestedLoop =
    /\bfor\s*\(/.test(code) && /\bfor\s*\(/.test(code.replace(/\bfor\s*\(/, ""));
  const hasRecursion = /\bsolve\s*\(/.test(code) && /return\s+solve\s*\(/.test(code);
  const usesMap = /\bMap\b|\bSet\b/.test(code);
  const hasComments = lines.some((l) => l.trim().startsWith("//") || l.trim().startsWith("#"));

  const hints: string[] = [];
  if (hasNestedLoop) hints.push("พบโครงสร้าง loop ซ้อนกัน อาจเสี่ยงช้าใน input ใหญ่");
  if (hasRecursion) hints.push("ใช้ recursion ตรวจสอบ stack depth / base case ให้ชัดเจน");
  if (usesMap) hints.push("ใช้ Map/Set ดีสำหรับลดเวลา lookup");
  if (nonEmpty.length < 10) hints.push("โค้ดสั้นมาก อาจยังไม่ครอบคลุม edge cases");
  if (!hasComments) hints.push("ยังไม่มี comment อธิบาย logic อาจทำให้โค้ดอ่านยากเมื่อเวลาผ่านไป");

  // ─── Component 1: Correctness (สูงสุด ~60 คะแนน) ───────────────────────────
  let correctnessScore = 0;
  if (evalResult && evalResult.totalCount > 0) {
    const ratio = evalResult.passedCount / evalResult.totalCount; // 0–1
    correctnessScore = ratio * 60;
    if (ratio < 1) {
      hints.push(
        `ยังมี test case ที่ไม่ผ่าน (${evalResult.passedCount}/${evalResult.totalCount}) ลองตรวจสอบ edge cases เพิ่มเติม`
      );
    }
  }

  // ─── Component 2: Code quality / structure (สูงสุด ~25 คะแนน) ──────────────
  const nonEmptyCount = nonEmpty.length;
  let structureScore = 10;
  if (nonEmptyCount >= 15 && nonEmptyCount <= 60) structureScore += 5; // ยาวกำลังดี
  if (nonEmptyCount > 80) structureScore -= 5; // ยาวมาก อาจ split ฟังก์ชันได้
  if (usesMap) structureScore += 5;
  if (hasNestedLoop) structureScore -= 5;
  if (hasRecursion) structureScore += 2;
  if (hasComments) structureScore += 3;
  structureScore = Math.min(25, Math.max(0, structureScore));

  // ─── Component 3: Performance approximation (สูงสุด ~15 คะแนน) ─────────────
  let perfScore = 7.5; // default กลาง ๆ ถ้าไม่มีข้อมูลเวลา
  if (evalResult) {
    // สมมติช่วงเวลาที่เหมาะสม ~0–3000ms
    const norm = Math.max(0, Math.min(1, evalResult.executionTimeMs / 3000));
    const perfFactor = 1 - norm; // ยิ่งเร็วยิ่งเข้าใกล้ 1
    perfScore = perfFactor * 15;
    if (evalResult.executionTimeMs > 1500) {
      hints.push(
        `เวลา run ค่อนข้างสูง (~${Math.round(
          evalResult.executionTimeMs
        )}ms) ลองพิจารณาปรับปรุง complexity หรือหลีกเลี่ยง loop ซ้อน`
      );
    }
  }

  const rawScore = correctnessScore + structureScore + perfScore;
  const qualityScore = Math.round(Math.max(0, Math.min(100, rawScore)));

  const analysisText =
    `Language: ${language}\n` +
    `Lines: ${nonEmpty.length}\n` +
    (evalResult
      ? `Tests: ${evalResult.passedCount}/${evalResult.totalCount} passed\nExecution: ~${Math.round(
          evalResult.executionTimeMs
        )}ms\n`
      : "") +
    (hints.length ? `Insights:\n- ${hints.join("\n- ")}\n` : "Insights:\n- ยังไม่มีสัญญาณผิดปกติ\n");

  return { analysisText, qualityScore };
}

const LLM_ANALYSIS_SYSTEM = `You are a code reviewer for a programming exercise platform. Analyze the submitted code and give brief, constructive feedback in Thai.
Consider: correctness (did tests pass?), code clarity, structure, and performance.
Output format:
1. First: your analysis text in Thai (2–5 short bullet points or paragraphs).
2. Last line: only a single integer 0–100 for quality score (e.g. 75).`;

async function analyzeCodeWithLLM(
  code: string,
  language: string,
  evalResult: { passedCount: number; totalCount: number; executionTimeMs: number }
): Promise<{ analysisText: string; qualityScore: number }> {
  const userContent = [
    `Language: ${language}`,
    `Test result: ${evalResult.passedCount}/${evalResult.totalCount} passed`,
    `Execution time: ~${evalResult.executionTimeMs} ms`,
    "",
    "Code:",
    "```",
    code,
    "```",
    "",
    "Reply with your analysis in Thai, then on the last line write only the quality score 0–100.",
  ].join("\n");

  const raw = await openRouterChat({
    messages: [
      { role: "system", content: LLM_ANALYSIS_SYSTEM },
      { role: "user", content: userContent },
    ],
    max_tokens: 600,
    temperature: 0.3,
  });

  const lines = raw.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  let qualityScore = 50;
  let analysisText = raw;

  // Parse score: last line only digits, or any line with number 0-100
  const lastLine = lines[lines.length - 1];
  if (lastLine) {
    const onlyNum = /^\d{1,3}$/.exec(lastLine);
    const numInLine = /\b(\d{1,3})\b/.exec(lastLine);
    const score = onlyNum
      ? parseInt(onlyNum[0], 10)
      : numInLine
        ? parseInt(numInLine[1], 10)
        : NaN;
    if (!Number.isNaN(score)) {
      qualityScore = Math.max(0, Math.min(100, score));
      if (onlyNum) analysisText = lines.slice(0, -1).join("\n").trim() || raw;
    }
  }

  if (!analysisText) analysisText = raw;
  return { analysisText, qualityScore };
}

function runJsLike(code: string, input: unknown) {
  const logs: string[] = [];
  const sandbox = {
    console: {
      log: (...args: unknown[]) => logs.push(args.map((a) => safeStringify(a)).join(" ")),
      error: (...args: unknown[]) => logs.push(args.map((a) => safeStringify(a)).join(" ")),
      warn: (...args: unknown[]) => logs.push(args.map((a) => safeStringify(a)).join(" ")),
    },
    input,
    result: undefined as unknown,
  };

  const wrapped = `
    "use strict";
    const __getSolve = () => {
      ${code}
      return typeof solve === "function" ? solve : null;
    };
    const __solve = __getSolve();
    if (!__solve) throw new Error("Expected a function named solve(input)");
    result = __solve(input);
  `;

  const script = new vm.Script(wrapped, { filename: "submission.js" });
  const context = vm.createContext(sandbox);
  script.runInContext(context, { timeout: 800 });

  return { result: sandbox.result, logs };
}

async function evaluate(problemId: string, language: SupportedLanguage, code: string, includeHidden: boolean) {
  const problem = await prisma.problem.findUnique({
    where: { id: problemId },
    include: {
      testCases: { orderBy: { id: "asc" } },
    },
  });

  if (!problem) {
    return { error: "Problem not found" as const };
  }

  const testCases = problem.testCases.filter((tc) => (includeHidden ? true : !tc.isHidden));
  const results: Array<{
    id: number;
    passed: boolean;
    actual: unknown;
    expected: unknown;
    isHidden: boolean;
    logs: string[];
    error?: string;
  }> = [];

  const start = performance.now();
  for (const tc of testCases) {
    const input = parseMaybeJson(tc.inputData);
    const expected = parseMaybeJson(tc.expectedOutput);
    try {
      const { result, logs } = runJsLike(code, input);
      const passed = isDeepStrictEqual(result, expected);
      results.push({
        id: tc.id,
        passed,
        actual: tc.isHidden ? null : result,
        expected: tc.isHidden ? null : expected,
        isHidden: tc.isHidden,
        logs,
      });
    } catch (err) {
      results.push({
        id: tc.id,
        passed: false,
        actual: null,
        expected: tc.isHidden ? null : expected,
        isHidden: tc.isHidden,
        logs: [],
        error: err instanceof Error ? err.message : "Runtime error",
      });
    }
  }
  const ms = performance.now() - start;
  const passedCount = results.filter((r) => r.passed).length;

  return {
    problem: { id: problem.id, title: problem.title },
    passedCount,
    totalCount: results.length,
    executionTimeMs: Math.round(ms),
    results,
  };
}

export async function runSubmission(req: Request, res: Response): Promise<void> {
  try {
    const { problemId, language, code } = req.body as {
      problemId?: string;
      language?: string;
      code?: string;
    };

    if (!problemId || !language || !code) {
      res.status(400).json({ message: "problemId, language, code are required" });
      return;
    }

    const lang = language.toLowerCase() as SupportedLanguage;
    if (lang !== "javascript" && lang !== "typescript") {
      res.status(400).json({ message: "Language not supported for run yet" });
      return;
    }

    const evalResult = await evaluate(problemId, lang, code, false);
    if ("error" in evalResult) {
      res.status(404).json({ message: evalResult.error });
      return;
    }

    res.json({ run: evalResult });
  } catch (error) {
    req.log.error({ err: error }, "[runSubmission] failed");
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function createSubmission(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const { problemId, language, code } = req.body as {
      problemId?: string;
      language?: string;
      code?: string;
    };

    if (!problemId || !language || !code) {
      res.status(400).json({ message: "problemId, language, code are required" });
      return;
    }

    const submission = await prisma.submission.create({
      data: {
        userId,
        problemId,
        language,
        code,
        status: "queued",
      },
      select: {
        id: true,
        language: true,
        status: true,
        executionTime: true,
        createdAt: true,
      },
    });

    try {
      await judgeQueue.add(
        "judge",
        { submissionId: submission.id },
        {
          attempts: 3, // ลองใหม่ได้สูงสุด 3 ครั้ง
          backoff: {
            type: "fixed",
            delay: 5_000, // เว้น 5 วิระหว่างแต่ละ attempt
          },
          removeOnComplete: true,
          removeOnFail: false,
        }
      );
    } catch (queueError) {
      req.log.error({ err: queueError }, "[createSubmission] failed to enqueue job");
    }

    res.json({
      submission,
      message: "Submission queued for judging",
    });
  } catch (error) {
    req.log.error({ err: error }, "[createSubmission] failed");
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function listSubmissions(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const problemId = String(req.query.problemId ?? "");

    if (!problemId) {
      res.status(400).json({ message: "problemId query is required" });
      return;
    }

    const submissions = await prisma.submission.findMany({
      where: { userId, problemId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        language: true,
        status: true,
        executionTime: true,
        createdAt: true,
        aiFeedback: {
          select: {
            analysisText: true,
            qualityScore: true,
            createdAt: true,
          },
        },
      },
      take: 30,
    });

    res.json({ submissions });
  } catch (error) {
    req.log.error({ err: error }, "[listSubmissions] failed");
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function getSubmission(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const id = String(req.params.id ?? "");

    if (!id) {
      res.status(400).json({ message: "Submission id is required" });
      return;
    }

    const submission = await prisma.submission.findFirst({
      where: { id, userId },
      select: {
        id: true,
        problemId: true,
        language: true,
        code: true,
        status: true,
        executionTime: true,
        createdAt: true,
      },
    });

    if (!submission) {
      res.status(404).json({ message: "Submission not found" });
      return;
    }

    res.json({ submission });
  } catch (error) {
    req.log.error({ err: error }, "[getSubmission] failed");
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function deleteSubmission(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const id = String(req.params.id ?? "");

    if (!id) {
      res.status(400).json({ message: "Submission id is required" });
      return;
    }

    const existing = await prisma.submission.findFirst({
      where: { id, userId },
      select: { id: true },
    });

    if (!existing) {
      res.status(404).json({ message: "Submission not found" });
      return;
    }

    await prisma.submission.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    req.log.error({ err: error }, "[deleteSubmission] failed");
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function internalJudgeSubmission(req: Request, res: Response): Promise<void> {
  try {
    const token = req.header("x-internal-judge-token");
    if (!token || token !== process.env.INTERNAL_JUDGE_TOKEN) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const { submissionId } = req.body as { submissionId?: string };
    if (!submissionId) {
      res.status(400).json({ message: "submissionId is required" });
      return;
    }

    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      select: {
        id: true,
        userId: true,
        problemId: true,
        language: true,
        code: true,
      },
    });

    if (!submission || !submission.problemId || !submission.language || !submission.code) {
      res.status(404).json({ message: "Submission not found" });
      return;
    }

    const lang = submission.language.toLowerCase() as SupportedLanguage;
    if (lang !== "javascript" && lang !== "typescript") {
      await prisma.submission.update({
        where: { id: submission.id },
        data: { status: "pending" },
      });

      res.json({
        submissionId: submission.id,
        message: "Language not supported for judge yet",
      });
      return;
    }

    const evalResult = await evaluate(submission.problemId, lang, submission.code, true);
    if ("error" in evalResult) {
      res.status(404).json({ message: evalResult.error });
      return;
    }

    const status = evalResult.passedCount === evalResult.totalCount ? "accepted" : "wrong_answer";

    const updatedSubmission = await prisma.submission.update({
      where: { id: submission.id },
      data: {
        status,
        executionTime: evalResult.executionTimeMs,
      },
      select: {
        id: true,
        language: true,
        status: true,
        executionTime: true,
        createdAt: true,
      },
    });

    let analysisText: string;
    let qualityScore: number;
    try {
      const llmResult = await analyzeCodeWithLLM(submission.code, submission.language, {
        passedCount: evalResult.passedCount,
        totalCount: evalResult.totalCount,
        executionTimeMs: evalResult.executionTimeMs,
      });
      analysisText = llmResult.analysisText;
      qualityScore = llmResult.qualityScore;
    } catch (llmErr) {
      // eslint-disable-next-line no-console
      console.warn("[internalJudgeSubmission] LLM analysis failed, using rule-based fallback", llmErr);
      const fallback = analyzeCode(submission.code, submission.language, {
        passedCount: evalResult.passedCount,
        totalCount: evalResult.totalCount,
        executionTimeMs: evalResult.executionTimeMs,
      });
      analysisText = fallback.analysisText;
      qualityScore = fallback.qualityScore;
    }

    const aiFeedback = await prisma.aiFeedback.upsert({
      where: { submissionId: submission.id },
      update: {
        analysisText,
        qualityScore,
      },
      create: {
        submissionId: submission.id,
        analysisText,
        qualityScore,
      },
      select: {
        analysisText: true,
        qualityScore: true,
        createdAt: true,
      },
    });

    res.json({
      submission: updatedSubmission,
      evaluation: {
        passedCount: evalResult.passedCount,
        totalCount: evalResult.totalCount,
        executionTimeMs: evalResult.executionTimeMs,
      },
      aiFeedback,
    });
  } catch (error) {
    // This endpoint is called from worker only, no req.log
    // but keep a generic log via console to avoid missing errors.
    // eslint-disable-next-line no-console
    console.error("[internalJudgeSubmission] failed", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

