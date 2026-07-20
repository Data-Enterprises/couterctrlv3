interface ConfirmModalProps {
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

// Shared delete-confirmation modal — used by both the Users grid and Base
// Groups detail, so the destructive-action pattern stays identical everywhere.
const ConfirmModal = ({
  title,
  message,
  confirmLabel = "Yes, delete",
  onConfirm,
  onCancel,
}: ConfirmModalProps) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35">
      <div className="bg-custom-white rounded-xl p-5 w-[300px] shadow-2xl">
        <div className="text-[14px] font-medium text-content mb-2">
          {title}
        </div>
        <p className="text-[12px] text-content/70 leading-relaxed mb-4">
          {message}
        </p>
        <div className="flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="text-[12px] font-medium px-3 py-1.5 rounded-md border border-gray-200 text-content"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="text-[12px] font-medium px-3 py-1.5 rounded-md text-custom-white bg-red-600 hover:bg-red-600/85"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
