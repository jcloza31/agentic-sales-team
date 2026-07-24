import OrbitDashboard from "@/components/OrbitDashboard";
import { currentUser } from "@/lib/auth/currentUser";
import { listAgents } from "@/lib/agents/store";
import { listTeams } from "@/lib/teams/store";
import { getWorkspaceStats } from "@/lib/workspace/stats";
import { listActivity } from "@/lib/activity/store";
import { getFreshTiktokAccount } from "@/lib/tiktok/store";

export default async function DashboardPage() {
  const user = await currentUser();
  const firstName = (user?.name || user?.email?.split("@")[0] || "there").split(" ")[0];

  if (!user) {
    return <OrbitDashboard showGreeting userName={firstName} />;
  }

  const [agents, teams, stats, activityRows, tiktok] = await Promise.all([
    listAgents(user.userId),
    listTeams(user.userId),
    getWorkspaceStats(user.userId),
    listActivity(user.userId, 10),
    getFreshTiktokAccount(user.userId),
  ]);

  const activity = activityRows.map((a) => ({ agentId: a.agentId, text: a.text }));

  return (
    <OrbitDashboard
      showGreeting
      userName={firstName}
      agents={agents}
      teams={teams}
      stats={stats}
      activity={activity}
      tiktok={tiktok ?? undefined}
    />
  );
}
