interface InputProps {
  value: string;
  setValue: (value: string) => void;
  label: string;
  type?: string;
  className?: string;
  width?: string;
  onKeyDown?: () => void;
}

const Input = ({
  value,
  setValue,
  label,
  className = "py-1.5",
  type = "text",
  width = "w-full",
  onKeyDown,
}: InputProps) => {
  const testId = `input-${label.toLowerCase().replace(/\s+/g, "-")}`;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && onKeyDown) {
      e.preventDefault();
      onKeyDown();
    }
  };

  return (
    <div className={`${width}`}>
      {label && <label className="font-medium text-sm pl-0.5">{label}</label>}
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
