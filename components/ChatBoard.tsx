"use client";
import { useState, useTransition, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { css } from "@/lib/css";
import { av } from "@/lib/visuals";
import { sendChatMessageAction } from "@/lib/chat/actions";
import type { ChatMessage } from "@/lib/chat/store";
import type { MergedAgent } from "@/lib/agents/store";

const inputStyle = "flex:1;background:var(--input-bg);border:1px solid var(--border);border-radius:10px;color:var(--text);font-size:14px;padding:12px 14px;outline:none";
const primaryBtn = "font-family:var(--font-display);font-size:13px;font-weight:800;text-transform:uppercase;letter-spacing:.02em;color:#050505;background:#ffb020;border-radius:10px;padding:0 22px;border:none;cursor:pointer;flex:none";

export default function ChatBoard({ initialMessages, agents }: { initialMessages: ChatMessage[]; agents: MergedAgent[] }) {
  const router = useRouter();
  const [messages, setMessages] = useState(initialMessages);
  const [text, setText] = useState("");
  const [pending, startTransition] = useTransition();
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => setMessages(initialMessages), [initialMessages]);
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, pending]);

  function byId(id: string | null) {
    return agents.find((a) => a.id === id) ?? null;
  }

  function send() {
    const value = text.trim();
    if (!value) return;
    setMessages((m) => [...m, { id: -Date.now(), userId: "", agentId: null, who: "me", text: value, createdAt: new Date() }]);
    setText("");
    startTransition(async () => {
      await sendChatMessageAction(value);
      router.refresh();
    });
  }

  return (
    <div style={css("display:flex;flex-direction:column;height:calc(100dvh - 130px)")}>
      <div style={css("margin-bottom:16px")}>
        <h1 style={css("font-family:var(--font-display);font-weight:900;font-size:clamp(26px,4vw,36px);color:var(--text);margin:0 0 6px;text-transform:uppercase")}>Team Chat</h1>
        <p style={css("font-size:14px;color:var(--text-muted);margin:0")}>
          @mention a teammate — try <strong style={css("color:var(--text)")}>@Research find me some fitness brands</strong>.
        </p>
      </div>

      <div style={css("flex:1;overflow-y:auto;display:flex;flex-direction:column;gap:12px;padding:4px 2px")}>
        {messages.length === 0 && (
          <div style={css("font-size:13px;color:var(--text-muted);text-align:center;margin-top:40px")}>
            Nothing here yet — try @mentioning a teammate below.
          </div>
        )}
        {messages.map((m, i) => {
          if (m.who === "me") {
            return (
              <div key={i} style={css("align-self:flex-end;max-width:70%;background:#ffb020;color:#050505;border-radius:14px 14px 2px 14px;padding:10px 14px;font-size:14px;line-height:1.4")}>
                {m.text}
              </div>
            );
          }
          const agent = byId(m.agentId);
          return (
            <div key={i} style={css("align-self:flex-start;max-width:75%;display:flex;gap:10px")}>
              <div style={css(av(agent ?? { id: "x", color: "#8f8f8f" }, 32) + ";flex:none;margin-top:2px")}>{agent?.initials ?? "AI"}</div>
              <div>
                <div style={css("font-size:11px;font-weight:700;color:" + (agent?.color ?? "var(--text-muted)") + ";margin-bottom:3px")}>{agent?.name ?? "Team"}</div>
                <div style={css("background:var(--surface);border:1px solid var(--border);color:var(--text);border-radius:14px 14px 14px 2px;padding:10px 14px;font-size:14px;line-height:1.4")}>
                  {m.text}
                </div>
              </div>
            </div>
          );
        })}
        {pending && <div style={css("align-self:flex-start;font-size:12.5px;color:var(--text-muted);padding-left:42px")}>Thinking…</div>}
        <div ref={endRef} />
      </div>

      <div style={css("display:flex;gap:10px;margin-top:16px")}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          placeholder="@Research find me some fitness brands"
          style={css(inputStyle)}
        />
        <button disabled={pending || !text.trim()} onClick={send} style={css(primaryBtn)}>
          Send
        </button>
      </div>
    </div>
  );
}
