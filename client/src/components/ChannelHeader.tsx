import { useStore } from "../store";

export function ChannelHeader() {
  const channels = useStore((s) => s.channels);
  const activeCID = useStore((s) => s.activeChannelId);
  const ch = channels.find((c) => c.id === activeCID);

  if (!ch) return null;

  return (
    <div className="ch-header">
      <span className="hash">#</span>
      <span>{ch.name}</span>
    </div>
  );
}
