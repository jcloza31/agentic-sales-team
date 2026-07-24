import { auth } from "@clerk/nextjs/server";
import { css } from "@/lib/css";
import { getUserRow } from "@/lib/db/users";
import NotificationsForm from "@/components/NotificationsForm";
import ThemeToggle from "@/components/ThemeToggle";
import { DEFAULT_NOTIFICATIONS, type NotificationPrefs } from "@/lib/settings/types";

export default async function SettingsPage() {
  const { userId } = await auth();
  const row = userId ? await getUserRow(userId) : null;
  const stored = (row?.notifications ?? {}) as Partial<NotificationPrefs>;
  const initial: NotificationPrefs = { ...DEFAULT_NOTIFICATIONS, ...stored };

  return (
    <div style={css("max-width:640px")}>
      <h1 style={css("font-family:var(--font-display);font-weight:900;font-size:clamp(26px,4vw,36px);color:var(--text);margin:0 0 6px;text-transform:uppercase")}>Settings</h1>
      <p style={css("font-size:15px;color:var(--text-muted);margin:0 0 24px")}>Choose what you want to hear about.</p>

      <div style={css("display:flex;align-items:center;justify-content:space-between;gap:16px;background:var(--surface);border:1px solid var(--border);border-radius:14px;padding:18px 20px;margin-bottom:28px")}>
        <div>
          <div style={css("font-size:15px;font-weight:700;color:var(--text)")}>Appearance</div>
          <div style={css("font-size:13px;color:var(--text-muted);margin-top:2px")}>Switch between light and dark mode.</div>
        </div>
        <ThemeToggle size={40} />
      </div>

      <NotificationsForm initial={initial} />
    </div>
  );
}
