// Interfaces
import type { PendingToggle } from "../interfaces";

// Components
import ConfirmModal from "../../../../../components/ConfirmModal";

interface ExclusionConfirmProps {
  pending: PendingToggle;
  onConfirm: () => void;
  onCancel: () => void;
}

/** The check before a department is excluded, or counted again, at more than
 *  one store. */
const ExclusionConfirm = ({
  pending,
  onConfirm,
  onCancel,
}: ExclusionConfirmProps) => (
  <ConfirmModal
    title={pending.want ? "Exclude at every store?" : "Count it again?"}
    message={
      pending.want
        ? `${pending.label} will stop counting towards net sales at ${pending.writes.length} stores. Each store is written with its own sub-department number.`
        : `${pending.label} will count towards net sales again at ${pending.writes.length} stores.`
    }
    confirmLabel={
      pending.want
        ? `Yes, exclude at ${pending.writes.length}`
        : `Yes, count at ${pending.writes.length}`
    }
    onConfirm={onConfirm}
    onCancel={onCancel}
  />
);

export default ExclusionConfirm;
