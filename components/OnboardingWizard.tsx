"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { css } from "@/lib/css";
import PlatformRows from "@/components/PlatformRows";
import { saveProfileAction } from "@/lib/profile/actions";
import type { CreatorProfileData } from "@/lib/profile/types";

const inputStyle = "width:100%;background:var(--input-bg);border:1px solid var(--border);border-radius:8px;color:var(--text);font-size:14px;padding:10px 12px;outline:none";
const labelStyle = "font-size:13px;font-weight:700;color:var(--text);margin-bottom:6px;display:block";

const STEPS = ["About you", "Your platforms", "Your audience", "Your rate"];

export default function OnboardingWizard({ initial }: { initial: CreatorProfileData }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [data, setData] = useState<CreatorProfileData>(() => ({
    ...initial,
    platforms: initial.platforms.length ? initial.platforms : [{ platform: "", handle: "", followers: "", engagementRate: "" }],
  }));
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function set<K extends keyof CreatorProfileData>(key: K, value: CreatorProfileData[K]) {
    setData((d) => ({ ...d, [key]: value }));
    setError("");
  }

  function next() {
    if (step === 0 && !data.niche.trim()) {
      setError("What's your niche? Even a rough one is fine.");
      return;
    }
    if (step === 1 && !data.platforms.some((p) => p.platform.trim() && p.handle.trim())) {
      setError("Add at least one platform with a handle.");
      return;
    }
    setError("");
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  function back() {
    setError("");
    setStep((s) => Math.max(s - 1, 0));
  }

  function finish() {
    if (!data.rateFloor.trim()) {
      setError("Give us at least a rough rate floor — you can refine it anytime.");
      return;
    }
    startTransition(async () => {
      await saveProfileAction(data);
      router.push("/dashboard");
    });
  }

  return (
    <main style={css("min-height:100dvh;display:flex;align-items:center;justify-content:center;background:radial-gradient(600px 400px at 30% 20%,rgba(255,176,32,.14),transparent 60%),radial-gradient(600px 400px at 70% 80%,rgba(124,92,255,.16),transparent 60%),var(--bg);padding:26px")}>
      <div style={css("width:100%;max-width:560px;background:var(--surface);border:1px solid var(--border-strong);border-radius:20px;padding:36px")}>
        <div style={css("display:flex;gap:6px;margin-bottom:22px")}>
          {STEPS.map((_, i) => (
            <div key={i} style={css("flex:1;height:4px;border-radius:2px;background:" + (i <= step ? "#ffb020" : "var(--border-strong)"))} />
          ))}
        </div>
        <div style={css("font-size:12px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:var(--accent-text);margin-bottom:10px")}>
          Step {step + 1} of {STEPS.length}
        </div>

        {step === 0 && (
          <>
            <h1 style={css("font-family:var(--font-display);font-weight:900;font-size:24px;color:var(--text);margin:0 0 6px;text-transform:uppercase")}>Tell us about your content</h1>
            <p style={css("font-size:14px;color:var(--text-muted);margin:0 0 18px")}>This is what makes every pitch sound like you, not a template.</p>
            <label style={css(labelStyle)}>Your niche</label>
            <input autoFocus style={css(inputStyle)} placeholder="e.g. Sustainable fashion & thrifting" value={data.niche} onChange={(e) => set("niche", e.target.value)} />
            <label style={css(labelStyle + ";margin-top:16px")}>Short bio (optional)</label>
            <textarea style={css(inputStyle + ";min-height:80px;resize:vertical")} placeholder="A couple sentences about you and your content" value={data.bio} onChange={(e) => set("bio", e.target.value)} />
          </>
        )}

        {step === 1 && (
          <>
            <h1 style={css("font-family:var(--font-display);font-weight:900;font-size:24px;color:var(--text);margin:0 0 6px;text-transform:uppercase")}>Which platforms are you on?</h1>
            <p style={css("font-size:14px;color:var(--text-muted);margin:0 0 18px")}>Add your handle and rough follower count — exact numbers aren't important yet.</p>
            <PlatformRows value={data.platforms} onChange={(v) => set("platforms", v)} />
          </>
        )}

        {step === 2 && (
          <>
            <h1 style={css("font-family:var(--font-display);font-weight:900;font-size:24px;color:var(--text);margin:0 0 6px;text-transform:uppercase")}>Who's your audience & vibe?</h1>
            <p style={css("font-size:14px;color:var(--text-muted);margin:0 0 18px")}>All optional — skip anything you don't know off the top of your head.</p>
            <div style={css("display:flex;flex-direction:column;gap:10px;margin-bottom:16px")}>
              <input style={css(inputStyle)} placeholder="Audience age range (e.g. 18–24)" value={data.audience.age ?? ""} onChange={(e) => set("audience", { ...data.audience, age: e.target.value })} />
              <input style={css(inputStyle)} placeholder="Where they're from (e.g. mostly US)" value={data.audience.geo ?? ""} onChange={(e) => set("audience", { ...data.audience, geo: e.target.value })} />
              <input style={css(inputStyle)} placeholder="Gender split (e.g. 65% women)" value={data.audience.gender ?? ""} onChange={(e) => set("audience", { ...data.audience, gender: e.target.value })} />
            </div>
            <label style={css(labelStyle)}>Your tone & vibe</label>
            <input style={css(inputStyle)} placeholder="e.g. Warm, funny, a little sarcastic" value={data.tone} onChange={(e) => set("tone", e.target.value)} />
            <label style={css(labelStyle + ";margin-top:16px")}>Deals you've done before (optional)</label>
            <textarea style={css(inputStyle + ";min-height:70px;resize:vertical")} placeholder="e.g. Partnered with Bloom Coffee, Verve Apparel…" value={data.pastDeals} onChange={(e) => set("pastDeals", e.target.value)} />
          </>
        )}

        {step === 3 && (
          <>
            <h1 style={css("font-family:var(--font-display);font-weight:900;font-size:24px;color:var(--text);margin:0 0 6px;text-transform:uppercase")}>What's your rate floor?</h1>
            <p style={css("font-size:14px;color:var(--text-muted);margin:0 0 18px")}>The least you'll accept for a standard post. Your agents will never price below this — change it anytime.</p>
            <input autoFocus style={css(inputStyle)} placeholder="e.g. $500 per post" value={data.rateFloor} onChange={(e) => set("rateFloor", e.target.value)} />
          </>
        )}

        {error && <div style={css("font-size:13px;color:#ff4257;margin-top:14px")}>{error}</div>}

        <div style={css("display:flex;justify-content:space-between;margin-top:26px")}>
          <button
            type="button"
            onClick={back}
            style={css("font-size:13px;font-weight:700;color:var(--text);background:none;border:1px solid var(--border-strong);border-radius:10px;padding:10px 18px;cursor:pointer;visibility:" + (step === 0 ? "hidden" : "visible"))}
          >
            Back
          </button>
          {step < STEPS.length - 1 ? (
            <button
              type="button"
              onClick={next}
              style={css("font-family:var(--font-display);font-size:13px;font-weight:800;text-transform:uppercase;color:#050505;background:#ffb020;border-radius:10px;padding:10px 22px;border:none;cursor:pointer")}
            >
              Next
            </button>
          ) : (
            <button
              type="button"
              onClick={finish}
              disabled={pending}
              style={css("font-family:var(--font-display);font-size:13px;font-weight:800;text-transform:uppercase;color:#050505;background:#ffb020;border-radius:10px;padding:10px 22px;border:none;cursor:pointer;opacity:" + (pending ? "0.7" : "1"))}
            >
              {pending ? "Finishing…" : "Finish"}
            </button>
          )}
        </div>
      </div>
    </main>
  );
}
