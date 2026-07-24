import { currentUser } from "@/lib/auth/currentUser";
import { listLeads, listPendingLeads } from "@/lib/leads/store";
import { listAgents } from "@/lib/agents/store";
import { listOutreachDraftsForUser, type OutreachDraft } from "@/lib/outreach/store";
import { listProposalsForUser, type Proposal } from "@/lib/proposals/store";
import DealsBoard from "@/components/DealsBoard";

export default async function DealsPage() {
  const user = await currentUser();
  const [leadsList, pendingList, agentsList, outreachList, proposalsList] = user
    ? await Promise.all([
        listLeads(user.userId),
        listPendingLeads(user.userId),
        listAgents(user.userId),
        listOutreachDraftsForUser(user.userId),
        listProposalsForUser(user.userId),
      ])
    : [[], [], [], [], []];

  const outreachByLead: Record<string, OutreachDraft[]> = {};
  for (const d of outreachList) {
    (outreachByLead[d.leadId] ??= []).push(d);
  }

  const proposalsByLead: Record<string, Proposal[]> = {};
  for (const p of proposalsList) {
    (proposalsByLead[p.leadId] ??= []).push(p);
  }

  return (
    <DealsBoard
      initialLeads={leadsList}
      initialPending={pendingList}
      agents={agentsList}
      outreachByLead={outreachByLead}
      proposalsByLead={proposalsByLead}
    />
  );
}
