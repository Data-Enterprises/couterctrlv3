// Interfaces
import type { ReactNode } from "react";

interface ConfirmModalProps {
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  /** Shown between the message and the buttons -- the people an Assign all
   *  is about to move, say. The modal widens to make room. */
  children?: ReactNode;
}

/** Small centred confirm dialog with a title, a message, optional extra content
 *  and Cancel / red confirm buttons (default "Yes, delete"). */
// Shared delete-confirmation modal — used across grid-style admin pages
// (Organization, Admin) so the destructive-action pattern stays identical.
const ConfirmModal = ({
  title,
  message,
  confirmLabel = "Yes, delete",
  onConfirm,
  onCancel,
  children,
}: ConfirmModalProps) => {
  return (
    <div className="cc-modal-backdrop z-50">
      <div
        className={`bg-custom-white rounded-xl p-5 shadow-2xl ${
          children ? "w-[400px] max-w-[92vw]" : "w-[300px]"
        }`}
      >
        <div className="text-[14px] font-medium text-content mb-2">
          {title}
        </div>
        <p className="text-[12px] text-content/95 leading-relaxed mb-4">
          {message}
        </p>
        {children && <div className="mb-4">{children}</div>}
        <div className="flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="text-[12px] font-medium px-3 py-1.5 rounded-md border border-line_field text-content"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="text-[12px] font-medium px-3 py-1.5 rounded-md text-custom-white bg-brand_danger hover:bg-brand_danger/85"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
