import { useState } from "react";
import { info, defaultTooltips, type Tooltip } from "..";
import { InformationCircleIcon } from "@heroicons/react/24/solid";

const Tooltips = () => {
  const [showTooltip, setShowTooltip] = useState<Tooltip>(defaultTooltips);

  const handleTooltip = (index: number, type: "show" | "hide") => {
    const bool = type === "show" ? true : false;
    setShowTooltip((prev) => ({ ...prev, [index]: bool }));
  };

  return (
    <div className="grid grid-cols-[1fr_22%_1fr_1fr] pb-2 w-full">
      {info.map((inst, i) => (
        <div
          key={i}
          className="text-xs text-content/70 w-full flex items-center gap-1 relative ml-3"
        >
          <InformationCircleIcon
            data-testid={`tooltip-icon-${i}`}
            height={22}
            width={22}
            onMouseEnter={() => handleTooltip(i, "show")}
            onMouseLeave={() => handleTooltip(i, "hide")}
            className="text-content/30 cursor-pointer hover:fill-blue-500"
          />
          <div className="underline font-medium text-content/80">
            {inst.label}
          </div>
          <div
            style={{ zIndex: showTooltip[i as keyof Tooltip] ? 1000 : -1 }}
            className={`${
              showTooltip[i as keyof Tooltip]
                ? "opacity-100"
                : "opacity-0 pointer-events-none"
            } transition-all duration-200 text-xs text-content absolute max-w-[250px] left-0.5 bottom-6 border rounded bg-blue-100 border-content/50 p-1`}
          >
            {inst.text}
          </div>
        </div>
      ))}
    </div>
  );
};

export default Tooltips;
