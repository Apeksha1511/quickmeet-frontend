import { useEffect, useRef, useState, useCallback } from "react";
import io from "socket.io-client";

const socket = io("http://localhost:5000");

// Google's free STUN server — needed to punch through NAT/firewalls
const ICE_SERVERS = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

function Video({ roomId, micOn, videoOn, setMicOn, setVideoOn }) {
  const localVideoRef = useRef();
  const streamRef = useRef();

  // peersRef: { socketId -> RTCPeerConnection }
  const peersRef = useRef({});

  // remoteStreams: [{ id, stream }] — drives the remote video grid
  const [remoteStreams, setRemoteStreams] = useState([]);

  const [loading, setLoading] = useState(true);

  // ── Helpers ────────────────────────────────────────────────

  function addRemoteStream(peerId, stream) {
    setRemoteStreams((prev) => {
      if (prev.find((s) => s.id === peerId)) return prev;
      return [...prev, { id: peerId, stream }];
    });
  }

  function removeRemoteStream(peerId) {
    setRemoteStreams((prev) => prev.filter((s) => s.id !== peerId));
  }

  // Create a peer connection wired up to socket signaling
  const createPeer = useCallback((peerId, localStream) => {
    const peer = new RTCPeerConnection(ICE_SERVERS);

    // Send our tracks to the remote peer
    localStream.getTracks().forEach((track) => peer.addTrack(track, localStream));

    // When we get a remote track, store it
    peer.ontrack = (e) => {
      addRemoteStream(peerId, e.streams[0]);
    };

    // Forward ICE candidates to the remote peer via server
    peer.onicecandidate = (e) => {
      if (e.candidate) {
        socket.emit("ice-candidate", { to: peerId, candidate: e.candidate });
      }
    };

    peer.onconnectionstatechange = () => {
      if (
        peer.connectionState === "disconnected" ||
        peer.connectionState === "failed" ||
        peer.connectionState === "closed"
      ) {
        removeRemoteStream(peerId);
      }
    };

    return peer;
  }, []);

  // ── Main Effect ────────────────────────────────────────────

  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then(async (stream) => {
        streamRef.current = stream;
        localVideoRef.current.srcObject = stream;
        setLoading(false);

        // Join the room — server replies with existing-users list
        socket.emit("join-room", roomId);
      })
      .catch(() => setLoading(false));

    // Server tells us who is already in the room.
    // We (the new user) create offers to each existing peer.
    socket.on("existing-users", async (userIds) => {
      for (const peerId of userIds) {
        const peer = createPeer(peerId, streamRef.current);
        peersRef.current[peerId] = peer;

        const offer = await peer.createOffer();
        await peer.setLocalDescription(offer);
        socket.emit("offer", { to: peerId, offer });
      }
    });

    // An existing peer receives our offer and sends back an answer
    socket.on("offer", async ({ from, offer }) => {
      const peer = createPeer(from, streamRef.current);
      peersRef.current[from] = peer;

      await peer.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await peer.createAnswer();
      await peer.setLocalDescription(answer);
      socket.emit("answer", { to: from, answer });
    });

    // We receive an answer to our offer
    socket.on("answer", async ({ from, answer }) => {
      const peer = peersRef.current[from];
      if (peer) await peer.setRemoteDescription(new RTCSessionDescription(answer));
    });

    // ICE candidates trickle in from the other side
    socket.on("ice-candidate", async ({ from, candidate }) => {
      const peer = peersRef.current[from];
      if (peer) {
        try {
          await peer.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {
          console.error("ICE candidate error:", e);
        }
      }
    });

    // A peer left the room
    socket.on("user-disconnected", (peerId) => {
      if (peersRef.current[peerId]) {
        peersRef.current[peerId].close();
        delete peersRef.current[peerId];
      }
      removeRemoteStream(peerId);
    });

    // Cleanup on leave — stops camera light + closes peer connections
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      Object.values(peersRef.current).forEach((p) => p.close());
      peersRef.current = {};

      socket.off("existing-users");
      socket.off("offer");
      socket.off("answer");
      socket.off("ice-candidate");
      socket.off("user-disconnected");
    };
  }, [roomId, createPeer]);

  // ── React to videoOn prop from Room.js ────────────────────
  useEffect(() => {
    if (!streamRef.current) return;

    if (!videoOn) {
      streamRef.current.getVideoTracks().forEach((track) => {
        track.stop();
        streamRef.current.removeTrack(track);
      });
    } else {
      navigator.mediaDevices.getUserMedia({ video: true }).then((newStream) => {
        const newTrack = newStream.getVideoTracks()[0];
        streamRef.current.addTrack(newTrack);

        Object.values(peersRef.current).forEach((peer) => {
          const sender = peer.getSenders().find((s) => s.track?.kind === "video");
          if (sender) sender.replaceTrack(newTrack);
        });

        localVideoRef.current.srcObject = null;
        localVideoRef.current.srcObject = streamRef.current;
      });
    }
  }, [videoOn]);

  // ── React to micOn prop from Room.js ───────────────────────
  useEffect(() => {
    if (!streamRef.current) return;
    const audioTrack = streamRef.current.getAudioTracks()[0];
    if (!audioTrack) return;
    audioTrack.enabled = micOn;
  }, [micOn]);

  // ── Render ─────────────────────────────────────────────────

  const totalParticipants = 1 + remoteStreams.length;
  const gridCols =
    totalParticipants === 1 ? "1fr"
    : totalParticipants === 2 ? "1fr 1fr"
    : totalParticipants <= 4 ? "1fr 1fr"
    : "repeat(3, 1fr)";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500&display=swap');

        .video-wrapper {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 20px;
          width: 100%;
          padding: 0 24px;
        }

        .video-grid {
          display: grid;
          width: 100%;
          max-width: 1100px;
          gap: 12px;
          grid-template-columns: ${gridCols};
        }

        .video-tile {
          position: relative;
          border-radius: 16px;
          overflow: hidden;
          background: #0d1628;
          aspect-ratio: 16/9;
          box-shadow: 0 0 0 1px rgba(255,255,255,0.07),
                      0 20px 50px rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .video-tile video {
          width: 100%; height: 100%;
          object-fit: cover; display: block;
        }

        .local-video { transform: scaleX(-1); }

        .tile-label {
          position: absolute;
          bottom: 10px; left: 12px;
          background: rgba(0,0,0,0.55);
          backdrop-filter: blur(6px);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 6px;
          padding: 3px 9px;
          font-family: 'DM Sans', sans-serif;
          font-size: 12px;
          color: rgba(255,255,255,0.75);
          display: flex; align-items: center; gap: 6px;
        }

        .live-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: #22c55e;
          animation: pulse-dot 1.5s ease infinite;
        }
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.35; }
        }

        .muted-indicator {
          position: absolute;
          top: 10px; right: 12px;
          background: rgba(255,60,60,0.18);
          border: 1px solid rgba(255,60,60,0.3);
          border-radius: 6px;
          padding: 3px 9px;
          font-size: 11px;
          color: #ff8a8a;
        }

        .video-off-overlay {
          position: absolute; inset: 0;
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          background: #0d1628; gap: 10px;
        }
        .video-off-avatar {
          width: 60px; height: 60px; border-radius: 50%;
          background: rgba(26,111,255,0.1);
          border: 2px solid rgba(26,111,255,0.25);
          display: flex; align-items: center; justify-content: center;
          font-size: 26px;
        }
        .video-off-label {
          font-family: 'DM Sans', sans-serif;
          font-size: 12px; color: rgba(255,255,255,0.28);
        }

        .spinner-wrap {
          position: absolute; inset: 0;
          display: flex; align-items: center; justify-content: center;
          background: #0d1628;
        }
        .spinner {
          width: 32px; height: 32px;
          border: 2px solid rgba(255,255,255,0.07);
          border-top-color: #1a6fff;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        .video-controls {
          display: flex; gap: 10px;
        }
        .vctr-btn {
          display: flex; align-items: center; gap: 7px;
          padding: 10px 20px;
          border-radius: 12px;
          border: 1px solid rgba(255,255,255,0.1);
          background: rgba(255,255,255,0.05);
          color: rgba(255,255,255,0.75);
          font-family: 'DM Sans', sans-serif;
          font-size: 13px; font-weight: 500;
          cursor: pointer; transition: all 0.18s;
        }
        .vctr-btn:hover {
          background: rgba(255,255,255,0.1); color: #fff;
          transform: translateY(-1px);
        }
        .vctr-btn.off {
          background: rgba(255,60,60,0.1);
          border-color: rgba(255,60,60,0.25);
          color: #ff8a8a;
        }
        .vctr-btn.off:hover { background: rgba(255,60,60,0.2); }
        .vctr-icon { font-size: 15px; }
      `}</style>

      <div className="video-wrapper">
        <div className="video-grid">

          {/* LOCAL TILE */}
          <div className="video-tile">
            {loading && (
              <div className="spinner-wrap"><div className="spinner" /></div>
            )}
            <video ref={localVideoRef} autoPlay playsInline muted className="local-video" />
            {!videoOn && (
              <div className="video-off-overlay">
                <div className="video-off-avatar">👤</div>
                <span className="video-off-label">Camera is off</span>
              </div>
            )}
            <div className="tile-label">
              <div className="live-dot" /> You
            </div>
            {!micOn && <div className="muted-indicator">🔇 Muted</div>}
          </div>

          {/* REMOTE TILES — one per connected participant */}
          {remoteStreams.map(({ id, stream }) => (
            <RemoteTile key={id} stream={stream} />
          ))}

        </div>
      </div>
    </>
  );
}

// Isolated component so each remote video gets its own ref
function RemoteTile({ stream }) {
  const ref = useRef();
  useEffect(() => {
    if (ref.current) ref.current.srcObject = stream;
  }, [stream]);

  return (
    <div className="video-tile">
      <video ref={ref} autoPlay playsInline />
      <div className="tile-label">
        <div className="live-dot" /> Participant
      </div>
    </div>
  );
}

export default Video;