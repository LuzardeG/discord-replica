import { WebSocket, WebSocketServer } from "ws";
import { IncomingMessage } from "http";
import { prisma } from "./db.js";
import { verifyToken } from "./middleware/auth.js";
import { presence } from "./presence.js";
import { ClientMessage, ServerMessage, Server as ProtoServer, Message as ProtoMessage } from "./types.js";

const connections = new Map<string, WebSocket>();

function send(ws: WebSocket, msg: ServerMessage) {
  if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(msg));
}

function sendUser(userId: string, msg: ServerMessage) {
  const ws = connections.get(userId);
  if (ws) send(ws, msg);
}

function broadcastServer(serverId: string, msg: ServerMessage, exclude?: string) {
  const users = presence.getServerUsers(serverId);
  for (const u of users) {
    if (u.userId === exclude) continue;
    sendUser(u.userId, msg);
  }
}

function toProtoServer(s: any): ProtoServer {
  return {
    id: s.id,
    name: s.name,
    icon: s.icon,
    ownerId: s.ownerId,
    channels: (s.channels || []).map((c: any) => ({
      id: c.id,
      name: c.name,
      type: c.type,
      serverId: c.serverId,
    })),
    members: (s.members || []).map((m: any) => ({
      userId: m.userId,
      serverId: m.serverId,
      role: m.role,
      user: { id: m.user.id, username: m.user.username },
    })),
  };
}

function toProtoMessage(m: any): ProtoMessage {
  return {
    id: m.id,
    channelId: m.channelId,
    authorId: m.authorId,
    authorName: m.author?.username || "Unknown",
    content: m.content,
    timestamp: new Date(m.createdAt).getTime(),
  };
}

async function handleMsg(userId: string, raw: string) {
  let msg: ClientMessage;
  try {
    msg = JSON.parse(raw);
  } catch {
    return;
  }

  switch (msg.type) {
    case "set-name":
      break;

    case "server-create": {
      const server = await prisma.server.create({
        data: {
          name: msg.name,
          ownerId: userId,
          members: { create: { userId, role: "owner" } },
          channels: { create: [{ name: "general", type: "text" }] },
        },
        include: { channels: true, members: { include: { user: true } } },
      });
      presence.joinServer(userId, server.id);
      // Refresh user's full server list
      const memberships = await prisma.serverMember.findMany({
        where: { userId },
        include: { server: { include: { channels: true, members: { include: { user: true } } } } },
      });
      sendUser(userId, { type: "server-list", servers: memberships.map((m) => toProtoServer(m.server)) });
      break;
    }

    case "server-join": {
      const existing = await prisma.serverMember.findUnique({
        where: { userId_serverId: { userId, serverId: msg.serverId } },
      });
      if (!existing) {
        await prisma.serverMember.create({ data: { userId, serverId: msg.serverId } });
      }
      presence.joinServer(userId, msg.serverId);
      const server = await prisma.server.findUnique({
        where: { id: msg.serverId },
        include: { channels: true, members: { include: { user: true } } },
      });
      if (server) sendUser(userId, { type: "server-updated", server: toProtoServer(server) });
      break;
    }

    case "channel-create": {
      const member = await prisma.serverMember.findUnique({
        where: { userId_serverId: { userId, serverId: msg.serverId } },
      });
      if (!member) break;
      const channel = await prisma.channel.create({
        data: { name: msg.name, type: msg.channelType, serverId: msg.serverId },
      });
      broadcastServer(msg.serverId, {
        type: "channel-created",
        channel: { id: channel.id, name: channel.name, type: channel.type, serverId: channel.serverId },
      });
      break;
    }

    case "chat-send": {
      const channel = await prisma.channel.findUnique({ where: { id: msg.channelId } });
      if (!channel) break;
      const message = await prisma.message.create({
        data: { channelId: msg.channelId, authorId: userId, content: msg.content },
        include: { author: { select: { id: true, username: true } } },
      });
      broadcastServer(channel.serverId, { type: "chat-message", message: toProtoMessage(message) });
      break;
    }

    case "chat-history": {
      const messages = await prisma.message.findMany({
        where: { channelId: msg.channelId },
        include: { author: { select: { id: true, username: true } } },
        orderBy: { createdAt: "asc" },
        take: 100,
      });
      sendUser(userId, {
        type: "chat-history",
        channelId: msg.channelId,
        messages: messages.map(toProtoMessage),
      });
      break;
    }

    case "voice-join": {
      presence.joinVoice(userId, msg.channelId);
      const users = presence.getVoiceUsers(msg.channelId);
      sendUser(userId, {
        type: "voice-users",
        channelId: msg.channelId,
        users: users.map((u) => ({
          id: u.userId,
          username: u.username,
          status: "online" as const,
          isMuted: false,
          isDeafened: false,
          currentVoiceChannelId: msg.channelId,
        })),
      });
      const me = presence.get(userId);
      if (me) {
        for (const other of users) {
          if (other.userId === userId) continue;
          sendUser(other.userId, {
            type: "voice-joined",
            channelId: msg.channelId,
            user: { id: userId, username: me.username, status: "online", isMuted: false, isDeafened: false, currentVoiceChannelId: msg.channelId },
          });
        }
      }
      break;
    }

    case "voice-leave": {
      const entry = presence.get(userId);
      const chId = entry?.voiceChannelId;
      if (chId) {
        const others = presence.getVoiceUsers(chId);
        for (const other of others) {
          if (other.userId === userId) continue;
          sendUser(other.userId, { type: "voice-left", channelId: chId, userId });
        }
      }
      presence.leaveVoice(userId);
      break;
    }

    case "voice-mute":
    case "voice-deafen":
      break;

    case "rtc-offer":
    case "rtc-answer":
    case "rtc-ice": {
      sendUser(msg.targetUserId, { ...msg, fromUserId: userId } as ServerMessage);
      break;
    }
  }
}

export function setupWS(wss: WebSocketServer) {
  wss.on("connection", async (ws: WebSocket, req: IncomingMessage) => {
    const url = new URL(req.url || "", "http://localhost");
    const token = url.searchParams.get("token");

    if (!token) {
      send(ws, { type: "error", message: "Authentication required" });
      ws.close();
      return;
    }

    let userId: string;
    try {
      userId = verifyToken(token).userId;
    } catch {
      send(ws, { type: "error", message: "Invalid token" });
      ws.close();
      return;
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      send(ws, { type: "error", message: "User not found" });
      ws.close();
      return;
    }

    connections.set(userId, ws);
    presence.add(userId, user.username);

    send(ws, {
      type: "user-info",
      user: { id: user.id, username: user.username, status: "online", isMuted: false, isDeafened: false, currentVoiceChannelId: null },
    });

    const memberships = await prisma.serverMember.findMany({
      where: { userId },
      include: { server: { include: { channels: true, members: { include: { user: true } } } } },
    });
    const servers = memberships.map((m) => toProtoServer(m.server));
    for (const s of servers) presence.joinServer(userId, s.id);
    send(ws, { type: "server-list", servers });

    ws.on("message", (data: Buffer) => handleMsg(userId, data.toString()));

    ws.on("close", () => {
      const entry = presence.get(userId);
      if (entry?.voiceChannelId) {
        const others = presence.getVoiceUsers(entry.voiceChannelId);
        for (const other of others) {
          if (other.userId === userId) continue;
          sendUser(other.userId, { type: "voice-left", channelId: entry.voiceChannelId, userId });
        }
      }
      presence.remove(userId);
      connections.delete(userId);
    });
  });
}
