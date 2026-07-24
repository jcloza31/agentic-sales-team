"use client";
import { css } from "@/lib/css";
import type { PlatformEntry } from "@/lib/profile/types";

const inputStyle = "width:100%;background:var(--input-bg);border:1px solid var(--border);border-radius:8px;color:var(--text);font-size:13px;padding:9px 11px;outline:none";

export default function PlatformRows({ value, onChange }: { value: PlatformEntry[]; onChange: (next: PlatformEntry[]) => void }) {
  function update(i: number, patch: Partial<PlatformEntry>) {
    onChange(value.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }
  function add() {
    onChange([...value, { platform: "", handle: "", followers: "", engagementRate: "" }]);
  }
  function remove(i: number) {
    onChange(value.filter((_, idx) => idx !== i));
  }

  return (
    <div style={css("display:flex;flex-direction:column;gap:10px")}>
      {value.map((row, i) => (
        <div key={i} style={css("display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:8px;align-items:center;background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:12px")}>
          <input style={css(inputStyle)} placeholder="Platform (e.g. TikTok)" value={row.platform} onChange={(e) => update(i, { platform: e.target.value })} />
          <input style={css(inputStyle)} placeholder="Handle (e.g. @yourname)" value={row.handle} onChange={(e) => update(i, { handle: e.target.value })} />
          <input style={css(inputStyle)} placeholder="Followers (e.g. 42k)" value={row.followers} onChange={(e) => update(i, { followers: e.target.value })} />
          <div style={css("display:flex;gap:8px;align-items:center")}>
            <input style={css(inputStyle)} placeholder="Engagement (e.g. 4.2%)" value={row.engagementRate} onChange={(e) => update(i, { engagementRate: e.target.value })} />
            <button
              type="button"
              onClick={() => remove(i)}
              aria-label="Remove platform"
              style={css("background:none;border:1px solid var(--border-strong);border-radius:8px;color:var(--text-muted);padding:9px 11px;cursor:pointer;flex:none")}
            >
              ✕
            </button>
          </div>
        </div>
      ))}
      <button
        type="button"
        onClick={add}
        style={css("align-self:flex-start;font-size:13px;font-weight:700;color:var(--accent-text);background:rgba(255,176,32,.1);border:1px solid rgba(255,176,32,.35);border-radius:8px;padding:8px 14px;cursor:pointer")}
      >
        + Add a platform
      </button>
    </div>
  );
}
