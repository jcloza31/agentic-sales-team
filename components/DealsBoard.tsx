"use client";
import { useRef, useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { css } from "@/lib/css";
import { STAGES, type Lead } from "@/lib/leads/types";
import { addLeadAction, importLeadsCsvAction, acceptLeadAction, rejectLeadAction } from "@/lib/leads/actions";
import type { MergedAgent } from "@/lib/agents/store";
import type { OutreachDraft } from "@/lib/outreach/store";
import type { Proposal } from "@/lib/proposals/store";
import LeadCard from "@/components/LeadCard";
import BrandLogo from "@/components/BrandLogo";

const inputStyle = "width:100%;background:var(--input-bg);border:1px solid var(--border);border-radius:8px;color:var(--text);font-size:13px;padding:9px 11px;outline:none";
const labelStyle = "font-size:12px;font-weight:700;color:var(--text);margin-bottom:5px;display:block";
const primaryBtn = "font-family:var(--font-display);font-size:13px;font-weight:800;text-transform:uppercase;letter-spacing:.02em;color:#050505;background:#ffb020;border-radius:10px;padding:10px 20px;border:none;cursor:pointer";
const ghostBtn = "font-size:12px;font-weight:700;color:var(--text);background:none;border:1px solid var(--border-strong);border-radius:8px;padding:8px 14px;cursor:pointer";

function ModalShell({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <div onClick={onClose} style={css("position:fixed;inset:0;background:rgba(0,0,0,.65);z-index:50;display:flex;align-items:center;justify-content:center;padding:20px")}>
      <div onClick={(e) => e.stopPropagation()} style={css("width:100%;max-width:480px;max-height:86vh;overflow-y:auto;background:var(--surface);border:1px solid var(--border-strong);border-radius:18px;padding:26px")}>
        <div style={css("display:flex;align-items:center;justify-content:space-between;margin-bottom:18px")}>
          <div style={css("font-family:var(--font-display);font-weight:900;font-size:18px;color:var(--text);text-transform:uppercase")}>{title}</div>
          <button onClick={onClose} style={css("background:none;border:none;color:var(--text-muted);font-size:18px;cursor:pointer;line-height:1")}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function DealsBoard({
  initialLeads,
  initialPending,
  agents,
  outreachByLead,
  proposalsByLead,
}: {
  initialLeads: Lead[];
  initialPending: Lead[];
  agents: MergedAgent[];
  outreachByLead: Record<string, OutreachDraft[]>;
  proposalsByLead: Record<string, Proposal[]>;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [discovering, setDiscovering] = useState(false);

  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [platform, setPlatform] = useState("");
  const [website, setWebsite] = useState("");
  const [agentId, setAgentId] = useState("");

  function submitAdd() {
    if (!name.trim()) return;
    startTransition(async () => {
      await addLeadAction({ name: name.trim(), company: company.trim(), email: email.trim(), platform: platform.trim(), website: website.trim(), agentId: agentId || null });
      setAddOpen(false);
      setName(""); setCompany(""); setEmail(""); setPlatform(""); setWebsite(""); setAgentId("");
      router.refresh();
    });
  }

  function onCsvChosen(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? "");
      startTransition(async () => {
        await importLeadsCsvAction(text);
        router.refresh();
      });
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  function accept(id: string) {
    startTransition(async () => {
      await acceptLeadAction(id);
      router.refresh();
    });
  }

  function reject(id: string) {
    startTransition(async () => {
      await rejectLeadAction(id);
      router.refresh();
    });
  }

  function discover() {
    setDiscovering(true);
    startTransition(async () => {
      await fetch("/api/scrape", { method: "POST" });
      setDiscovering(false);
      router.refresh();
    });
  }

  return (
    <div>
      <div style={css("display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;margin-bottom:24px")}>
        <div>
          <h1 style={css("font-family:var(--font-display);font-weight:900;font-size:clamp(26px,4vw,36px);color:var(--text);margin:0 0 6px;text-transform:uppercase")}>Deals</h1>
          <p style={css("font-size:15px;color:var(--text-muted);margin:0")}>New brands, all the way to a booked call.</p>
        </div>
        <div style={css("display:flex;gap:10px;flex-wrap:wrap")}>
          <button disabled={discovering} onClick={discover} style={css(ghostBtn)}>{discovering ? "Searching…" : "🔍 Discover brands"}</button>
          <button onClick={() => fileRef.current?.click()} style={css(ghostBtn)}>Import CSV</button>
          <input ref={fileRef} type="file" accept=".csv,text/csv" onChange={onCsvChosen} style={{ display: "none" }} />
          <button onClick={() => setAddOpen(true)} style={css(primaryBtn)}>+ Add a brand</button>
        </div>
      </div>

      <div style={css("margin-bottom:28px")}>
        <div style={css("display:flex;align-items:center;gap:8px;margin-bottom:12px")}>
          <div style={css("font-family:var(--font-display);font-size:13px;font-weight:800;letter-spacing:.05em;text-transform:uppercase;color:var(--text-muted)")}>Pending review</div>
          {initialPending.length > 0 && (
            <span style={css("font-size:11px;font-weight:800;color:#050505;background:#ffb020;border-radius:99px;padding:2px 9px")}>{initialPending.length}</span>
          )}
        </div>
        {initialPending.length === 0 ? (
          <div style={css("font-size:13px;color:var(--text-muted);background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:16px")}>
            Nothing waiting on you yet — brands your Research agent discovers will land here for your approval.
          </div>
        ) : (
          <div style={css("display:flex;flex-direction:column;gap:8px")}>
            {initialPending.map((l) => (
              <div key={l.id} style={css("display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;background:var(--surface);border:1px solid rgba(255,176,32,.3);border-radius:12px;padding:14px 16px")}>
                <div style={css("display:flex;align-items:center;gap:12px;min-width:0")}>
                  <BrandLogo name={l.name} website={l.website} profileUrl={l.profileUrl} size={40} />
                  <div style={css("min-width:0")}>
                    <div style={css("font-size:14px;font-weight:700;color:var(--text)")}>{l.name}{l.company ? " · " + l.company : ""}</div>
                    {l.platform && <div style={css("font-size:12px;color:var(--text-muted);margin-top:2px")}>{l.platform}</div>}
                    {l.profileUrl && (
                      <a href={l.profileUrl} target="_blank" rel="noreferrer" style={css("display:block;font-size:11.5px;color:var(--accent-text);margin-top:2px;text-decoration:underline;word-break:break-all")}>
                        {l.profileUrl}
                      </a>
                    )}
                    {l.website && (
                      <a href={l.website} target="_blank" rel="noreferrer" style={css("display:block;font-size:11.5px;color:var(--text-muted);margin-top:2px;text-decoration:underline;word-break:break-all")}>
                        {l.website}
                      </a>
                    )}
                    {!l.platform && !l.profileUrl && !l.website && (
                      <div style={css("font-size:12px;color:var(--text-muted);margin-top:2px")}>{l.email || "No contact info"}</div>
                    )}
                  </div>
                </div>
                <div style={css("display:flex;gap:8px;flex:none")}>
                  <button disabled={pending} onClick={() => accept(l.id)} style={css(primaryBtn)}>Accept</button>
                  <button disabled={pending} onClick={() => reject(l.id)} style={css(ghostBtn + ";color:#ff4257;border-color:rgba(255,66,87,.35)")}>Reject</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={css("display:grid;grid-template-columns:repeat(5,minmax(230px,1fr));gap:12px;overflow-x:auto;padding-bottom:8px")}>
        {STAGES.map((stage) => {
          const items = initialLeads.filter((l) => l.status === stage.id);
          return (
            <div key={stage.id} style={css("min-width:230px")}>
              <div style={css("display:flex;align-items:center;gap:8px;margin-bottom:10px")}>
                <div style={css("font-size:12px;font-weight:800;letter-spacing:.04em;text-transform:uppercase;color:var(--text)")}>{stage.label}</div>
                <span style={css("font-size:11px;font-weight:700;color:var(--text-muted)")}>{items.length}</span>
              </div>
              <div style={css("display:flex;flex-direction:column;gap:8px")}>
                {items.map((l) => (
                  <LeadCard
                    key={l.id}
                    lead={l}
                    agents={agents}
                    outreachDrafts={outreachByLead[l.id] ?? []}
                    proposals={proposalsByLead[l.id] ?? []}
                  />
                ))}
                {items.length === 0 && <div style={css("font-size:12px;color:var(--text-muted);padding:8px 0")}>—</div>}
              </div>
            </div>
          );
        })}
      </div>

      {addOpen && (
        <ModalShell title="Add a brand" onClose={() => setAddOpen(false)}>
          <label style={css(labelStyle)}>Brand name</label>
          <input autoFocus style={css(inputStyle)} placeholder="e.g. Bloom Coffee" value={name} onChange={(e) => setName(e.target.value)} />
          <label style={css(labelStyle + ";margin-top:12px")}>Company (optional)</label>
          <input style={css(inputStyle)} placeholder="e.g. Bloom Coffee Co." value={company} onChange={(e) => setCompany(e.target.value)} />
          <label style={css(labelStyle + ";margin-top:12px")}>Email (optional)</label>
          <input style={css(inputStyle)} placeholder="e.g. hello@bloomcoffee.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          <label style={css(labelStyle + ";margin-top:12px")}>Platform (optional)</label>
          <input style={css(inputStyle)} placeholder="e.g. Instagram @bloomcoffee" value={platform} onChange={(e) => setPlatform(e.target.value)} />
          <label style={css(labelStyle + ";margin-top:12px")}>Website (optional)</label>
          <input style={css(inputStyle)} placeholder="e.g. bloomcoffee.com" value={website} onChange={(e) => setWebsite(e.target.value)} />
          <label style={css(labelStyle + ";margin-top:12px")}>Assign to (optional)</label>
          <select value={agentId} onChange={(e) => setAgentId(e.target.value)} style={css(inputStyle)}>
            <option value="">Unassigned</option>
            {agents.map((a) => (
              <option key={a.id} value={a.id}>{a.name} — {a.role}</option>
            ))}
          </select>
          <button disabled={pending || !name.trim()} onClick={submitAdd} style={css(primaryBtn + ";width:100%;margin-top:18px;opacity:" + (pending ? "0.7" : "1"))}>
            {pending ? "Adding…" : "Add brand"}
          </button>
        </ModalShell>
      )}
    </div>
  );
}
