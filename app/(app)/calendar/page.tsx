import { currentUser } from "@/lib/auth/currentUser";
import { listMeetings } from "@/lib/meetings/store";
import { listLeads } from "@/lib/leads/store";
import CalendarBoard from "@/components/CalendarBoard";

export default async function CalendarPage() {
  const user = await currentUser();
  const [meetings, leads] = user ? await Promise.all([listMeetings(user.userId), listLeads(user.userId)]) : [[], []];

  return <CalendarBoard initialMeetings={meetings} leads={leads} />;
}
