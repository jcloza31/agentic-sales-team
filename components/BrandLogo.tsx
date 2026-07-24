"use client";
import { useState } from "react";

const PALETTE = ["#ffb020", "#ff7a00", "#00d18f", "#7c5cff", "#38b6ff"];

function colorFor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return PALETTE[hash % PALETTE.length];
}

function hostnameOf(url?: string | null): string | null {
  if (!url) return null;
  try {
    const withProtocol = url.startsWith("http") ? url : `https://${url}`;
    return new URL(withProtocol).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

export default function BrandLogo({
  name,
  website,
  profileUrl,
  size = 40,
}: {
  name: string;
  website?: string | null;
  profileUrl?: string | null;
  size?: number;
}) {
  const [failed, setFailed] = useState(false);
  const domain = hostnameOf(website) || hostnameOf(profileUrl);
  const src = domain ? `https://www.google.com/s2/favicons?sz=64&domain=${domain}` : null;

  if (!src || failed) {
    return (
      <div
        style={{
          width: size,
          height: size,
          borderRadius: 10,
          flex: "none",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: colorFor(name),
          color: "#050505",
          fontWeight: 800,
          fontSize: Math.round(size * 0.4),
        }}
      >
        {name.charAt(0).toUpperCase()}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={`${name} logo`}
      width={size}
      height={size}
      onError={() => setFailed(true)}
      style={{ borderRadius: 10, flex: "none", background: "#ffffff", objectFit: "contain", padding: 4 }}
    />
  );
}
