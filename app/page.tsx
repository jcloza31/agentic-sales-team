import { css } from "@/lib/css";
import OrbitDashboard from "@/components/OrbitDashboard";
import ThemeToggle from "@/components/ThemeToggle";

const FEATURES = [
  { color: "#00d18f", label: "Research", title: "Finds brands that fit your niche", body: "Your Research agent scans the web for brands that already sponsor creators like you, and drops them in a queue for your approval." },
  { color: "#ff7a00", label: "Outreach", title: "Pitches in your own voice", body: "A personalized, brand-specific pitch — a polished email or a short DM — written as if you wrote it yourself." },
  { color: "#ffb020", label: "Proposals", title: "Prices the deal for you", body: "A scoped, priced proposal grounded in your audience and your rate floor — no guesswork, no lowballing." },
  { color: "#7c5cff", label: "Follow-up", title: "Nudges brands that went quiet", body: "A short, friendly follow-up that builds on your first pitch, so good leads don't die in an inbox." },
  { color: "#38b6ff", label: "Scheduling", title: "Books the call", body: "Say it in plain English — \"book a call with Acme next Tuesday at 2pm\" — and it lands on your calendar." },
  { color: "#ffb020", label: "Dashboard", title: "Watch your team work, live", body: "The signature dashboard above — every agent, every deal, working in real time." },
];

const HOW_IT_WORKS = [
  "Fill in your Media Kit — your niche, audience, and rates.",
  "Your team finds and researches brands that fit.",
  "They pitch, propose, and follow up — in your voice.",
  "You approve the big moments; calls land on your calendar.",
];

const MARQUEE = ["FIND BRANDS", "PITCH IN YOUR VOICE", "PRICE THE DEAL", "FOLLOW UP", "BOOK THE CALL", "CLOSE MORE DEALS"];

const chipStyle = "display:inline-flex;align-items:center;gap:6px;font-family:var(--font-display);font-size:12px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#050505;background:#ffb020;border-radius:8px;padding:7px 15px";
const ctaPillStyle = "display:inline-block;font-family:var(--font-display);font-size:14px;font-weight:800;text-transform:uppercase;letter-spacing:.02em;color:#050505;border-radius:10px;padding:11px 22px;background:#ffb020";
const ghostPillStyle = "font-family:var(--font-display);font-size:14px;font-weight:800;text-transform:uppercase;letter-spacing:.02em;color:var(--text);border:1.5px solid var(--border-strong);border-radius:10px;padding:10px 20px";

export default function Home() {
  return (
    <main style={css("min-height:100dvh;background:var(--bg);overflow-x:hidden")}>
      {/* marquee */}
      <div style={css("overflow:hidden;border-bottom:1.5px solid #ffb020;background:var(--bg);padding:14px 0")}>
        <div style={css("display:flex;gap:0;width:max-content;animation:marquee 22s linear infinite")}>
          {[0, 1].map((rep) => (
            <div key={rep} style={css("display:flex;gap:0;align-items:center")}>
              {MARQUEE.map((m) => (
                <span key={rep + m} style={css("font-family:var(--font-display);font-weight:900;font-size:22px;text-transform:uppercase;letter-spacing:-.01em;color:var(--text);padding:0 26px;display:inline-flex;align-items:center;gap:26px")}>
                  {m}<span style={css("color:var(--accent-text)")}>✦</span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      <header style={css("display:flex;align-items:center;justify-content:space-between;max-width:1280px;margin:0 auto;padding:20px 26px")}>
        <div style={css("font-family:var(--font-display);font-weight:900;font-size:20px;color:var(--text);letter-spacing:-.02em;text-transform:uppercase")}>Creator<span style={css("color:var(--accent-text)")}>Manager</span></div>
        <nav style={css("display:flex;align-items:center;gap:10px")}>
          <ThemeToggle size={38} />
          <a href="/sign-in" style={css(ghostPillStyle)}>Log in</a>
          <a href="/sign-up" style={css(ctaPillStyle)}>Sign up</a>
        </nav>
      </header>

      <section style={css("max-width:1280px;margin:0 auto;padding:16px 26px 30px")}>
        <div style={css("text-align:center;max-width:900px;margin:0 auto 26px")}>
          <div style={css(chipStyle + ";margin-bottom:20px")}>⚡ Your AI Sales Team</div>
          <h1 style={css("font-family:var(--font-display);font-weight:900;font-size:clamp(42px,8vw,96px);line-height:.92;letter-spacing:-.03em;text-transform:uppercase;color:var(--text);margin:0 0 18px")}>
            Brand deals,<br /><span style={css("color:var(--accent-text);text-shadow:0 0 30px rgba(255,176,32,.35)")}>closed for you.</span>
          </h1>
          <p style={css("font-size:19px;line-height:1.5;color:var(--text-muted);margin:0;max-width:620px;margin:0 auto")}>
            An AI team that finds brands, pitches them in your own voice, prices the deal, follows up, and books the call — while you keep creating.
          </p>
        </div>
        <OrbitDashboard />
      </section>

      <section style={css("max-width:1280px;margin:0 auto;padding:70px 26px")}>
        <div style={css(chipStyle + ";margin-bottom:18px")}>What it does</div>
        <h2 style={css("font-family:var(--font-display);font-weight:900;font-size:clamp(30px,5vw,56px);line-height:.98;text-transform:uppercase;letter-spacing:-.02em;color:var(--text);margin:0 0 40px")}>
          One team. The whole deal.
        </h2>
        <div style={css("display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:16px")}>
          {FEATURES.map((f) => (
            <div key={f.label} style={css("background:var(--surface);border:1px solid var(--border);border-radius:16px;padding:26px;transition:border-color .15s")}>
              <div style={css("display:flex;align-items:center;gap:8px;margin-bottom:14px")}>
                <span style={css("width:10px;height:10px;border-radius:50%;background:" + f.color + ";flex:none;box-shadow:0 0 12px " + f.color)} />
                <span style={css("font-family:var(--font-display);font-size:13px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:" + f.color)}>{f.label}</span>
              </div>
              <div style={css("font-family:var(--font-display);font-size:21px;font-weight:800;line-height:1.1;color:var(--text);margin-bottom:10px")}>{f.title}</div>
              <div style={css("font-size:15px;line-height:1.55;color:var(--text-muted)")}>{f.body}</div>
            </div>
          ))}
        </div>
      </section>

      <section style={css("max-width:1280px;margin:0 auto;padding:70px 26px;border-top:1px solid var(--border)")}>
        <div style={css(chipStyle + ";margin-bottom:18px")}>How it works</div>
        <h2 style={css("font-family:var(--font-display);font-weight:900;font-size:clamp(30px,5vw,56px);line-height:.98;text-transform:uppercase;letter-spacing:-.02em;color:var(--text);margin:0 0 40px")}>
          Four steps. Then it runs itself.
        </h2>
        <div style={css("display:flex;flex-direction:column")}>
          {HOW_IT_WORKS.map((step, i) => (
            <div key={step} style={css("display:flex;align-items:center;gap:22px;padding:22px 0;border-top:" + (i === 0 ? "none" : "1px solid var(--border)"))}>
              <div style={css("font-family:var(--font-display);font-weight:900;font-size:18px;color:#050505;width:38px;height:38px;border-radius:10px;flex:none;display:flex;align-items:center;justify-content:center;background:#ffb020")}>{i + 1}</div>
              <div style={css("font-family:var(--font-display);font-size:19px;font-weight:600;line-height:1.4;color:var(--text)")}>{step}</div>
            </div>
          ))}
        </div>
      </section>

      <section style={css("max-width:1280px;margin:0 auto;padding:70px 26px;border-top:1px solid var(--border)")}>
        <div style={css(chipStyle + ";margin-bottom:18px")}>Who it's for</div>
        <h2 style={css("font-family:var(--font-display);font-weight:900;font-size:clamp(30px,5vw,56px);line-height:.98;text-transform:uppercase;letter-spacing:-.02em;color:var(--text);margin:0 0 20px;max-width:820px")}>
          Creators who'd rather create than chase brands.
        </h2>
        <p style={css("font-size:19px;line-height:1.6;color:var(--text-muted);max-width:640px")}>
          If you've got an audience and no time (or manager) to hunt sponsorships, this is the team that does it for you — grounded in your real niche, audience, and rates.
        </p>
      </section>

      <section style={css("max-width:1280px;margin:40px auto 0;padding:72px 26px;border-radius:24px;text-align:center;background:radial-gradient(600px 320px at 26% 16%,rgba(255,176,32,.2),transparent 60%),radial-gradient(600px 320px at 74% 84%,rgba(124,92,255,.22),transparent 60%),var(--surface);border:1.5px solid var(--border-strong)")}>
        <h2 style={css("font-family:var(--font-display);font-weight:900;font-size:clamp(32px,6vw,68px);line-height:.95;text-transform:uppercase;letter-spacing:-.02em;color:var(--text);margin:0 0 30px")}>
          Put your deals<br /><span style={css("color:var(--accent-text);text-shadow:0 0 30px rgba(255,176,32,.35)")}>on autopilot.</span>
        </h2>
        <a href="/sign-up" style={css("display:inline-block;font-family:var(--font-display);font-size:16px;font-weight:900;text-transform:uppercase;letter-spacing:.02em;color:#050505;border-radius:12px;padding:16px 38px;background:#ffb020;box-shadow:0 0 40px rgba(255,176,32,.4)")}>
          Sign up free →
        </a>
      </section>

      <footer style={css("padding:48px 26px 28px")}>
        <div style={css("max-width:1280px;margin:0 auto;display:flex;justify-content:space-between;flex-wrap:wrap;gap:24px;align-items:center")}>
          <div style={css("font-family:var(--font-display);font-weight:900;font-size:18px;color:var(--text);text-transform:uppercase")}>Creator<span style={css("color:var(--accent-text)")}>Manager</span></div>
          <div style={css("font-size:14px;color:var(--text-muted)")}>© {new Date().getFullYear()} Creator Manager. Built for creators.</div>
        </div>
      </footer>
    </main>
  );
}
