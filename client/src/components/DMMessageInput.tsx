import { useState } from "react";
import { useStore } from "../store";
import { getToken } from "../auth";

const API = import.meta.env.VITE_API_URL || "http://localhost:3001";

export function DMMessageInput() {
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const activeDM = useStore((s) => s.activeDMChannelId);

  const handleSend = async () => {
    if (!text.trim() || !activeDM || sending) return;
    setSending(true);
    try {
      await fetch(`${API}/dms/${activeDM}/messages`, {
        method: "POST",
        headers: { Authorization: `Bearer ${getToken()}`, "Content-Type": "application/json" },
        body: JSON.stringify({ content: text.trim() }),
      });
      setText("");
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="msg-input-wrap">
      <input
        className="msg-input"
        placeholder="Message..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
        }}
        disabled={!activeDM}
      />
    </div>
  );
}
