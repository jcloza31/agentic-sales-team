import { css } from "@/lib/css";

export default function ComingSoon({ title, description }: { title: string; description: string }) {
  return (
    <div style={css("max-width:640px")}>
      <div style={css("display:inline-flex;align-items:center;gap:6px;font-family:var(--font-display);font-size:11px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#050505;background:#ffb020;border-radius:8px;padding:6px 14px;margin-bottom:18px")}>
        Coming soon
      </div>
      <h1 style={css("font-family:var(--font-display);font-weight:900;font-size:clamp(28px,4vw,40px);color:var(--text);margin:0 0 12px;text-transform:uppercase")}>{title}</h1>
      <p style={css("font-size:16px;line-height:1.6;color:var(--text-muted)")}>{description}</p>
    </div>
  );
}
