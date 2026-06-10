import { useState } from "react";
import { useStore } from "../store";
import { send } from "../ws";
import { ChannelType } from "../types";

export function CreateChannelModal() {
  const serverId = useStore((s) => s.modalCreateChannel);
  const toggle = useStore((s) => s.toggleCreateChannel);
  const [name, setName] = useState("");
  const [kind, setKind] = useState<ChannelType>("text");

  if (!serverId) return null;

  const go = () => {
    const n = name.trim();
    if (!n) return;
    send({ type: "channel-create", serverId, name: n, channelType: kind });
    setName("");
    toggle(null);
  };

  return (
    <div className="modal-bg" onClick={() => toggle(null)}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>Create Channel</h2>
        <label>Type</label>
        <div className="modal-radio">
          <button className={kind === "text" ? "btn-primary" : "btn-cancel"} onClick={() => setKind("text")}># Text</button>
          <button className={kind === "voice" ? "btn-primary" : "btn-cancel"} onClick={() => setKind("voice")}>&#128264; Voice</button>
        </div>
        <label>Name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && go()}
          placeholder={kind === "text" ? "general" : "Lounge"}
          autoFocus
        />
        <div className="modal-btns">
          <button className="btn-cancel" onClick={() => toggle(null)}>Cancel</button>
          <button className="btn-primary" onClick={go}>Create</button>
        </div>
      </div>
    </div>
  );
}
