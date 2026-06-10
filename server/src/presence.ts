// In-memory presence tracking (not persisted to DB)
// Maps userId -> { ws, serverIds, voiceChannelId }

interface PresenceEntry {
  userId: string;
  username: string;
  serverIds: Set<string>;
  voiceChannelId: string | null;
}

class Presence {
  private users = new Map<string, PresenceEntry>();

  add(userId: string, username: string) {
    this.users.set(userId, { userId, username, serverIds: new Set(), voiceChannelId: null });
  }

  remove(userId: string) {
    this.users.delete(userId);
  }

  get(userId: string): PresenceEntry | undefined {
    return this.users.get(userId);
  }

  joinServer(userId: string, serverId: string) {
    this.users.get(userId)?.serverIds.add(serverId);
  }

  leaveServer(userId: string, serverId: string) {
    this.users.get(userId)?.serverIds.delete(serverId);
  }

  joinVoice(userId: string, channelId: string) {
    const entry = this.users.get(userId);
    if (entry) entry.voiceChannelId = channelId;
  }

  leaveVoice(userId: string) {
    const entry = this.users.get(userId);
    if (entry) entry.voiceChannelId = null;
  }

  getServerUsers(serverId: string): PresenceEntry[] {
    return [...this.users.values()].filter((u) => u.serverIds.has(serverId));
  }

  getVoiceUsers(channelId: string): PresenceEntry[] {
    return [...this.users.values()].filter((u) => u.voiceChannelId === channelId);
  }

  isOnline(userId: string): boolean {
    return this.users.has(userId);
  }
}

export const presence = new Presence();
