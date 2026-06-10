import { useState } from "react";
import { useStore } from "../store";
import { send } from "../ws";

export function MessageInput({ channelId }: { channelId: string }) {
  const [text, setText] = useState("");
  const channelName = useStore((s) => s.channels.find((c) => c.id === channelId)?.name || "channel");

  const handleSend = () => {
    const t = text.trim();
    if (!t) return;
    send({ type: "chat-send", channelId, content: t });
    setText("");
  };

  return (
    <div className="msg-input-wrap">
      <div className="msg-input-box">
        <textarea
          className="msg-input"
          placeholder={`Message #${channelName}`}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          rows={1}
        />
        <button className="msg-send" onClick={handleSend}>&#9654;</button>
      </div>
    </div>
  );
}
