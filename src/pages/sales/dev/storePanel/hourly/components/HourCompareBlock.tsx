// Utils
import { formatPct, pillClass } from "../../../utils/index";
import { pctChange } from "../utils";

interface HourCompareBlockProps {
  label: string;
  ty: number;
  lw: number;
  ly: number;
  format: (v: number) => string;
  threshold: number;
}

/** A titled three-column strip (TY, LW, LY) for one measure of the open hour,
 *  such as transactions or the average basket. A zero reference is a dash. */
const HourCompareBlock = ({ label, ty, lw, ly, format, threshold }: HourCompareBlockProps) => (
  <div className="border-b border-line_hair leading-snug">
    <div className="px-4 py-1.5 bg-fill_muted text-[10px] font-medium uppercase tracking-wide text-content">
      {label}
    </div>
    <div className="grid grid-cols-3 divide-x divide-line_hair">
      <div className="px-4 py-2.5">
        <div className="text-[13px] font-semibold text-content">{format(ty)}</div>
      </div>
      {[lw, ly].map((ref, i) => (
        <div key={i} className="px-4 py-2.5">
          <div className="flex items-baseline gap-1.5">
            <span className="text-[13px] font-semibold text-content">
              {ref > 0 ? format(ref) : "—"}
            </span>
            {ref > 0 && (
              <span
                className={`text-[9px] font-semibold px-1.5 py-0.5 rounded ${pillClass(pctChange(ty, ref), threshold)}`}
              >
                {formatPct(pctChange(ty, ref))}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default HourCompareBlock;
