"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { css, Box } from "@/components/primitives";
import { av } from "@/lib/visuals";
import { CAPABILITIES } from "@/lib/agentTypes";
import { createAgentAction, setAgentPausedAction, removeAgentAction } from "@/lib/agents/actions";
import { createTeamAction, updateTeamMembersAction } from "@/lib/teams/actions";
import type { MergedAgent } from "@/lib/agents/store";
import type { MergedTeam } from "@/lib/teams/store";

const COLORS = ["#ffb020", "#ff7a00", "#00d18f", "#7c5cff", "#38b6ff", "#ff4257"];
const inputStyle = "width:100%;background:var(--input-bg);border:1px solid var(--border);border-radius:8px;color:var(--text);font-size:14px;padding:10px 12px;outline:none";
const labelStyle = "font-size:13px;font-weight:700;color:var(--text);margin-bottom:6px;display:block";
const primaryBtn = "font-family:var(--font-display);font-size:13px;font-weight:800;text-transform:uppercase;letter-spacing:.02em;color:#050505;background:#ffb020;border-radius:10px;padding:10px 20px;border:none;cursor:pointer";
const ghostBtn = "font-size:12px;font-weight:700;color:var(--text);background:none;border:1px solid var(--border-strong);border-radius:8px;padding:8px 14px;cursor:pointer";

function ModalShell({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div onClick={onClose} style={css("position:fixed;inset:0;background:rgba(0,0,0,.65);z-index:50;display:flex;align-items:center;justify-content:center;padding:20px")}>
      <div onClick={(e) => e.stopPropagation()} style={css("width:100%;max-width:520px;max-height:86vh;overflow-y:auto;background:var(--surface);border:1px solid var(--border-strong);border-radius:18px;padding:28px")}>
        <div style={css("display:flex;align-items:center;justify-content:space-between;margin-bottom:20px")}>
          <div style={css("font-family:var(--font-display);font-weight:900;font-size:19px;color:var(--text);text-transform:uppercase")}>{title}</div>
          <button onClick={onClose} style={css("background:none;border:none;color:var(--text-muted);font-size:18px;cursor:pointer;line-height:1")}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function AgentsBoard({ initialAgents, initialTeams }: { initialAgents: MergedAgent[]; initialTeams: MergedTeam[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [newAgentOpen, setNewAgentOpen] = useState(false);
  const [newTeamOpen, setNewTeamOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<string | null>(null);

  const [agentName, setAgentName] = useState("");
  const [agentRole, setAgentRole] = useState("");
  const [agentColor, setAgentColor] = useState(COLORS[0]);
  const [agentCaps, setAgentCaps] = useState<string[]>([]);
  const [agentGoal, setAgentGoal] = useState("");

  const [teamName, setTeamName] = useState("");
  const [teamDesc, setTeamDesc] = useState("");
  const [teamMembers, setTeamMembers] = useState<string[]>([]);

  const [editMembers, setEditMembers] = useState<string[]>([]);

  function toggleCap(id: string) {
    setAgentCaps((c) => (c.includes(id) ? c.filter((x) => x !== id) : [...c, id]));
  }
  function toggleTeamMember(id: string, list: string[], setList: (v: string[]) => void) {
    setList(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);
  }

  function submitNewAgent() {
    if (!agentName.trim() || !agentRole.trim() || agentCaps.length === 0) return;
    startTransition(async () => {
      await createAgentAction({ name: agentName.trim(), role: agentRole.trim(), color: agentColor, capabilities: agentCaps, goal: agentGoal.trim() });
      setNewAgentOpen(false);
      setAgentName(""); setAgentRole(""); setAgentColor(COLORS[0]); setAgentCaps([]); setAgentGoal("");
      router.refresh();
    });
  }

  function submitNewTeam() {
    if (!teamName.trim() || teamMembers.length === 0) return;
    startTransition(async () => {
      await createTeamAction({ name: teamName.trim(), description: teamDesc.trim(), members: teamMembers });
      setNewTeamOpen(false);
      setTeamName(""); setTeamDesc(""); setTeamMembers([]);
      router.refresh();
    });
  }

  function saveTeamMembers(id: string) {
    startTransition(async () => {
      await updateTeamMembersAction(id, editMembers);
      setEditingTeam(null);
      router.refresh();
    });
  }

  function togglePause(agent: MergedAgent) {
    startTransition(async () => {
      await setAgentPausedAction(agent.id, agent.status !== "offline");
      router.refresh();
    });
  }

  function remove(agent: MergedAgent) {
    startTransition(async () => {
      await removeAgentAction(agent.id);
      router.refresh();
    });
  }

  return (
    <div>
      <div style={css("display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;margin-bottom:28px")}>
        <div>
          <h1 style={css("font-family:var(--font-display);font-weight:900;font-size:clamp(26px,4vw,36px);color:var(--text);margin:0 0 6px;text-transform:uppercase")}>Your AI Team</h1>
          <p style={css("font-size:15px;color:var(--text-muted);margin:0")}>Your ready-made Deal Team, plus anything you build yourself.</p>
        </div>
        <div style={css("display:flex;gap:10px")}>
          <button onClick={() => setNewTeamOpen(true)} style={css(ghostBtn)}>+ New team</button>
          <button onClick={() => setNewAgentOpen(true)} style={css(primaryBtn)}>+ New agent</button>
        </div>
      </div>

      <div style={css("font-family:var(--font-display);font-size:13px;font-weight:800;letter-spacing:.05em;text-transform:uppercase;color:var(--text-muted);margin-bottom:12px")}>Agents</div>
      <div style={css("display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:14px;margin-bottom:36px")}>
        {initialAgents.map((a) => (
          <div key={a.id} style={css("background:var(--surface);border:1px solid var(--border);border-radius:16px;padding:18px;opacity:" + (a.status === "offline" ? "0.55" : "1"))}>
            <div style={css("display:flex;align-items:center;gap:12px;margin-bottom:12px")}>
              <div style={css("padding:2.5px;border-radius:50%;background:var(--bg);box-shadow:0 0 16px " + a.color + "77;flex:none")}>
                <div style={css(av(a, 42) + ";border:2px solid var(--bg)")}>{a.initials}</div>
              </div>
              <div style={css("min-width:0;flex:1")}>
                <div style={css("font-family:var(--font-display);font-size:15px;font-weight:800;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis")}>{a.name}</div>
                <div style={css("font-size:10.5px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;color:" + a.color)}>{a.role}</div>
              </div>
            </div>
            <div style={css("display:flex;flex-wrap:wrap;gap:5px;margin-bottom:14px")}>
              {a.capabilities.map((c) => {
                const cap = CAPABILITIES.find((x) => x.id === c);
                return (
                  <span key={c} style={css("font-size:10px;font-weight:700;color:var(--text-muted);background:var(--overlay-1);border:1px solid var(--border);border-radius:6px;padding:3px 8px")}>
                    {cap?.label ?? c}
                  </span>
                );
              })}
            </div>
            <div style={css("display:flex;gap:8px")}>
              <button disabled={pending} onClick={() => togglePause(a)} style={css(ghostBtn)}>{a.status === "offline" ? "Resume" : "Pause"}</button>
              <button disabled={pending} onClick={() => remove(a)} style={css(ghostBtn + ";color:#ff4257;border-color:rgba(255,66,87,.35)")}>Remove</button>
            </div>
          </div>
        ))}
      </div>

      <div style={css("font-family:var(--font-display);font-size:13px;font-weight:800;letter-spacing:.05em;text-transform:uppercase;color:var(--text-muted);margin-bottom:12px")}>Teams</div>
      <div style={css("display:flex;flex-direction:column;gap:12px")}>
        {initialTeams.map((t) => (
          <div key={t.id} style={css("background:var(--surface);border:1px solid var(--border);border-radius:16px;padding:18px")}>
            <div style={css("display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap")}>
              <div>
                <div style={css("font-family:var(--font-display);font-size:16px;font-weight:800;color:var(--text)")}>{t.name}</div>
                <div style={css("font-size:13px;color:var(--text-muted);margin-top:4px;max-width:480px")}>{t.description}</div>
              </div>
              <button
                onClick={() => {
                  if (editingTeam === t.id) { setEditingTeam(null); return; }
                  setEditingTeam(t.id);
                  setEditMembers(t.members);
                }}
                style={css(ghostBtn)}
              >
                {editingTeam === t.id ? "Cancel" : "Edit members"}
              </button>
            </div>

            <div style={css("display:flex;gap:8px;margin-top:14px;flex-wrap:wrap")}>
              {t.members.map((id) => {
                const a = initialAgents.find((x) => x.id === id);
                if (!a) return null;
                return (
                  <div key={id} title={a.name} style={css(av(a, 30) + ";border:2px solid var(--surface)")}>
                    {a.initials}
                  </div>
                );
              })}
              {t.members.length === 0 && <span style={css("font-size:12px;color:var(--text-muted)")}>No teammates yet.</span>}
            </div>

            {editingTeam === t.id && (
              <div style={css("margin-top:16px;border-top:1px solid var(--border);padding-top:14px")}>
                <div style={css("display:flex;flex-wrap:wrap;gap:8px;margin-bottom:14px")}>
                  {initialAgents.map((a) => (
                    <Box
                      key={a.id}
                      onClick={() => toggleTeamMember(a.id, editMembers, setEditMembers)}
                      style={"font-size:12px;font-weight:700;border-radius:8px;padding:7px 12px;cursor:pointer;" + (editMembers.includes(a.id) ? "background:" + a.color + ";color:#050505" : "background:var(--overlay-1);color:var(--text-muted);border:1px solid var(--border-strong)")}
                    >
                      {a.name}
                    </Box>
                  ))}
                </div>
                <button disabled={pending} onClick={() => saveTeamMembers(t.id)} style={css(primaryBtn)}>Save members</button>
              </div>
            )}
          </div>
        ))}
      </div>

      {newAgentOpen && (
        <ModalShell title="New agent" onClose={() => setNewAgentOpen(false)}>
          <label style={css(labelStyle)}>Name</label>
          <input autoFocus style={css(inputStyle)} placeholder="e.g. Jordan Blake" value={agentName} onChange={(e) => setAgentName(e.target.value)} />
          <label style={css(labelStyle + ";margin-top:14px")}>Role label</label>
          <input style={css(inputStyle)} placeholder="e.g. Partnerships Scout" value={agentRole} onChange={(e) => setAgentRole(e.target.value)} />

          <label style={css(labelStyle + ";margin-top:14px")}>What can they do?</label>
          <div style={css("display:flex;flex-direction:column;gap:8px")}>
            {CAPABILITIES.map((c) => (
              <Box
                key={c.id}
                onClick={() => toggleCap(c.id)}
                style={"display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:8px;cursor:pointer;" + (agentCaps.includes(c.id) ? "background:rgba(255,176,32,.12);border:1px solid rgba(255,176,32,.4)" : "background:var(--input-bg);border:1px solid var(--border)")}
              >
                <span style={css("width:16px;height:16px;border-radius:4px;flex:none;background:" + (agentCaps.includes(c.id) ? "#ffb020" : "var(--border-strong)"))} />
                <span style={css("font-size:13px;color:var(--text)")}>{c.label}</span>
              </Box>
            ))}
          </div>

          <label style={css(labelStyle + ";margin-top:14px")}>Color</label>
          <div style={css("display:flex;gap:8px")}>
            {COLORS.map((c) => (
              <Box key={c} onClick={() => setAgentColor(c)} style={"width:30px;height:30px;border-radius:50%;background:" + c + ";cursor:pointer;border:2px solid " + (agentColor === c ? "var(--text)" : "transparent")} />
            ))}
          </div>

          <label style={css(labelStyle + ";margin-top:14px")}>Goal (optional)</label>
          <textarea style={css(inputStyle + ";min-height:60px;resize:vertical")} placeholder="What should they focus on?" value={agentGoal} onChange={(e) => setAgentGoal(e.target.value)} />

          <button disabled={pending || !agentName.trim() || !agentRole.trim() || agentCaps.length === 0} onClick={submitNewAgent} style={css(primaryBtn + ";width:100%;margin-top:20px;opacity:" + (pending ? "0.7" : "1"))}>
            {pending ? "Creating…" : "Create agent"}
          </button>
        </ModalShell>
      )}

      {newTeamOpen && (
        <ModalShell title="New team" onClose={() => setNewTeamOpen(false)}>
          <label style={css(labelStyle)}>Team name</label>
          <input autoFocus style={css(inputStyle)} placeholder="e.g. Fitness Push" value={teamName} onChange={(e) => setTeamName(e.target.value)} />
          <label style={css(labelStyle + ";margin-top:14px")}>Description (optional)</label>
          <textarea style={css(inputStyle + ";min-height:60px;resize:vertical")} placeholder="What's this team's focus?" value={teamDesc} onChange={(e) => setTeamDesc(e.target.value)} />

          <label style={css(labelStyle + ";margin-top:14px")}>Members</label>
          <div style={css("display:flex;flex-wrap:wrap;gap:8px")}>
            {initialAgents.map((a) => (
              <Box
                key={a.id}
                onClick={() => toggleTeamMember(a.id, teamMembers, setTeamMembers)}
                style={"font-size:12px;font-weight:700;border-radius:8px;padding:7px 12px;cursor:pointer;" + (teamMembers.includes(a.id) ? "background:" + a.color + ";color:#050505" : "background:var(--overlay-1);color:var(--text-muted);border:1px solid var(--border-strong)")}
              >
                {a.name}
              </Box>
            ))}
          </div>

          <button disabled={pending || !teamName.trim() || teamMembers.length === 0} onClick={submitNewTeam} style={css(primaryBtn + ";width:100%;margin-top:20px;opacity:" + (pending ? "0.7" : "1"))}>
            {pending ? "Creating…" : "Create team"}
          </button>
        </ModalShell>
      )}
    </div>
  );
}
