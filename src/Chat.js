import { useState, useEffect, useRef } from "react";
import socket from "./socket";

function Chat({ roomId, name, messages }) {
  const [msg, setMsg] = useState("");
  const bottomRef = useRef();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function sendMessage() {
    if (!msg.trim()) return;
    socket.emit("send-message", { roomId, message: msg, name });
    setMsg("");
  }

  function handleKey(e) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500&display=swap');
        .chat-root { display:flex;flex-direction:column;height:100%;font-family:'DM Sans',sans-serif; }
        .chat-header { padding:16px 18px 14px;border-bottom:1px solid rgba(255,255,255,0.07);display:flex;align-items:center;gap:8px; }
        .chat-hicon { width:26px;height:26px;background:rgba(26,111,255,0.15);border-radius:7px;display:flex;align-items:center;justify-content:center;font-size:13px; }
        .chat-htitle { font-size:14px;font-weight:500;color:rgba(255,255,255,0.85); }
        .chat-count { margin-left:auto;background:rgba(255,255,255,0.07);border-radius:20px;padding:2px 9px;font-size:11px;color:rgba(255,255,255,0.35); }
        .chat-msgs { flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:10px;scrollbar-width:thin;scrollbar-color:rgba(255,255,255,0.1) transparent; }
        .chat-empty { flex:1;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:8px;color:rgba(255,255,255,0.2);font-size:13px; }
        .msg-wrap { display:flex;flex-direction:column;gap:2px; }
        .msg-wrap.self { align-items:flex-end; }
        .msg-wrap.other { align-items:flex-start; }
        .msg-sender { font-size:11px;color:rgba(255,255,255,0.3);padding:0 4px; }
        .msg-bubble { max-width:85%;padding:9px 13px;border-radius:14px;font-size:13px;line-height:1.5;word-break:break-word;animation:msgPop 0.2s ease; }
        @keyframes msgPop { from{opacity:0;transform:scale(0.95) translateY(4px)} to{opacity:1;transform:scale(1) translateY(0)} }
        .msg-self { background:linear-gradient(135deg,#1a6fff,#0095ff);color:#fff;border-bottom-right-radius:4px; }
        .msg-other { background:rgba(255,255,255,0.07);border:1px solid rgba(255,255,255,0.06);color:rgba(255,255,255,0.85);border-bottom-left-radius:4px; }
        .msg-time { font-size:10px;color:rgba(255,255,255,0.2);padding:0 4px; }
        .chat-input-area { padding:12px 14px;border-top:1px solid rgba(255,255,255,0.07);display:flex;gap:8px;align-items:flex-end; }
        .chat-input { flex:1;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.09);border-radius:12px;padding:10px 14px;color:#fff;font-family:'DM Sans',sans-serif;font-size:13px;outline:none;resize:none;line-height:1.4;transition:border-color 0.18s;max-height:100px;overflow-y:auto;scrollbar-width:none; }
        .chat-input::placeholder { color:rgba(255,255,255,0.22); }
        .chat-input:focus { border-color:rgba(26,111,255,0.5);box-shadow:0 0 0 3px rgba(26,111,255,0.1); }
        .send-btn { width:38px;height:38px;border-radius:10px;border:none;background:linear-gradient(135deg,#1a6fff,#0095ff);color:#fff;font-size:16px;cursor:pointer;transition:all 0.18s;display:flex;align-items:center;justify-content:center;flex-shrink:0;box-shadow:0 4px 12px rgba(26,111,255,0.35); }
        .send-btn:hover { transform:scale(1.07); }
        .send-btn:disabled { opacity:0.4;cursor:default;transform:none; }
      `}</style>

      <div className="chat-root">
        <div className="chat-header">
          <div className="chat-hicon">💬</div>
          <span className="chat-htitle">Meeting Chat</span>
          <span className="chat-count">{messages.length}</span>
        </div>

        <div className="chat-msgs">
          {messages.length === 0
            ? <div className="chat-empty"><span style={{fontSize:28}}>💬</span>No messages yet</div>
            : messages.map((m, i) => (
              <div key={i} className={`msg-wrap ${m.self ? "self" : "other"}`}>
                {!m.self && <span className="msg-sender">{m.name}</span>}
                <div className={`msg-bubble ${m.self ? "msg-self" : "msg-other"}`}>{m.message}</div>
                <span className="msg-time">{m.time}</span>
              </div>
            ))
          }
          <div ref={bottomRef}/>
        </div>

        <div className="chat-input-area">
          <textarea
            className="chat-input" rows={1}
            placeholder="Type a message…"
            value={msg}
            onChange={e => setMsg(e.target.value)}
            onKeyDown={handleKey}
          />
          <button className="send-btn" onClick={sendMessage} disabled={!msg.trim()}>↑</button>
        </div>
      </div>
    </>
  );
}

export default Chat;