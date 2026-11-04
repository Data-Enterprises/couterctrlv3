import { useState } from "react";
import type { VpnCertificate } from "../../../api/vpn";
import { useVpnCtx } from "./hooks";
import RevokeModal from "./RevokeModal";
import {
  STATUS_CLASS,
  STATUS_LABEL,
  canRevoke,
  certStatus,
  dateText,
  dateTimeText,
  vpnLabel,
} from "./certStatus";

/**
 * Client VPN certificates for the caller's own company.
 *
 * Which VPNs appear is the server's answer, never a user level: a VPN belongs
 * to one company and only people linked to that company get it back from
 * `vpn/`. Most users get none, and the page says so rather than offering a
 * button that would 403.
 *
 * LAYOUT
 * One panel. The navy header holds the VPN tabs (only when there is more than
 * one) and the two things you do — issue a profile, refresh the list. The
 * table under it is every certificate issued for that VPN, newest first, as
 * the server sorts it.
 *
 * Issuing downloads the `.ovpn` straight away. The private key is only in
 * that file, so the banner that follows says plainly that there is no second
 * copy.
 */
const Vpn = () => {
  const ctx = useVpnCtx();
  const [confirming, setConfirming] = useState<VpnCertificate | null>(null);

  if (ctx.vpns === null) {
    return (
      <div className="flex h-[calc(100vh-3rem)] items-center justify-center bg-bkg text-[12.5px] text-content/85">
        Loading…
      </div>
    );
  }

  if (ctx.vpns.length === 0) {
    return (
      <div className="flex h-[calc(100vh-3rem)] flex-col items-center justify-center gap-2 bg-bkg px-4 text-center">
        <div className="text-sm font-semibold text-content/85">No VPN access</div>
        <div className="max-w-sm text-xs text-content/70">
          {ctx.error ??
            "Your account is not linked to a company with a VPN. Ask your administrator if you need one."}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-3rem)] flex-col gap-3 bg-bkg p-3">
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl bg-custom-white shadow-lg">
        <div className="flex flex-shrink-0 items-end gap-3 rounded-t-xl bg-brand_navy px-4 py-2.5">
          <span className="flex-shrink-0 text-[13px] font-semibold text-custom-white">
            VPN certificates
          </span>
          {ctx.vpns.length > 1 && (
            <div role="tablist" className="flex gap-1">
              {ctx.vpns.map((name) => (
                <button
                  key={name}
                  type="button"
                  role="tab"
                  aria-selected={ctx.vpn === name}
                  onClick={() => ctx.setVpn(name)}
                  className={`rounded-md px-2 py-[3px] text-[11px] font-medium transition-colors ${
                    ctx.vpn === name
                      ? "bg-custom-white text-brand_navy"
                      : "border border-custom-white/25 text-custom-white/85 hover:border-custom-white hover:text-custom-white"
                  }`}
                >
                  {vpnLabel(name)}
                </button>
              ))}
            </div>
          )}
          {ctx.vpns.length === 1 && ctx.vpn && (
            <span className="text-[11px] text-custom-white/85">
              {vpnLabel(ctx.vpn)}
            </span>
          )}
          <div className="flex-1" />
          <button
            type="button"
            onClick={ctx.refresh}
            disabled={ctx.loading}
            className="flex-shrink-0 rounded-md border border-custom-white/25 px-2 py-[3px] text-[11px] font-medium text-custom-white/85 transition-colors hover:border-custom-white hover:text-custom-white disabled:opacity-40"
          >
            {ctx.loading ? "Loading…" : "Refresh"}
          </button>
          <button
            type="button"
            onClick={ctx.issue}
            disabled={ctx.issuing || !ctx.vpn}
            className="flex-shrink-0 rounded-md bg-brand_green px-3 py-[3px] text-[11px] font-semibold text-custom-white transition-colors hover:bg-brand_green_dark disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {ctx.issuing ? "Issuing…" : "New certificate"}
          </button>
        </div>

        {ctx.issued && (
          <div className="flex flex-shrink-0 items-start gap-3 border-b border-brand_line bg-brand_green_tint px-4 py-2.5 text-[12.5px]">
            <div className="min-w-0 flex-1">
              <div className="font-semibold text-brand_green_darker">
                Saved {ctx.issued.filename}
              </div>
              <div className="text-content/85">
                Import it into the AWS VPN Client or OpenVPN. The private key is
                only in that file — this page cannot download it again. Valid
                until {dateText(ctx.issued.notAfter)}.
              </div>
            </div>
            <button
              type="button"
              onClick={ctx.dismissIssued}
              className="flex-shrink-0 text-[11px] font-medium text-content/85 hover:text-content"
            >
              Dismiss
            </button>
          </div>
        )}

        {ctx.error && (
          <div className="flex-shrink-0 border-b border-brand_line bg-brand_danger_bg px-4 py-2 text-[12.5px] text-brand_danger">
            {ctx.error}
          </div>
        )}

        <div className="min-h-0 flex-1 overflow-auto thin-scrollbar">
          <table className="w-full text-left text-[12.5px]">
            <thead className="sticky top-0 bg-custom-white">
              <tr className="border-b border-brand_line font-mono text-[9.5px] uppercase tracking-wider text-content/85">
                <th className="px-4 py-2 font-normal">Certificate</th>
                <th className="px-3 py-2 font-normal">User</th>
                <th className="px-3 py-2 font-normal">Status</th>
                <th className="px-3 py-2 font-normal">Issued</th>
                <th className="px-3 py-2 font-normal">Expires</th>
                <th className="px-3 py-2 font-normal">Last connected</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody>
              {ctx.certificates.map((cert) => {
                const status = certStatus(cert);
                return (
                  <tr
                    key={cert.certificate_id}
                    className="border-b border-brand_line last:border-b-0"
                  >
                    <td className="px-4 py-2 font-mono text-[11.5px]">
                      {cert.common_name ?? cert.certificate_id}
                    </td>
                    <td className="px-3 py-2">{cert.username ?? "—"}</td>
                    <td className="px-3 py-2">
                      <span
                        className={`rounded-full px-2 py-[2px] text-[11px] font-medium ${STATUS_CLASS[status]}`}
                        title={
                          status === "revoked" && cert.revoked_by
                            ? `Revoked ${dateText(cert.revoked_at)} by ${cert.revoked_by}`
                            : undefined
                        }
                      >
                        {STATUS_LABEL[status]}
                        {status === "connected" && cert.active_connections > 1
                          ? ` · ${cert.active_connections}`
                          : ""}
                      </span>
                    </td>
                    <td className="px-3 py-2 tabular-nums">
                      {dateText(cert.issued_at)}
                    </td>
                    <td className="px-3 py-2 tabular-nums">
                      {dateText(cert.not_after)}
                    </td>
                    {/* Client VPN keeps recent history only, so a dash is
                        "not lately" rather than "never". */}
                    <td className="px-3 py-2 tabular-nums">
                      {dateTimeText(cert.last_connected_at)}
                    </td>
                    <td className="px-4 py-2 text-right">
                      {canRevoke(cert) && (
                        <button
                          type="button"
                          onClick={() => setConfirming(cert)}
                          disabled={ctx.revokingId !== null}
                          className="rounded-md border border-brand_line_2 px-2.5 py-[3px] text-[11px] font-medium text-brand_danger transition-colors hover:border-brand_danger disabled:opacity-40"
                        >
                          Revoke
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {!ctx.loading && ctx.certificates.length === 0 && !ctx.error && (
            <div className="px-4 py-10 text-center text-[12.5px] text-content/85">
              No certificates have been issued for this VPN yet.
            </div>
          )}
          {ctx.loading && ctx.certificates.length === 0 && (
            <div className="px-4 py-10 text-center text-[12.5px] text-content/85">
              Loading certificates…
            </div>
          )}
        </div>
      </div>

      {confirming && (
        <RevokeModal
          cert={confirming}
          working={ctx.revokingId === confirming.certificate_id}
          onCancel={() => setConfirming(null)}
          onConfirm={async () => {
            await ctx.revoke(confirming);
            setConfirming(null);
          }}
        />
      )}
    </div>
  );
};

export default Vpn;
