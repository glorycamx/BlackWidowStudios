import { Group, Page, Row, Section } from "../components/Page";
import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { get, post } from "../api";
import type { ChatMessage } from "../types";
import { Icon } from "../components/Icon";
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
  const [params, setParams] = useSearchParams();
  const [text, setText] = useState(() => params.get("q") || "");
  const inputRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    // Quick-change tiles open the assistant with a started message
    if (params.get("q")) {
      setParams({}, { replace: true });
      const el = inputRef.current;
      if (el) { el.focus(); el.setSelectionRange(el.value.length, el.value.length); }
    }
  }, []);
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
    <Page page="assistant" heading={fresh ? `Hi ${me?.name?.split(" ")[0]}, how can I help?` : "Assistant"} blurb="Edits, site checks and your numbers. Cam and Trae step in when needed." mainStyle={{ paddingBottom: 170 }}>
      {fresh ? (
        <Section title="Try asking">
          <Group>
            {SUGGESTED.map((s) => <Row key={s} title={s} onClick={() => send(s)} />)}
          </Group>
        </Section>
      ) : (
        <div className="chat">
          {msgs.map((m) =>
            m.sender === "system" ? (
              <div key={m.id} className="sys">{m.body}</div>
            ) : (
              <div key={m.id} className={`bubble ${m.sender === "client" ? "me" : m.sender === "team" ? "team" : "them"}`}>
                {m.sender !== "client" && <div className="who">{m.sender === "team" ? `${m.authorName} · Black Widow` : "Assistant"}</div>}
                {m.body}
              </div>
            ),
          )}
          {waiting && <div className="bubble them"><span className="typing"><i /><i /><i /></span></div>}
          <div ref={endRef} />
        </div>
      )}

      <div className="composer">
        <form onSubmit={(e) => { e.preventDefault(); send(text); }}>
          <textarea
            placeholder="Message the assistant"
            ref={inputRef}
            value={text}
            rows={text.length > 40 ? 2 : 1}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(text); } }}
          />
          <button className="send" disabled={!text.trim()} aria-label="Send"><Icon name="send" size={18} /></button>
        </form>
      </div>
    </Page>
  );
}
