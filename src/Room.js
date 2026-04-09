import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import Video from "./Video";
import Chat from "./Chat";

function Room() {
  const { roomId } = useParams();
  const navigate = useNavigate();

  // Name lobby — shown before entering the meeting
  const [name, setName] = useState("");
  const [joined, setJoined] = useState(false);

  const [showChat, setShowChat] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [participants, setParticipants] = useState([]);

  const [micOn, setMicOn] = useState(true);
  const [videoOn, setVideoOn] = useState(true);

  const shortId = roomId ? roomId.slice(0, 8).toUpperCase() : "";

  function enterMeeting() {
    if (!name.trim()) return;
    setJoined(true);
  }

  function leaveMeeting() {
    navigate("/");
  }

  // ── LOBBY SCREEN ────────────────────────────────────────────
  if (!joined) {
    return (
      <>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@300;400;500&display=swap');
          * { box-sizing: border-box; margin: 0; padding: 0; }
          .lobby-root {
            min-height: 100vh;
            background: #080c14;
            display: flex; align-items: center; justify-content: center;
            font-family: 'DM Sans', sans-serif;
            position: relative; overflow: hidden;
          }
          .lobby-orb1 {
            position: absolute; width: 400px; height: 400px; border-radius: 50%;
            background: #1a6fff; filter: blur(100px); opacity: 0.2;
            top: -100px; left: -100px;
          }
          .lobby-orb2 {
            position: absolute; width: 300px; height: 300px; border-radius: 50%;
            background: #00c8ff; filter: blur(100px); opacity: 0.15;
            bottom: -80px; right: -80px;
          }
          .lobby-card {
            position: relative; z-index: 10;
            background: rgba(255,255,255,0.04);
            backdrop-filter: blur(32px);
            border: 1px solid rgba(255,255,255,0.08);
            border-radius: 24px;
            padding: 48px 44px;
            width: 420px;
            box-shadow: 0 40px 80px rgba(0,0,0,0.5);
          }
          .lobby-logo {
            display: flex; align-items: center; gap: 10px; margin-bottom: 8px;
          }
          .lobby-logo-icon {
            width: 36px; height: 36px;
            background: linear-gradient(135deg, #1a6fff, #00c8ff);
            border-radius: 10px;
            display: flex; align-items: center; justify-content: center; font-size: 18px;
          }
          .lobby-logo-text {
            font-family: 'Syne', sans-serif; font-weight: 800; font-size: 22px;
            background: linear-gradient(90deg, #fff 60%, #6ca0ff);
            -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          }
          .lobby-subtitle { font-size: 13px; color: rgba(255,255,255,0.35); margin-bottom: 36px; }
          .lobby-room-badge {
            background: rgba(255,255,255,0.05);
            border: 1px solid rgba(255,255,255,0.08);
            border-radius: 8px; padding: 8px 14px;
            font-size: 12px; color: rgba(255,255,255,0.4);
            margin-bottom: 28px; display: flex; align-items: center; gap: 8px;
          }
          .lobby-room-badge strong {
            color: #fff; font-family: 'Syne', sans-serif;
            letter-spacing: 2px; font-size: 13px;
          }
          .lobby-label {
            font-size: 11px; letter-spacing: 1px; text-transform: uppercase;
            color: rgba(255,255,255,0.3); margin-bottom: 8px; font-weight: 500;
          }
          .lobby-input {
            width: 100%; padding: 13px 16px;
            background: rgba(255,255,255,0.06);
            border: 1px solid rgba(255,255,255,0.1);
            border-radius: 12px; color: #fff;
            font-family: 'DM Sans', sans-serif; font-size: 15px;
            outline: none; margin-bottom: 20px; transition: border-color 0.18s;
          }
          .lobby-input::placeholder { color: rgba(255,255,255,0.22); }
          .lobby-input:focus {
            border-color: rgba(26,111,255,0.5);
            box-shadow: 0 0 0 3px rgba(26,111,255,0.12);
          }
          .lobby-btn {
            width: 100%; padding: 14px;
            background: linear-gradient(135deg, #1a6fff, #0095ff);
            border: none; border-radius: 12px;
            color: #fff; font-family: 'DM Sans', sans-serif;
            font-size: 15px; font-weight: 500; cursor: pointer;
            transition: all 0.2s;
            box-shadow: 0 8px 24px rgba(26,111,255,0.35);
          }
          .lobby-btn:hover { filter: brightness(1.1); transform: translateY(-1px); }
          .lobby-btn:disabled { opacity: 0.4; cursor: default; transform: none; }
        `}</style>
        <div className="lobby-root">
          <div className="lobby-orb1" /><div className="lobby-orb2" />
          <div className="lobby-card">
            <div className="lobby-logo">
              <div className="lobby-logo-icon">🎥</div>
              <span className="lobby-logo-text">QuickMeet</span>
            </div>
            <p className="lobby-subtitle">You're about to join a meeting</p>
            <div className="lobby-room-badge">
              Room &nbsp;<strong>{shortId}</strong>
            </div>
            <p className="lobby-label">Your name</p>
            <input
              className="lobby-input"
              placeholder="Enter your name…"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && enterMeeting()}
              autoFocus
            />
            <button className="lobby-btn" onClick={enterMeeting} disabled={!name.trim()}>
              Join Meeting →
            </button>
          </div>
        </div>
      </>
    );
  }

  // ── ROOM SCREEN ─────────────────────────────────────────────
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:wght@300;400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .room-root {
          height: 100vh; background: #06090f;
          display: flex; flex-direction: column;
          font-family: 'DM Sans', sans-serif; color: #fff; overflow: hidden;
        }
        .topbar {
          display: flex; align-items: center; justify-content: space-between;
          padding: 14px 24px;
          background: rgba(255,255,255,0.03);
          border-bottom: 1px solid rgba(255,255,255,0.07);
          backdrop-filter: blur(12px); z-index: 10;
        }
        .topbar-logo { display: flex; align-items: center; gap: 10px; }
        .topbar-logo-icon {
          width: 32px; height: 32px;
          background: linear-gradient(135deg, #1a6fff, #00c8ff);
          border-radius: 9px; display: flex; align-items: center; justify-content: center; font-size: 15px;
        }
        .topbar-logo-text {
          font-family: 'Syne', sans-serif; font-weight: 700; font-size: 16px;
          background: linear-gradient(90deg, #fff, #6ca0ff);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
        }
        .topbar-right { display: flex; align-items: center; gap: 10px; }
        .room-id-badge {
          display: flex; align-items: center; gap: 8px;
          background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08);
          border-radius: 8px; padding: 6px 14px;
          font-size: 12px; color: rgba(255,255,255,0.5);
        }
        .room-id-badge strong {
          color: #fff; font-family: 'Syne', sans-serif; letter-spacing: 2px; font-size: 13px;
        }
        .btn-leave {
          padding: 8px 20px; border-radius: 10px;
          background: rgba(255,60,60,0.15); border: 1px solid rgba(255,60,60,0.25);
          color: #ff6b6b; font-family: 'DM Sans', sans-serif;
          font-size: 13px; font-weight: 500; cursor: pointer; transition: all 0.18s;
        }
        .btn-leave:hover { background: rgba(255,60,60,0.28); border-color: rgba(255,60,60,0.5); color: #fff; }
        .main-area { flex: 1; display: flex; overflow: hidden; }
        .video-area {
          flex: 1; display: flex; align-items: center; justify-content: center;
          background: radial-gradient(ellipse at 50% 50%, #0d1628 0%, #06090f 70%);
        }
        /* Side panels */
        .side-panel {
          width: 300px; background: rgba(255,255,255,0.03);
          border-left: 1px solid rgba(255,255,255,0.07);
          display: flex; flex-direction: column;
          animation: slideIn 0.25s cubic-bezier(0.16,1,0.3,1);
        }
        @keyframes slideIn {
          from { transform: translateX(300px); opacity: 0; }
          to   { transform: translateX(0); opacity: 1; }
        }
        .panel-header {
          padding: 16px 18px; border-bottom: 1px solid rgba(255,255,255,0.07);
          display: flex; align-items: center; gap: 8px;
          font-size: 14px; font-weight: 500; color: rgba(255,255,255,0.85);
        }
        .panel-header-icon {
          width: 26px; height: 26px; border-radius: 7px;
          background: rgba(26,111,255,0.15);
          display: flex; align-items: center; justify-content: center; font-size: 13px;
        }
        /* Participants list */
        .participants-list { flex: 1; overflow-y: auto; padding: 12px; display: flex; flex-direction: column; gap: 6px; }
        .participant-item {
          display: flex; align-items: center; gap: 10px;
          padding: 10px 12px; border-radius: 10px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.06);
        }
        .participant-avatar {
          width: 32px; height: 32px; border-radius: 50%;
          background: linear-gradient(135deg, #1a6fff33, #00c8ff33);
          border: 1px solid rgba(26,111,255,0.3);
          display: flex; align-items: center; justify-content: center;
          font-size: 13px; font-weight: 600; color: #6ca0ff;
          flex-shrink: 0; text-transform: uppercase;
        }
        .participant-name { font-size: 13px; color: rgba(255,255,255,0.8); flex: 1; }
        .participant-you { font-size: 11px; color: rgba(255,255,255,0.3); }
        /* Controls */
        .controls {
          display: flex; justify-content: center; align-items: center;
          gap: 10px; padding: 14px 24px;
          background: rgba(255,255,255,0.03);
          border-top: 1px solid rgba(255,255,255,0.07);
        }
        .ctrl-btn {
          display: flex; flex-direction: column; align-items: center; gap: 4px;
          padding: 11px 20px; border-radius: 14px;
          border: 1px solid rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.05);
          color: rgba(255,255,255,0.75);
          font-family: 'DM Sans', sans-serif; font-size: 11px; font-weight: 500;
          cursor: pointer; transition: all 0.18s; min-width: 70px;
        }
        .ctrl-btn .ctrl-icon { font-size: 20px; line-height: 1; }
        .ctrl-btn:hover { background: rgba(255,255,255,0.1); color: #fff; transform: translateY(-1px); }
        .ctrl-btn.off { background: rgba(255,60,60,0.1); border-color: rgba(255,60,60,0.28); color: #ff8a8a; }
        .ctrl-btn.off:hover { background: rgba(255,60,60,0.2); }
        .ctrl-btn.active { background: rgba(26,111,255,0.18); border-color: rgba(26,111,255,0.4); color: #6ca0ff; }
        .ctrl-btn.active:hover { background: rgba(26,111,255,0.28); }
        .ctrl-divider { width: 1px; height: 36px; background: rgba(255,255,255,0.07); margin: 0 2px; }
        .participant-badge {
          background: rgba(26,111,255,0.25); border-radius: 20px;
          padding: 1px 6px; font-size: 10px; color: #6ca0ff; margin-left: auto;
        }
      `}</style>

      <div className="room-root">
        {/* Top Bar */}
        <div className="topbar">
          <div className="topbar-logo">
            <div className="topbar-logo-icon">🎥</div>
            <span className="topbar-logo-text">QuickMeet</span>
          </div>
          <div className="room-id-badge">Room &nbsp;<strong>{shortId}</strong></div>
          <div className="topbar-right">
            <button className="btn-leave" onClick={leaveMeeting}>Leave Meeting</button>
          </div>
        </div>

        {/* Main */}
        <div className="main-area">
          <div className="video-area">
            <Video
              roomId={roomId}
              name={name}
              micOn={micOn}
              videoOn={videoOn}
              setParticipants={setParticipants}
            />
          </div>

          {/* Participants Panel */}
          {showParticipants && (
            <div className="side-panel">
              <div className="panel-header">
                <div className="panel-header-icon">👥</div>
                Participants ({participants.length + 1})
              </div>
              <div className="participants-list">
                {/* You */}
                <div className="participant-item">
                  <div className="participant-avatar">{name.charAt(0)}</div>
                  <span className="participant-name">{name}</span>
                  <span className="participant-you">You</span>
                </div>
                {/* Others */}
                {participants.map((p) => (
                  <div key={p.id} className="participant-item">
                    <div className="participant-avatar">{p.name.charAt(0)}</div>
                    <span className="participant-name">{p.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Chat Panel */}
          {showChat && (
            <div className="side-panel">
              <Chat roomId={roomId} name={name} />
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="controls">
          <button className={`ctrl-btn ${!micOn ? "off" : ""}`} onClick={() => setMicOn((p) => !p)}>
            <span className="ctrl-icon">{micOn ? "🎤" : "🔇"}</span>
            {micOn ? "Mute" : "Unmute"}
          </button>

          <button className={`ctrl-btn ${!videoOn ? "off" : ""}`} onClick={() => setVideoOn((p) => !p)}>
            <span className="ctrl-icon">{videoOn ? "📷" : "📵"}</span>
            {videoOn ? "Cam Off" : "Cam On"}
          </button>

          <div className="ctrl-divider" />

          <button
            className={`ctrl-btn ${showParticipants ? "active" : ""}`}
            onClick={() => { setShowParticipants((p) => !p); setShowChat(false); }}
          >
            <span className="ctrl-icon">👥</span>
            People
            {participants.length > 0 && (
              <span className="participant-badge">{participants.length + 1}</span>
            )}
          </button>

          <button
            className={`ctrl-btn ${showChat ? "active" : ""}`}
            onClick={() => { setShowChat((p) => !p); setShowParticipants(false); }}
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