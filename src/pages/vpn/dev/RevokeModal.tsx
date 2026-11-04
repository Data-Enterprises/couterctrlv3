import Modal from "../../../components-dev/Modal";
import type { VpnCertificate } from "../../../api/vpn";

interface Props {
  cert: VpnCertificate;
  working: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

/**
 * Revoking one.
 *
 * There is no undo: the serial goes on the endpoint's CRL, and the laptop
 * holding this profile needs a new one to get back in. Live sessions are
 * dropped as part of the revoke, so the warning says so when there are any.
 */
const RevokeModal = ({ cert, working, onCancel, onConfirm }: Props) => (
  <Modal
    isOpen
    onClose={working ? undefined : onCancel}
    modalClassName="bg-card_bg w-[520px] max-w-[94vw]"
  >
    <div className="flex flex-col gap-4 p-5">
      <div>
        <h2 className="text-[17px] font-semibold">Revoke this certificate?</h2>
        <p className="mt-1 break-all font-mono text-[12px] text-content/85">
          {cert.common_name}
        </p>
      </div>

      <p className="text-[12.5px] text-content/85">
        Whoever holds this profile will no longer be able to connect. It cannot
        be undone — they will need a new certificate.
      </p>
      {cert.active_connections > 0 && (
        <p className="rounded-lg bg-brand_danger_bg px-3 py-2 text-[12.5px] text-brand_danger">
          It is connected right now ({cert.active_connections} session
          {cert.active_connections === 1 ? "" : "s"}). Revoking drops it
          immediately.
        </p>
      )}

      <div className="flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          disabled={working}
          className="text-[12.5px] font-medium px-4 py-1.5 rounded-lg border border-brand_line_2 hover:border-brand_slate transition-colors disabled:opacity-40"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={working}
          className="text-[12.5px] font-semibold px-5 py-1.5 rounded-lg bg-brand_danger text-custom-white hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {working ? "Revoking…" : "Revoke"}
        </button>
      </div>
    </div>
  </Modal>
);

export default RevokeModal;
