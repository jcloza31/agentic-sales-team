"use client";
import { useState, useTransition, useRef, useEffect } from "react";
import { css } from "@/lib/css";
import { dismissAllActivityAction } from "@/lib/activity/actions";

export interface BellItem {
  id: string;
  agentId: string | null;
  text: string;
  createdAt: Date | string;
}

export interface BellAgent {
  id: string;
  name: string;
}

function timeAgo(d: Date | string): string {
  const date = new Date(d);
  const secs = Math.max(0, Math.round((Date.now() - date.getTime()) / 1000));
  if (secs < 60) return "just now";
  const mins = Math.round(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  return `${days}d ago`;
}

export default function NotificationsBell({ initialItems, agents }: { initialItems: BellItem[]; agents: BellAgent[] }) {
  const [items, setItems] = useState(initialItems);
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => setItems(initialItems), [initialItems]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  function agentName(id: string | null) {
    return agents.find((a) => a.id === id)?.name ?? "Team";
  }

  function clearAll() {
    setItems([]);
    startTransition(async () => {
      await dismissAllActivityAction();
    });
  }

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Notifications"
        style={css("position:relative;background:none;border:1px solid var(--border-strong);border-radius:8px;color:var(--text);padding:8px 10px;cursor:pointer;display:flex;align-items:center;justify-content:center")}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {items.length > 0 && (
          <span style={css("position:absolute;top:-4px;right:-4px;background:#ff4257;color:#fff;font-size:10px;font-weight:800;border-radius:99px;min-width:16px;height:16px;display:flex;align-items:center;justify-content:center;padding:0 3px")}>
            {items.length > 9 ? "9+" : items.length}
          </span>
        )}
      </button>

      {open && (
        <div style={css("position:absolute;right:0;top:calc(100% + 8px);width:320px;max-height:400px;overflow-y:auto;background:var(--surface);border:1px solid var(--border-strong);border-radius:14px;padding:14px;z-index:40;box-shadow:0 12px 30px rgba(0,0,0,.25)")}>
          <div style={css("display:flex;align-items:center;justify-content:space-between;margin-bottom:10px")}>
            <div style={css("font-family:var(--font-display);font-size:13px;font-weight:800;text-transform:uppercase;letter-spacing:.04em;color:var(--text)")}>Notifications</div>
            {items.length > 0 && (
              <button disabled={pending} onClick={clearAll} style={css("font-size:11.5px;font-weight:700;color:var(--text-muted);background:none;border:none;cursor:pointer")}>
                Clear all
              </button>
            )}
          </div>
          {items.length === 0 ? (
            <div style={css("font-size:12.5px;color:var(--text-muted);padding:12px 2px")}>Nothing new.</div>
          ) : (
            <div style={css("display:flex;flex-direction:column;gap:8px")}>
              {items.map((it) => (
                <div key={it.id} style={css("background:var(--overlay-1);border:1px solid var(--border);border-radius:10px;padding:9px 11px")}>
                  <div style={css("font-size:11px;font-weight:700;color:var(--accent-text);margin-bottom:2px")}>{agentName(it.agentId)}</div>
                  <div style={css("font-size:12.5px;color:var(--text);line-height:1.4")}>{it.text}</div>
                  <div style={css("font-size:10.5px;color:var(--text-muted);margin-top:4px")}>{timeAgo(it.createdAt)}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
