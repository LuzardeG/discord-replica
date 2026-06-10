import { useEffect } from "react";
import { useStore } from "../store";

interface Props {
  activeTab: "servers" | "friends" | "dms";
  onTabChange: (tab: "servers" | "friends" | "dms") => void;
}

export function ServerList({ activeTab, onTabChange }: Props) {
  const servers = useStore((s) => s.servers);
  const active = useStore((s) => s.activeServerId);
  const setServer = useStore((s) => s.setActiveServer);
  const setDM = useStore((s) => s.setActiveDM);
  const toggleModal = useStore((s) => s.toggleCreateServer);
  const channels = useStore((s) => s.channels);
  const activeCID = useStore((s) => s.activeChannelId);

  useEffect(() => {
    if (active && !activeCID) {
      const ch = channels.find((c) => c.serverId === active);
      if (ch) useStore.getState().setActiveChannel(ch.id);
    }
  }, [active, channels.length]);

  return (
    <div className="server-list">
      <div
        className={`srv-icon ${activeTab === "dms" ? "active" : ""}`}
        onClick={() => onTabChange("dms")}
        title="Direct Messages"
      >
        @
      </div>
      <div
        className={`srv-icon ${activeTab === "friends" ? "active" : ""}`}
        onClick={() => onTabChange("friends")}
        title="Friends"
        style={{ fontSize: 14 }}
      >
        F
      </div>
      <div className="srv-divider" />
      {servers.map((s) => (
        <div
          key={s.id}
          className={`srv-icon ${activeTab === "servers" && active === s.id ? "active" : ""}`}
          onClick={() => { onTabChange("servers"); setServer(s.id); }}
          title={s.name}
        >
          {s.name.charAt(0).toUpperCase()}
        </div>
      ))}
      <div className="srv-divider" />
      <div className="srv-icon srv-add" onClick={toggleModal} title="Add a Server">
        +
      </div>
    </div>
  );
}
