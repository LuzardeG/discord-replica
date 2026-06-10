import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import { authMiddleware } from "../middleware/auth.js";

const router = Router();
router.use(authMiddleware);

// Get or create DM channel with a user
const openSchema = z.object({ userId: z.string().optional(), username: z.string().optional() });

router.post("/open", async (req, res) => {
  const parsed = openSchema.safeParse(req.body);
  if (!parsed.success || (!parsed.data.userId && !parsed.data.username)) {
    return res.status(400).json({ error: "Provide userId or username" });
  }

  let other;
  if (parsed.data.userId) {
    other = await prisma.user.findUnique({ where: { id: parsed.data.userId } });
  } else {
    other = await prisma.user.findUnique({ where: { username: parsed.data.username } });
  }
  if (!other) return res.status(404).json({ error: "User not found" });
  if (other.id === req.userId) return res.status(400).json({ error: "Cannot DM yourself" });

  const [u1, u2] = [req.userId!, other.id].sort();

  let dm = await prisma.dmChannel.findUnique({
    where: { user1Id_user2Id: { user1Id: u1, user2Id: u2 } },
  });

  if (!dm) {
    dm = await prisma.dmChannel.create({
      data: { user1Id: u1, user2Id: u2 },
    });
  }

  res.json({ id: dm.id, otherUser: { id: other.id, username: other.username } });
});

// List DM channels for current user
router.get("/", async (req, res) => {
  const dms = await prisma.dmChannel.findMany({
    where: {
      OR: [{ user1Id: req.userId }, { user2Id: req.userId }],
    },
    include: {
      user1: { select: { id: true, username: true, status: true } },
      user2: { select: { id: true, username: true, status: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const result = dms.map((dm) => ({
    id: dm.id,
    otherUser: dm.user1Id === req.userId ? dm.user2 : dm.user1,
  }));

  res.json(result);
});

// Send DM message
const msgSchema = z.object({ content: z.string().min(1).max(2000) });

router.post("/:dmChannelId/messages", async (req, res) => {
  const parsed = msgSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid message" });

  const dm = await prisma.dmChannel.findUnique({ where: { id: req.params.dmChannelId } });
  if (!dm) return res.status(404).json({ error: "DM channel not found" });
  if (dm.user1Id !== req.userId && dm.user2Id !== req.userId) {
    return res.status(403).json({ error: "Not a member" });
  }

  const message = await prisma.dmMessage.create({
    data: { dmChannelId: dm.id, authorId: req.userId!, content: parsed.data.content },
    include: { author: { select: { id: true, username: true } } },
  });

  res.json({ id: message.id, content: message.content, author: message.author, createdAt: message.createdAt });
});

// Get DM message history
router.get("/:dmChannelId/messages", async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
  const before = req.query.before as string | undefined;

  const where: any = { dmChannelId: req.params.dmChannelId };
  if (before) {
    where.createdAt = { lt: new Date(before) };
  }

  const messages = await prisma.dmMessage.findMany({
    where,
    include: { author: { select: { id: true, username: true } } },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  res.json(messages.reverse());
});

export default router;
