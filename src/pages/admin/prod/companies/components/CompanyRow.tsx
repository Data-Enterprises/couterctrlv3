// Utils
import { COMPANY_GRID } from "../utils";

// Interfaces
import type { CompanyRecord } from "../interfaces";

// Components
import IconButton from "../../../../../components/IconButton";
import { PencilIcon, TrashIcon } from "@heroicons/react/20/solid";

interface CompanyRowProps {
  company: CompanyRecord;
  /** The company it sits under, if any: its name, or its id when unknown. */
  parentName: string | null;
  onEdit: () => void;
  onDelete: () => void;
}

/** One company: name (and the company it sits under), city, state, phone and
 *  contact email, with Edit and Delete. */
const CompanyRow = ({
  company: c,
  parentName,
  onEdit,
  onDelete,
}: CompanyRowProps) => (
  <div
    className={`grid ${COMPANY_GRID} px-3 py-2 text-[12px] items-center text-content even:bg-row_stripe hover:bg-fill_soft`}
  >
    <div className="truncate">
      {c.name}
      {parentName ? (
        <span className="text-[10.5px] text-content/95">
          {" "}
          · under {parentName}
        </span>
      ) : null}
    </div>
    <div className="truncate">{c.city}</div>
    <div className="truncate">{c.state}</div>
    <div className="truncate">{c.phone}</div>
    <div className="truncate">{c.contact_email}</div>
    <div className="flex items-center justify-end gap-1">
      <IconButton icon={PencilIcon} title="Edit" onClick={onEdit} />
      <IconButton
        icon={TrashIcon}
        title="Delete"
        variant="danger"
        onClick={onDelete}
      />
    </div>
  </div>
);

export default CompanyRow;
