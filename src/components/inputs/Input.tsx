interface InputProps {
  value: string;
  setValue: (value: string) => void;
  label: string;
  type?: string;
}

const Input = ({ value, setValue, label, type = "text" }: InputProps) => {
  const testId = `input-${label.toLowerCase().replace(/\s+/g, "-")}`;
  return (
    <div>
      {label && <label className="font-medium text-sm pl-0.5">{label}</label>}
      <input
        data-testid={testId}
        type={type}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="basic-input focus:border w-full bg-custom-white py-1.5"
      />
    </div>
  );
};

export default Input;
