// Representative "looks alive" demo numbers for the dashboard showcase,
// used before real accounts/agents/activity exist. Replaced with real data later.
export const DEMO_STATS = {
  activeAgents: 4,
  tasksRunning: 6,
  leadsWorked: 18,
  perAgent: [
    { agentId: "discovery", leadsWorked: 5 },
    { agentId: "outreach", leadsWorked: 7 },
    { agentId: "proposal", leadsWorked: 3 },
    { agentId: "followup", leadsWorked: 2 },
    { agentId: "scheduler", leadsWorked: 1 },
  ],
};

export const DEMO_ACTIVITY: { agentId: string; text: string }[] = [
  { agentId: "scheduler", text: "booked a call with Solstice Eyewear" },
  { agentId: "outreach", text: "drafted a pitch for Glow Skincare" },
  { agentId: "discovery", text: "found 3 new brands in the fitness niche" },
  { agentId: "proposal", text: "sent a proposal to Bloom Coffee" },
];
