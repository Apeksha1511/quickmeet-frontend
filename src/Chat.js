import { useState, useEffect, useRef } from "react";
import io from "socket.io-client";

const socket = io(process.env.REACT_APP_SERVER_URL || "http://localhost:5000");

function Chat({ roomId }) {
  const [msg, setMsg] = useState("");
  const [messages, setMessages] = useState([]);
  const bottomRef = useRef();

  function sendMessage() {
    if (!msg.trim()) return;
    socket.emit("send-message", { room: roomId, message: msg });
    setMessages((prev) => [...prev, { text: msg, self: true }]);
    setMsg("");
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  useEffect(() => {
    socket.on("receive-message", (data) => {
      setMessages((prev) => [...prev, { text: data.message, self: false }]);
    });
    return () => socket.off("receive-message");
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500&display=swap');

        .chat-root {
          display: flex;
          flex-direction: column;
          height: 100%;
          font-family: 'DM Sans', sans-serif;
        }

        .chat-header {
          padding: 18px 20px 14px;
          border-bottom: 1px solid rgba(255,255,255,0.07);
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .chat-header-icon {
          width: 28px; height: 28px;
          background: rgba(26,111,255,0.15);
          border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          font-size: 13px;
        }
        .chat-header-title {
          font-size: 14px;
          font-weight: 500;
          color: rgba(255,255,255,0.85);
        }
        .chat-count {
          margin-left: auto;
          background: rgba(255,255,255,0.07);
          border-radius: 20px;
          padding: 2px 9px;
          font-size: 11px;
          color: rgba(255,255,255,0.35);
        }

        .chat-messages {
          flex: 1;
          overflow-y: auto;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          scrollbar-width: thin;
          scrollbar-color: rgba(255,255,255,0.1) transparent;
        }

        .chat-empty {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-direction: column;
          gap: 8px;
          color: rgba(255,255,255,0.2);
          font-size: 13px;
        }
        .chat-empty-icon { font-size: 28px; }

        .msg-bubble {
          max-width: 85%;
          padding: 9px 13px;
          border-radius: 14px;
          font-size: 13px;
          line-height: 1.5;
          word-break: break-word;
          animation: msgPop 0.2s cubic-bezier(0.16,1,0.3,1);
        }
        @keyframes msgPop {
          from { opacity: 0; transform: scale(0.95) translateY(4px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }

        .msg-self {
          align-self: flex-end;
          background: linear-gradient(135deg, #1a6fff, #0095ff);
          color: #fff;
          border-bottom-right-radius: 4px;
        }

        .msg-other {
          align-self: flex-start;
          background: rgba(255,255,255,0.07);
          border: 1px solid rgba(255,255,255,0.06);
          color: rgba(255,255,255,0.85);
          border-bottom-left-radius: 4px;
        }

        .chat-input-area {
          padding: 14px 16px;
          border-top: 1px solid rgba(255,255,255,0.07);
          display: flex;
          gap: 8px;
          align-items: flex-end;
        }

        .chat-input {
          flex: 1;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.09);
          border-radius: 12px;
          padding: 10px 14px;
          color: #fff;
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          outline: none;
          resize: none;
          line-height: 1.4;
          transition: border-color 0.18s;
          max-height: 100px;
          overflow-y: auto;
          scrollbar-width: none;
        }
        .chat-input::placeholder { color: rgba(255,255,255,0.22); }
        .chat-input:focus {
          border-color: rgba(26,111,255,0.5);
          box-shadow: 0 0 0 3px rgba(26,111,255,0.1);
        }

        .send-btn {
          width: 38px; height: 38px;
          border-radius: 10px;
          border: none;
          background: linear-gradient(135deg, #1a6fff, #0095ff);
          color: #fff;
          font-size: 16px;
          cursor: pointer;
          transition: all 0.18s;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
          box-shadow: 0 4px 12px rgba(26,111,255,0.35);
        }
        .send-btn:hover {
          transform: scale(1.07);
          box-shadow: 0 6px 18px rgba(26,111,255,0.5);
        }
        .send-btn:disabled {
          opacity: 0.4;
          cursor: default;
          transform: none;
        }
      `}</style>

      <div className="chat-root">
        <div className="chat-header">
          <div className="chat-header-icon">💬</div>
          <span className="chat-header-title">Meeting Chat</span>
          <span className="chat-count">{messages.length}</span>
        </div>

        <div className="chat-messages">
          {messages.length === 0 ? (
            <div className="chat-empty">
              <span className="chat-empty-icon">💬</span>
              No messages yet
            </div>
          ) : (
            messages.map((m, i) => (
              <div
                key={i}
                className={`msg-bubble ${m.self ? "msg-self" : "msg-other"}`}
              >
                {m.text}
              </div>
            ))
          )}
          <div ref={bottomRef} />
        </div>

        <div className="chat-input-area">
          <textarea
            className="chat-input"
            rows={1}
            placeholder="Type a message…"
            value={msg}
            onChange={(e) => setMsg(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button
            className="send-btn"
            onClick={sendMessage}
            disabled={!msg.trim()}
          >
            ↑
          </button>
        </div>
      </div>
    </>
  );
}

export default Chat;