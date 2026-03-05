import type { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";

export async function listAnnouncements(_req: Request, res: Response): Promise<void> {
  try {
    const announcements = await prisma.announcement.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    res.json({
      announcements: announcements.map((a) => ({
        id: a.id,
        title: a.title,
        body: a.body,
        type: a.type,
        createdAt: a.createdAt,
      })),
    });
  } catch (error) {
    console.error("[listAnnouncements] failed", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function createAnnouncement(req: Request, res: Response): Promise<void> {
  try {
    const { title, body, type } = req.body as {
      title?: unknown;
      body?: unknown;
      type?: unknown;
    };

    const titleStr = typeof title === "string" ? title.trim() : "";
    const bodyStr = typeof body === "string" ? body.trim() : String(body ?? "");

    if (!titleStr || !bodyStr) {
      res.status(400).json({ message: "title and body are required" });
      return;
    }

    const typeStr = (typeof type === "string" ? type.trim() : "info").slice(0, 20) || "info";

    if (typeof prisma.announcement?.create !== "function") {
      const log = (req as Request & { log?: { error: (o: unknown, msg: string) => void } }).log;
      if (log) log.error({}, "[createAnnouncement] prisma.announcement not available — run: npx prisma generate");
      res.status(503).json({ message: "Service unavailable. Run: npx prisma generate" });
      return;
    }

    const announcement = await prisma.announcement.create({
      data: {
        title: titleStr.slice(0, 255),
        body: bodyStr,
        type: typeStr,
      },
      select: {
        id: true,
        title: true,
        body: true,
        type: true,
        createdAt: true,
      },
    });

    res.status(201).json({ announcement });
  } catch (error) {
    const log = (req as Request & { log?: { error: (o: unknown, msg: string) => void } }).log;
    if (log) log.error({ err: error }, "[createAnnouncement] failed");
    else console.error("[createAnnouncement] failed", error);
    const message = process.env.NODE_ENV !== "production" && error instanceof Error ? error.message : "Internal server error";
    res.status(500).json({ message });
  }
}

export async function listAdminAnnouncements(_req: Request, res: Response): Promise<void> {
  try {
    const announcements = await prisma.announcement.findMany({
      orderBy: { createdAt: "desc" },
    });

    res.json({
      announcements: announcements.map((a) => ({
        id: a.id,
        title: a.title,
        body: a.body,
        type: a.type,
        createdAt: a.createdAt,
      })),
    });
  } catch (error) {
    console.error("[listAdminAnnouncements] failed", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function updateAnnouncement(req: Request, res: Response): Promise<void> {
  try {
    const id = Number(req.params.id);
    if (!id || Number.isNaN(id)) {
      res.status(400).json({ message: "Valid announcement id is required" });
      return;
    }

    const { title, body, type } = req.body as {
      title?: unknown;
      body?: unknown;
      type?: unknown;
    };

    const data: {
      title?: string;
      body?: string;
      type?: string;
    } = {};

    if (typeof title === "string") data.title = title.trim().slice(0, 255);
    if (typeof body === "string") data.body = body.trim();
    if (typeof type === "string") data.type = type.trim().slice(0, 20);

    const updated = await prisma.announcement.update({
      where: { id },
      data,
      select: {
        id: true,
        title: true,
        body: true,
        type: true,
        createdAt: true,
      },
    });

    res.json({ announcement: updated });
  } catch (error) {
    console.error("[updateAnnouncement] failed", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function deleteAnnouncement(req: Request, res: Response): Promise<void> {
  try {
    const id = Number(req.params.id);
    if (!id || Number.isNaN(id)) {
      res.status(400).json({ message: "Valid announcement id is required" });
      return;
    }

    await prisma.announcement.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    console.error("[deleteAnnouncement] failed", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

