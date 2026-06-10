import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import { authMiddleware } from "../middleware/auth.js";

const router = Router();
router.use(authMiddleware);

const createSchema = z.object({ name: z.string().min(1).max(100) });

// Create server
router.post("/", async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid name" });

  const server = await prisma.server.create({
    data: {
      name: parsed.data.name,
      ownerId: req.userId!,
      members: { create: { userId: req.userId!, role: "owner" } },
      channels: { create: [{ name: "general", type: "text" }] },
    },
    include: { channels: true, members: { include: { user: true } } },
  });
  res.status(201).json(server);
});

// List user's servers
router.get("/", async (req, res) => {
  const memberships = await prisma.serverMember.findMany({
    where: { userId: req.userId! },
    include: {
      server: { include: { channels: true, members: { include: { user: true } } } },
    },
  });
  res.json(memberships.map((m) => m.server));
});

// Join server (by id - for simplicity, no invite system yet)
router.post("/:serverId/join", async (req, res) => {
  const { serverId } = req.params;
  const server = await prisma.server.findUnique({ where: { id: serverId } });
  if (!server) return res.status(404).json({ error: "Server not found" });

  const existing = await prisma.serverMember.findUnique({
    where: { userId_serverId: { userId: req.userId!, serverId } },
  });
  if (existing) return res.json(server);

  await prisma.serverMember.create({
    data: { userId: req.userId!, serverId },
  });

  const full = await prisma.server.findUnique({
    where: { id: serverId },
    include: { channels: true, members: { include: { user: true } } },
  });
  res.json(full);
});

// Get server details
router.get("/:serverId", async (req, res) => {
  const server = await prisma.server.findUnique({
    where: { id: req.params.serverId },
    include: { channels: true, members: { include: { user: true } } },
  });
  if (!server) return res.status(404).json({ error: "Not found" });
  res.json(server);
});

export default router;
