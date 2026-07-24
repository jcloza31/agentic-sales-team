"use client";
import { useEffect, useState, type ReactNode, type SVGProps } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignOutButton } from "@clerk/nextjs";
import { css } from "@/lib/css";
import ThemeToggle from "@/components/ThemeToggle";
import NotificationsBell, { type BellItem, type BellAgent } from "@/components/NotificationsBell";

const NAV: { href: string; label: string; icon: string }[] = [
  { href: "/dashboard", label: "Dashboard", icon: "dashboard" },
  { href: "/deals", label: "Deals", icon: "deals" },
  { href: "/agents", label: "Agents", icon: "agents" },
  { href: "/chat", label: "Chat", icon: "chat" },
  { href: "/calendar", label: "Calendar", icon: "calendar" },
  { href: "/analytics", label: "Analytics", icon: "analytics" },
  { href: "/profile", label: "Profile", icon: "profile" },
  { href: "/settings", label: "Settings", icon: "settings" },
];

function Icon({ type, ...rest }: { type: string } & SVGProps<SVGSVGElement>) {
  const common = { width: 18, height: 18, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, ...rest };
  switch (type) {
    case "dashboard":
      return <svg {...common}><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /></svg>;
    case "deals":
      return <svg {...common}><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>;
    case "agents":
      return <svg {...common}><circle cx="9" cy="8" r="3.2" /><path d="M2.5 20.5v-1.2a5 5 0 0 1 5-5h3a5 5 0 0 1 5 5v1.2" /><circle cx="18" cy="8.5" r="2.3" /><path d="M21.5 20.5v-1a4 4 0 0 0-2.8-3.8" /></svg>;
    case "chat":
      return <svg {...common}><path d="M21 11.5a8.4 8.4 0 0 1-8.4 8.4c-1.3 0-2.6-.3-3.7-.9L3 21l2-5.9a8.4 8.4 0 1 1 16-3.6Z" /></svg>;
    case "calendar":
      return <svg {...common}><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 10h18" /></svg>;
    case "analytics":
      return <svg {...common}><path d="M4 20V11" /><path d="M11 20V4" /><path d="M18 20v-7" /><path d="M2 20h20" /></svg>;
    case "profile":
      return <svg {...common}><circle cx="12" cy="8" r="4" /><path d="M4 20.5c0-4 3.6-6.2 8-6.2s8 2.2 8 6.2" /></svg>;
    case "settings":
      return <svg {...common}><circle cx="12" cy="12" r="3.2" /><path d="M19.4 14.5a1.8 1.8 0 0 0 .36 2l.04.04a2.2 2.2 0 1 1-3.1 3.1l-.04-.04a1.8 1.8 0 0 0-2-.36 1.8 1.8 0 0 0-1.1 1.66V21a2.2 2.2 0 0 1-4.4 0v-.1a1.8 1.8 0 0 0-1.18-1.65 1.8 1.8 0 0 0-2 .36l-.04.04a2.2 2.2 0 1 1-3.1-3.1l.04-.04a1.8 1.8 0 0 0 .36-2 1.8 1.8 0 0 0-1.66-1.1H3a2.2 2.2 0 0 1 0-4.4h.1A1.8 1.8 0 0 0 4.75 7.6a1.8 1.8 0 0 0-.36-2l-.04-.04a2.2 2.2 0 1 1 3.1-3.1l.04.04a1.8 1.8 0 0 0 2 .36H9.6A1.8 1.8 0 0 0 10.7 1.2V1a2.2 2.2 0 0 1 4.4 0v.1a1.8 1.8 0 0 0 1.1 1.65 1.8 1.8 0 0 0 2-.36l.04-.04a2.2 2.2 0 1 1 3.1 3.1l-.04.04a1.8 1.8 0 0 0-.36 2v.09A1.8 1.8 0 0 0 22.6 9.6H23a2.2 2.2 0 0 1 0 4.4h-.1a1.8 1.8 0 0 0-1.5 1.1Z" /></svg>;
    default:
      return null;
  }
}

export default function AppFrame({
  userName,
  notifications,
  agents,
  children,
}: {
  userName: string;
  notifications: BellItem[];
  agents: BellAgent[];
  children: ReactNode;
}) {
  const pathname = usePathname();
  const [isMobile, setIsMobile] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 880);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const sidebar = (
    <aside
      style={css(
        "width:232px;flex:none;background:var(--surface);border-right:1px solid var(--border);display:flex;flex-direction:column;padding:20px 14px;height:100dvh;position:sticky;top:0;z-index:20;" +
          (isMobile ? "position:fixed;left:0;top:0;transition:transform .2s ease;transform:translateX(" + (mobileOpen ? "0" : "-100%") + ")" : "")
      )}
    >
      <Link href="/dashboard" style={css("font-family:var(--font-display);font-weight:900;font-size:16px;color:var(--text);letter-spacing:-.02em;text-transform:uppercase;padding:6px 10px;margin-bottom:20px;display:block")}>
        Creator<span style={css("color:var(--accent-text)")}>Manager</span>
      </Link>

      <nav style={css("display:flex;flex-direction:column;gap:3px;flex:1")}>
        {NAV.map((item) => {
          const active = pathname === item.href || pathname?.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              style={css(
                "display:flex;align-items:center;gap:11px;padding:9px 12px;border-radius:10px;font-size:14px;font-weight:700;text-decoration:none;transition:background .12s;" +
                  (active ? "background:#ffb020;color:#050505" : "color:var(--text-muted)")
              )}
            >
              <Icon type={item.icon} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div style={css("border-top:1px solid var(--border);padding-top:14px;display:flex;align-items:center;justify-content:space-between;gap:8px")}>
        <span style={css("font-size:13px;font-weight:700;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0")}>{userName}</span>
        <div style={css("display:flex;align-items:center;gap:6px;flex:none")}>
          <ThemeToggle size={32} />
          <SignOutButton redirectUrl="/">
            <button
              style={css("font-family:var(--font-display);font-size:10.5px;font-weight:800;letter-spacing:.03em;text-transform:uppercase;color:var(--text);background:var(--overlay-2);border:1px solid var(--border-strong);border-radius:8px;padding:7px 11px;cursor:pointer;flex:none")}
            >
              Log out
            </button>
          </SignOutButton>
        </div>
      </div>
    </aside>
  );

  return (
    <div style={css("min-height:100dvh;background:var(--bg);display:flex")}>
      {sidebar}
      {isMobile && mobileOpen && (
        <div onClick={() => setMobileOpen(false)} style={css("position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:15")} />
      )}

      <div style={css("flex:1;min-width:0;display:flex;flex-direction:column")}>
        <header style={css("display:flex;align-items:center;gap:14px;padding:16px 24px;border-bottom:1px solid var(--border)")}>
          {isMobile && (
            <button
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
              style={css("background:none;border:1px solid var(--border-strong);border-radius:8px;color:var(--text);padding:8px 10px;cursor:pointer;flex:none")}
            >
              ☰
            </button>
          )}
          <div style={css("position:relative;max-width:360px;width:100%")}>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search deals, agents, brands…"
              style={css("width:100%;background:var(--input-bg);border:1px solid var(--border);border-radius:10px;color:var(--text);font-size:13px;padding:9px 12px 9px 34px;outline:none")}
            />
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)" }}>
              <circle cx="11" cy="11" r="7" />
              <path d="m21 21-4.3-4.3" />
            </svg>
          </div>
          <div style={css("margin-left:auto")}>
            <NotificationsBell initialItems={notifications} agents={agents} />
          </div>
        </header>
        <main style={css("flex:1;padding:28px")}>{children}</main>
      </div>
    </div>
  );
}
