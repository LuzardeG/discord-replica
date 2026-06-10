import { send } from "./ws";

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

class WebRTC {
  private peers = new Map<string, RTCPeerConnection>();
  private localStream: MediaStream | null = null;
  private myId = "";

  onRemote: ((userId: string, stream: MediaStream) => void) | null = null;
  onRemove: ((userId: string) => void) | null = null;

  setMyId(id: string) {
    this.myId = id;
  }

  async acquireMedia(): Promise<MediaStream | null> {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true,
      });
      return this.localStream;
    } catch (e) {
      console.error("media error:", e);
      return null;
    }
  }

  getLocal() {
    return this.localStream;
  }

  async joinChannel(peerIds: string[]) {
    for (const id of peerIds) {
      if (id === this.myId || this.peers.has(id)) continue;
      await this.createPeer(id, true);
    }
  }

  async handleOffer(from: string, sdp: RTCSessionDescriptionInit) {
    const pc = await this.createPeer(from, false);
    await pc.setRemoteDescription(new RTCSessionDescription(sdp));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    send({ type: "rtc-answer", targetUserId: from, sdp: answer });
  }

  async handleAnswer(from: string, sdp: RTCSessionDescriptionInit) {
    const pc = this.peers.get(from);
    if (!pc) return;
    await pc.setRemoteDescription(new RTCSessionDescription(sdp));
  }

  async handleICE(from: string, candidate: RTCIceCandidateInit) {
    const pc = this.peers.get(from);
    if (!pc) return;
    await pc.addIceCandidate(new RTCIceCandidate(candidate));
  }

  private async createPeer(userId: string, initiator: boolean): Promise<RTCPeerConnection> {
    this.peers.get(userId)?.close();
    const pc = new RTCPeerConnection(ICE_SERVERS);
    this.peers.set(userId, pc);

    pc.onicecandidate = (e) => {
      if (e.candidate) {
        send({ type: "rtc-ice", targetUserId: userId, candidate: e.candidate.toJSON() });
      }
    };

    pc.ontrack = (e) => {
      if (e.streams[0]) this.onRemote?.(userId, e.streams[0]);
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "failed" || pc.connectionState === "disconnected") {
        this.onRemove?.(userId);
        this.peers.delete(userId);
      }
    };

    if (this.localStream) {
      for (const track of this.localStream.getTracks()) {
        pc.addTrack(track, this.localStream);
      }
    }

    if (initiator) {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      send({ type: "rtc-offer", targetUserId: userId, sdp: offer });
    }

    return pc;
  }

  leave() {
    for (const [id, pc] of this.peers) {
      pc.close();
      this.onRemove?.(id);
    }
    this.peers.clear();
    this.localStream?.getTracks().forEach((t) => t.stop());
    this.localStream = null;
  }

  toggleMute(): boolean {
    const track = this.localStream?.getAudioTracks()[0];
    if (track) {
      track.enabled = !track.enabled;
      return track.enabled; // true = not muted
    }
    return true;
  }

  toggleCamera(): boolean {
    const track = this.localStream?.getVideoTracks()[0];
    if (track) {
      track.enabled = !track.enabled;
      return track.enabled;
    }
    return true;
  }
}

export const webrtc = new WebRTC();
