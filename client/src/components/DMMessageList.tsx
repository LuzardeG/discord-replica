import { useEffect, useRef, useState } from "react";
import { useStore } from "../store";
import { getToken } from "../auth";

const API = import.meta.env.VITE_API_URL || "https://discord-replica-server.onrender.com";

interface DmMsg {
  id: string;
  content: string;
  authorId: string;
  author: { id: string; username: string };
  createdAt: string;
}

export function DMMessageList() {
  const activeDM = useStore((s) => s.activeDMChannelId);
  const [messages, setMessages] = useState<DmMsg[]>([]);
  const bottom = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!activeDM) { setMessages([]); return; }
    fetch(`${API}/dms/${activeDM}/messages`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    })
      .then((r) => r.json())
      .then(setMessages)
      .catch(console.error);
  }, [activeDM]);

  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  if (!activeDM) return <div className="empty-chat">Select a conversation</div>;

  return (
    <div className="msg-list">
      {messages.length === 0 && <div className="empty-chat">No messages yet. Say hello!</div>}
      {messages.map((m, i) => (
        <div key={m.id || i} className={`msg-group ${i > 0 && messages[i - 1].authorId === m.authorId ? "same-user" : ""}`}>
          {i === 0 || messages[i - 1].authorId !== m.authorId ? (
            <>
              <div className="usr-av">{(m.author?.username || "?").charAt(0).toUpperCase()}</div>
              <div>
                <div className="msg-header">
                  <span className="msg-author">{m.author?.username}</span>
                  <span className="msg-time">{new Date(m.createdAt).toLocaleTimeString()}</span>
                </div>
                <div className="msg-content">{m.content}</div>
              </div>
            </>
          ) : (
            <div className="msg-continuation">
              <span className="msg-time-inline">{new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
              <span className="msg-content">{m.content}</span>
            </div>
          )}
        </div>
      ))}
      <div ref={bottom} />
    </div>
  );
}
