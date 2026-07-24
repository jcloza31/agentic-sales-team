import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth/currentUser";
import { getProfile, isProfileComplete } from "@/lib/profile/store";
import { isDbConfigured } from "@/lib/db";
import OnboardingWizard from "@/components/OnboardingWizard";

export default async function OnboardingPage() {
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  const profile = await getProfile(user.userId);
  if (isDbConfigured() && isProfileComplete(profile)) {
    redirect("/dashboard");
  }

  return <OnboardingWizard initial={profile} />;
}
