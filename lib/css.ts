import type { CSSProperties } from "react";

export type Style = string | CSSProperties;

export function css(input?: Style): CSSProperties {
  if (!input) return {};
  if (typeof input !== "string") return input;
  const o: Record<string, string> = {};
  for (const decl of input.split(";")) {
    const i = decl.indexOf(":");
    if (i < 0) continue;
    const prop = decl.slice(0, i).trim();
    const val = decl.slice(i + 1).trim();
    if (!prop) continue;
    const key = prop.startsWith("--") ? prop : prop.replace(/-([a-z])/g, (_m, c: string) => c.toUpperCase());
    const bm = key === "border" && val.match(/^(\S+)\s+(solid|dashed|dotted|double|none)(?:\s+(.+))?$/);
    if (bm) { o.borderWidth = bm[1]; o.borderStyle = bm[2]; if (bm[3]) o.borderColor = bm[3]; continue; }
    o[key] = val;
  }
  return o as CSSProperties;
}
