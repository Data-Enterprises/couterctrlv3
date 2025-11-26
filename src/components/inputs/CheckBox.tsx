import CheckboxIcon from "../../svgs/CheckBoxIcon";

interface Props {
  label?: string;
  value: boolean;
  onChange: (value: boolean | number) => void;
  id: number;
  stroke?: string;
  className?: string;
}

const CheckBox = ({
  label = "",
  value,
  onChange,
  id,
  stroke = "green",
  className = "",
}: Props) => {
  return (
    <div
      data-testid={`check-${id}`}
      className={`flex items-center gap-2 ${className}`}
    >
      <CheckboxIcon
        onClick={() => onChange(!value)}
        active={value}
        stroke={stroke}
      />
      <span className="truncate overflow-hidden whitespace-nowrap">
        {label}
      </span>
    </div>
  );
};

export default CheckBox;
