"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { css } from "@/lib/css";
import { STAGES, type Lead, type LeadStatus } from "@/lib/leads/types";
import type { MergedAgent } from "@/lib/agents/store";
import type { OutreachDraft } from "@/lib/outreach/store";
import type { Proposal } from "@/lib/proposals/store";
import {
  updateLeadStageAction,
  assignLeadAgentAction,
  enqueueResearchAction,
  enqueueOutreachAction,
  enqueueFollowupAction,
  enqueueProposalAction,
} from "@/lib/leads/actions";
import { bookMeetingForLeadAction } from "@/lib/meetings/actions";

const inputStyle = "width:100%;background:var(--input-bg);border:1px solid var(--border);border-radius:8px;color:var(--text);font-size:12px;padding:7px 9px;outline:none";
const ghostBtn = "font-size:11px;font-weight:700;color:var(--text);background:none;border:1px solid var(--border-strong);border-radius:8px;padding:6px 10px;cursor:pointer;width:100%;text-align:center";
const primaryBtn = "font-family:var(--font-display);font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.02em;color:#050505;background:#ffb020;border-radius:8px;padding:7px 10px;border:none;cursor:pointer;width:100%;text-align:center";

async function runJob() {
  await fetch("/api/jobs/run", { method: "POST" });
}

export default function LeadCard({
  lead,
  agents,
  outreachDrafts,
  proposals,
}: {
  lead: Lead;
  agents: MergedAgent[];
  outreachDrafts: OutreachDraft[];
  proposals: Proposal[];
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [busy, setBusy] = useState<string | null>(null);
  const [showBrief, setShowBrief] = useState(false);
  const [showOutreach, setShowOutreach] = useState(false);
  const [showProposals, setShowProposals] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [meetingText, setMeetingText] = useState("");
  const [meetingError, setMeetingError] = useState("");

  function run(key: string, fn: () => Promise<unknown>) {
    setBusy(key);
    startTransition(async () => {
      await fn();
      await runJob();
      setBusy(null);
      router.refresh();
    });
  }

  function bookMeeting() {
    if (!meetingText.trim()) return;
    setBusy("meeting");
    setMeetingError("");
    startTransition(async () => {
      const res = await bookMeetingForLeadAction(lead.id, meetingText.trim());
      setBusy(null);
      if (!res.ok) {
        setMeetingError(res.error || "Couldn't book that.");
        return;
      }
      setMeetingText("");
      router.refresh();
    });
  }

  function copy(text: string, id: string) {
    navigator.clipboard?.writeText(text).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1500);
    });
  }

  return (
    <div style={css("background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:12px")}>
      <div style={css("font-size:13.5px;font-weight:700;color:var(--text)")}>{lead.name}</div>
      {lead.company && <div style={css("font-size:12px;color:var(--text-muted);margin-top:2px")}>{lead.company}</div>}
      {typeof lead.score === "number" && (
        <span style={css("display:inline-block;font-size:10.5px;font-weight:800;color:var(--accent-text);background:rgba(255,176,32,.12);border-radius:6px;padding:2px 7px;margin-top:6px")}>
          Fit {lead.score}
        </span>
      )}

      <select
        value={lead.agentId ?? ""}
        onChange={(e) => run("agent", () => assignLeadAgentAction(lead.id, e.target.value || null))}
        style={css(inputStyle + ";margin-top:8px")}
      >
        <option value="">Unassigned</option>
        {agents.map((a) => (
          <option key={a.id} value={a.id}>{a.name} — {a.role}</option>
        ))}
      </select>

      <select
        value={lead.status}
        onChange={(e) => run("stage", () => updateLeadStageAction(lead.id, e.target.value as LeadStatus))}
        style={css(inputStyle + ";margin-top:6px")}
      >
        {STAGES.map((s) => (
          <option key={s.id} value={s.id}>{s.label}</option>
        ))}
      </select>

      {/* Research brief */}
      <div style={css("margin-top:10px;border-top:1px solid var(--border);padding-top:10px")}>
        {lead.research ? (
          <>
            <button onClick={() => setShowBrief((v) => !v)} style={css(ghostBtn)}>
              {showBrief ? "Hide brief ▲" : "View brief ▼"}
            </button>
            {showBrief && (
              <div style={css("margin-top:8px;background:var(--overlay-1);border:1px solid var(--border);border-radius:8px;padding:10px;font-size:11.5px;color:var(--text);line-height:1.5")}>
                <div style={css("color:var(--accent-text);font-weight:700;margin-bottom:4px")}>Best angle</div>
                <div style={css("margin-bottom:8px")}>{lead.research.angle}</div>
                <div style={css("color:var(--text);font-weight:700;margin-bottom:4px")}>They likely care about</div>
                {lead.research.priorities.length > 0 ? (
                  <ul style={css("margin:0 0 8px;padding-left:16px")}>
                    {lead.research.priorities.map((p, i) => <li key={i}>{p}</li>)}
                  </ul>
                ) : (
                  <div style={css("margin-bottom:8px;color:var(--text-muted)")}>—</div>
                )}
                <div style={css("color:var(--text);font-weight:700;margin-bottom:4px")}>Hooks</div>
                {lead.research.hooks.length > 0 ? (
                  <ul style={css("margin:0;padding-left:16px")}>{lead.research.hooks.map((h, i) => <li key={i}>{h}</li>)}</ul>
                ) : (
                  <div style={css("color:var(--text-muted)")}>—</div>
                )}
              </div>
            )}
            <button disabled={busy === "brief"} onClick={() => run("brief", () => enqueueResearchAction(lead.id, lead.agentId))} style={css(ghostBtn + ";margin-top:6px")}>
              {busy === "brief" ? "Thinking…" : "Refresh brief"}
            </button>
          </>
        ) : (
          <button disabled={busy === "brief"} onClick={() => run("brief", () => enqueueResearchAction(lead.id, lead.agentId))} style={css(primaryBtn)}>
            {busy === "brief" ? "Thinking…" : "✦ Write brief"}
          </button>
        )}
      </div>

      {/* Outreach thread — pitch + any follow-ups */}
      <div style={css("margin-top:10px;border-top:1px solid var(--border);padding-top:10px")}>
        {outreachDrafts.length > 0 ? (
          <>
            <button onClick={() => setShowOutreach((v) => !v)} style={css(ghostBtn)}>
              {showOutreach ? "Hide outreach ▲" : `View outreach (${outreachDrafts.length}) ▼`}
            </button>
            {showOutreach && (
              <div style={css("margin-top:8px;display:flex;flex-direction:column;gap:8px")}>
                {outreachDrafts.map((d) => (
                  <div key={d.id} style={css("background:var(--overlay-1);border:1px solid var(--border);border-radius:8px;padding:10px;font-size:11.5px;color:var(--text);line-height:1.5")}>
                    {d.subject && <div style={css("color:var(--text);font-weight:700;margin-bottom:4px")}>{d.subject}</div>}
                    <div style={css("white-space:pre-wrap;margin-bottom:8px")}>{d.body}</div>
                    <div style={css("display:flex;gap:10px;align-items:center")}>
                      {lead.email && (
                        <a
                          href={`mailto:${lead.email}?subject=${encodeURIComponent(d.subject || "")}&body=${encodeURIComponent(d.body)}`}
                          style={css("font-size:10.5px;font-weight:700;color:var(--accent-text);text-decoration:underline")}
                        >
                          Open in mail
                        </a>
                      )}
                      <button onClick={() => copy(d.body, d.id)} style={css("font-size:10.5px;font-weight:700;color:var(--text-muted);background:none;border:none;cursor:pointer;padding:0")}>
                        {copiedId === d.id ? "Copied!" : "Copy"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <button disabled={busy === "followup"} onClick={() => run("followup", () => enqueueFollowupAction(lead.id, lead.agentId))} style={css(ghostBtn + ";margin-top:6px")}>
              {busy === "followup" ? "Thinking…" : "✦ Follow up"}
            </button>
          </>
        ) : (
          <button disabled={busy === "pitch"} onClick={() => run("pitch", () => enqueueOutreachAction(lead.id, lead.agentId))} style={css(primaryBtn)}>
            {busy === "pitch" ? "Writing…" : "✦ Draft pitch"}
          </button>
        )}
      </div>

      {/* Proposals */}
      <div style={css("margin-top:10px;border-top:1px solid var(--border);padding-top:10px")}>
        {proposals.length > 0 && (
          <>
            <button onClick={() => setShowProposals((v) => !v)} style={css(ghostBtn)}>
              {showProposals ? "Hide proposals ▲" : `View proposals (${proposals.length}) ▼`}
            </button>
            {showProposals && (
              <div style={css("margin-top:8px;display:flex;flex-direction:column;gap:8px")}>
                {proposals.map((p) => (
                  <div key={p.id} style={css("background:var(--overlay-1);border:1px solid var(--border);border-radius:8px;padding:10px;font-size:11.5px;color:var(--text);line-height:1.5")}>
                    <div style={css("color:var(--text);font-weight:700;margin-bottom:4px")}>{p.title}</div>
                    <div style={css("white-space:pre-wrap;margin-bottom:8px")}>{p.body}</div>
                    {p.products.length > 0 && (
                      <ul style={css("margin:0 0 8px;padding-left:16px")}>
                        {p.products.map((pkg, i) => (
                          <li key={i} style={css("color:var(--accent-text);font-weight:600")}>{pkg}</li>
                        ))}
                      </ul>
                    )}
                    <button onClick={() => copy(p.body, p.id)} style={css("font-size:10.5px;font-weight:700;color:var(--text-muted);background:none;border:none;cursor:pointer;padding:0")}>
                      {copiedId === p.id ? "Copied!" : "Copy"}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
        <button
          disabled={busy === "proposal"}
          onClick={() => run("proposal", () => enqueueProposalAction(lead.id, lead.agentId))}
          style={css(primaryBtn + ";margin-top:" + (proposals.length > 0 ? "6px" : "0"))}
        >
          {busy === "proposal" ? "Pricing…" : proposals.length > 0 ? "✦ New proposal" : "✦ Draft proposal"}
        </button>
      </div>

      {/* Book a call */}
      <div style={css("margin-top:10px;border-top:1px solid var(--border);padding-top:10px")}>
        <input
          value={meetingText}
          onChange={(e) => { setMeetingText(e.target.value); setMeetingError(""); }}
          placeholder="e.g. next Tuesday at 2pm"
          style={css(inputStyle)}
        />
        <button disabled={busy === "meeting" || !meetingText.trim()} onClick={bookMeeting} style={css(primaryBtn + ";margin-top:6px")}>
          {busy === "meeting" ? "Booking…" : "📅 Book a call"}
        </button>
        {meetingError && <div style={css("font-size:10.5px;color:#ff4257;margin-top:6px")}>{meetingError}</div>}
      </div>
    </div>
  );
}
