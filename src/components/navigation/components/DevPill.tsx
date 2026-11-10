interface DevPillProps {
  onNavy: boolean;
}

const DevPill = ({ onNavy }: DevPillProps) => {
  return (
    <div
      aria-hidden={!onNavy}
      className={`flex items-center overflow-hidden transition-all duration-300 ease-in-out ${
        onNavy ? "max-w-[120px] opacity-100 pr-3" : "max-w-0 opacity-0 pr-0"
      }`}
    >
      <span
        title="Dev mode: this session is on the dev API"
        className="px-3 py-1.5 rounded-full bg-custom-white text-brand_navy text-[11px] font-bold tracking-wide leading-none whitespace-nowrap select-none"
      >
        DEV MODE
      </span>
    </div>
  );
};

export default DevPill;
