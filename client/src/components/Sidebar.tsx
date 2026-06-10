import { useStore } from "../store";

export function Sidebar() {
  const servers = useStore((s) => s.servers);
  const activeSID = useStore((s) => s.activeServerId);
  const activeCID = useStore((s) => s.activeChannelId);
  const activeDM = useStore((s) => s.activeDMChannelId);
  const channels = useStore((s) => s.channels);
  const setChannel = useStore((s) => s.setActiveChannel);
  const toggleChModal = useStore((s) => s.toggleCreateChannel);

  if (activeDM === "dm-list") {
    return (
      <div className="sidebar">
        <div className="sb-header">Direct Messages</div>
        <div className="sb-scroll">
          <div className="empty-chat">No DMs yet. Join a server to chat.</div>
        </div>
      </div>
    );
  }

  const server = servers.find((s) => s.id === activeSID);
  if (!server) return <div className="sidebar"><div className="sb-header">&nbsp;</div></div>;

  const textCh = channels.filter((c) => c.serverId === server.id && c.type === "text");
  const voiceCh = channels.filter((c) => c.serverId === server.id && c.type === "voice");

  return (
    <div className="sidebar">
      <div className="sb-header">{server.name}</div>
      <div className="sb-scroll">
        <div>
          <div className="sb-label">
            Text Channels
            <span onClick={() => toggleChModal(server.id)}>+</span>
          </div>
          {textCh.map((c) => (
            <div
              key={c.id}
              className={`ch-item ${activeCID === c.id ? "active" : ""}`}
              onClick={() => setChannel(c.id)}
            >
              <span className="ch-icon">#</span>
              <span className="ch-name">{c.name}</span>
            </div>
          ))}
          {textCh.length === 0 && (
            <div className="ch-item" style={{ color: "var(--text-muted)", fontSize: 13 }}>
              No text channels
            </div>
          )}
        </div>
        <div>
          <div className="sb-label">
            Voice Channels
            <span onClick={() => toggleChModal(server.id)}>+</span>
          </div>
          {voiceCh.map((c) => (
            <VoiceItem key={c.id} channelId={c.id} name={c.name} active={activeCID === c.id} onClick={() => setChannel(c.id)} />
          ))}
          {voiceCh.length === 0 && (
            <div className="ch-item" style={{ color: "var(--text-muted)", fontSize: 13 }}>
              No voice channels
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function VoiceItem({ channelId, name, active, onClick }: { channelId: string; name: string; active: boolean; onClick: () => void }) {
  const users = useStore((s) => s.voiceUsers[channelId] || []);
  return (
    <div className={`ch-item ${active ? "active" : ""}`} onClick={onClick}>
      <span className="ch-icon">&#128264;</span>
      <span className="ch-name">{name}</span>
      {users.length > 0 && <span className="ch-count">{users.length}</span>}
    </div>
  );
}
