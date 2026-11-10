// Utils
import { FIELD, LABEL } from "../utils";

interface TextFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: "text" | "email";
  autoComplete?: string;
  autoFocus?: boolean;
  disabled?: boolean;
}

/** A labelled input drawn like the sign-in rail's Username field. */
const TextField = ({
  id,
  label,
  value,
  onChange,
  type = "text",
  autoComplete,
  autoFocus,
  disabled,
}: TextFieldProps) => (
  <div className="mb-[15px]">
    <label htmlFor={id} className={LABEL}>
      {label}
    </label>
    <input
      id={id}
      name={id}
      data-testid={id}
      type={type}
      value={value}
      autoComplete={autoComplete}
      autoCapitalize="none"
      spellCheck={false}
      autoFocus={autoFocus}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
      className={FIELD}
    />
  </div>
);

export default TextField;
