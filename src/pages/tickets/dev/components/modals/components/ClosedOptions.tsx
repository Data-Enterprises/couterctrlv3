// Hooks
import { useTicketsCtx } from "../../../hooks";

interface ClosedOptionsProps {
  kind: string;
  setKind: (kind: string) => void;
}

// Displays the options a ticket tech can select when closing a ticket
const ClosedOptions = ({ kind, setKind }: ClosedOptionsProps) => {
  const ctx = useTicketsCtx();
  const kinds = ctx.lookups?.resolutionTypes ?? [
    { value: "fixed", description: "Fixed" },
    { value: "config", description: "Config" },
    { value: "user_error", description: "User error" },
    { value: "no_action", description: "No action" },
    { value: "duplicate", description: "Duplicate" },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {kinds.map((option) => (
        <label
          key={option.value}
          htmlFor={`kind-${option.value}`}
          className={`flex items-center gap-2 text-[12.5px] rounded-lg px-3 py-2 border transition-colors ${
            kind === option.value
              ? "bg-filter_active border-filter_active_border"
              : "bg-custom-white border-brand_line hover:border-brand_slate"
          }`}
        >
          <input
            id={`kind-${option.value}`}
            type="radio"
            name="resolution-kind"
            checked={kind === option.value}
            onChange={() => setKind(option.value)}
            className="w-4 h-4"
          />
          {option.description}
        </label>
      ))}
    </div>
  );
};

export default ClosedOptions;
