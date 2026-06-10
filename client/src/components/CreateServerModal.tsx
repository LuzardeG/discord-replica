import { useState } from "react";
import { useStore } from "../store";
import { send } from "../ws";

export function CreateServerModal() {
  const show = useStore((s) => s.modalCreateServer);
  const toggle = useStore((s) => s.toggleCreateServer);
  const [name, setName] = useState("");

  if (!show) return null;

  const go = () => {
    const n = name.trim();
    if (!n) return;
    send({ type: "server-create", name: n });
    setName("");
    toggle();
  };

  return (
    <div className="modal-bg" onClick={toggle}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>Create a Server</h2>
        <label>Server Name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && go()}
          placeholder="My Server"
          autoFocus
        />
        <div className="modal-btns">
          <button className="btn-cancel" onClick={toggle}>Cancel</button>
          <button className="btn-primary" onClick={go}>Create</button>
        </div>
      </div>
    </div>
  );
}
