import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import { authMiddleware } from "../middleware/auth.js";

const router = Router();
router.use(authMiddleware);

// Send friend request
const requestSchema = z.object({ username: z.string() });

router.post("/request", async (req, res) => {
  const parsed = requestSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid username" });

  const target = await prisma.user.findUnique({
    where: { username: parsed.data.username },
  });
  if (!target) return res.status(404).json({ error: "User not found" });
  if (target.id === req.userId) return res.status(400).json({ error: "Cannot friend yourself" });

  // Check if already friends
  const existingFriendship = await prisma.friendship.findFirst({
    where: {
      OR: [
        { user1Id: req.userId, user2Id: target.id },
        { user1Id: target.id, user2Id: req.userId },
      ],
    },
  });
  if (existingFriendship) return res.status(409).json({ error: "Already friends" });

  // Check for existing request
  const existingRequest = await prisma.friendRequest.findUnique({
    where: { requesterId_receiverId: { requesterId: req.userId!, receiverId: target.id } },
  });
  if (existingRequest) return res.status(409).json({ error: "Request already sent" });

  // Check if they already sent us a request (auto-accept)
  const reverseRequest = await prisma.friendRequest.findUnique({
    where: { requesterId_receiverId: { requesterId: target.id, receiverId: req.userId! } },
  });

  if (reverseRequest) {
    // Auto-accept: create friendship, delete request
    const [u1, u2] = [req.userId!, target.id].sort();
    await prisma.$transaction([
      prisma.friendship.create({ data: { user1Id: u1, user2Id: u2 } }),
      prisma.friendRequest.delete({ where: { id: reverseRequest.id } }),
    ]);
    return res.json({ status: "accepted", user: { id: target.id, username: target.username } });
  }

  const request = await prisma.friendRequest.create({
    data: { requesterId: req.userId!, receiverId: target.id },
    include: { requester: { select: { id: true, username: true } } },
  });
  res.status(201).json({ status: "pending", request });
});

// Accept friend request
router.post("/accept/:requestId", async (req, res) => {
  const request = await prisma.friendRequest.findUnique({
    where: { id: req.params.requestId },
  });
  if (!request || request.receiverId !== req.userId) {
    return res.status(404).json({ error: "Request not found" });
  }

  const [u1, u2] = [request.requesterId, request.receiverId].sort();
  await prisma.$transaction([
    prisma.friendship.create({ data: { user1Id: u1, user2Id: u2 } }),
    prisma.friendRequest.delete({ where: { id: request.id } }),
  ]);

  res.json({ status: "accepted" });
});

// Reject friend request
router.post("/reject/:requestId", async (req, res) => {
  const request = await prisma.friendRequest.findUnique({
    where: { id: req.params.requestId },
  });
  if (!request || request.receiverId !== req.userId) {
    return res.status(404).json({ error: "Request not found" });
  }

  await prisma.friendRequest.delete({ where: { id: request.id } });
  res.json({ status: "rejected" });
});

// List friends
router.get("/", async (req, res) => {
  const friendships = await prisma.friendship.findMany({
    where: {
      OR: [{ user1Id: req.userId }, { user2Id: req.userId }],
    },
    include: {
      user1: { select: { id: true, username: true, status: true } },
      user2: { select: { id: true, username: true, status: true } },
    },
  });

  const friends = friendships.map((f) =>
    f.user1Id === req.userId ? f.user2 : f.user1
  );
  res.json(friends);
});

// List pending friend requests (received)
router.get("/requests", async (req, res) => {
  const requests = await prisma.friendRequest.findMany({
    where: { receiverId: req.userId },
    include: { requester: { select: { id: true, username: true } } },
  });
  res.json(requests);
});

// Search users
router.get("/search", async (req, res) => {
  const q = (req.query.q as string) || "";
  if (q.length < 2) return res.json([]);

  const users = await prisma.user.findMany({
    where: {
      username: { contains: q, mode: "insensitive" },
      id: { not: req.userId },
    },
    select: { id: true, username: true, status: true },
    take: 20,
  });
  res.json(users);
});

export default router;
