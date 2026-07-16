import { passFailChipClass } from "../../gradingUtils";

interface MetricChipProps {
  label: string;
  value: string;
  isPass: boolean | null;
}

const MetricChip = ({ label, value, isPass }: MetricChipProps) => (
  <div className={`flex items-baseline gap-1 rounded px-1.5 py-0.5 ${passFailChipClass(isPass)}`}>
    <span className="text-[10px] opacity-85">{label}</span>
    <span className="text-[10px] font-semibold">{value}</span>
  </div>
);

export default MetricChip;
