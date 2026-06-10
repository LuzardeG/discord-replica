import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import { authMiddleware } from "../middleware/auth.js";

const router = Router();
router.use(authMiddleware);

// Get message history for a channel
router.get("/:channelId", async (req, res) => {
  const { channelId } = req.params;
  const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
  const before = req.query.before as string | undefined;

  const where: any = { channelId };
  if (before) {
    where.createdAt = { lt: new Date(before) };
  }

  const messages = await prisma.message.findMany({
    where,
    include: { author: { select: { id: true, username: true } } },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  res.json(messages.reverse());
});

// Send message (REST fallback - main path is via WebSocket)
const sendSchema = z.object({ content: z.string().min(1).max(2000) });

router.post("/:channelId", async (req, res) => {
  const parsed = sendSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid message" });

  const message = await prisma.message.create({
    data: {
      channelId: req.params.channelId,
      authorId: req.userId!,
      content: parsed.data.content,
    },
    include: { author: { select: { id: true, username: true } } },
  });
  res.status(201).json(message);
});

export default router;
