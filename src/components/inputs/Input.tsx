interface InputProps {
  value: string;
  setValue: (value: string) => void;
  label: string;
  type?: string;
}

const Input = ({ value, setValue, label, type = "text" }: InputProps) => {
  return (
    <div>
      <label className="font-medium text-xs pl-0.5">{label}</label>
      <input
        data-testid={`input-${label.toLowerCase()}`}
        type={type}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="basic-input focus:border w-full bg-custom-white py-1.5"
      />
    </div>
  );
};

export default Input;
