// Hooks
import { useState } from "react";
import { useMarkdownsCtx, useVisibleMarkdowns } from "../hooks";

// Utils
import { downloadCsv } from "../../../../utils/csvExport";
import { MARKDOWN_COLUMNS } from "../utils";
import { buildMarkdownsCsv, markdownsFileName } from "./utils";

// Interfaces
import type { MarkdownSortKey } from "../../../../interfaces/markdowns";

// Components
import { ArrowDownTrayIcon } from "@heroicons/react/16/solid";
import ResizableModalShell from "../../../../components-dev/modals/ResizableModalShell";
import ExportHeader from "./components/ExportHeader";
import ColumnPicker from "./components/ColumnPicker";

interface MarkdownsExportModalProps {
  onClose: () => void;
}

/** The export pop-up: the markdown lines exactly as filtered and sorted on
 *  screen, with the columns picked. Nothing is totalled. */
const MarkdownsExportModal = ({ onClose }: MarkdownsExportModalProps) => {
  const ctx = useMarkdownsCtx();
  const rows = useVisibleMarkdowns();
  const [chosen, setChosen] = useState<Set<MarkdownSortKey>>(
    () => new Set(MARKDOWN_COLUMNS.map((c) => c.key)),
  );

  const toggle = (key: MarkdownSortKey) =>
    setChosen((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const download = () => {
    const columns = MARKDOWN_COLUMNS.filter((c) => chosen.has(c.key));
    downloadCsv(
      buildMarkdownsCsv(rows, columns),
      markdownsFileName(ctx.scopeLabel, ctx.startDate, ctx.endDate),
    );
    onClose();
  };

  return (
    <ResizableModalShell
      onClose={onClose}
      storageKey="export-modal:markdowns:v1"
      defaultWidth={620}
      defaultHeight={620}
    >
      <ExportHeader onClose={onClose} />

      <div className="flex-1 overflow-y-auto thin-scrollbar px-4 pt-4 pb-2 space-y-4">
        <div className="space-y-1">
          <p className="text-[11px] text-content/95 uppercase tracking-wide font-medium">
            Data to include
          </p>
          <p className="text-[13px] font-medium text-content">Markdown lines</p>
          <p className="text-[11px] text-content/95">
            {rows.length.toLocaleString()} rows, as filtered and sorted on screen
          </p>
        </div>
        <ColumnPicker
          chosen={chosen}
          onToggle={toggle}
          onAll={(all) => setChosen(new Set(all ? MARKDOWN_COLUMNS.map((c) => c.key) : []))}
        />
      </div>

      <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 flex-shrink-0">
        <button onClick={onClose} className="text-[12px] text-content/95 hover:text-content transition-colors">
          Cancel
        </button>
        <button
          onClick={download}
          disabled={rows.length === 0 || chosen.size === 0}
          className="flex items-center gap-1.5 bg-brand_navy hover:bg-brand_navy/85 disabled:opacity-40 text-custom-white text-[12px] font-medium px-3 py-1.5 rounded-md transition-colors"
        >
          <ArrowDownTrayIcon className="w-3.5 h-3.5" />
          Download CSV
        </button>
      </div>
    </ResizableModalShell>
  );
};

export default MarkdownsExportModal;
