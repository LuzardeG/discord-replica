import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useStore } from "./store";
import { connect, onRTC } from "./ws";
import { webrtc } from "./webrtc";
import { getToken } from "./auth";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { ServerList } from "./components/ServerList";
import { Sidebar } from "./components/Sidebar";
import { ChannelHeader } from "./components/ChannelHeader";
import { MessageList } from "./components/MessageList";
import { MessageInput } from "./components/MessageInput";
import { UserPanel } from "./components/UserPanel";
import { VoiceChannel } from "./components/VoiceChannel";
import { VideoGrid } from "./components/VideoGrid";
import { VoiceControls } from "./components/VoiceControls";
import { CreateServerModal } from "./components/CreateServerModal";
import { CreateChannelModal } from "./components/CreateChannelModal";
import { FriendsPanel } from "./components/FriendsPanel";
import { DMSidebar } from "./components/DMSidebar";
import { DMMessageList } from "./components/DMMessageList";
import { DMMessageInput } from "./components/DMMessageInput";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  if (!getToken()) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AppLayout() {
  const user = useStore((s) => s.currentUser);
  const activeCID = useStore((s) => s.activeChannelId);
  const activeDM = useStore((s) => s.activeDMChannelId);
  const channels = useStore((s) => s.channels);
  const [sidebarTab, setSidebarTab] = useState<"servers" | "friends" | "dms">("servers");

  useEffect(() => {
    connect();
    onRTC((msg) => {
      if (msg.sdp && msg.type === "rtc-offer") webrtc.handleOffer(msg.fromUserId, msg.sdp);
      if (msg.sdp && msg.type === "rtc-answer") webrtc.handleAnswer(msg.fromUserId, msg.sdp);
      if (msg.candidate && msg.type === "rtc-ice") webrtc.handleICE(msg.fromUserId, msg.candidate);
    });
  }, []);

  useEffect(() => {
    if (user) webrtc.setMyId(user.id);
  }, [user]);

  const activeCh = channels.find((c) => c.id === activeCID);
  const isVoice = activeCh?.type === "voice";

  let main: React.ReactNode;
  if (sidebarTab === "friends") {
    main = <FriendsPanel />;
  } else if (activeDM) {
    main = (
      <div className="main">
        <div className="ch-header">Direct Message</div>
        <DMMessageList />
        <DMMessageInput />
      </div>
    );
  } else if (activeCID && isVoice) {
    main = (
      <div className="main">
        <ChannelHeader />
        <VoiceChannel channelId={activeCID} />
      </div>
    );
  } else if (activeCID) {
    main = (
      <div className="main">
        <ChannelHeader />
        <MessageList channelId={activeCID} />
        <MessageInput channelId={activeCID} />
      </div>
    );
  } else {
    main = (
      <div className="main">
        <div className="welcome">
          <h1>Discord Replica</h1>
          <p>Select a channel to start chatting</p>
          <p>Chat uses TCP (WebSocket) &middot; Calls use UDP (WebRTC)</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <ServerList activeTab={sidebarTab} onTabChange={setSidebarTab} />
      <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
        {sidebarTab === "servers" && <Sidebar />}
        {sidebarTab === "dms" && <DMSidebar />}
        <UserPanel />
      </div>
      {main}
      <CreateServerModal />
      <CreateChannelModal />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/*" element={<ProtectedRoute><AppLayout /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  );
}
