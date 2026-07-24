import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getActiveJobStatus } from "@/lib/workspace/stats";

// Deliberately cheap and auth-only (no ensureUser upsert) — this gets
// polled every couple seconds by the dashboard to catch agents mid-work.
export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ activeAgentIds: [], tasksRunning: 0 }, { status: 401 });
  const status = await getActiveJobStatus(userId);
  return NextResponse.json(status);
}
