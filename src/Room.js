import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import Video from "./Video";
import Chat from "./Chat";

function Room() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [showChat, setShowChat] = useState(false);

  // Lifted up so the bottom bar controls Video.js
  const [micOn, setMicOn]     = useState(true);
  const [videoOn, setVideoOn] = useState(true);

  function leaveMeeting() {
    navigate("/");
  }

  const shortId = roomId ? roomId.slice(0, 8).toUpperCase() : "";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:wght@300;400;500&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        .room-root {
          height: 100vh;
          background: #06090f;
          display: flex;
          flex-direction: column;
          font-family: 'DM Sans', sans-serif;
          color: #fff;
          overflow: hidden;
        }

        /* TOP BAR */
        .topbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 24px;
          background: rgba(255,255,255,0.03);
          border-bottom: 1px solid rgba(255,255,255,0.07);
          backdrop-filter: blur(12px);
          z-index: 10;
        }
        .topbar-logo { display: flex; align-items: center; gap: 10px; }
        .topbar-logo-icon {
          width: 32px; height: 32px;
          background: linear-gradient(135deg, #1a6fff, #00c8ff);
          border-radius: 9px;
          display: flex; align-items: center; justify-content: center;
          font-size: 15px;
        }
        .topbar-logo-text {
          font-family: 'Syne', sans-serif;
          font-weight: 700; font-size: 16px;
          background: linear-gradient(90deg, #fff, #6ca0ff);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .room-id-badge {
          display: flex; align-items: center; gap: 8px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 8px; padding: 6px 14px;
          font-size: 12px; color: rgba(255,255,255,0.5);
        }
        .room-id-badge strong {
          color: #fff; font-family: 'Syne', sans-serif;
          letter-spacing: 2px; font-size: 13px;
        }
        .btn-leave {
          padding: 8px 20px; border-radius: 10px;
          background: rgba(255,60,60,0.15);
          border: 1px solid rgba(255,60,60,0.25);
          color: #ff6b6b;
          font-family: 'DM Sans', sans-serif;
          font-size: 13px; font-weight: 500;
          cursor: pointer; transition: all 0.18s;
        }
        .btn-leave:hover {
          background: rgba(255,60,60,0.28);
          border-color: rgba(255,60,60,0.5); color: #fff;
        }

        /* MAIN AREA */
        .main-area { flex: 1; display: flex; overflow: hidden; }
        .video-area {
          flex: 1; display: flex;
          align-items: center; justify-content: center;
          background: radial-gradient(ellipse at 50% 50%, #0d1628 0%, #06090f 70%);
        }
        .chat-panel {
          width: 320px;
          background: rgba(255,255,255,0.03);
          border-left: 1px solid rgba(255,255,255,0.07);
          display: flex; flex-direction: column;
          animation: slideIn 0.25s cubic-bezier(0.16,1,0.3,1);
        }
        @keyframes slideIn {
          from { transform: translateX(320px); opacity: 0; }
          to   { transform: translateX(0); opacity: 1; }
        }

        /* CONTROLS BAR */
        .controls {
          display: flex;
          justify-content: center; align-items: center;
          gap: 10px; padding: 14px 24px;
          background: rgba(255,255,255,0.03);
          border-top: 1px solid rgba(255,255,255,0.07);
        }

        .ctrl-btn {
          display: flex; flex-direction: column;
          align-items: center; gap: 4px;
          padding: 11px 22px; border-radius: 14px;
          border: 1px solid rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.05);
          color: rgba(255,255,255,0.75);
          font-family: 'DM Sans', sans-serif;
          font-size: 11px; font-weight: 500;
          cursor: pointer; transition: all 0.18s;
          min-width: 76px;
        }
        .ctrl-btn .ctrl-icon { font-size: 20px; line-height: 1; }
        .ctrl-btn:hover {
          background: rgba(255,255,255,0.1);
          border-color: rgba(255,255,255,0.15);
          color: #fff; transform: translateY(-1px);
        }

        /* OFF = red tint (mic/camera disabled) */
        .ctrl-btn.off {
          background: rgba(255,60,60,0.1);
          border-color: rgba(255,60,60,0.28);
          color: #ff8a8a;
        }
        .ctrl-btn.off:hover { background: rgba(255,60,60,0.2); }

        /* ACTIVE = blue tint (chat open) */
        .ctrl-btn.active {
          background: rgba(26,111,255,0.18);
          border-color: rgba(26,111,255,0.4);
          color: #6ca0ff;
        }
        .ctrl-btn.active:hover { background: rgba(26,111,255,0.28); }

        .ctrl-divider {
          width: 1px; height: 36px;
          background: rgba(255,255,255,0.07);
          margin: 0 2px;
        }
      `}</style>

      <div className="room-root">
        {/* Top Bar */}
        <div className="topbar">
          <div className="topbar-logo">
            <div className="topbar-logo-icon">🎥</div>
            <span className="topbar-logo-text">QuickMeet</span>
          </div>
          <div className="room-id-badge">
            Room &nbsp;<strong>{shortId}</strong>
          </div>
          <button className="btn-leave" onClick={leaveMeeting}>
            Leave Meeting
          </button>
        </div>

        {/* Main */}
        <div className="main-area">
          <div className="video-area">
            <Video
              roomId={roomId}
              micOn={micOn}
              videoOn={videoOn}
              setMicOn={setMicOn}
              setVideoOn={setVideoOn}
            />
          </div>
          {showChat && (
            <div className="chat-panel">
              <Chat roomId={roomId} />
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="controls">
          {/* Mic */}
          <button
            className={`ctrl-btn ${!micOn ? "off" : ""}`}
            onClick={() => setMicOn((prev) => !prev)}
          >
            <span className="ctrl-icon">{micOn ? "🎤" : "🔇"}</span>
            {micOn ? "Mute" : "Unmute"}
          </button>

          {/* Camera */}
          <button
            className={`ctrl-btn ${!videoOn ? "off" : ""}`}
            onClick={() => setVideoOn((prev) => !prev)}
          >
            <span className="ctrl-icon">{videoOn ? "📷" : "📵"}</span>
            {videoOn ? "Cam Off" : "Cam On"}
          </button>

          <div className="ctrl-divider" />

          {/* Chat */}
          <button
            className={`ctrl-btn ${showChat ? "active" : ""}`}
            onClick={() => setShowChat(!showChat)}
          >
            <span className="ctrl-icon">💬</span>
            Chat
          </button>
        </div>
      </div>
    </>
  );
}

export default Room;