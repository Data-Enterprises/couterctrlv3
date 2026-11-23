// Utils
import { PRESET_OPTIONS, SCOPE_OPTIONS, type CouponPreset } from "../utils";

// Interfaces
import type { Scope } from "../interfaces";

interface PresetsPaneProps {
  scope: Scope;
  onScope: (scope: Scope) => void;
  presets: Set<CouponPreset>;
  onTogglePreset: (key: CouponPreset) => void;
}

/** Presets mode: the store scope, then the data sets to include. */
const PresetsPane = ({
  scope,
  onScope,
  presets,
  onTogglePreset,
}: PresetsPaneProps) => (
  <div className="px-4 pt-4 pb-2 space-y-3 cc-scroll">
    <div>
      <p className="text-[11px] text-content uppercase tracking-wide font-medium mb-1.5">
        Scope
      </p>
      <div className="flex gap-1.5">
        {SCOPE_OPTIONS.map((sc) => (
          <button
            key={sc.key}
            onClick={() => onScope(sc.key)}
            className={`text-[11px] px-2 py-1 rounded-md border transition-colors ${
              scope === sc.key
                ? "border-brand_navy bg-row_selected text-content"
                : "border-line_field text-content hover:border-line_strong"
            }`}
          >
            {sc.label}
          </button>
        ))}
      </div>
    </div>

    <p className="text-[11px] text-content/95 uppercase tracking-wide font-medium">
      Select data to include
    </p>
    {PRESET_OPTIONS.map((pr) => (
      <label
        key={pr.key}
        className="flex items-start gap-3 cursor-pointer group"
      >
        <input
          type="checkbox"
          checked={presets.has(pr.key)}
          onChange={() => onTogglePreset(pr.key)}
          className="mt-0.5 cc-checkbox border-line_strong cursor-pointer flex-shrink-0"
        />
        <div>
          <p className="text-[13px] cc-row-title">{pr.label}</p>
          <p className="text-[11px] text-content/95 mt-0.5">{pr.desc}</p>
        </div>
      </label>
    ))}
  </div>
);

export default PresetsPane;
