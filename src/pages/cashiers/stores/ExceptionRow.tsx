import { formatBigNumber, formatCurrency2 } from "../../../utils";

type ExceptionType =
  | "Voided"
  | "Refunded"
  | "No Sale"
  | "Hand Key"
  | "Cancelled"
  | "Adjustment"
  | "Backup"
  | "Modified";
interface ExceptionInnerCardProps {
  type: ExceptionType;
  col2: number;
  col3: number;
  col4: number;
  col5: number;
  bgColor?: string;
}

const ExceptionRow = ({
  type,
  col2,
  col3,
  col4,
  col5,
  bgColor = "bg-custom-white",
}: ExceptionInnerCardProps) => {
  return (
    <div
      className={`grid grid-cols-[22%_26%_22%_20%_10%] text-[13px] py-0.5 ${bgColor}`}
    >
      <div className="font-medium text-content/60">{type}</div>
      <div className="font-medium">{formatCurrency2(col2)}</div>
      <div className="font-medium">{formatBigNumber(col3, 0)}</div>
      <div className="font-medium">{formatBigNumber(col4, 0)}</div>
      <div className="font-medium">{col5}</div>
    </div>
  );
};

export default ExceptionRow;