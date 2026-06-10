import { useEffect, useRef } from "react";
import { useStore } from "../store";
import { send } from "../ws";

export function MessageList({ channelId }: { channelId: string }) {
  const messages = useStore((s) => s.messages[channelId] || []);
  const bottom = useRef<HTMLDivElement>(null);

  useEffect(() => {
    send({ type: "chat-history", channelId });
  }, [channelId]);

  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  return (
    <div className="msg-list">
      {messages.length === 0 && (
        <div className="empty-chat">No messages yet. Start the conversation!</div>
      )}
      {messages.map((m) => (
        <div key={m.id} className="msg">
          <div className="msg-av">{m.authorName.charAt(0).toUpperCase()}</div>
          <div className="msg-body">
            <div className="msg-head">
              <span className="msg-author">{m.authorName}</span>
              <span className="msg-time">{new Date(m.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
            </div>
            <div className="msg-text">{m.content}</div>
          </div>
        </div>
      ))}
      <div ref={bottom} />
    </div>
  );
}
