import { create } from "zustand";
import { User, Server, Channel, Message } from "./types";

export interface RemoteStream {
  userId: string;
  stream: MediaStream;
}

interface State {
  currentUser: User | null;
  usernameSet: boolean;
  servers: Server[];
  channels: Channel[];
  messages: Record<string, Message[]>;

  activeServerId: string | null;
  activeChannelId: string | null;
  activeDMChannelId: string | null;

  voiceChannelId: string | null;
  voiceUsers: Record<string, User[]>;
  localStream: MediaStream | null;
  remoteStreams: RemoteStream[];

  modalCreateServer: boolean;
  modalCreateChannel: string | null; // serverId

  setUser: (u: User) => void;
  setUsernameSet: (v: boolean) => void;
  setServers: (s: Server[]) => void;
  addServer: (s: Server) => void;
  updateServer: (s: Server) => void;
  addChannel: (c: Channel) => void;
  setActiveServer: (id: string | null) => void;
  setActiveChannel: (id: string | null) => void;
  setActiveDM: (id: string | null) => void;
  addMessage: (m: Message) => void;
  setMessages: (chId: string, msgs: Message[]) => void;
  setVoiceUsers: (chId: string, users: User[]) => void;
  addVoiceUser: (chId: string, user: User) => void;
  removeVoiceUser: (chId: string, userId: string) => void;
  setVoiceChannel: (chId: string | null) => void;
  setLocalStream: (s: MediaStream | null) => void;
  addRemoteStream: (userId: string, stream: MediaStream) => void;
  removeRemoteStream: (userId: string) => void;
  toggleCreateServer: () => void;
  toggleCreateChannel: (serverId: string | null) => void;
}

export const useStore = create<State>((set) => ({
  currentUser: null,
  usernameSet: false,
  servers: [],
  channels: [],
  messages: {},

  activeServerId: null,
  activeChannelId: null,
  activeDMChannelId: null,

  voiceChannelId: null,
  voiceUsers: {},
  localStream: null,
  remoteStreams: [],

  modalCreateServer: false,
  modalCreateChannel: null,

  setUser: (u) => set({ currentUser: u }),
  setUsernameSet: (v) => set({ usernameSet: v }),
  setServers: (s) => {
    const allChannels = s.flatMap((srv) => srv.channels);
    set({ servers: s, channels: allChannels });
  },
  addServer: (s) => set((st) => ({ servers: [...st.servers, s] })),
  updateServer: (s) =>
    set((st) => {
      const servers = st.servers.map((x) => (x.id === s.id ? s : x));
      const allChannels = servers.flatMap((srv) => srv.channels);
      return { servers, channels: allChannels };
    }),
  addChannel: (c) =>
    set((st) => ({
      channels: st.channels.some((x) => x.id === c.id) ? st.channels : [...st.channels, c],
    })),
  setActiveServer: (id) => set({ activeServerId: id, activeChannelId: null, activeDMChannelId: null }),
  setActiveChannel: (id) => set({ activeChannelId: id, activeDMChannelId: null }),
  setActiveDM: (id) => set({ activeDMChannelId: id, activeChannelId: null, activeServerId: null }),
  addMessage: (m) =>
    set((st) => ({
      messages: { ...st.messages, [m.channelId]: [...(st.messages[m.channelId] || []), m] },
    })),
  setMessages: (chId, msgs) =>
    set((st) => ({ messages: { ...st.messages, [chId]: msgs } })),
  setVoiceUsers: (chId, users) =>
    set((st) => ({ voiceUsers: { ...st.voiceUsers, [chId]: users } })),
  addVoiceUser: (chId, user) =>
    set((st) => ({
      voiceUsers: {
        ...st.voiceUsers,
        [chId]: [...(st.voiceUsers[chId] || []).filter((u) => u.id !== user.id), user],
      },
    })),
  removeVoiceUser: (chId, userId) =>
    set((st) => ({
      voiceUsers: {
        ...st.voiceUsers,
        [chId]: (st.voiceUsers[chId] || []).filter((u) => u.id !== userId),
      },
    })),
  setVoiceChannel: (chId) => set({ voiceChannelId: chId }),
  setLocalStream: (s) => set({ localStream: s }),
  addRemoteStream: (userId, stream) =>
    set((st) => ({
      remoteStreams: [...st.remoteStreams.filter((r) => r.userId !== userId), { userId, stream }],
    })),
  removeRemoteStream: (userId) =>
    set((st) => ({ remoteStreams: st.remoteStreams.filter((r) => r.userId !== userId) })),
  toggleCreateServer: () => set((st) => ({ modalCreateServer: !st.modalCreateServer })),
  toggleCreateChannel: (id) => set({ modalCreateChannel: id }),
}));
