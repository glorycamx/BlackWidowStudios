import { useEffect, useRef, useState } from "react";
import { get, post } from "../api";
import type { ChatMessage } from "../types";
import { Icon, WebMark } from "../components/Icon";
import { useMe } from "../App";
import { buzz } from "../buzz";

const SUGGESTED = [
  "Change my business hours on the site",
  "Is my website up right now?",
  "How many leads did I get this month?",
  "Add a new photo to my home page",
  "I need to talk to Cam",
];

export default function Help() {
  const { me } = useMe();
  const [msgs, setMsgs] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const [waiting, setWaiting] = useState(false);
  const lastId = useRef(0);
  const endRef = useRef<HTMLDivElement>(null);

  const poll = async () => {
    const r = await get<{ messages: ChatMessage[] }>(`/client/chat?after=${lastId.current}`);
    if (!r.messages.length) return;
    lastId.current = r.messages[r.messages.length - 1].id;
    setMsgs((m) => [...m, ...r.messages.filter((x) => !m.some((y) => y.id === x.id))]);
    if (r.messages.some((x) => x.sender !== "client")) {
      setWaiting(false);
      if (r.messages.some((x) => x.sender === "team")) buzz("team_reply");
    }
  };

  useEffect(() => {
    poll();
    const t = setInterval(poll, 2500);
    return () => clearInterval(t);
  }, []);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs.length, waiting]);

  const send = async (body: string) => {
    if (!body.trim()) return;
    setText("");
    setWaiting(true);
    const r = await post<{ message: ChatMessage }>("/client/chat", { body });
    setMsgs((m) => [...m, r.message]);
    lastId.current = Math.max(lastId.current, r.message.id);
    setTimeout(() => setWaiting(false), 60_000);
  };

  const fresh = msgs.filter((m) => m.sender === "client").length === 0;

  return (
    <main className="main" style={{ paddingBottom: 190 }}>
      {fresh ? (
        <div className="assistant-hero">
          <span className="spark-pill" style={{ marginBottom: 18 }}><Icon name="sparkle" size={15} /> Black Widow Assistant</span>
          <h1 style={{ marginTop: 16 }}>Hi, {me?.name}.<br />How can I help you <span className="accent">today?</span></h1>
          <p className="muted small" style={{ marginTop: 10 }}>I can make edits to your site, check that it's up, pull your numbers, and get Cam and Trae on anything I can't handle.</p>
          <div className="suggest">
            <div className="sub">Suggested</div>
            {SUGGESTED.map((s) => (
              <button key={s} onClick={() => send(s)}><Icon name="arrow" size={16} /> {s}</button>
            ))}
          </div>
        </div>
      ) : (
        <div className="row" style={{ padding: "8px 0 4px" }}>
          <div className="avatar" style={{ background: "var(--text)", color: "var(--bg)" }}><WebMark size={24} /></div>
          <div className="grow">
            <div style={{ fontWeight: 700 }}>Black Widow Assistant</div>
            <div className="tiny muted">Edits · site checks · Cam & Trae on standby</div>
          </div>
        </div>
      )}

      {!fresh && (
        <div className="chat">
          {msgs.map((m) =>
            m.sender === "system" ? (
              <div key={m.id} className="sys">🕷️ {m.body}</div>
            ) : (
              <div key={m.id} className={`bubble ${m.sender === "client" ? "me" : m.sender === "team" ? "team" : "them"}`}>
                {m.sender !== "client" && <div className="who">{m.sender === "team" ? `★ ${m.authorName} · Black Widow team` : "Assistant"}</div>}
                {m.body}
              </div>
            ),
          )}
          {waiting && <div className="bubble them"><span className="typing"><i /><i /><i /></span></div>}
          <div ref={endRef} />
        </div>
      )}

      <div className="composer">
        {!fresh && (
          <div className="chips" style={{ maxWidth: 680, margin: "0 auto 8px" }}>
            {["Make an edit", "Is my site up?", "Talk to Cam", "How do I get more leads?"].map((c) => (
              <button key={c} className="chip" onClick={() => send(c)}>{c}</button>
            ))}
          </div>
        )}
        <form onSubmit={(e) => { e.preventDefault(); send(text); }}>
          <textarea
            placeholder="Ask the assistant anything…"
            value={text}
            rows={1}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(text); } }}
          />
          <button className="send" disabled={!text.trim()} aria-label="Send"><Icon name="send" size={18} /></button>
        </form>
      </div>
    </main>
  );
}
