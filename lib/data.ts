export type StatusKey = "working" | "waiting" | "offline" | "error";
export interface StatusMeta { label: string; bg: string; color: string; dot: string }

const STATUS_META: Record<StatusKey, StatusMeta> = {
  working: { label: "Working", bg: "rgba(0,209,143,.14)", color: "#00d18f", dot: "#00d18f" },
  waiting: { label: "Waiting", bg: "rgba(255,122,0,.14)", color: "#ff7a00", dot: "#ff7a00" },
  offline: { label: "Offline", bg: "rgba(143,143,143,.14)", color: "#8f8f8f", dot: "#8f8f8f" },
  error: { label: "Error", bg: "rgba(255,66,87,.14)", color: "#ff4257", dot: "#ff4257" },
};

export function statusMeta(s: StatusKey): StatusMeta {
  return STATUS_META[s] ?? STATUS_META.offline;
}
