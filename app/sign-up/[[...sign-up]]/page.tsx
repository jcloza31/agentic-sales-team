"use client";
import { useEffect, useState } from "react";
import { SignUp } from "@clerk/nextjs";
import { css } from "@/lib/css";
import ThemeToggle from "@/components/ThemeToggle";

export default function SignUpPage() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const update = () => setDark(document.documentElement.getAttribute("data-theme") === "dark");
    update();
    const observer = new MutationObserver(update);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => observer.disconnect();
  }, []);

  const bg = dark ? "#0e0e0e" : "#ffffff";
  const text = dark ? "#ffffff" : "#0a0a0a";
  const textSecondary = dark ? "#8f8f8f" : "#62626a";
  const inputBg = dark ? "#161616" : "#f0f0f1";

  return (
    <main style={css("min-height:100dvh;display:flex;align-items:center;justify-content:center;background:radial-gradient(600px 400px at 30% 20%,rgba(255,176,32,.14),transparent 60%),radial-gradient(600px 400px at 70% 80%,rgba(124,92,255,.16),transparent 60%),var(--bg);padding:26px;position:relative")}>
      <div style={{ position: "absolute", top: 20, right: 20 }}>
        <ThemeToggle size={38} />
      </div>
      <SignUp
        path="/sign-up"
        appearance={{
          variables: {
            colorPrimary: "#ffb020",
            colorBackground: bg,
            colorText: text,
            colorTextSecondary: textSecondary,
            colorInputBackground: inputBg,
            colorInputText: text,
            borderRadius: "12px",
            fontFamily: "var(--font-sans)",
          },
          elements: {
            socialButtonsBlockButton: {
              backgroundColor: "#ffffff",
              border: "1px solid rgba(0,0,0,.08)",
              "&:hover": { backgroundColor: "#f2f2f2" },
            },
            socialButtonsBlockButtonText: {
              color: "#050505",
              fontWeight: "600",
            },
          },
        }}
      />
    </main>
  );
}
