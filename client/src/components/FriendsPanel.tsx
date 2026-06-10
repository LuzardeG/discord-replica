import { useState, useEffect } from "react";
import { getToken } from "../auth";

const API = import.meta.env.VITE_API_URL || "https://discord-replica-server.onrender.com";

interface Friend {
  id: string;
  username: string;
  status: string;
}

interface FriendRequest {
  id: string;
  requester: { id: string; username: string };
}

export function FriendsPanel() {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<Friend[]>([]);
  const [tab, setTab] = useState<"friends" | "pending" | "add">("friends");

  const headers = { Authorization: `Bearer ${getToken()}`, "Content-Type": "application/json" };

  const loadFriends = async () => {
    const res = await fetch(`${API}/friends`, { headers });
    setFriends(await res.json());
  };

  const loadRequests = async () => {
    const res = await fetch(`${API}/friends/requests`, { headers });
    setRequests(await res.json());
  };

  useEffect(() => {
    loadFriends();
    loadRequests();
  }, []);

  const searchUsers = async () => {
    if (search.length < 2) return;
    const res = await fetch(`${API}/friends/search?q=${encodeURIComponent(search)}`, { headers });
    setSearchResults(await res.json());
  };

  const sendRequest = async (username: string) => {
    await fetch(`${API}/friends/request`, {
      method: "POST",
      headers,
      body: JSON.stringify({ username }),
    });
    setSearch("");
    setSearchResults([]);
    loadFriends();
    loadRequests();
  };

  const acceptRequest = async (id: string) => {
    await fetch(`${API}/friends/accept/${id}`, { method: "POST", headers });
    loadFriends();
    loadRequests();
  };

  const rejectRequest = async (id: string) => {
    await fetch(`${API}/friends/reject/${id}`, { method: "POST", headers });
    loadRequests();
  };

  return (
    <div className="sidebar">
      <div className="sb-header">Friends</div>
      <div className="sb-scroll" style={{ padding: "8px 0" }}>
        <div className="sb-label" style={{ display: "flex", gap: 4, padding: "4px 12px" }}>
          <button className={tab === "friends" ? "btn-primary" : "btn-cancel"} style={{ flex: 1, padding: "6px 8px", fontSize: 12 }} onClick={() => setTab("friends")}>
            Friends ({friends.length})
          </button>
          <button className={tab === "pending" ? "btn-primary" : "btn-cancel"} style={{ flex: 1, padding: "6px 8px", fontSize: 12 }} onClick={() => setTab("pending")}>
            Pending ({requests.length})
          </button>
          <button className={tab === "add" ? "btn-primary" : "btn-cancel"} style={{ flex: 1, padding: "6px 8px", fontSize: 12 }} onClick={() => setTab("add")}>
            Add
          </button>
        </div>

        {tab === "friends" && (
          <div>
            {friends.length === 0 && <div className="empty-chat">No friends yet</div>}
            {friends.map((f) => (
              <div key={f.id} className="ch-item" style={{ padding: "8px 16px" }}>
                <div className="usr-av" style={{ width: 28, height: 28, fontSize: 11 }}>{f.username.charAt(0).toUpperCase()}</div>
                <span className="ch-name">{f.username}</span>
                <span className="ch-count" style={{ color: f.status === "online" ? "var(--green)" : "var(--text-muted)" }}>
                  {f.status}
                </span>
              </div>
            ))}
          </div>
        )}

        {tab === "pending" && (
          <div>
            {requests.length === 0 && <div className="empty-chat">No pending requests</div>}
            {requests.map((r) => (
              <div key={r.id} className="ch-item" style={{ padding: "8px 16px", justifyContent: "space-between" }}>
                <span className="ch-name">{r.requester.username}</span>
                <div style={{ display: "flex", gap: 4 }}>
                  <button className="btn-primary" style={{ padding: "4px 12px", fontSize: 12 }} onClick={() => acceptRequest(r.id)}>Accept</button>
                  <button className="btn-cancel" style={{ padding: "4px 12px", fontSize: 12 }} onClick={() => rejectRequest(r.id)}>Reject</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === "add" && (
          <div style={{ padding: "12px 16px" }}>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && searchUsers()}
              placeholder="Search by username..."
              style={{ width: "100%", padding: "8px 12px", background: "var(--bg-tertiary)", border: "1px solid var(--divider)", borderRadius: 4, color: "var(--text-primary)", outline: "none" }}
            />
            <button className="btn-primary" style={{ width: "100%", marginTop: 8, padding: "8px" }} onClick={searchUsers}>Search</button>
            <div style={{ marginTop: 12 }}>
              {searchResults.map((u) => (
                <div key={u.id} className="ch-item" style={{ justifyContent: "space-between", padding: "8px 12px" }}>
                  <span className="ch-name">{u.username}</span>
                  <button className="btn-primary" style={{ padding: "4px 12px", fontSize: 12 }} onClick={() => sendRequest(u.username)}>Add Friend</button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
