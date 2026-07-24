export type MeetingKind = "call" | "shoot" | "deliverable";

export interface Meeting {
  id: string;
  userId: string;
  agentId: string | null;
  leadId: string | null;
  title: string;
  kind: MeetingKind;
  whenAt: Date;
  whenLabel: string;
  createdAt: Date;
}
