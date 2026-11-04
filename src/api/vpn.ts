import axios from "axios";

/**
 * Customer Client VPN certificates: issue a profile, list them, revoke one.
 *
 * Every VPN belongs to exactly one company, and the server refuses anybody not
 * linked to that company in `company_link` — not the company family. So the
 * page never decides who may see a VPN; it asks `vpn/` and shows what comes
 * back.
 *
 * Failures are FastAPI's `detail` on a non-2xx, not a 200 with `error: 1`, so
 * axios throws and the reason has to be read off the rejection (`vpnReason`).
 */

const headers = (token: string) => ({
  "Content-Type": "application/json",
  Authorization: "Bearer " + token,
});

export interface VpnCertificate {
  /** The last segment of the ACM ARN — what a revoke takes. */
  certificate_id: string;
  /** `<username>-<serial prefix>.<customer>.vpn`, unique per certificate. */
  common_name: string | null;
  username: string | null;
  serial: string | null;
  issued_at: string | null;
  not_after: string | null;
  revoked_at: string | null;
  revoked_by: string | null;
  active_connections: number;
  /**
   * Client VPN keeps recent history only, so null means "not lately" rather
   * than "never".
   */
  last_connected_at: string | null;
}

export interface VpnListResp {
  error: number;
  success: boolean;
  vpns: string[];
}

export interface VpnCertificatesResp {
  error: number;
  success: boolean;
  vpn: string;
  certificates: VpnCertificate[];
}

export interface VpnRevokeResp {
  error: number;
  success: boolean;
  vpn: string;
  certificate_id: string;
  common_name: string;
  serial: string;
  revoked_count: number;
  terminated_connections: string[];
}

/** What came back from an issue: the profile itself and the facts about it. */
export interface IssuedProfile {
  ovpn: Blob;
  filename: string;
  certificateId: string;
  commonName: string;
  serial: string;
  notAfter: string;
}

/** The VPNs the caller may get certificates for. Empty for most users. */
export const listVpns = (url: string, token: string) =>
  axios({
    method: "GET",
    url: url + "vpn/",
    headers: headers(token),
  });

/** Certificates issued for one VPN, with their recent connections. Slow: it
 *  is several AWS calls behind one request. */
export const listVpnCertificates = (url: string, token: string, vpn: string) =>
  axios({
    method: "GET",
    url: url + `vpn/${encodeURIComponent(vpn)}/certificates`,
    headers: headers(token),
  });

/**
 * Issue a certificate and get its `.ovpn` back.
 *
 * The body is the profile with the private key in it, and that key is
 * nowhere else the caller can reach — this response is the only copy. It is
 * read as a blob and handed straight to a download, never put in state.
 */
export const issueVpnCertificate = async (
  url: string,
  token: string,
  vpn: string,
): Promise<IssuedProfile> => {
  const resp = await axios({
    method: "POST",
    url: url + `vpn/${encodeURIComponent(vpn)}/certificates`,
    headers: headers(token),
    responseType: "blob",
  });
  const h = resp.headers;
  const disposition = String(h["content-disposition"] ?? "");
  const commonName = String(h["x-certificate-common-name"] ?? "");
  return {
    ovpn: resp.data as Blob,
    filename:
      /filename="([^"]+)"/.exec(disposition)?.[1] ??
      `${vpn}-${commonName || "client"}.ovpn`,
    certificateId: String(h["x-certificate-id"] ?? ""),
    commonName,
    serial: String(h["x-certificate-serial"] ?? ""),
    notAfter: String(h["x-certificate-not-after"] ?? ""),
  };
};

/** Revoke one certificate. Also drops any live session made with it. */
export const revokeVpnCertificate = (
  url: string,
  token: string,
  vpn: string,
  certificateId: string,
) =>
  axios({
    method: "POST",
    url:
      url +
      `vpn/${encodeURIComponent(vpn)}/certificates/${encodeURIComponent(certificateId)}/revoke`,
    headers: headers(token),
  });

/**
 * The server's reason for a refusal.
 *
 * An issue asks for a blob, so its error body arrives as a Blob too and the
 * `detail` has to be read out of it before it can be shown.
 */
export const vpnReason = async (err: unknown): Promise<string> => {
  const e = err as {
    response?: { status?: number; data?: unknown };
    message?: string;
  };
  let data = e.response?.data;
  if (data instanceof Blob) {
    try {
      data = JSON.parse(await data.text());
    } catch {
      data = undefined;
    }
  }
  const detail = (data as { detail?: unknown } | undefined)?.detail;
  if (typeof detail === "string") return detail;
  return e.message ?? "The server refused it.";
};
