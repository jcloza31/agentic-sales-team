"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { css } from "@/lib/css";
import { bookMeetingFreeformAction, bookMeetingManualAction } from "@/lib/meetings/actions";
import type { Meeting } from "@/lib/meetings/types";
import type { Lead } from "@/lib/leads/types";

const inputStyle = "width:100%;background:var(--input-bg);border:1px solid var(--border);border-radius:8px;color:var(--text);font-size:14px;padding:10px 12px;outline:none";
const labelStyle = "font-size:12px;font-weight:700;color:var(--text);margin-bottom:5px;display:block";
const primaryBtn = "font-family:var(--font-display);font-size:13px;font-weight:800;text-transform:uppercase;letter-spacing:.02em;color:#050505;background:#ffb020;border-radius:10px;padding:10px 20px;border:none;cursor:pointer";

function groupLabel(d: Date): string {
  const now = new Date();
  const oneDay = 86400000;
  const startOfDay = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diff = Math.round((startOfDay(d) - startOfDay(now)) / oneDay);
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  return d.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
}

export default function CalendarBoard({ initialMeetings, leads }: { initialMeetings: Meeting[]; leads: Lead[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");

  const [freeText, setFreeText] = useState("");
  const [title, setTitle] = useState("");
  const [leadId, setLeadId] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");

  function submitFreeform() {
    if (!freeText.trim()) return;
    setError("");
    startTransition(async () => {
      const res = await bookMeetingFreeformAction(freeText.trim());
      if (!res.ok) {
        setError(res.error || "Couldn't book that.");
        return;
      }
      setFreeText("");
      setOpen(false);
      router.refresh();
    });
  }

  function submitManual() {
    if (!title.trim() || !date || !time) return;
    setError("");
    const whenAt = new Date(`${date}T${time}`);
    if (isNaN(whenAt.getTime())) {
      setError("That date/time doesn't look right.");
      return;
    }
    const whenLabel = whenAt.toLocaleString([], { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
    startTransition(async () => {
      await bookMeetingManualAction({ title: title.trim(), leadId: leadId || null, whenAt: whenAt.toISOString(), whenLabel });
      setTitle(""); setLeadId(""); setDate(""); setTime("");
      setOpen(false);
      router.refresh();
    });
  }

  const groups: { label: string; items: Meeting[] }[] = [];
  for (const m of initialMeetings) {
    const label = groupLabel(new Date(m.whenAt));
    const g = groups.find((x) => x.label === label);
    if (g) g.items.push(m);
    else groups.push({ label, items: [m] });
  }

  return (
    <div>
      <div style={css("display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;margin-bottom:24px")}>
        <div>
          <h1 style={css("font-family:var(--font-display);font-weight:900;font-size:clamp(26px,4vw,36px);color:var(--text);margin:0 0 6px;text-transform:uppercase")}>Calendar</h1>
          <p style={css("font-size:15px;color:var(--text-muted);margin:0")}>Every real booked call, nothing else.</p>
        </div>
        <button onClick={() => setOpen(true)} style={css(primaryBtn)}>+ Book a call</button>
      </div>

      {initialMeetings.length === 0 ? (
        <div style={css("font-size:14px;color:var(--text-muted);background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:24px;text-align:center")}>
          Nothing booked yet — book a call above, or straight from a brand on your Deals page.
        </div>
      ) : (
        <div style={css("display:flex;flex-direction:column;gap:24px")}>
          {groups.map((g) => (
            <div key={g.label}>
              <div style={css("font-family:var(--font-display);font-size:12px;font-weight:800;letter-spacing:.05em;text-transform:uppercase;color:var(--text-muted);margin-bottom:10px")}>{g.label}</div>
              <div style={css("display:flex;flex-direction:column;gap:8px")}>
                {g.items.map((m) => (
                  <div key={m.id} style={css("display:flex;align-items:center;gap:14px;background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:14px 16px")}>
                    <div style={css("font-family:var(--font-display);font-weight:800;font-size:13px;color:var(--accent-text);flex:none;width:100px")}>
                      {new Date(m.whenAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                    </div>
                    <div>
                      <div style={css("font-size:14px;font-weight:700;color:var(--text)")}>{m.title}</div>
                      <div style={css("font-size:12px;color:var(--text-muted);margin-top:2px;text-transform:capitalize")}>{m.kind}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {open && (
        <div onClick={() => setOpen(false)} style={css("position:fixed;inset:0;background:rgba(0,0,0,.65);z-index:50;display:flex;align-items:center;justify-content:center;padding:20px")}>
          <div onClick={(e) => e.stopPropagation()} style={css("width:100%;max-width:480px;max-height:86vh;overflow-y:auto;background:var(--surface);border:1px solid var(--border-strong);border-radius:18px;padding:26px")}>
            <div style={css("display:flex;align-items:center;justify-content:space-between;margin-bottom:18px")}>
              <div style={css("font-family:var(--font-display);font-weight:900;font-size:18px;color:var(--text);text-transform:uppercase")}>Book a call</div>
              <button onClick={() => setOpen(false)} style={css("background:none;border:none;color:var(--text-muted);font-size:18px;cursor:pointer;line-height:1")}>✕</button>
            </div>

            <label style={css(labelStyle)}>Say it in plain English</label>
            <input
              autoFocus
              style={css(inputStyle)}
              placeholder="e.g. book a call with Acme next Tuesday at 2pm"
              value={freeText}
              onChange={(e) => setFreeText(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") submitFreeform(); }}
            />
            <button disabled={pending || !freeText.trim()} onClick={submitFreeform} style={css(primaryBtn + ";width:100%;margin-top:10px;opacity:" + (pending ? "0.7" : "1"))}>
              {pending ? "Booking…" : "Book it"}
            </button>

            {error && <div style={css("font-size:12.5px;color:#ff4257;margin-top:10px")}>{error}</div>}

            <div style={css("display:flex;align-items:center;gap:10px;margin:22px 0")}>
              <div style={css("flex:1;height:1px;background:var(--border)")} />
              <span style={css("font-size:11px;color:var(--text-muted);text-transform:uppercase;letter-spacing:.05em")}>or enter manually</span>
              <div style={css("flex:1;height:1px;background:var(--border)")} />
            </div>

            <label style={css(labelStyle)}>Title</label>
            <input style={css(inputStyle)} placeholder="e.g. Call with Bloom Coffee" value={title} onChange={(e) => setTitle(e.target.value)} />
            <label style={css(labelStyle + ";margin-top:12px")}>Brand (optional)</label>
            <select value={leadId} onChange={(e) => setLeadId(e.target.value)} style={css(inputStyle)}>
              <option value="">None</option>
              {leads.map((l) => (
                <option key={l.id} value={l.id}>{l.name}{l.company ? " — " + l.company : ""}</option>
              ))}
            </select>
            <div style={css("display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:12px")}>
              <div>
                <label style={css(labelStyle)}>Date</label>
                <input type="date" style={css(inputStyle)} value={date} onChange={(e) => setDate(e.target.value)} />
              </div>
              <div>
                <label style={css(labelStyle)}>Time</label>
                <input type="time" style={css(inputStyle)} value={time} onChange={(e) => setTime(e.target.value)} />
              </div>
            </div>
            <button disabled={pending || !title.trim() || !date || !time} onClick={submitManual} style={css(primaryBtn + ";width:100%;margin-top:16px;opacity:" + (pending ? "0.7" : "1"))}>
              {pending ? "Booking…" : "Book it"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
