import CheckboxIcon from "../../svgs/CheckBoxIcon";

interface Props {
  label?: string;
  value: boolean;
  onChange?: (value: boolean | number) => void;
  id: number;
  stroke?: string;
  className?: string;
  idExtension?: string;
}

const CheckBox = ({
  label = "",
  value,
  onChange,
  id,
  stroke = "green",
  className = "",
  idExtension = "",
}: Props) => {
  const handleClick = () => {
    if (onChange) onChange(!value);
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
