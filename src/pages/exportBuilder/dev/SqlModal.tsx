import { useState } from "react";
import Modal from "../../../components-dev/Modal";
import { useExportBuilderCtx } from "./hooks";
import { closeSql } from "../../../features/dev/devExportBuilderSlice";

/**
 * The statement this configuration would run.
 *
 * It comes from the export endpoint itself with `dryRun` on — same request,
 * same store resolution, same column validation, stopping short of writing —
 * so this is the query, not a reconstruction of it. Useful when a file comes
 * back holding something nobody expected: the answer is usually visible in the
 * WHERE clause.
 */
const SqlModal = () => {
  const ctx = useExportBuilderCtx();
  const [copied, setCopied] = useState(false);

  if (!ctx.sql) return null;

  const copy = () => {
    navigator.clipboard?.writeText(ctx.sql?.query ?? "").then(
      () => {
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1600);
      },
      () => setCopied(false),
    );
  };

  return (
    <Modal
      isOpen
      onClose={() => ctx.dispatch(closeSql())}
      modalClassName="bg-card_bg w-[860px] max-w-[92vw] max-h-[85vh]"
    >
      <div className="flex flex-col gap-3 p-4 min-h-0">
        <div className="flex items-baseline gap-3">
          <h2 className="text-[15px] font-semibold">The query this would run</h2>
          <span className="text-[11.5px] text-content/85">
            dry run · nothing was written
          </span>
          <div className="flex-1" />
          <button
            type="button"
            onClick={copy}
            className="text-[12px] font-medium px-3 py-1.5 rounded-lg border border-brand_line_2 hover:border-brand_slate transition-colors"
          >
            {copied ? "Copied" : "Copy"}
          </button>
          <button
            type="button"
            onClick={() => ctx.dispatch(closeSql())}
            className="text-[12px] font-medium px-3 py-1.5 rounded-lg bg-[#1e2a4a] hover:bg-[#2a3a63] text-custom-white transition-colors"
          >
            Close
          </button>
        </div>

        <pre className="flex-1 min-h-0 overflow-auto thin-scrollbar bg-custom-white border border-brand_line rounded-lg p-3 text-[11.5px] font-mono whitespace-pre-wrap break-words text-content">
          {ctx.sql.query}
        </pre>

        <dl className="grid grid-cols-[110px_1fr] gap-x-3 gap-y-1.5 text-[12px]">
          <dt className="text-content/85">Writes to</dt>
          <dd className="font-mono text-[11.5px] break-all">
            s3://{ctx.sql.bucket}/{ctx.sql.filePath}
          </dd>
          <dt className="text-content/85">Copy options</dt>
          <dd className="font-mono text-[11.5px]">{ctx.sql.copyOptions}</dd>
        </dl>
      </div>
    </Modal>
  );
};

export default SqlModal;
