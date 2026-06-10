export type ChannelType = "text" | "voice";

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
  type: ChannelType;
  serverId: string;
}

export interface Server {
  id: string;
  name: string;
  ownerId: string;
  channels: Channel[];
  memberIds: string[];
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
  | { type: "rtc-offer"; targetUserId: string; sdp: RTCSessionDescriptionInit }
  | { type: "rtc-answer"; targetUserId: string; sdp: RTCSessionDescriptionInit }
  | { type: "rtc-ice"; targetUserId: string; candidate: RTCIceCandidateInit };

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
  | { type: "rtc-offer"; fromUserId: string; sdp: RTCSessionDescriptionInit }
  | { type: "rtc-answer"; fromUserId: string; sdp: RTCSessionDescriptionInit }
  | { type: "rtc-ice"; fromUserId: string; candidate: RTCIceCandidateInit }
  | { type: "error"; message: string };
