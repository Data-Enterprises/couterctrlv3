import { useEffect, useRef, useState } from "react";
import { useDevApi } from "../../../hooks/useDevApi";
import { useToast } from "../../../components/toasts/hooks/useToast";
import {
  issueVpnCertificate,
  listVpnCertificates,
  listVpns,
  revokeVpnCertificate,
  vpnReason,
  type VpnCertificate,
  type VpnCertificatesResp,
  type VpnListResp,
  type VpnRevokeResp,
} from "../../../api/vpn";

/** What was last issued, minus the profile — that went to the download. */
export interface IssuedNote {
  vpn: string;
  filename: string;
  commonName: string;
  notAfter: string;
}

/**
 * Everything the VPN page needs, in one hook.
 *
 * Local state rather than a slice: nothing else in the app reads it, and the
 * one thing here worth protecting — the issued profile — is never held at
 * all. It goes from the response to a download and is dropped.
 *
 * Dev-only, so every call goes through `useDevApi`, like Tickets.
 */
export const useVpnCtx = () => {
  const { url, token } = useDevApi();
  const toast = useToast();

  const [vpns, setVpns] = useState<string[] | null>(null);
  const [vpn, setVpn] = useState<string | null>(null);
  const [certificates, setCertificates] = useState<VpnCertificate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [issuing, setIssuing] = useState(false);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [issued, setIssued] = useState<IssuedNote | null>(null);

  // The list is several AWS calls and can be slow; switching VPN mid-load must
  // not let the first one's answer land on the second one's table.
  const current = useRef<string | null>(null);

  const loadVpns = () => {
    setError(null);
    listVpns(url, token)
      .then((resp) => {
        const names = (resp.data as VpnListResp).vpns ?? [];
        setVpns(names);
        setVpn((v) => (v && names.includes(v) ? v : (names[0] ?? null)));
      })
      .catch(async (err) => {
        setVpns([]);
        setError(await vpnReason(err));
      });
  };

  const loadCertificates = (name: string | null = vpn) => {
    if (!name) return;
    current.current = name;
    setLoading(true);
    setError(null);
    listVpnCertificates(url, token, name)
      .then((resp) => {
        if (current.current !== name) return;
        setCertificates((resp.data as VpnCertificatesResp).certificates ?? []);
      })
      .catch(async (err) => {
        if (current.current !== name) return;
        setCertificates([]);
        setError(await vpnReason(err));
      })
      .finally(() => {
        if (current.current === name) setLoading(false);
      });
  };

  useEffect(() => {
    loadVpns();
  }, []);

  useEffect(() => {
    setCertificates([]);
    setIssued(null);
    loadCertificates(vpn);
  }, [vpn]);

  const issue = async () => {
    if (!vpn || issuing) return;
    setIssuing(true);
    try {
      const profile = await issueVpnCertificate(url, token, vpn);
      const href = URL.createObjectURL(profile.ovpn);
      const a = document.createElement("a");
      a.href = href;
      a.download = profile.filename;
      a.click();
      URL.revokeObjectURL(href);
      setIssued({
        vpn,
        filename: profile.filename,
        commonName: profile.commonName,
        notAfter: profile.notAfter,
      });
      toast.success(`Downloaded ${profile.filename}`);
      loadCertificates(vpn);
    } catch (err) {
      toast.error(`Could not issue a certificate: ${await vpnReason(err)}`);
    } finally {
      setIssuing(false);
    }
  };

  const revoke = async (cert: VpnCertificate) => {
    if (!vpn || revokingId) return;
    setRevokingId(cert.certificate_id);
    try {
      const resp = await revokeVpnCertificate(
        url,
        token,
        vpn,
        cert.certificate_id,
      );
      const j = resp.data as VpnRevokeResp;
      const dropped = j.terminated_connections?.length ?? 0;
      toast.success(
        dropped
          ? `Revoked ${j.common_name} and dropped ${dropped} live connection${dropped === 1 ? "" : "s"}`
          : `Revoked ${j.common_name}`,
      );
      loadCertificates(vpn);
    } catch (err) {
      toast.error(`Could not revoke it: ${await vpnReason(err)}`);
    } finally {
      setRevokingId(null);
    }
  };

  return {
    vpns,
    vpn,
    setVpn,
    certificates,
    loading,
    error,
    issuing,
    issued,
    dismissIssued: () => setIssued(null),
    revokingId,
    issue,
    revoke,
    refresh: () => loadCertificates(vpn),
  };
};

export type VpnCtx = ReturnType<typeof useVpnCtx>;
