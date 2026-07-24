"use server";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { createMeeting } from "./store";
import { parseMeetingTime, parseMeetingRequest } from "@/lib/ai/meetingTime";
import { listLeads } from "@/lib/leads/store";

interface ActionResult {
  ok: boolean;
  error?: string;
}

function findLeadByName<T extends { id: string; name: string; company: string | null }>(leads: T[], query: string): T | null {
  const q = query.trim().toLowerCase();
  if (!q) return null;
  return (
    leads.find((l) => {
      const name = l.name.toLowerCase();
      const company = l.company?.toLowerCase() ?? "";
      return name.includes(q) || (company && company.includes(q)) || q.includes(name) || (company && q.includes(company));
    }) ?? null
  );
}

// "book a call with Acme next Tuesday at 2pm" — extracts both the brand
// and the time in one go.
export async function bookMeetingFreeformAction(text: string): Promise<ActionResult> {
  const { userId } = await auth();
  if (!userId) return { ok: false, error: "Not signed in" };

  const parsed = await parseMeetingRequest(text);
  if (!parsed) {
    return { ok: false, error: "Couldn't understand that — try the manual fields below." };
  }

  const leads = await listLeads(userId);
  const lead = parsed.brandName ? findLeadByName(leads, parsed.brandName) : null;
  const title = lead ? `Call with ${lead.name}` : parsed.brandName ? `Call with ${parsed.brandName}` : "Brand call";

  await createMeeting(userId, {
    title,
    kind: "call",
    whenAt: new Date(parsed.iso),
    whenLabel: parsed.label,
    leadId: lead?.id ?? null,
  });

  revalidatePath("/calendar");
  return { ok: true };
}

export async function bookMeetingManualAction(input: { title: string; leadId?: string | null; whenAt: string; whenLabel: string }): Promise<ActionResult> {
  const { userId } = await auth();
  if (!userId) return { ok: false, error: "Not signed in" };

  const d = new Date(input.whenAt);
  if (isNaN(d.getTime())) return { ok: false, error: "That date/time doesn't look right." };

  await createMeeting(userId, {
    title: input.title,
    kind: "call",
    whenAt: d,
    whenLabel: input.whenLabel,
    leadId: input.leadId ?? null,
  });

  revalidatePath("/calendar");
  return { ok: true };
}

// Booking straight from a brand — only the time needs parsing.
export async function bookMeetingForLeadAction(leadId: string, text: string): Promise<ActionResult> {
  const { userId } = await auth();
  if (!userId) return { ok: false, error: "Not signed in" };

  const parsed = await parseMeetingTime(text);
  if (!parsed) {
    return { ok: false, error: "Couldn't understand that time — try the Calendar page's date/time picker instead." };
  }

  const leads = await listLeads(userId);
  const lead = leads.find((l) => l.id === leadId);

  await createMeeting(userId, {
    title: lead ? `Call with ${lead.name}` : "Brand call",
    kind: "call",
    whenAt: new Date(parsed.iso),
    whenLabel: parsed.label,
    leadId,
  });

  revalidatePath("/calendar");
  revalidatePath("/deals");
  return { ok: true };
}
