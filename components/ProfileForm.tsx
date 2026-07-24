"use client";
import { useState, useTransition } from "react";
import { css } from "@/lib/css";
import PlatformRows from "@/components/PlatformRows";
import { saveProfileAction } from "@/lib/profile/actions";
import type { CreatorProfileData } from "@/lib/profile/types";

const inputStyle = "width:100%;background:var(--input-bg);border:1px solid var(--border);border-radius:8px;color:var(--text);font-size:14px;padding:10px 12px;outline:none";
const labelStyle = "font-size:13px;font-weight:700;color:var(--text);margin-bottom:6px;display:block";
const sectionStyle = "background:var(--surface);border:1px solid var(--border);border-radius:16px;padding:22px;margin-bottom:16px";

export default function ProfileForm({ initial }: { initial: CreatorProfileData }) {
  const [data, setData] = useState(initial);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  function set<K extends keyof CreatorProfileData>(key: K, value: CreatorProfileData[K]) {
    setData((d) => ({ ...d, [key]: value }));
    setSaved(false);
  }

  function save() {
    startTransition(async () => {
      await saveProfileAction(data);
      setSaved(true);
    });
  }

  return (
    <div style={css("max-width:760px")}>
      <h1 style={css("font-family:var(--font-display);font-weight:900;font-size:clamp(26px,4vw,36px);color:var(--text);margin:0 0 6px;text-transform:uppercase")}>Your Media Kit</h1>
      <p style={css("font-size:15px;color:var(--text-muted);margin:0 0 24px")}>This is what every agent reads before they write a word — the more real it is, the better your pitches sound.</p>

      <div style={css(sectionStyle)}>
        <label style={css(labelStyle)}>Your niche</label>
        <input style={css(inputStyle)} placeholder="e.g. Sustainable fashion & thrifting" value={data.niche} onChange={(e) => set("niche", e.target.value)} />
        <label style={css(labelStyle + ";margin-top:16px")}>Short bio</label>
        <textarea style={css(inputStyle + ";min-height:80px;resize:vertical")} placeholder="A couple sentences about you and your content" value={data.bio} onChange={(e) => set("bio", e.target.value)} />
      </div>

      <div style={css(sectionStyle)}>
        <label style={css(labelStyle + ";margin-bottom:12px")}>Your platforms</label>
        <PlatformRows value={data.platforms} onChange={(v) => set("platforms", v)} />
      </div>

      <div style={css(sectionStyle)}>
        <label style={css(labelStyle + ";margin-bottom:12px")}>Your audience</label>
        <div style={css("display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:10px")}>
          <input style={css(inputStyle)} placeholder="Age range (e.g. 18–24)" value={data.audience.age ?? ""} onChange={(e) => set("audience", { ...data.audience, age: e.target.value })} />
          <input style={css(inputStyle)} placeholder="Where they're from (e.g. mostly US)" value={data.audience.geo ?? ""} onChange={(e) => set("audience", { ...data.audience, geo: e.target.value })} />
          <input style={css(inputStyle)} placeholder="Gender split (e.g. 65% women)" value={data.audience.gender ?? ""} onChange={(e) => set("audience", { ...data.audience, gender: e.target.value })} />
        </div>
      </div>

      <div style={css(sectionStyle)}>
        <label style={css(labelStyle)}>Your tone & vibe</label>
        <input style={css(inputStyle)} placeholder="e.g. Warm, funny, a little sarcastic" value={data.tone} onChange={(e) => set("tone", e.target.value)} />
        <label style={css(labelStyle + ";margin-top:16px")}>Deals you've done before</label>
        <textarea style={css(inputStyle + ";min-height:70px;resize:vertical")} placeholder="e.g. Partnered with Bloom Coffee, Verve Apparel…" value={data.pastDeals} onChange={(e) => set("pastDeals", e.target.value)} />
      </div>

      <div style={css(sectionStyle)}>
        <label style={css(labelStyle)}>Your rate floor</label>
        <p style={css("font-size:13px;color:var(--text-muted);margin:0 0 10px")}>The least you'll accept for a standard post — your agents will never price below this.</p>
        <input style={css(inputStyle)} placeholder="e.g. $500 per post" value={data.rateFloor} onChange={(e) => set("rateFloor", e.target.value)} />
      </div>

      <div style={css("display:flex;align-items:center;gap:14px")}>
        <button
          type="button"
          onClick={save}
          disabled={pending}
          style={css("font-family:var(--font-display);font-size:14px;font-weight:800;text-transform:uppercase;letter-spacing:.02em;color:#050505;background:#ffb020;border-radius:10px;padding:11px 26px;border:none;cursor:pointer;opacity:" + (pending ? "0.7" : "1"))}
        >
          {pending ? "Saving…" : "Save changes"}
        </button>
        <span style={css("font-size:13px;color:" + (saved ? "#00d18f" : "transparent") + ";transition:color .2s")}>Saved</span>
      </div>
    </div>
  );
}
