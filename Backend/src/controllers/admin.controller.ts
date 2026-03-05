import type { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma.js";
import { getLogLines } from "../lib/logBuffer.js";

const SALT_ROUNDS = 12;

export async function getAdminStats(req: Request, res: Response): Promise<void> {
  try {
    const [usersCount, problemsCount, submissionsCount, aiFeedbackCount] = await Promise.all([
      prisma.user.count(),
      prisma.problem.count(),
      prisma.submission.count(),
      prisma.aiFeedback.count(),
    ]);
    res.json({
      usersCount,
      problemsCount,
      submissionsCount,
      aiFeedbackCount,
    });
  } catch (error) {
    req.log.error({ err: error }, "[admin.getStats] failed");
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function getAdminLogs(req: Request, res: Response): Promise<void> {
  try {
    const lines = getLogLines();
    res.json({ logs: lines });
  } catch (error) {
    req.log.error({ err: error }, "[admin.getLogs] failed");
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function listAdminUsers(req: Request, res: Response): Promise<void> {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        email: true,
        role: true,
        fullName: true,
        avatarUrl: true,
        createdAt: true,
        submissions: {
          select: { id: true },
        },
      },
      take: 500,
    });

    res.json({
      users: users.map((u) => ({
        id: u.id,
        email: u.email,
        fullName: u.fullName,
        role: u.role,
        avatarUrl: u.avatarUrl,
        createdAt: u.createdAt,
        submissionsCount: u.submissions.length,
      })),
    });
  } catch (error) {
    req.log.error({ err: error }, "[admin.listUsers] failed");
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function createAdminUser(req: Request, res: Response): Promise<void> {
  try {
    const { email, password, fullName, role } = req.body as {
      email?: string;
      password?: string;
      fullName?: string;
      role?: string;
    };
    if (!email || !password) {
      res.status(400).json({ message: "email and password are required" });
      return;
    }
    if (password.length < 8) {
      res.status(400).json({ message: "password must be at least 8 characters" });
      return;
    }
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      res.status(409).json({ message: "Email already registered" });
      return;
    }
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        fullName: fullName ?? null,
        role: role === "ADMIN" ? "ADMIN" : "USER",
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        avatarUrl: true,
        createdAt: true,
      },
    });
    req.log.info({ userId: user.id }, "[admin] user created");
    res.status(201).json({
      user: {
        ...user,
        submissionsCount: 0,
      },
    });
  } catch (error) {
    req.log.error({ err: error }, "[admin.createUser] failed");
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function updateAdminUser(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.params.id;
    const { fullName, avatarUrl, role } = req.body as {
      fullName?: string;
      avatarUrl?: string;
      role?: string;
    };
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }
    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(fullName !== undefined && { fullName }),
        ...(avatarUrl !== undefined && { avatarUrl }),
        ...(role === "ADMIN" || role === "USER" ? { role } : {}),
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        avatarUrl: true,
        role: true,
        createdAt: true,
      },
    });
    res.json({ user: updated });
  } catch (error) {
    req.log.error({ err: error }, "[admin.updateUser] failed");
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function deleteAdminUser(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.params.id;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }
    await prisma.user.delete({ where: { id: userId } });
    req.log.info({ userId }, "[admin] user deleted");
    res.json({ message: "User deleted" });
  } catch (error) {
    req.log.error({ err: error }, "[admin.deleteUser] failed");
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function listAdminProblems(req: Request, res: Response): Promise<void> {
  try {
    const problems = await prisma.problem.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        testCases: true,
        submissions: true,
      },
      take: 200,
    });

    res.json({
      problems: problems.map((p) => ({
        id: p.id,
        title: p.title,
        description: p.description,
        difficulty: p.difficulty,
        createdAt: p.createdAt,
        testcasesCount: p.testCases.length,
        submissionsCount: p.submissions.length,
      })),
    });
  } catch (error) {
    req.log.error({ err: error }, "[admin.listProblems] failed");
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function getAdminProblem(req: Request, res: Response): Promise<void> {
  try {
    const id = req.params.id;
    const problem = await prisma.problem.findUnique({
      where: { id },
      include: { testCases: true },
    });
    if (!problem) {
      res.status(404).json({ message: "Problem not found" });
      return;
    }
    const submissionsCount = await prisma.submission.count({ where: { problemId: id } });
    res.json({
      problem: {
        id: problem.id,
        title: problem.title,
        description: problem.description,
        difficulty: problem.difficulty,
        createdAt: problem.createdAt,
        testcasesCount: problem.testCases.length,
        submissionsCount,
        testCases: problem.testCases.map((tc) => ({
          id: tc.id,
          inputData: tc.inputData ?? "",
          expectedOutput: tc.expectedOutput ?? "",
          isHidden: tc.isHidden,
        })),
      },
    });
  } catch (error) {
    req.log.error({ err: error }, "[admin.getProblem] failed");
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function createAdminProblem(req: Request, res: Response): Promise<void> {
  try {
    const { title, description, difficulty, testCases } = req.body as {
      title?: string;
      description?: string;
      difficulty?: string;
      testCases?: Array<{ inputData?: string; expectedOutput?: string; isHidden?: boolean }>;
    };
    if (!title || !description) {
      res.status(400).json({ message: "title and description are required" });
      return;
    }
    const diff = difficulty === "HARD" ? "HARD" : difficulty === "MEDIUM" ? "MEDIUM" : "EASY";
    const problem = await prisma.problem.create({
      data: {
        title,
        description,
        difficulty: diff,
        testCases:
          Array.isArray(testCases) && testCases.length > 0
            ? {
                create: testCases.slice(0, 50).map((tc) => ({
                  inputData: tc.inputData ?? null,
                  expectedOutput: tc.expectedOutput ?? null,
                  isHidden: tc.isHidden ?? true,
                })),
              }
            : undefined,
      },
      include: { testCases: true },
    });
    req.log.info({ problemId: problem.id }, "[admin] problem created");
    res.status(201).json({
      problem: {
        id: problem.id,
        title: problem.title,
        description: problem.description,
        difficulty: problem.difficulty,
        createdAt: problem.createdAt,
        testcasesCount: problem.testCases.length,
        submissionsCount: 0,
      },
    });
  } catch (error) {
    req.log.error({ err: error }, "[admin.createProblem] failed");
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function updateAdminProblem(req: Request, res: Response): Promise<void> {
  try {
    const id = req.params.id;
    const body = req.body as {
      title?: string;
      description?: string;
      difficulty?: string;
      testCases?: Array<{ inputData?: string; expectedOutput?: string; isHidden?: boolean }>;
    };
    const { title, description, difficulty, testCases } = body;
    const existing = await prisma.problem.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ message: "Problem not found" });
      return;
    }
    const diff = difficulty === "HARD" ? "HARD" : difficulty === "MEDIUM" ? "MEDIUM" : undefined;
    const data: { title?: string; description?: string; difficulty?: string } = {};
    if (title !== undefined) data.title = title;
    if (description !== undefined) data.description = description;
    if (diff !== undefined) data.difficulty = diff;
    if (Object.keys(data).length > 0) {
      await prisma.problem.update({ where: { id }, data });
    }
    if (Array.isArray(testCases)) {
      await prisma.testCase.deleteMany({ where: { problemId: id } });
      if (testCases.length > 0) {
        await prisma.testCase.createMany({
          data: testCases.slice(0, 50).map((tc) => ({
            problemId: id,
            inputData: tc.inputData ?? null,
            expectedOutput: tc.expectedOutput ?? null,
            isHidden: tc.isHidden ?? true,
          })),
        });
      }
    }
    const final = await prisma.problem.findUnique({
      where: { id },
      include: { testCases: true },
    });
    const submissionsCount = await prisma.submission.count({ where: { problemId: id } });
    if (!final) {
      res.status(500).json({ message: "Internal server error" });
      return;
    }
    res.json({
      problem: {
        id: final.id,
        title: final.title,
        description: final.description,
        difficulty: final.difficulty,
        createdAt: final.createdAt,
        testcasesCount: final.testCases.length,
        submissionsCount,
        testCases: final.testCases.map((tc) => ({
          id: tc.id,
          inputData: tc.inputData ?? "",
          expectedOutput: tc.expectedOutput ?? "",
          isHidden: tc.isHidden,
        })),
      },
    });
  } catch (error) {
    req.log.error({ err: error }, "[admin.updateProblem] failed");
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function deleteAdminProblem(req: Request, res: Response): Promise<void> {
  try {
    const id = req.params.id;
    const existing = await prisma.problem.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ message: "Problem not found" });
      return;
    }
    await prisma.problem.delete({ where: { id } });
    req.log.info({ problemId: id }, "[admin] problem deleted");
    res.json({ message: "Problem deleted" });
  } catch (error) {
    req.log.error({ err: error }, "[admin.deleteProblem] failed");
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function importAdminProblems(req: Request, res: Response): Promise<void> {
  try {
    const body = req.body as {
      problems?: Array<{
        title: string;
        description: string;
        difficulty?: string;
        testCases?: Array<{ inputData?: string; expectedOutput?: string; isHidden?: boolean }>;
      }>;
    };
    const problems = Array.isArray(body.problems) ? body.problems : [];
    if (problems.length === 0) {
      res.status(400).json({ message: "problems array is required and must not be empty" });
      return;
    }
    const created: Array<{ id: string; title: string }> = [];
    for (const p of problems.slice(0, 100)) {
      if (!p.title || !p.description) continue;
      const diff = p.difficulty === "HARD" ? "HARD" : p.difficulty === "MEDIUM" ? "MEDIUM" : "EASY";
      const problem = await prisma.problem.create({
        data: {
          title: p.title,
          description: p.description,
          difficulty: diff,
          testCases:
            Array.isArray(p.testCases) && p.testCases.length > 0
              ? {
                  create: p.testCases.slice(0, 20).map((tc) => ({
                    inputData: tc.inputData ?? null,
                    expectedOutput: tc.expectedOutput ?? null,
                    isHidden: tc.isHidden ?? true,
                  })),
                }
              : undefined,
        },
      });
      created.push({ id: problem.id, title: problem.title });
    }
    req.log.info({ count: created.length }, "[admin] problems imported");
    res.status(201).json({ imported: created.length, problems: created });
  } catch (error) {
    req.log.error({ err: error }, "[admin.importProblems] failed");
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function listAdminSubmissions(req: Request, res: Response): Promise<void> {
  try {
    const limit = Number(req.query.limit ?? 100);

    const submissions = await prisma.submission.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: { email: true },
        },
        problem: {
          select: { title: true },
        },
      },
      take: Math.min(limit, 500),
    });

    res.json({
      submissions: submissions.map((s) => ({
        id: s.id,
        userEmail: s.user?.email ?? null,
        problemTitle: s.problem?.title ?? null,
        language: s.language,
        status: s.status,
        executionTime: s.executionTime,
        createdAt: s.createdAt,
      })),
    });
  } catch (error) {
    req.log.error({ err: error }, "[admin.listSubmissions] failed");
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function listAdminAiInsights(req: Request, res: Response): Promise<void> {
  try {
    const feedback = await prisma.aiFeedback.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        submission: {
          select: {
            language: true,
            status: true,
            problem: { select: { title: true } },
          },
        },
      },
      take: 50,
    });

    res.json({
      feedback: feedback.map((f) => ({
        id: f.id,
        createdAt: f.createdAt,
        analysisText: f.analysisText,
        qualityScore: f.qualityScore,
        language: f.submission.language,
        status: f.submission.status,
        problemTitle: f.submission.problem?.title ?? null,
      })),
    });
  } catch (error) {
    req.log.error({ err: error }, "[admin.listAiInsights] failed");
    res.status(500).json({ message: "Internal server error" });
  }
}

