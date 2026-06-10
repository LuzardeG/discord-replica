import { useStore } from "../store";
import { clearToken } from "../auth";
import { useNavigate } from "react-router-dom";

export function UserPanel() {
  const user = useStore((s) => s.currentUser);
  const inVoice = useStore((s) => s.voiceChannelId !== null);
  const localStream = useStore((s) => s.localStream);
  const navigate = useNavigate();

  if (!user) return null;

  const muted = localStream ? !localStream.getAudioTracks()[0]?.enabled : false;

  const handleLogout = () => {
    clearToken();
    localStorage.removeItem("dr_user");
    navigate("/login");
    window.location.reload();
  };

  return (
    <div className="user-panel">
      <div className="usr-av">{user.username.charAt(0).toUpperCase()}</div>
      <div className="usr-info">
        <span className="usr-name">{user.username}</span>
        <span className="usr-status">{inVoice ? "Voice Connected" : "Online"}</span>
      </div>
      <button
        onClick={handleLogout}
        style={{ marginLeft: "auto", background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: 11, padding: "4px 8px" }}
        title="Log out"
      >
        Logout
      </button>
    </div>
  );
}
