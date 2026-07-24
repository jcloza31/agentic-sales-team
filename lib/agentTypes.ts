export type CapabilityId = "scrape" | "research" | "outreach" | "proposal" | "follow-up" | "book-meeting";

export interface Capability {
  id: CapabilityId;
  label: string;
  jobKind: string;
}

export const CAPABILITIES: Capability[] = [
  { id: "scrape", label: "Research", jobKind: "scrape" },
  { id: "research", label: "Brand brief", jobKind: "research" },
  { id: "outreach", label: "Initial outreach", jobKind: "outreach" },
  { id: "proposal", label: "Proposals", jobKind: "proposal" },
  { id: "follow-up", label: "Follow-ups", jobKind: "follow-up" },
  { id: "book-meeting", label: "Scheduling", jobKind: "book-meeting" },
];

export interface AgentType {
  id: string;
  role: string;
  capability: CapabilityId;
  name: string;
  initials: string;
  color: string;
  task: string;
}

// The premade "Deal Team" — every creator's five starter agents.
// Names/initials/colors are friendly placeholders the creator can rename later.
export const AGENT_TYPES: AgentType[] = [
  { id: "discovery", role: "Research", capability: "scrape", name: "Remy Rivera", initials: "RR", color: "#00d18f", task: "Scanning wellness brands for sponsorship fit…" },
  { id: "outreach", role: "Initial Outreach", capability: "outreach", name: "Otis Vance", initials: "OV", color: "#ff7a00", task: "Drafting a pitch for Glow Skincare…" },
  { id: "proposal", role: "Proposal", capability: "proposal", name: "Priya Shah", initials: "PS", color: "#ffb020", task: "Pricing a 3-post bundle for Bloom Coffee…" },
  { id: "followup", role: "Follow-up", capability: "follow-up", name: "Faye Cole", initials: "FC", color: "#7c5cff", task: "Following up with Verve Apparel…" },
  { id: "scheduler", role: "Scheduler", capability: "book-meeting", name: "Sam Okafor", initials: "SO", color: "#38b6ff", task: "Booking a call with Solstice Eyewear…" },
];

export interface TeamTemplate {
  id: string;
  name: string;
  members: string[];
}

export const TEAM_TEMPLATES: TeamTemplate[] = [
  { id: "deal-team", name: "Deal Team", members: AGENT_TYPES.map((a) => a.id) },
];
