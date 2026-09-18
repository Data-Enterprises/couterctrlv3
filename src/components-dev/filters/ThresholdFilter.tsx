export interface ThresholdValue {
  op: "gt" | "lt" | "eq";
  amount: number;
}

interface Props {
  value: ThresholdValue | null;
  onChange: (v: ThresholdValue | null) => void;
  prefix?: string;
  suffix?: string;
  placeholder?: string;
  showOp?: boolean;
  showClear?: boolean;
  inputWidth?: number;
  stretch?: boolean;
  variant?: "light" | "dark";
  className?: string;
}

const OP_LABELS: Record<ThresholdValue["op"], string> = { gt: ">", lt: "<", eq: "=" };

const ThresholdFilter = ({
  value,
  onChange,
  prefix,
  suffix,
  placeholder = "Amount",
  showOp = true,
  showClear = true,
  inputWidth = 64,
  stretch = false,
  variant = "light",
  className = "",
}: Props) => {
  const isDark = variant === "dark";

  const colors = {
    bg: isDark ? "rgba(255,255,255,0.12)" : "rgba(30,42,74,0.06)",
    bgInset: isDark ? "rgba(255,255,255,0.08)" : "rgba(30,42,74,0.06)",
    opBg: isDark ? "rgba(255,255,255,0.15)" : "rgba(30,42,74,0.12)",
    opColor: isDark ? "#fff" : "#1e2a4a",
    divider: isDark ? "rgba(255,255,255,0.15)" : "rgba(30,42,74,0.15)",
    prefix: isDark ? "rgba(255,255,255,0.45)" : "rgba(30,42,74,0.45)",
    text: isDark ? "#fff" : "var(--color-text-primary)",
    placeholder: isDark ? "rgba(255,255,255,0.3)" : undefined,
    clear: isDark ? "rgba(255,255,255,0.4)" : "rgba(30,42,74,0.35)",
    shadow: isDark ? "inset 0 1px 3px rgba(0,0,0,0.2)" : "inset 0 1px 3px rgba(30,42,74,0.1)",
  };

  const hasRight = showClear || suffix;
  const inputStyle: React.CSSProperties = {
    height: "100%",
    border: "none",
    outline: "none",
    boxShadow: "none",
    WebkitAppearance: "none",
    MozAppearance: "textfield",
    fontSize: 10,
    color: colors.text,
    width: inputWidth,
    padding: `0 ${hasRight ? 20 : 6}px 0 ${prefix ? 2 : 6}px`,
    background: "transparent",
  };

  return (
    <div
      className={`relative inline-flex items-center rounded flex-shrink-0 ${className}`}
      style={{ height: 24, background: colors.bg, boxShadow: colors.shadow }}
    >
      {/* Operator dropdown — hidden when showOp=false */}
      {showOp && (
        <>
          <select
            value={value?.op ?? "gt"}
            onChange={(e) => {
              const op = e.target.value as ThresholdValue["op"];
              if (value) onChange({ ...value, op });
              else onChange(null);
            }}
            style={{
              height: "100%",
              border: "none",
              outline: "none",
              boxShadow: "none",
              fontSize: 11,
              fontWeight: 600,
              color: colors.opColor,
              background: colors.opBg,
              padding: "0 4px 0 6px",
              cursor: "pointer",
              appearance: "none",
              width: 36,
              flexShrink: 0,
            }}
          >
            {(["gt", "lt", "eq"] as const).map((op) => (
              <option key={op} value={op}>{OP_LABELS[op]}</option>
            ))}
          </select>
          <div style={{ width: 0.5, height: 14, background: colors.divider, flexShrink: 0 }} />
        </>
      )}

      {/* Input area */}
      <div style={{ position: "relative", display: "flex", alignItems: "center", height: "100%", background: colors.bgInset, ...(stretch ? { flex: 1 } : {}) }}>
        {prefix && (
          <span style={{ fontSize: 10, color: colors.prefix, paddingLeft: 6, lineHeight: 1, flexShrink: 0 }}>{prefix}</span>
        )}
        <input
          type="number"
          min={0}
          value={value?.amount ?? ""}
          placeholder={placeholder}
          style={{ ...inputStyle, ...(stretch ? { width: "100%" } : {}) }}
          className="border-0 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          onChange={(e) => {
            const raw = e.target.value;
            if (raw === "") { onChange(null); return; }
            const amount = parseFloat(raw);
            if (isNaN(amount)) return;
            onChange({ op: value?.op ?? "gt", amount });
          }}
        />
        {suffix && (
          <span style={{ position: "absolute", right: 6, fontSize: 10, color: colors.prefix, lineHeight: 1, pointerEvents: "none" }}>
            {suffix}
          </span>
        )}
        {!suffix && showClear && value !== null && (
          <button
            onClick={() => onChange(null)}
            style={{
              position: "absolute",
              right: 5,
              fontSize: 10,
              lineHeight: 1,
              color: colors.clear,
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 0,
            }}
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
};

export default ThresholdFilter;
