import { useEffect, useRef } from "react";
import { XMarkIcon } from "@heroicons/react/16/solid";

export type InfoGlossaryEntry = {
  term: string;
  desc: string;
  subEntries?: { label: string; desc: string }[];
};

interface InfoPopoverProps {
  title: string;
  purpose: string;
  glossary: InfoGlossaryEntry[];
  onClose: () => void;
  className?: string;
}

// Generic navy sliding info card — anchored below whatever trigger renders
// it (default position assumes a top-right "?" icon in a header), dismisses
// on click-outside. Content-agnostic: pass title/purpose/glossary from a
// per-page content file, this component only owns the shell.
const InfoPopover = ({ title, purpose, glossary, onClose, className }: InfoPopoverProps) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className={`absolute top-full right-0 w-[300px] bg-[#1e2a4a] rounded-b-lg shadow-xl overflow-hidden z-50 animate-slidedown ${className ?? ""}`}
    >
      <div
        className="px-3.5 py-2.5 flex items-center justify-between flex-shrink-0 border-b"
        style={{ borderColor: "rgb(var(--color-custom-white) / 0.15)" }}
      >
        <span className="text-[12px] font-semibold text-custom-white">{title}</span>
        <button onClick={onClose} className="text-custom-white/85 hover:text-custom-white transition-colors">
          <XMarkIcon className="h-3.5 w-3.5" />
        </button>
      </div>

      <div
        className="px-3.5 py-2.5 border-b"
        style={{ borderColor: "rgb(var(--color-custom-white) / 0.15)" }}
      >
        <p className="text-[11px] text-custom-white/85 leading-relaxed">{purpose}</p>
      </div>

      <div className="px-3.5 py-2.5 flex flex-col gap-2.5 max-h-[400px] overflow-y-auto thin-scrollbar">
        {glossary.map((entry) => (
          <div key={entry.term}>
            <div className="text-[11px] font-semibold text-custom-white">{entry.term}</div>
            <div className="text-[10px] text-custom-white/85 leading-relaxed">{entry.desc}</div>
            {entry.subEntries?.map((sub) => (
              <div key={sub.label} className="text-[10px] text-custom-white/85 leading-relaxed mt-1">
                <span className="font-semibold text-custom-white">{sub.label}</span> — {sub.desc}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default InfoPopover;
