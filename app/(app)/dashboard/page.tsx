import OrbitDashboard from "@/components/OrbitDashboard";
import { currentUser } from "@/lib/auth/currentUser";
import { listAgents } from "@/lib/agents/store";
import { listTeams } from "@/lib/teams/store";

export default async function DashboardPage() {
  const user = await currentUser();
  const firstName = (user?.name || user?.email?.split("@")[0] || "there").split(" ")[0];
  const [agents, teams] = user ? await Promise.all([listAgents(user.userId), listTeams(user.userId)]) : [undefined, undefined];

  return <OrbitDashboard showGreeting userName={firstName} agents={agents} teams={teams} />;
}
