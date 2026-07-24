export type LeadStatus = "new" | "pitched" | "negotiating" | "replied" | "booked";
export type LeadReview = "accepted" | "pending";
export type LeadSource = "manual" | "scrape";

export interface LeadResearch {
  summary: string;
  priorities: string[];
  hooks: string[];
  angle: string;
}

export interface Lead {
  id: string;
  userId: string;
  agentId: string | null;
  name: string;
  title: string | null;
  company: string | null;
  email: string | null;
  status: LeadStatus;
  score: number | null;
  source: LeadSource;
  review: LeadReview;
  profileUrl: string | null;
  website: string | null;
  platform: string | null;
  research: LeadResearch | null;
  createdAt: Date;
  updatedAt: Date;
}

export const STAGES: { id: LeadStatus; label: string }[] = [
  { id: "new", label: "New" },
  { id: "pitched", label: "Pitched" },
  { id: "negotiating", label: "Negotiating" },
  { id: "replied", label: "Replied" },
  { id: "booked", label: "Booked" },
];
