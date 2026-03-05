import type { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";

function buildProfile(user: {
  id: string;
  email: string;
  role: string;
  createdAt: Date;
  fullName: string | null;
  avatarUrl: string | null;
}) {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
    fullName: user.fullName,
    avatarUrl: user.avatarUrl,
  };
}

export async function getProfile(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
        fullName: true,
        avatarUrl: true,
      },
    });

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    req.log.debug({ userId }, "Loaded user profile");
    res.json({ user: buildProfile(user) });
  } catch (error) {
    req.log.error({ err: error }, "[getProfile] failed");
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function updateProfile(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const { fullName, avatarUrl } = req.body as {
      fullName?: string;
      avatarUrl?: string;
    };

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        fullName: fullName ?? null,
        avatarUrl: avatarUrl ?? null,
      },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
        fullName: true,
        avatarUrl: true,
      },
    });

    req.log.info({ userId }, "User profile updated");
    res.json({ user: buildProfile(user) });
  } catch (error) {
    req.log.error({ err: error }, "[updateProfile] failed");
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function getMyAnnouncements(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;

    const readIds = await prisma.announcementRead.findMany({
      where: { userId },
      select: { announcementId: true },
    });
    const readSet = new Set(readIds.map((r) => r.announcementId));

    const announcements = await prisma.announcement.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    const unread = announcements.filter((a) => !readSet.has(a.id));

    res.json({
      announcements: unread.map((a) => ({
        id: a.id,
        title: a.title,
        body: a.body,
        type: a.type,
        createdAt: a.createdAt,
      })),
    });
  } catch (error) {
    req.log.error({ err: error }, "[getMyAnnouncements] failed");
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function markMyAnnouncementsRead(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;

    const announcements = await prisma.announcement.findMany({
      select: { id: true },
    });

    await prisma.announcementRead.createMany({
      data: announcements.map((a) => ({
        userId,
        announcementId: a.id,
      })),
      skipDuplicates: true,
    });

    req.log.info({ userId, count: announcements.length }, "Announcements marked as read");
    res.json({ message: "Marked all as read" });
  } catch (error) {
    req.log.error({ err: error }, "[markMyAnnouncementsRead] failed");
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function getProgress(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;

    const totals = await prisma.problem.groupBy({
      by: ["difficulty"],
      _count: { _all: true },
    });

    const totalsByDifficulty: Record<"EASY" | "MEDIUM" | "HARD", number> = {
      EASY: 0,
      MEDIUM: 0,
      HARD: 0,
    };

    for (const row of totals) {
      const diff = String(row.difficulty).toUpperCase() as "EASY" | "MEDIUM" | "HARD";
      if (diff in totalsByDifficulty) totalsByDifficulty[diff] = row._count._all;
    }

    const acceptedStatuses = [
      "accepted",
      "ACCEPTED",
      "Accepted",
      "success",
      "SUCCESS",
      "passed",
      "PASSED",
    ];

    const solvedDistinct = await prisma.submission.findMany({
      where: {
        userId,
        problemId: { not: null },
        status: { in: acceptedStatuses },
      },
      distinct: ["problemId"],
      select: {
        problemId: true,
        problem: {
          select: { difficulty: true },
        },
      },
    });

    const attemptedDistinct = await prisma.submission.findMany({
      where: {
        userId,
        problemId: { not: null },
      },
      distinct: ["problemId"],
      select: {
        problemId: true,
        problem: {
          select: { difficulty: true },
        },
      },
    });

    const solvedByDifficulty: Record<"EASY" | "MEDIUM" | "HARD", number> = {
      EASY: 0,
      MEDIUM: 0,
      HARD: 0,
    };

    const attemptedByDifficulty: Record<"EASY" | "MEDIUM" | "HARD", number> = {
      EASY: 0,
      MEDIUM: 0,
      HARD: 0,
    };

    for (const row of solvedDistinct) {
      const diff = String(row.problem?.difficulty ?? "EASY").toUpperCase() as
        | "EASY"
        | "MEDIUM"
        | "HARD";
      if (diff in solvedByDifficulty) solvedByDifficulty[diff] += 1;
    }

    for (const row of attemptedDistinct) {
      const diff = String(row.problem?.difficulty ?? "EASY").toUpperCase() as
        | "EASY"
        | "MEDIUM"
        | "HARD";
      if (diff in attemptedByDifficulty) attemptedByDifficulty[diff] += 1;
    }

    const totalProblems =
      totalsByDifficulty.EASY + totalsByDifficulty.MEDIUM + totalsByDifficulty.HARD;

    const solvedTotal =
      solvedByDifficulty.EASY + solvedByDifficulty.MEDIUM + solvedByDifficulty.HARD;
    const attemptedTotal =
      attemptedByDifficulty.EASY +
      attemptedByDifficulty.MEDIUM +
      attemptedByDifficulty.HARD;

    const solvedProblemIds = solvedDistinct
      .map((row) => row.problemId)
      .filter((id): id is string => id != null);
    const attemptedProblemIds = attemptedDistinct
      .map((row) => row.problemId)
      .filter((id): id is string => id != null);

    const masteryByDifficulty: Record<"EASY" | "MEDIUM" | "HARD", number> = {
      EASY: totalsByDifficulty.EASY
        ? Math.round((solvedByDifficulty.EASY / totalsByDifficulty.EASY) * 100)
        : 0,
      MEDIUM: totalsByDifficulty.MEDIUM
        ? Math.round((solvedByDifficulty.MEDIUM / totalsByDifficulty.MEDIUM) * 100)
        : 0,
      HARD: totalsByDifficulty.HARD
        ? Math.round((solvedByDifficulty.HARD / totalsByDifficulty.HARD) * 100)
        : 0,
    };

    req.log.debug({ userId }, "Loaded user progress");
    res.json({
      progress: {
        totalProblems,
        solvedTotal,
        attemptedTotal,
        totalsByDifficulty,
        solvedByDifficulty,
        attemptedByDifficulty,
        masteryByDifficulty,
        solvedProblemIds,
        attemptedProblemIds,
      },
    });
  } catch (error) {
    req.log.error({ err: error }, "[getProgress] failed");
    res.status(500).json({ message: "Internal server error" });
  }
}

/** For AI Analytics: recent submissions with AI feedback (quality score, analysis text). */
export async function getMyInsights(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const page = Math.max(Number(req.query.page) || 1, 1);
    const pageSize = Math.min(Number(req.query.pageSize) || 10, 50);
    const skip = (page - 1) * pageSize;

    const where = {
      userId,
      problemId: { not: null },
      aiFeedback: {
        // เอาเฉพาะ submission ที่มี AI feedback แล้ว
        isNot: null,
      },
    } as const;

    const [total, submissions] = await Promise.all([
      prisma.submission.count({ where }),
      prisma.submission.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
        select: {
          id: true,
          problemId: true,
          language: true,
          status: true,
          executionTime: true,
          createdAt: true,
          problem: {
            select: { title: true, difficulty: true },
          },
          aiFeedback: {
            select: {
              analysisText: true,
              qualityScore: true,
              createdAt: true,
            },
          },
        },
      }),
    ]);

    const insights = submissions.map((s) => ({
      id: s.id,
      problemTitle: s.problem?.title ?? null,
      difficulty: s.problem?.difficulty ?? null,
      language: s.language,
      status: s.status,
      executionTime: s.executionTime,
      createdAt: s.createdAt,
      qualityScore: s.aiFeedback?.qualityScore ?? null,
      analysisText: s.aiFeedback?.analysisText ?? null,
    }));

    const totalPages = total === 0 ? 1 : Math.ceil(total / pageSize);
    const hasMore = page < totalPages;

    req.log.debug({ userId, count: insights.length, page, pageSize }, "Loaded my insights");
    res.json({
      insights,
      page,
      pageSize,
      total,
      totalPages,
      hasMore,
    });
  } catch (error) {
    req.log.error({ err: error }, "[getMyInsights] failed");
    res.status(500).json({ message: "Internal server error" });
  }
}

