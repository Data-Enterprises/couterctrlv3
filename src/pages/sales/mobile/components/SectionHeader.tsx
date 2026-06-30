import { SECTION_BG, SECTION_BORDER, SECTION_TEXT } from "../../shared/ledgerUtils";
import type { Severity } from "../../components/LedgerRow";
import SevBadge from "./SevBadge";

const SectionHeader = ({ sev, count }: { sev: Severity; count: number }) => (
  <div className={`flex items-center gap-2 px-3 py-2 border-b ${SECTION_BORDER[sev]} ${SECTION_BG[sev]}`}>
    <SevBadge sev={sev} />
    <span className={`text-[11px] font-semibold flex-1 ${SECTION_TEXT[sev]}`}>
      {sev.charAt(0).toUpperCase() + sev.slice(1)}
    </span>
    <span className={`text-[10px] ${SECTION_TEXT[sev]} opacity-60`}>{count}</span>
  </div>
);

export default SectionHeader;
