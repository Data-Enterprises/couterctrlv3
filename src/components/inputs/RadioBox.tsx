import CheckboxIcon from "../../svgs/CheckBoxIcon";

interface Props {
  value: boolean;
  label: string;
  onChange: (id: number) => void;
  id: number;
  className?: string;
}

const RadioBox = ({ value, onChange, id, label, className }: Props) => {
  return (
    <div
      className={`flex items-center gap-2 cursor-pointer ${className}`}
      data-testid={`radio-${id}`}
      onClick={() => onChange(id)}
    >
      <CheckboxIcon active={value} />
      <label>{label}</label>
    </div>
  );
};

export default RadioBox;
