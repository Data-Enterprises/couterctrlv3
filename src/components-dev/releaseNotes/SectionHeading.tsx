// Utils
import { LOOK } from "./utils";
import { SECTION_TITLE } from "../../content/releaseNotes";

// Interfaces
import type { SectionKey } from "./interfaces";

/** A section's heading, with its icon tile and its count. */
const SectionHeading = ({
  sectionKey,
  count,
}: {
  sectionKey: SectionKey;
  count: number;
}) => {
  const { Icon, tile } = LOOK[sectionKey];
  return (
    <div className="flex items-center gap-2.5">
      <span
        className={`flex h-7 w-7 flex-none items-center justify-center rounded-lg ${tile}`}
      >
        <Icon className="h-4 w-4" />
      </span>
      <h4 className="m-0 text-[14px] font-semibold text-content">
        {SECTION_TITLE[sectionKey]}
      </h4>
      <span className="text-[12px] tabular-nums text-content/95">{count}</span>
    </div>
  );
};

export default SectionHeading;
