import { currentUser } from "@/lib/auth/currentUser";
import { listAgents } from "@/lib/agents/store";
import { listTeams } from "@/lib/teams/store";
import AgentsBoard from "@/components/AgentsBoard";

export default async function AgentsPage() {
  const user = await currentUser();
  const [agentsList, teamsList] = user ? await Promise.all([listAgents(user.userId), listTeams(user.userId)]) : [[], []];

  return <AgentsBoard initialAgents={agentsList} initialTeams={teamsList} />;
}
