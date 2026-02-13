import CheckboxIcon from "../../svgs/CheckBoxIcon";

interface Props {
  label?: string;
  value: boolean;
  onChange?: (value: boolean | number) => void;
  id: number;
  stroke?: string;
  className?: string;
  idExtension?: string;
  isBool?: boolean;
}

const CheckBox = ({
  label = "",
  value,
  onChange,
  id,
  stroke = "green",
  className = "",
  idExtension = "",
  isBool = true,
}: Props) => {
  const handleClick = () => {
    if (onChange && isBool) onChange(!value);
    if (onChange && !isBool) onChange(id);
  };

  const testId = idExtension ? `check-${id}-${idExtension}` : `check-${id}`;
  return (
    <div
      data-testid={testId}
      className={`flex items-center gap-2 ${className}`}
      onClick={handleClick}
    >
      <CheckboxIcon active={value} stroke={stroke} />
      <span className="truncate overflow-hidden whitespace-nowrap">
        {label}
      </span>
    </div>
  );
};

export default CheckBox;
