import { useStore } from "../store";
import { send } from "../ws";
import { webrtc } from "../webrtc";

export function VoiceControls() {
  const voiceCh = useStore((s) => s.voiceChannelId);
  const setVoiceCh = useStore((s) => s.setVoiceChannel);
  const setLocalStream = useStore((s) => s.setLocalStream);
  const localStream = useStore((s) => s.localStream);

  const audio = localStream?.getAudioTracks()[0];
  const video = localStream?.getVideoTracks()[0];
  const micOn = audio ? audio.enabled : false;
  const camOn = video ? video.enabled : false;

  const toggleMic = () => {
    const on = webrtc.toggleMute();
    send({ type: "voice-mute", muted: !on });
  };

  const toggleCam = () => {
    webrtc.toggleCamera();
  };

  const leave = () => {
    webrtc.leave();
    setLocalStream(null);
    if (voiceCh) send({ type: "voice-leave", channelId: voiceCh });
    setVoiceCh(null);
  };

  return (
    <div className="voice-bar">
      <button className={`v-btn ${!micOn ? "off" : ""}`} onClick={toggleMic} title={micOn ? "Mute" : "Unmute"}>
        {micOn ? "MIC" : "MUT"}
      </button>
      <button className={`v-btn ${!camOn ? "off" : ""}`} onClick={toggleCam} title={camOn ? "Cam Off" : "Cam On"}>
        {camOn ? "CAM" : "NOV"}
      </button>
      <button className="v-btn leave" onClick={leave} title="Leave">
        EXIT
      </button>
    </div>
  );
}
