const HUB_GLYPHS: Record<string, string> = {
  email: '<rect x="3" y="5" width="18" height="14" rx="2.2"/><path d="m3.6 6.5 8.4 6 8.4-6"/>',
  call: '<path d="M15.6 13.7c-1 1-1 1-2 .5a11 11 0 0 1-3.8-3.8c-.5-1-.5-1 .5-2 .6-.6.7-1 .3-1.8l-1-2.2c-.3-.6-.8-.8-1.4-.6C6.6 4.3 5.6 5.6 5.6 7c0 5.6 5.4 11 11 11 1.4 0 2.7-1 3.2-2.4.2-.6 0-1.1-.6-1.4l-2.2-1c-.7-.4-1.1-.3-1.7.3Z"/>',
  research: '<circle cx="10.5" cy="10.5" r="6"/><path d="m20 20-5-5"/>',
  writing: '<path d="M4 20l1-4L15.4 5.6a1.5 1.5 0 0 1 2.1 0l.9.9a1.5 1.5 0 0 1 0 2.1L8 19l-4 1Z"/><path d="m13.5 7.5 3 3"/>',
  meeting: '<rect x="3.5" y="5" width="17" height="15.5" rx="2.4"/><path d="M3.5 9.5h17"/><path d="M8 3v4M16 3v4"/>',
  analytics: '<path d="M4 5v15h16"/><path d="m7.5 14.5 3-3.5 3 2 4-5.5"/>',
  idle: '<circle cx="12" cy="12" r="7.2" stroke-dasharray="2.2 3"/>',
  alert: '<path d="M12 4.5 20.5 19H3.5L12 4.5Z"/><path d="M12 10.5v3.5"/><path d="M12 17h.01"/>',
};
const hubIconCache = new Map<string, string>();
export function hubIcon(type: string, color: string, size = 14): string {
  const ck = type + "|" + color + "|" + size;
  const hit = hubIconCache.get(ck); if (hit !== undefined) return hit;
  const inner = HUB_GLYPHS[type] || HUB_GLYPHS.writing;
  const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="' + color +
    '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + inner + "</svg>";
  const out = "width:" + size + "px;height:" + size + "px;flex:none;background-image:url(\"data:image/svg+xml," +
    encodeURIComponent(svg) + "\");background-size:contain;background-repeat:no-repeat;background-position:center";
  hubIconCache.set(ck, out); return out;
}

export function av(a: { id: string; color: string }, size: number): string {
  return "width:" + size + "px;height:" + size + "px;border-radius:50%;flex:none;display:flex;" +
    "align-items:center;justify-content:center;background:" + a.color + ";color:#fff;" +
    "font-weight:700;font-size:" + Math.round(size * 0.37) + "px";
}
