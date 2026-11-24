// Hooks
import { useExportBuilderCtx } from "../hooks";

// Utils
import { previewFileName } from "./utils";

// Components
import PreviewHeader from "./components/PreviewHeader";
import SampleStrip from "./components/SampleStrip";
import PreviewEmpty from "./components/PreviewEmpty";
import SummaryTable from "./components/SummaryTable";
import SampleMissNote from "./components/SampleMissNote";

/**
 * The right panel when the file is a rollup rather than the lines. No
 * dragging: the endpoint writes the group keys in the order picked, then the
 * measures. The numbers are this configuration's arithmetic over the sample,
 * not the range, and the strip above them says so.
 */
const SummaryPreview = () => {
  const ctx = useExportBuilderCtx();
  const { columns, rows } = ctx.summary;
  const keys = ctx.groupBy;

  const name = previewFileName(
    ctx.flags.filePrefix || ctx.source.filePrefix,
    ctx.startDate,
    ctx.endDate,
    ctx.flags.fileFormat,
  );

  const measures = ctx.aggregates.length;
  const stores = ctx.selectedStoreIds.length;
  const counts = `${keys.length} key${keys.length === 1 ? "" : "s"} · ${measures} measure${
    measures === 1 ? "" : "s"
  }`;
  const status = `${stores} store${stores === 1 ? "" : "s"}`;

  return (
    <div className="flex-1 min-w-0 bg-card_bg border border-brand_line rounded-xl flex flex-col min-h-0 overflow-hidden">
      <PreviewHeader
        kind="summary"
        fileName={name}
        counts={counts}
        status={status}
      />

      <SampleStrip lines={ctx.visibleRows.length} />

      {columns.length === 0 ? (
        <PreviewEmpty kind="summary" />
      ) : (
        <SummaryTable columns={columns} rows={rows} keys={keys} />
      )}

      {columns.length > 0 && rows.length === 0 && (
        <SampleMissNote kind="summary" />
      )}
    </div>
  );
};

export default SummaryPreview;
