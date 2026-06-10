import { useEffect, useRef } from "react";
import { useStore, RemoteStream } from "../store";

export function VideoGrid() {
  const remote = useStore((s) => s.remoteStreams);
  const local = useStore((s) => s.localStream);
  const user = useStore((s) => s.currentUser);

  const all: { id: string; stream: MediaStream; label: string }[] = [];
  if (local) all.push({ id: "local", stream: local, label: user?.username || "You" });
  for (const r of remote) all.push({ id: r.userId, stream: r.stream, label: r.userId.slice(0, 8) });

  if (all.length === 0) return null;

  return (
    <div className="video-grid">
      {all.map((v) => (
        <VideoTile key={v.id} stream={v.stream} label={v.label} />
      ))}
    </div>
  );
}

function VideoTile({ stream, label }: { stream: MediaStream; label: string }) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (ref.current) ref.current.srcObject = stream;
  }, [stream]);

  return (
    <div className="vid-tile">
      <video ref={ref} autoPlay playsInline muted={label === "You"} />
      <div className="vid-label">{label}</div>
    </div>
  );
}
