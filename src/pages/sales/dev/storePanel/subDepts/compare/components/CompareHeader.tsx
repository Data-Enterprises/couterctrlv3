// Components
import { XMarkIcon } from "@heroicons/react/20/solid";
import HeaderIconButton from "../../../../../../../components-dev/HeaderIconButton";

interface CompareHeaderProps {
  deptName: string;
  storeName: string;
  onClose: () => void;
}

/** The panel's navy bar: what is being compared, where, and the close. */
const CompareHeader = ({ deptName, storeName, onClose }: CompareHeaderProps) => (
  <div className="flex items-center gap-2 px-4 py-2 bg-brand_navy flex-shrink-0">
    <span className="cc-navy-title text-[13px] truncate min-w-0">
      Compare | {deptName} | {storeName}
    </span>
    <HeaderIconButton onClick={onClose} title="Close the comparison" className="ml-auto">
      <XMarkIcon className="w-3.5 h-3.5" />
    </HeaderIconButton>
  </div>
);

export default CompareHeader;
