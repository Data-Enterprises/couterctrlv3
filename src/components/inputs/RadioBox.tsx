import CheckboxIcon from "../../svgs/CheckBoxIcon";

interface Props {
  value: boolean;
  label: string;
  onChange: (id: number) => void;
  id: number;
}

const RadioBox = ({ value, onChange, id, label }: Props) => {
  return (
    <div
      className="flex items-center gap-2 cursor-pointer"
      data-testid={`radio-${id}`}
      onClick={() => onChange(id)}
    >
      <CheckboxIcon active={value} />
      <label>{label}</label>
    </div>
  );
};

export default RadioBox;
