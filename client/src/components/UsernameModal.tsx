import { useState, useRef, useEffect } from "react";
import { useStore } from "../store";
import { send } from "../ws";

export function UsernameModal() {
  const set = useStore((s) => s.setUsernameSet);
  const setUser = useStore((s) => s.setUser);
  const [name, setName] = useState(localStorage.getItem("dr_name") || "");

  const go = () => {
    const n = name.trim() || "Anonymous";
    send({ type: "set-name", username: n });
    localStorage.setItem("dr_name", n);
    set(true);
  };

  return (
    <div className="modal-bg">
      <div className="modal">
        <h2>Discord Replica</h2>
        <label>Display Name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && go()}
          placeholder="Enter a name..."
          autoFocus
        />
        <div className="modal-btns">
          <button className="btn-primary" onClick={go}>Join</button>
        </div>
      </div>
    </div>
  );
}
