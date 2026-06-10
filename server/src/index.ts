import express from "express";
import cors from "cors";
import http from "http";
import path from "path";
import { WebSocketServer } from "ws";
import { setupWS } from "./handler.js";
import authRoutes from "./routes/auth.js";
import serverRoutes from "./routes/servers.js";
import channelRoutes from "./routes/channels.js";
import messageRoutes from "./routes/messages.js";
import friendRoutes from "./routes/friends.js";
import dmRoutes from "./routes/dms.js";

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: "/ws" });

// Middleware
app.use(cors({ origin: process.env.FRONTEND_URL || "*", credentials: true }));
app.use(express.json());

// Health check
app.get("/health", (_req, res) => res.json({ ok: true }));

// API routes
app.use("/auth", authRoutes);
app.use("/servers", serverRoutes);
app.use("/channels", channelRoutes);
app.use("/messages", messageRoutes);
app.use("/friends", friendRoutes);
app.use("/dms", dmRoutes);

// Serve static client in production (only if built locally)
import fs from "fs";
const clientDist = path.resolve("../../client/dist");
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get("*", (_req, res) => {
    res.sendFile(path.join(clientDist, "index.html"));
  });
}

// WebSocket
setupWS(wss);

const PORT = parseInt(process.env.PORT || "3001", 10);
server.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on :${PORT}`);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down...");
  wss.close();
  server.close(() => process.exit(0));
});
