"use client";
import { useEffect, useState } from "react";
import { css } from "@/lib/css";
import { Box } from "@/components/primitives";
import { statusMeta, type StatusKey } from "@/lib/data";
import { av, hubIcon } from "@/lib/visuals";
import { AGENT_TYPES, TEAM_TEMPLATES } from "@/lib/agentTypes";
import { DEMO_STATS, DEMO_ACTIVITY } from "@/lib/demoData";
import { formatFollowers } from "@/lib/tiktok/format";

export interface DashboardAgent {
  id: string;
  name: string;
  initials: string;
  color: string;
  role?: string;
  status?: StatusKey;
  capabilities: string[];
  task?: string;
}

export interface DashboardTeam {
  id: string;
  name: string;
  members: string[];
}

export interface DashboardStats {
  leadsWorked: number;
  tasksRunning: number;
  activeAgentIds: string[];
  perAgent: { agentId: string; leadsWorked: number }[];
}

export interface DashboardActivityItem {
  agentId: string | null;
  text: string;
}

export interface DashboardTiktok {
  displayName: string;
  username: string | null;
  avatarUrl: string;
  followerCount: number;
}

// The static preset team — used when no real agents/teams are passed in
// (the marketing landing page's showcase hero).
const DEFAULT_AGENTS: DashboardAgent[] = AGENT_TYPES.map((a) => ({
  id: a.id,
  name: a.name,
  initials: a.initials,
  color: a.color,
  role: a.role,
  status: "working",
  capabilities: [a.capability],
  task: a.task,
}));
const DEFAULT_TEAMS: DashboardTeam[] = TEAM_TEMPLATES.map((t) => ({ id: t.id, name: t.name, members: t.members }));

// [animation, tint] per activity type — the glyph comes from hubIcon().
const hubIcons: Record<string, [string, string]> = {
  email: ["iconFly 2.6s ease-in-out infinite", "#ff7a00"],
  call: ["iconRing 1.6s ease-in-out infinite", "#00d18f"],
  research: ["iconSwing 2.4s ease-in-out infinite", "#ffb020"],
  writing: ["iconPop 2.4s ease-in-out infinite", "#7c5cff"],
  meeting: ["iconPop 2.8s ease-in-out infinite", "#38b6ff"],
  analytics: ["iconPop 3s ease-in-out infinite", "#38b6ff"],
  idle: ["breathe 3s ease-in-out infinite", "#8f8f8f"],
  alert: ["iconPop 1.8s ease-in-out infinite", "#ff4257"],
};

// maps an agent's capability to the kind of activity badge it shows
const typeByCapability: Record<string, string> = {
  scrape: "research", research: "research", outreach: "email",
  "follow-up": "email", proposal: "writing", "book-meeting": "meeting",
};

// small live equalizer (three bouncing bars) shown on a working agent
function Equalizer({ color }: { color: string }) {
  return (
    <div style={css("display:flex;align-items:flex-end;gap:2px;height:12px")}>
      {[0, 1, 2, 3].map((i) => (
        <span key={i} style={css("width:2.5px;height:12px;border-radius:2px;transform-origin:bottom;background:" + color + ";animation:eq " + (0.8 + i * 0.18).toFixed(2) + "s ease-in-out " + (i * 0.12).toFixed(2) + "s infinite")} />
      ))}
    </div>
  );
}

export default function OrbitDashboard({
  showGreeting = false,
  userName = "there",
  agents,
  teams,
  stats,
  activity,
  tiktok,
}: {
  showGreeting?: boolean;
  userName?: string;
  agents?: DashboardAgent[];
  teams?: DashboardTeam[];
  stats?: DashboardStats;
  activity?: DashboardActivityItem[];
  tiktok?: DashboardTiktok;
}) {
  const [reduced, setReduced] = useState(false);
  const [greeting, setGreeting] = useState("Good morning");
  const [hubTeam, setHubTeam] = useState("all");
  const [tick, setTick] = useState(0);
  const isReal = Boolean(stats);
  const [live, setLive] = useState<{ activeAgentIds: string[]; tasksRunning: number }>({
    activeAgentIds: stats?.activeAgentIds ?? [],
    tasksRunning: stats?.tasksRunning ?? 0,
  });

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const on = () => setReduced(mq.matches); on();
    mq.addEventListener("change", on); return () => mq.removeEventListener("change", on);
  }, []);
  useEffect(() => {
    const h = new Date().getHours();
    setGreeting(h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening");
  }, []);
  useEffect(() => { const hub = setInterval(() => setTick((t) => t + 1), 3200); return () => clearInterval(hub); }, []);

  // Poll who's genuinely working right now — only on the real dashboard.
  useEffect(() => {
    if (!isReal) return;
    let cancelled = false;
    async function poll() {
      try {
        const res = await fetch("/api/workspace/status");
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) setLive({ activeAgentIds: data.activeAgentIds ?? [], tasksRunning: data.tasksRunning ?? 0 });
      } catch {
        // ignore — next poll will retry
      }
    }
    poll();
    const id = setInterval(poll, 2500);
    return () => { cancelled = true; clearInterval(id); };
  }, [isReal]);

  const AGENTS = agents ?? DEFAULT_AGENTS;
  const TEAMS = teams ?? DEFAULT_TEAMS;

  const perAgentList = stats?.perAgent ?? DEMO_STATS.perAgent;
  const acts: DashboardActivityItem[] = activity ?? DEMO_ACTIVITY;
  const paMap = new Map(perAgentList.map((p) => [p.agentId, p]));
  const maxOut = Math.max(1, ...perAgentList.map((p) => p.leadsWorked));
  const byId = (id: string) => AGENTS.find((a) => a.id === id);

  const teamPills = [{ id: "all", label: "Everyone" }, ...TEAMS.map((t) => ({ id: t.id, label: t.name }))];
  const members = hubTeam === "all"
    ? AGENTS
    : ((TEAMS.find((t) => t.id === hubTeam)?.members ?? []).map((id) => byId(id)).filter(Boolean) as DashboardAgent[]);

  const hubWorking = isReal ? live.activeAgentIds.length : DEMO_STATS.activeAgents;
  const leadsWorked = stats?.leadsWorked ?? DEMO_STATS.leadsWorked;
  const tasksRunning = isReal ? live.tasksRunning : DEMO_STATS.tasksRunning;
  const monthLabel = new Date().toLocaleString("en-US", { month: "long" }).toUpperCase();

  const kpis = [
    { value: leadsWorked, label: "Brands worked · " + monthLabel, color: "#ffb020" },
    { value: hubWorking, label: "Agents working now", color: "#00d18f" },
    { value: tasksRunning, label: "Tasks running", color: "#ff7a00" },
    { value: members.length, label: "Team members", color: "#7c5cff" },
  ];

  const actLine = (f?: DashboardActivityItem) => {
    if (!f) return "";
    const name = f.agentId ? byId(f.agentId)?.name : null;
    return name ? `${name} ${f.text}` : f.text;
  };

  return (
    <div style={css("display:flex;flex-direction:column;gap:18px;animation:fadeUp .3s ease")}>
      {tiktok && (
        <div style={css("display:flex;align-items:center;justify-content:center;gap:14px")}>
          <div style={css("padding:3px;border-radius:50%;background:var(--bg);box-shadow:0 0 24px rgba(254,44,85,.5),0 0 0 2px #fe2c55;flex:none")}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={tiktok.avatarUrl} alt="" width={64} height={64} style={{ borderRadius: "50%", display: "block", objectFit: "cover" }} />
          </div>
          <div>
            <div style={css("font-family:var(--font-display);font-weight:900;font-size:15px;color:var(--text)")}>
              {tiktok.username ? `@${tiktok.username}` : tiktok.displayName}
            </div>
            <div style={css("font-size:12px;font-weight:700;color:var(--text-muted)")}>{formatFollowers(tiktok.followerCount)} followers on TikTok</div>
          </div>
        </div>
      )}
      {showGreeting && (
        <div style={css("display:flex;align-items:baseline;gap:12px")}>
          <div style={css("font-family:var(--font-display);font-size:26px;font-weight:900;letter-spacing:-.02em;text-transform:uppercase;white-space:nowrap;color:var(--text)")}>{greeting}, {userName}!</div>
        </div>
      )}

      <div style={css("position:relative;background:radial-gradient(620px 420px at 15% 0%,rgba(255,176,32,.13),transparent 55%),radial-gradient(620px 460px at 90% 100%,rgba(124,92,255,.16),transparent 55%),var(--bg);border:1.5px solid var(--border-strong);border-radius:22px;padding:20px;overflow:hidden;box-shadow:var(--shadow-card)")}>

        {/* toolbar */}
        <div style={css("display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:18px")}>
          <div style={css("display:flex;align-items:center;gap:10px;flex-wrap:wrap")}>
            <div style={css("font-family:var(--font-display);font-size:14px;font-weight:900;text-transform:uppercase;letter-spacing:.02em;color:var(--text)")}>Your team, live</div>
            <div style={css("display:flex;gap:6px")}>
              {teamPills.map((p) => (
                <Box
                  key={p.id}
                  onClick={() => setHubTeam(p.id)}
                  style={"font-size:11px;font-weight:800;letter-spacing:.03em;text-transform:uppercase;border-radius:8px;padding:6px 12px;cursor:pointer;transition:all .12s;" +
                    (hubTeam === p.id ? "background:#ffb020;color:#050505;border:1px solid #ffb020" : "background:var(--overlay-1);color:var(--text-muted);border:1px solid var(--border-strong)")}
                  styleHover="border-color:#ffb020"
                >
                  {p.label}
                </Box>
              ))}
            </div>
          </div>
          {hubWorking > 0 && (
            <div style={css("display:inline-flex;align-items:center;gap:8px;font-size:10.5px;font-weight:800;letter-spacing:.05em;text-transform:uppercase;color:#00d18f;background:rgba(0,209,143,.1);border:1px solid rgba(0,209,143,.4);border-radius:8px;padding:6px 12px")}>
              {!reduced && <Equalizer color="#00d18f" />}
              {hubWorking} agents working now
            </div>
          )}
        </div>

        {/* KPI tiles */}
        <div style={css("display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;margin-bottom:16px")}>
          {kpis.map((k, i) => (
            <div key={k.label} style={css("position:relative;background:var(--surface);border:1px solid var(--border);border-radius:14px;padding:16px 18px;overflow:hidden")}>
              <div style={css("position:absolute;left:0;top:0;bottom:0;width:3px;background:" + k.color + ";box-shadow:0 0 12px " + k.color)} />
              <div style={css("font-family:var(--font-display);font-size:38px;font-weight:900;line-height:1;color:var(--text);animation:countUp .5s ease " + (i * 0.08).toFixed(2) + "s both")}>{k.value}</div>
              <div style={css("font-size:11px;font-weight:600;letter-spacing:.02em;color:var(--text-muted);margin-top:8px")}>{k.label}</div>
            </div>
          ))}
        </div>

        {/* agent cards */}
        {members.length === 0 && (
          <div style={css("font-size:13px;font-weight:600;color:var(--text-muted);background:var(--surface);border:1px solid var(--border);border-radius:14px;padding:20px;text-align:center")}>
            No teammates in this view yet.
          </div>
        )}
        <div style={css("display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:12px")}>
          {members.map((a, i) => {
            const type = typeByCapability[a.capabilities[0] ?? ""] || "writing";
            const ic = hubIcons[type];
            const working = isReal ? live.activeAgentIds.includes(a.id) : a.status !== "offline";
            const displayStatus: StatusKey = a.status === "offline" ? "offline" : working ? "working" : "waiting";
            const m = statusMeta(displayStatus);
            const latest = acts.find((f) => f.agentId === a.id);
            const task = latest ? latest.text : isReal ? "Ready to help" : a.task || "Ready to help";
            const out = paMap.get(a.id)?.leadsWorked ?? 0;
            const pct = Math.round((out / maxOut) * 100);
            return (
              <Box
                key={a.id}
                style={"position:relative;background:var(--surface);border:1px solid var(--border);border-radius:16px;padding:16px;overflow:hidden;cursor:default;transition:border-color .15s;animation:fadeUp .4s ease " + (i * 0.06).toFixed(2) + "s both"}
                styleHover={"border-color:" + a.color + "66"}
              >
                {/* top accent */}
                <div style={css("position:absolute;left:0;top:0;right:0;height:2px;background:" + a.color + ";box-shadow:0 0 12px " + a.color)} />

                {/* header */}
                <div style={css("display:flex;align-items:center;gap:12px;margin-bottom:14px")}>
                  <div style={css("position:relative;flex:none")}>
                    <div style={css("padding:2.5px;border-radius:50%;background:var(--bg);box-shadow:0 0 20px " + a.color + "99,0 0 0 2px " + a.color)}>
                      <div style={css(av(a, 42) + ";border:2px solid var(--bg)")}>{a.initials}</div>
                    </div>
                    <div style={css("position:absolute;top:-6px;right:-8px;width:20px;height:20px;border-radius:50%;background:var(--surface);border:1px solid var(--border-strong);display:flex;align-items:center;justify-content:center;box-shadow:0 3px 10px rgba(0,0,0,.25);animation:" + (reduced || !working ? "none" : ic[0]))}>
                      <span style={css(hubIcon(type, ic[1], 12))} />
                    </div>
                  </div>
                  <div style={css("min-width:0;flex:1")}>
                    <div style={css("font-family:var(--font-display);font-size:16px;font-weight:800;letter-spacing:-.01em;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis")}>{a.name}</div>
                    <div style={css("font-size:10.5px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;color:" + a.color + ";margin-top:2px")}>{a.role}</div>
                  </div>
                  {!reduced && working && <Equalizer color={a.color} />}
                </div>

                {/* current task */}
                <div style={css("display:flex;align-items:flex-start;gap:7px;background:var(--overlay-1);border:1px solid var(--border);border-radius:10px;padding:9px 11px;margin-bottom:12px;min-height:52px")}>
                  <span style={css("width:6px;height:6px;border-radius:50%;flex:none;margin-top:5px;background:" + m.dot + ";box-shadow:0 0 8px " + m.dot + ";animation:" + (reduced || !working ? "none" : "pulse 1.6s infinite"))} />
                  <span style={css("font-size:12.5px;line-height:1.4;color:var(--text)")} key={tick}>{task}</span>
                </div>

                {/* output */}
                <div style={css("display:flex;align-items:center;gap:10px")}>
                  <div style={css("flex:1;height:6px;border-radius:4px;background:var(--border-strong);overflow:hidden")}>
                    <div style={css("height:100%;border-radius:4px;width:" + pct + "%;background:" + a.color + ";box-shadow:0 0 10px " + a.color + ";animation:barGrow 1s ease " + (i * 0.06).toFixed(2) + "s both")} />
                  </div>
                  <div style={css("font-family:var(--font-display);font-size:12px;font-weight:800;color:var(--text);white-space:nowrap")}>{out} <span style={css("color:var(--text-muted);font-weight:600")}>{out === 1 ? "deal" : "deals"}</span></div>
                </div>
              </Box>
            );
          })}
        </div>

        {/* live activity feed */}
        <div style={css("margin-top:16px;border-top:1px solid var(--border);padding-top:14px;display:flex;flex-direction:column;gap:8px")}>
          <div style={css("font-size:10px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--text-muted)")}>Latest activity</div>
          {acts.length === 0 && <div style={css("font-size:12px;color:var(--text-muted)")}>Nothing yet — your team's work will show up here.</div>}
          {acts.slice(0, 2).map((f, i) => (
            <div key={i} style={css("display:flex;align-items:center;gap:9px;animation:fadeUp .4s ease " + (i * 0.1).toFixed(2) + "s both")}>
              <span style={css("width:6px;height:6px;border-radius:50%;flex:none;background:" + (i === 0 ? "#ffb020" : "var(--text-muted)") + ";" + (i === 0 ? "box-shadow:0 0 8px #ffb020;animation:" + (reduced ? "none" : "pulse 1.6s infinite") : ""))} />
              <span style={css("font-size:13px;font-weight:" + (i === 0 ? "700" : "500") + ";color:" + (i === 0 ? "var(--text)" : "var(--text-muted)") + ";white-space:nowrap;overflow:hidden;text-overflow:ellipsis")}>{actLine(f)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
