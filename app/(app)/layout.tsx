import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import AppFrame from "@/components/AppFrame";
import { currentUser } from "@/lib/auth/currentUser";
import { getProfile, isProfileComplete } from "@/lib/profile/store";
import { isDbConfigured } from "@/lib/db";

export default async function AppGroupLayout({ children }: { children: ReactNode }) {
  const user = await currentUser();
  const displayName = user?.name || (user?.email ? user.email.split("@")[0] : "there");

  // Gate the app behind onboarding until the essentials are filled.
  // Skipped entirely with no database configured — nothing to gate against.
  if (user && isDbConfigured()) {
    const profile = await getProfile(user.userId);
    if (!isProfileComplete(profile)) {
      redirect("/onboarding");
    }
  }

  return <AppFrame userName={displayName}>{children}</AppFrame>;
}
