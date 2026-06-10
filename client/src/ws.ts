import { useStore } from "./store";
import { ClientMessage, ServerMessage } from "./types";
import { getToken } from "./auth";

let ws: WebSocket | null = null;
let timer: ReturnType<typeof setTimeout> | null = null;

type RTCHandler = (msg: {
  type: "rtc-offer" | "rtc-answer" | "rtc-ice";
  fromUserId: string;
  sdp?: RTCSessionDescriptionInit;
  candidate?: RTCIceCandidateInit;
}) => void;
let rtcHandler: RTCHandler | null = null;

export function onRTC(h: RTCHandler) {
  rtcHandler = h;
}

function handle(msg: ServerMessage) {
  const st = useStore.getState();
  switch (msg.type) {
    case "user-info":
      st.setUser(msg.user);
      break;
    case "server-list":
      st.setServers(msg.servers);
      break;
    case "server-updated":
      st.updateServer(msg.server);
      break;
    case "channel-created":
      st.addChannel(msg.channel);
      break;
    case "chat-message":
      st.addMessage(msg.message);
      break;
    case "chat-history":
      st.setMessages(msg.channelId, msg.messages);
      break;
    case "voice-users":
      st.setVoiceUsers(msg.channelId, msg.users);
      break;
    case "voice-joined":
      st.addVoiceUser(msg.channelId, msg.user);
      break;
    case "voice-left":
      st.removeVoiceUser(msg.channelId, msg.userId);
      break;
    case "rtc-offer":
    case "rtc-answer":
    case "rtc-ice":
      rtcHandler?.(msg);
      break;
    case "error":
      console.error("server:", msg.message);
      break;
  }
}

export function connect() {
  const token = getToken();
  if (!token) return;

  const isProd = import.meta.env.PROD;
  const wsProtocol = isProd ? "wss:" : "ws:";
  const wsHost = isProd ? "discord-replica-server.onrender.com" : window.location.hostname;
  const wsPort = isProd ? "" : ":3001";
  const url = `${wsProtocol}//${wsHost}${wsPort}/ws?token=${token}`;

  function go() {
    ws = new WebSocket(url);
    ws.onmessage = (e) => {
      try {
        handle(JSON.parse(e.data));
      } catch {
        console.error("bad message");
      }
    };
    ws.onclose = () => {
      if (getToken()) {
        timer = setTimeout(go, 2000);
      }
    };
  }
  go();
}

export function disconnect() {
  if (timer) clearTimeout(timer);
  ws?.close();
  ws = null;
}

export function send(msg: ClientMessage) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(msg));
  }
}
