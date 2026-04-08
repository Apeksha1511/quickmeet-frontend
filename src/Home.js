import { useNavigate } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import { useState } from "react";

function Home() {
  const navigate = useNavigate();
  const [room, setRoom] = useState("");
  function createRoom() {
    const id = uuidv4();
    navigate(`/room/${id}`);
  }

  function joinRoom() {
    if (room.trim() !== "") {
      navigate(`/room/${room}`);
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Enter") joinRoom();
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=DM+Sans:wght@300;400;500&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        .home-root {
          min-height: 100vh;
          background: #080c14;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'DM Sans', sans-serif;
          overflow: hidden;
          position: relative;
        }

        .orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(90px);
          opacity: 0.35;
          animation: drift 10s ease-in-out infinite alternate;
        }
        .orb1 { width: 500px; height: 500px; background: #1a6fff; top: -100px; left: -120px; animation-delay: 0s; }
        .orb2 { width: 400px; height: 400px; background: #00c8ff; bottom: -80px; right: -100px; animation-delay: 3s; }
        .orb3 { width: 300px; height: 300px; background: #6c4fff; top: 50%; left: 50%; animation-delay: 6s; }

        @keyframes drift {
          from { transform: translate(0, 0) scale(1); }
          to   { transform: translate(30px, 20px) scale(1.07); }
        }

        .grid-overlay {
          position: absolute; inset: 0;
          background-image: linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
          background-size: 48px 48px;
          pointer-events: none;
        }

        .card {
          position: relative;
          z-index: 10;
          background: rgba(255,255,255,0.04);
          backdrop-filter: blur(32px);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 28px;
          padding: 56px 52px;
          width: 460px;
          box-shadow: 0 40px 80px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.07);
          animation: fadeUp 0.7s cubic-bezier(0.16,1,0.3,1) both;
        }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(32px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .logo-row {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 10px;
        }

        .logo-icon {
          width: 42px; height: 42px;
          background: linear-gradient(135deg, #1a6fff, #00c8ff);
          border-radius: 12px;
          display: flex; align-items: center; justify-content: center;
          font-size: 20px;
          box-shadow: 0 0 24px rgba(26,111,255,0.5);
        }

        .logo-text {
          font-family: 'Syne', sans-serif;
          font-weight: 800;
          font-size: 26px;
          letter-spacing: -0.5px;
          background: linear-gradient(90deg, #fff 60%, #6ca0ff);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .tagline {
          font-size: 14px;
          color: rgba(255,255,255,0.38);
          margin-bottom: 44px;
          letter-spacing: 0.2px;
        }

        .divider {
          display: flex; align-items: center; gap: 12px;
          margin: 28px 0;
          color: rgba(255,255,255,0.2);
          font-size: 12px; letter-spacing: 1px; text-transform: uppercase;
        }
        .divider::before, .divider::after {
          content: ''; flex: 1;
          height: 1px; background: rgba(255,255,255,0.08);
        }

        .btn-create {
          width: 100%;
          padding: 15px;
          border-radius: 14px;
          border: none;
          background: linear-gradient(135deg, #1a6fff 0%, #0095ff 100%);
          color: #fff;
          font-family: 'DM Sans', sans-serif;
          font-size: 15px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.22s ease;
          box-shadow: 0 8px 24px rgba(26,111,255,0.35);
          letter-spacing: 0.2px;
        }
        .btn-create:hover {
          transform: translateY(-2px);
          box-shadow: 0 14px 32px rgba(26,111,255,0.5);
          filter: brightness(1.08);
        }
        .btn-create:active { transform: translateY(0); }

        .join-row {
          display: flex;
          gap: 0;
          border-radius: 14px;
          overflow: hidden;
          border: 1px solid rgba(255,255,255,0.1);
          transition: border-color 0.2s;
        }
        .join-row:focus-within {
          border-color: rgba(26,111,255,0.6);
          box-shadow: 0 0 0 3px rgba(26,111,255,0.15);
        }

        .join-input {
          flex: 1;
          padding: 13px 16px;
          background: rgba(255,255,255,0.05);
          border: none;
          outline: none;
          color: #fff;
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
        }
        .join-input::placeholder { color: rgba(255,255,255,0.25); }

        .btn-join {
          padding: 13px 20px;
          background: rgba(255,255,255,0.07);
          border: none;
          border-left: 1px solid rgba(255,255,255,0.08);
          color: #6ca0ff;
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.18s;
          white-space: nowrap;
        }
        .btn-join:hover { background: rgba(26,111,255,0.2); color: #fff; }

        .section-label {
          font-size: 11px;
          letter-spacing: 1.2px;
          text-transform: uppercase;
          color: rgba(255,255,255,0.25);
          margin-bottom: 10px;
          font-weight: 500;
        }

        .features {
          display: flex; gap: 8px; margin-top: 36px;
        }
        .feature-pill {
          flex: 1;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 10px;
          padding: 10px 8px;
          text-align: center;
          font-size: 11px;
          color: rgba(255,255,255,0.35);
        }
        .feature-pill span { display: block; font-size: 16px; margin-bottom: 4px; }
      `}</style>

      <div className="home-root">
        <div className="orb orb1" />
        <div className="orb orb2" />
        <div className="orb orb3" />
        <div className="grid-overlay" />

        <div className="card">
          <div className="logo-row">
            <div className="logo-icon">🎥</div>
            <span className="logo-text">QuickMeet</span>
          </div>
          <p className="tagline">Instant video meetings, zero friction.</p>

          <p className="section-label">Start</p>
          <button className="btn-create" onClick={createRoom}>
            + Create New Meeting
          </button>

          <div className="divider">or</div>

          <p className="section-label">Join</p>
          <div className="join-row">
            <input
              className="join-input"
              placeholder="Paste Meeting ID…"
              value={room}
              onChange={(e) => setRoom(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <button className="btn-join" onClick={joinRoom}>Join →</button>
          </div>

          <div className="features">
            <div className="feature-pill"><span>🔒</span>Secure</div>
            <div className="feature-pill"><span>⚡</span>Instant</div>
            <div className="feature-pill"><span>💬</span>Chat</div>
          </div>
        </div>
      </div>
    </>
  );
}

export default Home;