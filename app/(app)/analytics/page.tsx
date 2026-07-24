import { currentUser } from "@/lib/auth/currentUser";
import { listAgents } from "@/lib/agents/store";
import { getWorkspaceStats, getDailyActivityCounts } from "@/lib/workspace/stats";
import { css } from "@/lib/css";

export default async function AnalyticsPage() {
  const user = await currentUser();

  if (!user) {
    return (
      <div>
        <h1 style={css("font-family:var(--font-display);font-weight:900;font-size:clamp(26px,4vw,36px);color:var(--text);margin:0 0 6px;text-transform:uppercase")}>Analytics</h1>
        <p style={css("font-size:15px;color:var(--text-muted)")}>Sign in to see your real numbers.</p>
      </div>
    );
  }

  const [agents, stats, daily] = await Promise.all([
    listAgents(user.userId),
    getWorkspaceStats(user.userId),
    getDailyActivityCounts(user.userId, 14),
  ]);

  const monthLabel = new Date().toLocaleString("en-US", { month: "long" }).toUpperCase();
  const totalActions = daily.reduce((sum, d) => sum + d.count, 0);
  const maxDay = Math.max(1, ...daily.map((d) => d.count));

  const ranking = agents
    .map((a) => ({ agent: a, count: stats.perAgent.find((p) => p.agentId === a.id)?.leadsWorked ?? 0 }))
    .sort((a, b) => b.count - a.count);
  const maxRank = Math.max(1, ...ranking.map((r) => r.count));

  const kpis = [
    { value: stats.leadsWorked, label: "Brands worked · " + monthLabel, color: "#ffb020" },
    { value: stats.tasksRunning, label: "Tasks running now", color: "#00d18f" },
    { value: totalActions, label: "Actions, last 14 days", color: "#7c5cff" },
    { value: agents.length, label: "Team members", color: "#38b6ff" },
  ];

  return (
    <div>
      <h1 style={css("font-family:var(--font-display);font-weight:900;font-size:clamp(26px,4vw,36px);color:var(--text);margin:0 0 6px;text-transform:uppercase")}>Analytics</h1>
      <p style={css("font-size:15px;color:var(--text-muted);margin:0 0 24px")}>Real numbers from your real pipeline.</p>

      <div style={css("display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;margin-bottom:32px")}>
        {kpis.map((k) => (
          <div key={k.label} style={css("position:relative;background:var(--surface);border:1px solid var(--border);border-radius:14px;padding:16px 18px;overflow:hidden")}>
            <div style={css("position:absolute;left:0;top:0;bottom:0;width:3px;background:" + k.color + ";box-shadow:0 0 12px " + k.color)} />
            <div style={css("font-family:var(--font-display);font-size:34px;font-weight:900;line-height:1;color:var(--text)")}>{k.value}</div>
            <div style={css("font-size:11px;font-weight:600;letter-spacing:.02em;color:var(--text-muted);margin-top:8px")}>{k.label}</div>
          </div>
        ))}
      </div>

      <div style={css("background:var(--surface);border:1px solid var(--border);border-radius:16px;padding:22px;margin-bottom:24px")}>
        <div style={css("font-family:var(--font-display);font-size:13px;font-weight:800;letter-spacing:.05em;text-transform:uppercase;color:var(--text-muted);margin-bottom:18px")}>
          Activity, last 14 days
        </div>
        {totalActions === 0 ? (
          <div style={css("font-size:13px;color:var(--text-muted);text-align:center;padding:20px 0")}>
            Nothing logged yet — draft a pitch, write a brief, or book a call and it'll show up here.
          </div>
        ) : (
          <div style={css("display:flex;align-items:flex-end;gap:6px;height:140px")}>
            {daily.map((d) => (
              <div key={d.date} style={css("flex:1;display:flex;flex-direction:column;align-items:center;gap:6px;height:100%;justify-content:flex-end")}>
                <div
                  title={`${d.count} on ${d.label}`}
                  style={css(
                    "width:100%;max-width:28px;border-radius:4px 4px 0 0;background:#ffb020;box-shadow:0 0 8px rgba(255,176,32,.4);min-height:2px;height:" +
                      Math.round((d.count / maxDay) * 100) +
                      "%"
                  )}
                />
                <div style={css("font-size:9.5px;color:var(--text-muted);white-space:nowrap")}>{d.label[0]}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={css("background:var(--surface);border:1px solid var(--border);border-radius:16px;padding:22px")}>
        <div style={css("font-family:var(--font-display);font-size:13px;font-weight:800;letter-spacing:.05em;text-transform:uppercase;color:var(--text-muted);margin-bottom:16px")}>
          Output by agent
        </div>
        {ranking.length === 0 ? (
          <div style={css("font-size:13px;color:var(--text-muted)")}>No agents yet.</div>
        ) : (
          <div style={css("display:flex;flex-direction:column;gap:14px")}>
            {ranking.map((r, i) => (
              <div key={r.agent.id} style={css("display:flex;align-items:center;gap:12px")}>
                <div style={css("font-family:var(--font-display);font-weight:800;font-size:13px;color:var(--text-muted);width:18px;flex:none")}>{i + 1}</div>
                <div style={css("font-size:13.5px;font-weight:700;color:var(--text);width:130px;flex:none;white-space:nowrap;overflow:hidden;text-overflow:ellipsis")}>{r.agent.name}</div>
                <div style={css("flex:1;height:8px;border-radius:4px;background:var(--border-strong);overflow:hidden")}>
                  <div style={css("height:100%;border-radius:4px;width:" + Math.round((r.count / maxRank) * 100) + "%;background:" + r.agent.color + ";box-shadow:0 0 8px " + r.agent.color)} />
                </div>
                <div style={css("font-family:var(--font-display);font-weight:800;font-size:13px;color:var(--text);width:70px;flex:none;text-align:right")}>
                  {r.count} {r.count === 1 ? "deal" : "deals"}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
