import "server-only";
import { auth, currentUser as clerkCurrentUser } from "@clerk/nextjs/server";
import { ensureUser } from "@/lib/db/users";

export async function currentUser() {
  const { userId } = await auth();
  if (!userId) return null;

  const clerkUser = await clerkCurrentUser();
  const email = clerkUser?.primaryEmailAddress?.emailAddress ?? null;
  const name = clerkUser?.fullName ?? null;

  await ensureUser(userId, email, name);

  return { userId, email, name };
}
