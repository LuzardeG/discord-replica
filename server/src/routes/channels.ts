import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import { authMiddleware } from "../middleware/auth.js";

const router = Router();
router.use(authMiddleware);

const createSchema = z.object({
  name: z.string().min(1).max(100),
  type: z.enum(["text", "voice"]),
});

router.post("/:serverId", async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid input" });

  const member = await prisma.serverMember.findUnique({
    where: { userId_serverId: { userId: req.userId!, serverId: req.params.serverId } },
  });
  if (!member) return res.status(403).json({ error: "Not a member" });

  const channel = await prisma.channel.create({
    data: {
      name: parsed.data.name,
      type: parsed.data.type,
      serverId: req.params.serverId,
    },
  });
  res.status(201).json(channel);
});

router.get("/:serverId", async (req, res) => {
  const channels = await prisma.channel.findMany({
    where: { serverId: req.params.serverId },
    orderBy: { createdAt: "asc" },
  });
  res.json(channels);
});

export default router;
