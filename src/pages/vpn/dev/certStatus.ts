import type { VpnCertificate } from "../../../api/vpn";

export type CertStatus = "connected" | "valid" | "expired" | "revoked";

/**
 * One word for where a certificate stands.
 *
 * Revoked wins over everything: a revoke tags the certificate before the CRL
 * is pushed, so a certificate can read revoked while a session made with it
 * is still being torn down, and "connected" would say the wrong thing.
 */
export const certStatus = (
  cert: VpnCertificate,
  now: number = Date.now(),
): CertStatus => {
  if (cert.revoked_at) return "revoked";
  if (cert.not_after && Date.parse(cert.not_after) <= now) return "expired";
  if (cert.active_connections > 0) return "connected";
  return "valid";
};

export const STATUS_LABEL: Record<CertStatus, string> = {
  connected: "Connected",
  valid: "Valid",
  expired: "Expired",
  revoked: "Revoked",
};

export const STATUS_CLASS: Record<CertStatus, string> = {
  connected: "bg-brand_green_tint text-brand_green_darker",
  valid: "bg-brand_line text-content",
  expired: "bg-amber-100 text-amber-900",
  revoked: "bg-brand_danger_bg text-brand_danger",
};

/** Only a certificate that could still connect is worth revoking. */
export const canRevoke = (cert: VpnCertificate) =>
  certStatus(cert) === "valid" || certStatus(cert) === "connected";

/** `2026-10-26T14:03:00+00:00` → "Oct 26, 2026", or a dash. */
export const dateText = (iso: string | null) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

/** A date with the time, for "last connected". */
export const dateTimeText = (iso: string | null) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

/** `houchens-vpn` → "Houchens". */
export const vpnLabel = (name: string) =>
  name
    .replace(/-vpn$/, "")
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
