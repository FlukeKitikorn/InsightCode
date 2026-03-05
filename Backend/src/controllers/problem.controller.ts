import type { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";

export async function listProblems(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId ?? null;

    const [problems, submissionStats] = await Promise.all([
      prisma.problem.findMany({
        select: {
          id: true,
          title: true,
          difficulty: true,
          createdAt: true,
        },
        orderBy: { createdAt: "asc" },
      }),
      userId
        ? prisma.submission.groupBy({
            by: ["problemId", "status"],
            where: {
              problemId: { not: null },
              userId,
            },
            _count: {
              _all: true,
            },
          })
        : Promise.resolve([]),
    ]);

    const acceptedStatuses = [
      "accepted",
      "ACCEPTED",
      "Accepted",
      "success",
      "SUCCESS",
      "passed",
      "PASSED",
    ];

    const statsByProblem = new Map<
      string,
      {
        total: number;
        accepted: number;
      }
    >();

    for (const row of submissionStats) {
      const problemId = row.problemId;
      if (!problemId) continue;
      const current = statsByProblem.get(problemId) ?? { total: 0, accepted: 0 };
      current.total += row._count._all;
      if (acceptedStatuses.includes(row.status)) {
        current.accepted += row._count._all;
      }
      statsByProblem.set(problemId, current);
    }

    res.json({
      problems: problems.map((p) => {
        const stats = statsByProblem.get(p.id);
        let acceptance: string | null = null;
        if (stats && stats.total > 0) {
          const rate = (stats.accepted / stats.total) * 100;
          acceptance = `${rate.toFixed(1)}%`;
        }

        return {
          id: p.id,
          title: p.title,
          difficulty: p.difficulty,
          createdAt: p.createdAt,
          acceptance,
        };
      }),
    });
  } catch (error) {
    // use minimal logging – global logger will still capture request line
    console.error("[listProblems]", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function getProblem(req: Request, res: Response): Promise<void> {
  try {
    const id = String(req.params.id ?? "");
    if (!id) {
      res.status(400).json({ message: "Problem id is required" });
      return;
    }

    const problem = await prisma.problem.findUnique({
      where: { id },
      include: { testCases: { orderBy: { id: "asc" } } },
    });

    if (!problem) {
      res.status(404).json({ message: "Problem not found" });
      return;
    }

    res.json({
      problem: {
        id: problem.id,
        title: problem.title,
        description: problem.description,
        difficulty: problem.difficulty,
        createdAt: problem.createdAt,
        testCases: problem.testCases.map((tc: { id: number; inputData: string | null; expectedOutput: string | null; isHidden: boolean }) => ({
          id: tc.id,
          inputData: tc.inputData,
          expectedOutput: tc.expectedOutput,
          isHidden: tc.isHidden,
        })),
      },
    });
  } catch (error) {
    console.error("[getProblem]", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

