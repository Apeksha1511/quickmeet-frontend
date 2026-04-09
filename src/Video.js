import { useEffect, useRef, useState, useCallback } from "react";
import socket from "./socket";

const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    {
      urls: "turn:openrelay.metered.ca:80",
      username: "5f9d492dab2e65115d8e809c",
      credential: "tOll6qUbz+8sl04R",
    },
    {
      urls: "turn:openrelay.metered.ca:443",
      username: "5f9d492dab2e65115d8e809c",
      credential: "tOll6qUbz+8sl04R",
    },
    {
      urls: "turn:openrelay.metered.ca:443?transport=tcp",
      username: "5f9d492dab2e65115d8e809c",
      credential: "tOll6qUbz+8sl04R",
    },
  ],
};

function Video({ roomId, name, micOn, videoOn, setParticipants }) {
  const localVideoRef = useRef();
  const streamRef = useRef();
  const peersRef = useRef({});

  const [remoteStreams, setRemoteStreams] = useState([]);
  const [loading, setLoading] = useState(true);

  function addRemoteStream(peerId, stream, peerName, peerVideoOn) {
    setRemoteStreams((prev) => {
      if (prev.find((s) => s.id === peerId)) return prev;
      return [...prev, { id: peerId, stream, name: peerName, videoOn: peerVideoOn ?? true }];
    });
  }

  function removeRemoteStream(peerId) {
    setRemoteStreams((prev) => prev.filter((s) => s.id !== peerId));
    setParticipants((prev) => prev.filter((p) => p.id !== peerId));
  }

  function updatePeerVideo(peerId, state) {
    setRemoteStreams((prev) =>
      prev.map((s) => (s.id === peerId ? { ...s, videoOn: state } : s))
    );
  }

  const createPeer = useCallback((peerId, localStream, peerName, peerVideoOn) => {
    const peer = new RTCPeerConnection(ICE_SERVERS);

    localStream.getTracks().forEach((track) => peer.addTrack(track, localStream));

    peer.ontrack = (e) => {
      addRemoteStream(peerId, e.streams[0], peerName, peerVideoOn);
    };

    peer.onicecandidate = (e) => {
      if (e.candidate) socket.emit("ice-candidate", { to: peerId, candidate: e.candidate });
    };

    peer.onconnectionstatechange = () => {
      if (["disconnected", "failed", "closed"].includes(peer.connectionState)) {
        removeRemoteStream(peerId);
      }
    };

    return peer;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then(async (stream) => {
        streamRef.current = stream;
        localVideoRef.current.srcObject = stream;
        setLoading(false);
        socket.emit("join-room", { roomId, name });
      })
      .catch(() => setLoading(false));

    socket.on("existing-users", async (users) => {
      setParticipants(users);
      for (const user of users) {
        const peer = createPeer(user.id, streamRef.current, user.name, user.videoOn);
        peersRef.current[user.id] = peer;
        const offer = await peer.createOffer();
        await peer.setLocalDescription(offer);
        socket.emit("offer", { to: user.id, offer });
      }
    });

    socket.on("user-joined", (user) => {
      setParticipants((prev) => {
        if (prev.find(p => p.id === user.id)) return prev;
        return [...prev, user];
      });
    });

    socket.on("offer", async ({ from, offer }) => {
      const peerName = "Participant";
      const peer = createPeer(from, streamRef.current, peerName, true);
      peersRef.current[from] = peer;
      await peer.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await peer.createAnswer();
      await peer.setLocalDescription(answer);
      socket.emit("answer", { to: from, answer });
    });

    socket.on("answer", async ({ from, answer }) => {
      const peer = peersRef.current[from];
      if (peer) await peer.setRemoteDescription(new RTCSessionDescription(answer));
    });

    socket.on("ice-candidate", async ({ from, candidate }) => {
      const peer = peersRef.current[from];
      if (peer) {
        try { await peer.addIceCandidate(new RTCIceCandidate(candidate)); }
        catch (e) { console.error("ICE error:", e); }
      }
    });

    socket.on("peer-video-state", ({ id, videoOn: state }) => {
      updatePeerVideo(id, state);
    });

    socket.on("user-disconnected", (peerId) => {
      if (peersRef.current[peerId]) {
        peersRef.current[peerId].close();
        delete peersRef.current[peerId];
      }
      removeRemoteStream(peerId);
    });

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      Object.values(peersRef.current).forEach((p) => p.close());
      peersRef.current = {};
      socket.off("existing-users");
      socket.off("user-joined");
      socket.off("offer");
      socket.off("answer");
      socket.off("ice-candidate");
      socket.off("peer-video-state");
      socket.off("user-disconnected");
    };
  }, [roomId, name, createPeer, setParticipants]);

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
    socket.emit("video-state", { roomId, videoOn });
  }, [videoOn, roomId]);

  useEffect(() => {
    if (!streamRef.current) return;
    const audioTrack = streamRef.current.getAudioTracks()[0];
    if (!audioTrack) return;
    audioTrack.enabled = micOn;
  }, [micOn]);

  const total = 1 + remoteStreams.length;
  const gridCols = total === 1 ? "1fr" : total <= 4 ? "1fr 1fr" : "repeat(3, 1fr)";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500&display=swap');
        .video-wrapper { display:flex;flex-direction:column;align-items:center;gap:20px;width:100%;padding:0 24px; }
        .video-grid { display:grid;width:100%;max-width:1100px;gap:12px;grid-template-columns:${gridCols}; }
        .video-tile { position:relative;border-radius:16px;overflow:hidden;background:#0d1628;aspect-ratio:16/9;box-shadow:0 0 0 1px rgba(255,255,255,0.07),0 20px 50px rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center; }
        .video-tile video { width:100%;height:100%;object-fit:cover;display:block; }
        .local-video { transform:scaleX(-1); }
        .tile-label { position:absolute;bottom:10px;left:12px;background:rgba(0,0,0,0.55);backdrop-filter:blur(6px);border:1px solid rgba(255,255,255,0.08);border-radius:6px;padding:3px 9px;font-family:'DM Sans',sans-serif;font-size:12px;color:rgba(255,255,255,0.75);display:flex;align-items:center;gap:6px; }
        .live-dot { width:6px;height:6px;border-radius:50%;background:#22c55e;animation:pulse-dot 1.5s ease infinite; }
        @keyframes pulse-dot { 0%,100%{opacity:1} 50%{opacity:0.35} }
        .muted-ind { position:absolute;top:10px;right:12px;background:rgba(255,60,60,0.18);border:1px solid rgba(255,60,60,0.3);border-radius:6px;padding:3px 9px;font-size:11px;color:#ff8a8a; }
        .vid-off { position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;background:#0d1628;gap:10px; }
        .vid-off-av { width:60px;height:60px;border-radius:50%;background:rgba(26,111,255,0.1);border:2px solid rgba(26,111,255,0.25);display:flex;align-items:center;justify-content:center;font-size:22px;font-weight:600;color:#6ca0ff;text-transform:uppercase; }
        .vid-off-lbl { font-family:'DM Sans',sans-serif;font-size:12px;color:rgba(255,255,255,0.28); }
        .spinner-wrap { position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:#0d1628; }
        .spinner { width:32px;height:32px;border:2px solid rgba(255,255,255,0.07);border-top-color:#1a6fff;border-radius:50%;animation:spin 0.8s linear infinite; }
        @keyframes spin { to{transform:rotate(360deg)} }
      `}</style>

      <div className="video-wrapper">
        <div className="video-grid">
          {/* LOCAL */}
          <div className="video-tile">
            {loading && <div className="spinner-wrap"><div className="spinner"/></div>}
            <video ref={localVideoRef} autoPlay playsInline muted className="local-video"/>
            {!videoOn && (
              <div className="vid-off">
                <div className="vid-off-av">{name.charAt(0)}</div>
                <span className="vid-off-lbl">Camera is off</span>
              </div>
            )}
            <div className="tile-label"><div className="live-dot"/> {name} (You)</div>
            {!micOn && <div className="muted-ind">🔇 Muted</div>}
          </div>

          {/* REMOTE */}
          {remoteStreams.map(({ id, stream, name: peerName, videoOn: peerVideoOn }) => (
            <RemoteTile key={id} stream={stream} name={peerName} videoOn={peerVideoOn}/>
          ))}
        </div>
      </div>
    </>
  );
}

function RemoteTile({ stream, name, videoOn }) {
  const ref = useRef();
  useEffect(() => {
    if (ref.current) ref.current.srcObject = stream;
  }, [stream]);

  return (
    <div className="video-tile">
      <video ref={ref} autoPlay playsInline/>
      {!videoOn && (
        <div className="vid-off">
          <div className="vid-off-av">{name?.charAt(0) || "?"}</div>
          <span className="vid-off-lbl">Camera is off</span>
        </div>
      )}
      <div className="tile-label"><div className="live-dot"/> {name || "Participant"}</div>
    </div>
  );
}

export default Video;