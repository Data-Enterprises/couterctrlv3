import type { ReactNode } from "react";
import Modal from "./Modal";

interface ConfirmDeleteProps {
  /** What is about to go, in the words the user would use for it. */
  what: string;
  /** "saved query", "configuration" — what kind of thing it is. */
  kind: string;
  /** Anything else worth knowing before it goes. */
  detail?: ReactNode;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * The question before a delete.
 *
 * Deleting is the one action on this page that cannot be undone by doing it
 * again, so it asks — by name, so the answer is to a specific thing rather
 * than to a dialog. The destructive button is the one that carries the
 * colour; Cancel is the quiet one, because the quiet one is the safe one.
 */
const ConfirmDelete = ({
  what,
  kind,
  detail,
  onConfirm,
  onCancel,
}: ConfirmDeleteProps) => (
  <Modal
    isOpen
    onClose={onCancel}
    modalClassName="bg-card_bg w-[440px] max-w-[92vw]"
  >
    <div className="flex flex-col gap-3 p-4">
      <h2 className="text-[15px] font-semibold">Delete this {kind}?</h2>
      <p className="text-[13px] text-content/75">
        <span className="font-semibold text-content">{what}</span> will be
        gone. {detail}
      </p>
      <div className="flex items-center gap-2 justify-end">
        <button
          type="button"
          onClick={onCancel}
          className="text-[12.5px] font-medium px-4 py-1.5 rounded-lg border border-brand_line_2 hover:border-brand_slate transition-colors"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className="bg-[#9C3A2E] hover:bg-[#87322a] text-custom-white text-[12.5px] font-semibold px-4 py-1.5 rounded-lg transition-colors"
        >
          Delete
        </button>
      </div>
    </div>
  </Modal>
);

export default ConfirmDelete;
