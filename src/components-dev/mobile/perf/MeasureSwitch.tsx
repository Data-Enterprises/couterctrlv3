interface MeasureSwitchProps {
  value: "sales" | "units";
  onChange: (m: "sales" | "units") => void;
}

/** The phone Performance pages' Sales / Units switch, the choice desktop Sales
 *  gives with its toggle. It sits in the page's own card, beside the "?",
 *  because it changes every figure on the screen rather than one card's. */
const MeasureSwitch = ({ value, onChange }: MeasureSwitchProps) => (
  <div
    role="group"
    aria-label="Measure"
    className="flex rounded-full border border-line_field bg-bkg p-0.5"
  >
    {(["sales", "units"] as const).map((m) => {
      const on = value === m;
      return (
        <button
          key={m}
          type="button"
          aria-pressed={on}
          onClick={() => onChange(m)}
          className={`rounded-full px-2.5 py-0.5 text-[12px] font-semibold transition-colors ${
            on ? "bg-brand_navy text-custom-white" : "text-content/95"
          }`}
        >
          {m === "sales" ? "Sales" : "Units"}
        </button>
      );
    })}
  </div>
);

export default MeasureSwitch;
