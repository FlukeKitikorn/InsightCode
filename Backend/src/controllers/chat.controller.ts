import type { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { openRouterChat } from "../lib/openrouter.js";

const NO_SOLUTION_RULE = `คุณเป็นผู้ช่วยติวเขียนโค้ดในแพลตฟอร์ม InsightCode
กฎที่ต้องปฏิบัติอย่างเคร่งครัด:
- ห้ามเฉลยโจทย์ ไม่ว่าจะเป็นโค้ดสำเร็จรูป คำตอบของ test case ค่าที่ต้อง return ที่ถูกต้อง หรือวิธีแก้แบบตรงโจทย์
- ห้ามบอก input/output ของ test case ที่ซ่อนอยู่ หรือตัวอย่าง test case เพิ่ม
- ได้แค่ให้คำแนะนำแนวคิด อธิบาย concept ตัวอย่างทั่วไป (ที่ไม่ใช่โจทย์ข้อนี้โดยตรง) ช่วยอ่าน error หรืออธิบาย syntax/API
ถ้าผู้ใช้ถามในลักษณะขอเฉลยหรือขอคำตอบ เช่น \"ขอโค้ด Two Sum แบบสมบูรณ์\" ให้ปฏิเสธอย่างสุภาพและแนะนำให้ลองคิดเองหรือดูแนวคิดทั่วไปแทน`;

function buildSystemPrompt(
  problemContext: { title: string; description: string } | null,
  submissionSummary: string | null
): string {
  let base = NO_SOLUTION_RULE;
  if (problemContext) {
    base += `\n\nบริบทโจทย์ปัจจุบัน (ใช้เพื่อเข้าใจคำถามเท่านั้น — ห้ามใช้เพื่อเฉลย):\n- ชื่อโจทย์: ${problemContext.title}\n- คำอธิบายย่อ: ${problemContext.description.slice(0, 400)}`;
  }
  if (submissionSummary) {
    base += `\n\nนี่คือสรุปประวัติการส่งคำตอบของผู้ใช้ในโจทย์นี้ (ใช้เพื่อดูพัฒนาการและจุดอ่อน — ห้ามนำไปเขียนเฉลยให้):\n${submissionSummary}`;
  }
  return base;
}

export async function postChat(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const body = req.body as {
      problemId?: string;
      message?: string;
      history?: Array<{ role: "user" | "assistant"; content: string }>;
    };
    const { problemId, message, history = [] } = body;

    if (!message || typeof message !== "string" || !message.trim()) {
      res.status(400).json({ message: "message is required" });
      return;
    }

    let problemContext: { title: string; description: string } | null = null;
    let submissionSummary: string | null = null;

    if (problemId && typeof problemId === "string") {
      const [problem, submissions] = await Promise.all([
        prisma.problem.findUnique({
          where: { id: problemId },
          select: { title: true, description: true },
        }),
        prisma.submission.findMany({
          where: { userId, problemId },
          orderBy: { createdAt: "desc" },
          take: 5,
          select: {
            id: true,
            status: true,
            language: true,
            createdAt: true,
            aiFeedback: {
              select: {
                qualityScore: true,
                analysisText: true,
              },
            },
          },
        }),
      ]);

      if (problem) {
        problemContext = { title: problem.title, description: problem.description };
      }

      if (submissions.length > 0) {
        const lines: string[] = [];
        submissions.forEach((s, index) => {
          const prefix = `${index + 1}) [${s.language ?? "unknown"}] status=${s.status} score=${
            s.aiFeedback?.qualityScore ?? "n/a"
          } เวลา=${s.createdAt.toISOString()}`;
          const analysis =
            s.aiFeedback?.analysisText?.slice(0, 160).replace(/\s+/g, " ") ?? "ไม่มี note จาก AI";
          lines.push(`${prefix}\n   note: ${analysis}`);
        });
        submissionSummary = lines.join("\n");
      }
    }

    const systemPrompt = buildSystemPrompt(problemContext, submissionSummary);
    const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
      { role: "system", content: systemPrompt },
      ...history.slice(-10).map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
      { role: "user", content: message.trim() },
    ];

    const reply = await openRouterChat({
      messages,
      max_tokens: 1024,
      temperature: 0.5,
    });

    req.log.info({ userId, problemId: problemId ?? null }, "Chat completion");
    res.json({ reply });
  } catch (err) {
    req.log.error({ err }, "[postChat] failed");
    const message = err instanceof Error ? err.message : "Internal server error";
    const status = message.includes("OPENROUTER_API_KEY") ? 503 : 500;
    res.status(status).json({ message });
  }
}
