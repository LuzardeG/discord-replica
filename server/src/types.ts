export type ChannelType = "text" | "voice";

// Protocol types sent over WebSocket
// These match what the server actually sends, not the DB schema

export interface User {
  id: string;
  username: string;
  status: "online" | "idle" | "dnd";
  isMuted: boolean;
  isDeafened: boolean;
  currentVoiceChannelId: string | null;
}

export interface Channel {
  id: string;
  name: string;
  type: string;
  serverId: string;
}

export interface Server {
  id: string;
  name: string;
  icon?: string | null;
  ownerId: string;
  channels: Channel[];
  members: ServerMember[];
}

export interface ServerMember {
  userId: string;
  serverId: string;
  role: string;
  user: { id: string; username: string };
}

export interface Message {
  id: string;
  channelId: string;
  authorId: string;
  authorName: string;
  content: string;
  timestamp: number;
}

export type ClientMessage =
  | { type: "set-name"; username: string }
  | { type: "server-create"; name: string }
  | { type: "server-join"; serverId: string }
  | { type: "channel-create"; serverId: string; name: string; channelType: ChannelType }
  | { type: "chat-send"; channelId: string; content: string }
  | { type: "chat-history"; channelId: string }
  | { type: "voice-join"; channelId: string }
  | { type: "voice-leave"; channelId: string }
  | { type: "voice-mute"; muted: boolean }
  | { type: "voice-deafen"; deafened: boolean }
  | { type: "rtc-offer"; targetUserId: string; sdp: Record<string, unknown> }
  | { type: "rtc-answer"; targetUserId: string; sdp: Record<string, unknown> }
  | { type: "rtc-ice"; targetUserId: string; candidate: Record<string, unknown> };

export type ServerMessage =
  | { type: "user-info"; user: User }
  | { type: "server-list"; servers: Server[] }
  | { type: "server-created"; server: Server }
  | { type: "server-updated"; server: Server }
  | { type: "channel-created"; channel: Channel }
  | { type: "chat-message"; message: Message }
  | { type: "chat-history"; channelId: string; messages: Message[] }
  | { type: "voice-users"; channelId: string; users: User[] }
  | { type: "voice-joined"; channelId: string; user: User }
  | { type: "voice-left"; channelId: string; userId: string }
  | { type: "rtc-offer"; fromUserId: string; sdp: Record<string, unknown> }
  | { type: "rtc-answer"; fromUserId: string; sdp: Record<string, unknown> }
  | { type: "rtc-ice"; fromUserId: string; candidate: Record<string, unknown> }
  | { type: "error"; message: string };
