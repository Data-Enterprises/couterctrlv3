interface InputProps {
  value: string;
  setValue: (value: string) => void;
  label: string;
  type?: string;
  className?: string;
}

const Input = ({
  value,
  setValue,
  label,
  className = "py-1.5",
  type = "text",
}: InputProps) => {
  const testId = `input-${label.toLowerCase().replace(/\s+/g, "-")}`;
  return (
    <div>
      {label && <label className="font-medium text-sm pl-0.5">{label}</label>}
      <input
        data-testid={testId}
        type={type}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className={`basic-input focus:border w-full bg-custom-white ${className}`}
      />
    </div>
  );
};

export default Input;
