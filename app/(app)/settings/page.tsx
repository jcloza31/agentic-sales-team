import { auth } from "@clerk/nextjs/server";
import { css } from "@/lib/css";
import { getUserRow } from "@/lib/db/users";
import NotificationsForm from "@/components/NotificationsForm";
import ThemeToggle from "@/components/ThemeToggle";
import { DEFAULT_NOTIFICATIONS, type NotificationPrefs } from "@/lib/settings/types";
import { getTiktokAccount } from "@/lib/tiktok/store";
import { isTiktokConfigured } from "@/lib/tiktok/oauth";
import { formatFollowers } from "@/lib/tiktok/format";

const TIKTOK_MESSAGES: Record<string, string> = {
  connected: "TikTok connected — your photo and follower count are now live.",
  error: "Something went wrong connecting TikTok — try again.",
  not_configured: "TikTok isn't set up on this site yet.",
  disconnected: "TikTok disconnected.",
};

export default async function SettingsPage({
  searchParams,
}: {
  searchParams?: Promise<{ tiktok?: string }>;
}) {
  const { userId } = await auth();
  const row = userId ? await getUserRow(userId) : null;
  const stored = (row?.notifications ?? {}) as Partial<NotificationPrefs>;
  const initial: NotificationPrefs = { ...DEFAULT_NOTIFICATIONS, ...stored };

  const tiktok = userId ? await getTiktokAccount(userId) : null;
  const tiktokReady = isTiktokConfigured();
  const params = await searchParams;
  const tiktokMessage = params?.tiktok ? TIKTOK_MESSAGES[params.tiktok] : null;

  return (
    <div style={css("max-width:640px")}>
      <h1 style={css("font-family:var(--font-display);font-weight:900;font-size:clamp(26px,4vw,36px);color:var(--text);margin:0 0 6px;text-transform:uppercase")}>Settings</h1>
      <p style={css("font-size:15px;color:var(--text-muted);margin:0 0 24px")}>Choose what you want to hear about.</p>

      <div style={css("display:flex;align-items:center;justify-content:space-between;gap:16px;background:var(--surface);border:1px solid var(--border);border-radius:14px;padding:18px 20px;margin-bottom:20px")}>
        <div>
          <div style={css("font-size:15px;font-weight:700;color:var(--text)")}>Appearance</div>
          <div style={css("font-size:13px;color:var(--text-muted);margin-top:2px")}>Switch between light and dark mode.</div>
        </div>
        <ThemeToggle size={40} />
      </div>

      <div style={css("background:var(--surface);border:1px solid var(--border);border-radius:14px;padding:18px 20px;margin-bottom:28px")}>
        <div style={css("display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap")}>
          <div>
            <div style={css("font-size:15px;font-weight:700;color:var(--text)")}>TikTok</div>
            <div style={css("font-size:13px;color:var(--text-muted);margin-top:2px")}>Your profile photo and follower count on the dashboard.</div>
          </div>
          {tiktok ? (
            <form action="/api/tiktok/disconnect" method="post">
              <button
                type="submit"
                style={css("font-family:var(--font-display);font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:.02em;color:var(--text);border:1.5px solid var(--border-strong);border-radius:10px;padding:9px 16px;background:transparent;cursor:pointer")}
              >
                Disconnect
              </button>
            </form>
          ) : tiktokReady ? (
            <a
              href="/api/tiktok/connect"
              style={css("font-family:var(--font-display);font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:.02em;color:#ffffff;border-radius:10px;padding:9px 16px;background:#fe2c55")}
            >
              Connect TikTok
            </a>
          ) : (
            <div style={css("font-size:12.5px;font-weight:600;color:var(--text-muted)")}>Available once your site is live</div>
          )}
        </div>

        {tiktok && (
          <div style={css("display:flex;align-items:center;gap:12px;margin-top:16px;padding-top:16px;border-top:1px solid var(--border)")}>
            <div style={css("padding:2.5px;border-radius:50%;background:var(--bg);box-shadow:0 0 0 2px #fe2c55")}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={tiktok.avatarUrl} alt="" width={44} height={44} style={{ borderRadius: "50%", display: "block", objectFit: "cover" }} />
            </div>
            <div>
              <div style={css("font-size:14px;font-weight:700;color:var(--text)")}>{tiktok.username ? `@${tiktok.username}` : tiktok.displayName}</div>
              <div style={css("font-size:12.5px;color:var(--text-muted);margin-top:1px")}>{formatFollowers(tiktok.followerCount)} followers</div>
            </div>
          </div>
        )}

        {tiktokMessage && (
          <div style={css("font-size:12.5px;font-weight:600;color:var(--text-muted);margin-top:14px")}>{tiktokMessage}</div>
        )}
      </div>

      <NotificationsForm initial={initial} />
    </div>
  );
}
