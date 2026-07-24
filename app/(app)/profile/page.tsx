import { currentUser } from "@/lib/auth/currentUser";
import { getProfile } from "@/lib/profile/store";
import { EMPTY_PROFILE } from "@/lib/profile/types";
import ProfileForm from "@/components/ProfileForm";

export default async function ProfilePage() {
  const user = await currentUser();
  const profile = user ? await getProfile(user.userId) : EMPTY_PROFILE;

  return <ProfileForm initial={profile} />;
}
