import { useEffect, useState } from "react";
import { useStore } from "../store";
import { send } from "../ws";
import { webrtc } from "../webrtc";
import { VideoGrid } from "./VideoGrid";
import { VoiceControls } from "./VoiceControls";

export function VoiceChannel({ channelId }: { channelId: string }) {
  const user = useStore((s) => s.currentUser);
  const voiceCh = useStore((s) => s.voiceChannelId);
  const setVoiceCh = useStore((s) => s.setVoiceChannel);
  const setLocalStream = useStore((s) => s.setLocalStream);
  const setRemote = useStore((s) => s.addRemoteStream);
  const removeRemote = useStore((s) => s.removeRemoteStream);
  const voiceUsers = useStore((s) => s.voiceUsers[channelId] || []);
  const [joining, setJoining] = useState(false);

  const joined = voiceCh === channelId;

  useEffect(() => {
    if (!user) return;
    webrtc.setMyId(user.id);
    webrtc.onRemote = (uid, stream) => setRemote(uid, stream);
    webrtc.onRemove = (uid) => removeRemote(uid);
  }, [user]);

  useEffect(() => {
    if (joined && voiceUsers.length > 1) {
      const peers = voiceUsers.filter((u) => u.id !== user?.id).map((u) => u.id);
      webrtc.joinChannel(peers);
    }
  }, [joined, voiceUsers.length]);

  const join = async () => {
    setJoining(true);
    const stream = await webrtc.acquireMedia();
    if (stream) {
      setLocalStream(stream);
      send({ type: "voice-join", channelId });
      setVoiceCh(channelId);
    }
    setJoining(false);
  };

  return (
    <div className="voice-view">
      {!joined ? (
        <>
          <div className="label">
            {voiceUsers.length > 0 ? `${voiceUsers.length} in voice` : "No one here"}
          </div>
          <button className="btn-primary" style={{ padding: "12px 32px", fontSize: 16 }} onClick={join} disabled={joining}>
            {joining ? "Connecting..." : "Join Voice"}
          </button>
        </>
      ) : (
        <>
          <VideoGrid />
          <VoiceControls />
        </>
      )}
    </div>
  );
}
