import { ExclamationTriangleIcon, ExclamationCircleIcon, CheckCircleIcon } from "@heroicons/react/20/solid";

const TIERS = [
  { key: "critical", Icon: ExclamationTriangleIcon, iconColor: "#ef4444", bg: "bg-red-50",     label: "Critical" },
  { key: "watch",    Icon: ExclamationCircleIcon,   iconColor: "#f59e0b", bg: "bg-amber-50",   label: "Watch"    },
  { key: "healthy",  Icon: CheckCircleIcon,         iconColor: "#10b981", bg: "bg-emerald-50", label: "Healthy"  },
] as const;

interface TierStripProps {
  critical: number;
  watch: number;
  healthy: number;
  className?: string;
}

const TierStrip = ({ critical, watch, healthy, className = "" }: TierStripProps) => {
  const counts = { critical, watch, healthy };
  return (
    <div className={`flex-shrink-0 grid grid-cols-3 divide-x divide-gray-100 ${className}`}>
      {TIERS.map(({ key, Icon, iconColor, bg, label }) => (
        <div key={key} className={`flex items-center justify-between gap-4 px-6 py-3 ${bg}`}>
          <Icon className="w-6 h-6 flex-shrink-0" style={{ color: iconColor }} />
          <span className="text-[15px] font-medium text-content/60">{label}</span>
          <span className="text-[15px] font-semibold text-content leading-none">{counts[key]}</span>
        </div>
      ))}
    </div>
  );
};

export default TierStrip;
