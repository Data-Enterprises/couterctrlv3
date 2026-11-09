// Utils
import { inputStyle } from "../utils";

// Interfaces
import type { Operator } from "../interfaces";

interface ThreshInputProps {
  operator: Operator;
  value: string;
  onOperatorChange: (op: Operator) => void;
  onValueChange: (v: string) => void;
  placeholder?: string;
}

/** A threshold filter: an operator select and a value box. */
const ThreshInput = ({ operator, value, onOperatorChange, onValueChange, placeholder }: ThreshInputProps) => (
  <div className="flex gap-1">
    <select
      value={operator}
      onChange={(e) => onOperatorChange(e.target.value as Operator)}
      style={{ ...inputStyle, width: 42, padding: "4px 4px" }}
    >
      <option value=">">{">"}</option>
      <option value="<">{"<"}</option>
      <option value="=">{"="}</option>
    </select>
    <input
      autoFocus
      type="number"
      style={{ ...inputStyle, flex: 1 }}
      placeholder={placeholder ?? "Value…"}
      value={value}
      onChange={(e) => onValueChange(e.target.value)}
    />
  </div>
);

export default ThreshInput;
