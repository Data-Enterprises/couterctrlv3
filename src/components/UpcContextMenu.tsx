import { useEffect, useRef } from "react";

interface SeverityUpcs {
  critical: string[];
  watch: string[];
  healthy: string[];
}

interface UpcContextMenuProps {
  x: number;
  y: number;
  upc: string;
  allUpcs: string[];
  severityUpcs?: SeverityUpcs;
  onClose: () => void;
}

const copyToClipboard = (upcs: string[]) => navigator.clipboard.writeText(upcs.join(", "));

const UpcContextMenu = ({ x, y, upc, allUpcs, severityUpcs, onClose }: UpcContextMenuProps) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  const items: { label: string; count: number | null; disabled: boolean; onClick: () => void }[] = [
    { label: "Copy UPC", count: null, disabled: !upc, onClick: () => copyToClipboard([upc]) },
    { label: "Copy all UPCs", count: allUpcs.length, disabled: allUpcs.length === 0, onClick: () => copyToClipboard(allUpcs) },
  ];

  if (severityUpcs) {
    items.push(
      { label: "Copy critical UPCs", count: severityUpcs.critical.length, disabled: severityUpcs.critical.length === 0, onClick: () => copyToClipboard(severityUpcs.critical) },
      { label: "Copy watch UPCs", count: severityUpcs.watch.length, disabled: severityUpcs.watch.length === 0, onClick: () => copyToClipboard(severityUpcs.watch) },
      { label: "Copy healthy UPCs", count: severityUpcs.healthy.length, disabled: severityUpcs.healthy.length === 0, onClick: () => copyToClipboard(severityUpcs.healthy) },
    );
  }

  return (
    <div
      ref={menuRef}
      data-testid="upc-ctx-menu"
      style={{ position: "fixed", top: y, left: x, zIndex: 9999 }}
      className="bg-custom-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[190px]"
    >
      {upc && (
        <div className="px-3 py-1.5 border-b border-gray-100">
          <div className="text-[9px] font-semibold uppercase tracking-wide text-gray-400">UPC</div>
          <div className="text-[12px] font-semibold text-content tabular-nums">{upc}</div>
        </div>
      )}
      {items.map((item) => (
        <button
          key={item.label}
          disabled={item.disabled}
          onClick={() => {
            if (item.disabled) return;
            item.onClick();
            onClose();
          }}
          className="w-full flex items-center justify-between gap-2 text-left px-3 py-2 text-[12px] text-content hover:bg-gray-50 disabled:text-gray-300 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-colors"
        >
          <span>{item.label}</span>
          {item.count !== null && (
            <span className="text-[10px] text-gray-400 tabular-nums">{item.count}</span>
          )}
        </button>
      ))}
    </div>
  );
};

export default UpcContextMenu;
