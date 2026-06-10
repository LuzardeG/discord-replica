import { useState, useEffect } from "react";
import { useStore } from "../store";
import { getToken } from "../auth";

const API = import.meta.env.VITE_API_URL || "https://discord-replica-server.onrender.com";

interface DmChannel {
  id: string;
  otherUser: { id: string; username: string; status: string };
}

export function DMSidebar() {
  const [dms, setDms] = useState<DmChannel[]>([]);
  const [search, setSearch] = useState("");
  const activeDM = useStore((s) => s.activeDMChannelId);
  const setActiveDM = useStore((s) => s.setActiveDM);

  const headers = { Authorization: `Bearer ${getToken()}`, "Content-Type": "application/json" };

  const loadDMs = () => {
    fetch(`${API}/dms`, { headers })
      .then((r) => r.json())
      .then(setDms)
      .catch(console.error);
  };

  useEffect(() => {
    loadDMs();
  }, []);

  const openDM = async () => {
    if (!search.trim()) return;
    try {
      const res = await fetch(`${API}/dms/open`, {
        method: "POST",
        headers,
        body: JSON.stringify({ username: search.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.id) {
        setActiveDM(data.id);
        loadDMs();
        setSearch("");
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="sidebar">
      <div className="sb-header">Direct Messages</div>
      <div className="sb-scroll">
        <div style={{ padding: "8px 16px" }}>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && openDM()}
            placeholder="Enter a username..."
            style={{ width: "100%", padding: "8px 12px", background: "var(--bg-tertiary)", border: "1px solid var(--divider)", borderRadius: 4, color: "var(--text-primary)", outline: "none", fontSize: 13 }}
          />
          <button className="btn-primary" style={{ width: "100%", marginTop: 6, padding: "6px 8px", fontSize: 12 }} onClick={openDM}>Start Chat</button>
        </div>
        {dms.map((dm) => (
          <div
            key={dm.id}
            className={`ch-item ${activeDM === dm.id ? "active" : ""}`}
            onClick={() => setActiveDM(dm.id)}
            style={{ padding: "8px 16px" }}
          >
            <div className="usr-av" style={{ width: 28, height: 28, fontSize: 11 }}>
              {dm.otherUser.username.charAt(0).toUpperCase()}
            </div>
            <span className="ch-name">{dm.otherUser.username}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
