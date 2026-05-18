interface InputProps {
  value: string;
  setValue: (value: string) => void;
  label: string;
  type?: string;
  className?: string;
  width?: string;
  onKeyDown?: () => void;
  validateUsername?: () => void;
  validateEmail?: () => void;
  availableText?: string;
  textColor?: string;
}

const Input = ({
  value,
  setValue,
  label,
  className = "py-1.5",
  type = "text",
  width = "w-full",
  onKeyDown,
  validateEmail,
  validateUsername,
  availableText = "",
  textColor = "",
}: InputProps) => {
  const testId = `input-${label.toLowerCase().replace(/\s+/g, "-")}`;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && onKeyDown) {
      e.preventDefault();
      onKeyDown();
    }
    if (e.key === "Enter" && (validateEmail || validateUsername)) {
      e.preventDefault();
      handleValidationClick();
    }
  };

  const isValidating = validateEmail || validateUsername;

  const handleValidationClick = () => {
    if (validateEmail) {
      validateEmail();
    } else if (validateUsername) {
      validateUsername();
    }
  };

  return (
    <div className={`${width}`}>
      <div className="flex justify-between text-[11px] md:text-[13px] items-end pr-1.5">
        <div>
          <label className="font-medium pl-0.5">{label}</label>
          <span className={`text-[10px] ml-1 ${textColor}`}>{availableText}</span>
        </div>
        <div
          className={`${!isValidating ? "hidden" : "text-[10px] underline cursor-pointer hover:text-content/60 transition-all duration-200"}`}
          onClick={handleValidationClick}
        >
          Check Availability
        </div>
      </div>
      <input
        data-testid={testId}
        type={type}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        className={`basic-input focus:border w-full bg-custom-white ${className}`}
      />
    </div>
  );
};

export default Input;
