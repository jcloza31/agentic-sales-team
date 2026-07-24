"use client";
import { useState, useTransition } from "react";
import { css, Box } from "@/components/primitives";
import { updateNotifications } from "@/lib/settings/actions";
import type { NotificationPrefs } from "@/lib/settings/types";

const ROWS: { key: keyof NotificationPrefs; label: string; hint: string }[] = [
  { key: "newBrands", label: "New brand matches", hint: "Your Research agent found brands worth a look." },
  { key: "pitchesReady", label: "Pitches & proposals ready", hint: "A draft is ready for you to read and send." },
  { key: "callsBooked", label: "Calls booked", hint: "A brand call landed on your calendar." },
];

function Switch({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <Box
      onClick={onToggle}
      style={"width:44px;height:26px;border-radius:99px;flex:none;position:relative;cursor:pointer;transition:background .15s;background:" + (on ? "#ffb020" : "var(--border-strong)")}
    >
      <span
        style={{
          position: "absolute",
          top: 3,
          left: on ? 21 : 3,
          width: 20,
          height: 20,
          borderRadius: "50%",
          background: "#ffffff",
          boxShadow: "0 1px 3px rgba(0,0,0,.4)",
          transition: "left .15s",
        }}
      />
    </Box>
  );
}

export default function NotificationsForm({ initial }: { initial: NotificationPrefs }) {
  const [prefs, setPrefs] = useState(initial);
  const [saved, setSaved] = useState(false);
  const [, startTransition] = useTransition();

  function toggle(key: keyof NotificationPrefs) {
    const next = { ...prefs, [key]: !prefs[key] };
    setPrefs(next);
    setSaved(false);
    startTransition(async () => {
      await updateNotifications(next);
      setSaved(true);
    });
  }

  return (
    <div style={css("display:flex;flex-direction:column;gap:2px;max-width:520px")}>
      {ROWS.map((row, i) => (
        <div key={row.key} style={css("display:flex;align-items:center;justify-content:space-between;gap:16px;padding:16px 0;border-top:" + (i === 0 ? "none" : "1px solid var(--border)"))}>
          <div>
            <div style={css("font-size:15px;font-weight:700;color:var(--text)")}>{row.label}</div>
            <div style={css("font-size:13px;color:var(--text-muted);margin-top:2px")}>{row.hint}</div>
          </div>
          <Switch on={prefs[row.key]} onToggle={() => toggle(row.key)} />
        </div>
      ))}
      <div style={css("font-size:12px;color:" + (saved ? "#00d18f" : "transparent") + ";margin-top:14px;transition:color .2s")}>Saved</div>
    </div>
  );
}
