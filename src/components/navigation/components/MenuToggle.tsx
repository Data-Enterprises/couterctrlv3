// Utils
import { segmentClass } from "./utils";

interface MenuToggleProps<T extends string> {
  label: string;
  value: T;
  options: { id: T; label: string }[];
  onPick: (id: T) => void;
  /** Greyed and unclickable, with this as the reason on hover. */
  disabledReason?: string;
}

/** A labelled two-way switch in the avatar menu (View, Mode). */
const MenuToggle = <T extends string>({ label, value, options, onPick, disabledReason }: MenuToggleProps<T>) => (
  <div className="flex items-center justify-between h-[42px]" title={disabledReason}>
    <span className="text-[13px] font-medium text-content">{label}</span>
    <div
      role="group"
      aria-label={label}
      className="flex gap-0.5 p-[3px] rounded-lg bg-custom-white border border-brand_line"
    >
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          aria-pressed={value === o.id}
          disabled={Boolean(disabledReason)}
          onClick={() => onPick(o.id)}
          className={`${segmentClass(value === o.id)} disabled:opacity-40`}
        >
          {o.label}
        </button>
      ))}
    </div>
  </div>
);

export default MenuToggle;
