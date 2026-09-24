import SearchCard from "../../../components-dev/SearchCard";
import ConfigPanel from "./ConfigPanel";
import CsvPreview from "./CsvPreview";
import SummaryPreview from "./SummaryPreview";
import ExportBar from "./ExportBar";
import SqlModal from "./SqlModal";
import QueryModal from "./QueryModal";
import DownloadsModal from "./DownloadsModal";
import SavedExportsModal from "./SavedExportsModal";
import { useExportBuilderCtx } from "./hooks";

/**
 * Sales Export — pick a scope, narrow what goes in the file, build it.
 *
 * Two calls and one screen. `export_preview` resolves the scope and describes
 * the data; every list on the left is that response. Narrowing is local, so
 * the sample redraws as it is ticked and nothing is fetched twice. `export`
 * then writes the file to storage and answers with a link.
 */
const ExportBuilder = () => {
  const ctx = useExportBuilderCtx();

  if (!ctx.loaded) {
    return (
      <SearchCard
        title="Sales Export"
        description="Pick a store or group and a date range. What comes back is the thing you configure: the stores it covers, the row types it holds and every column of the table."
        buttonLabel="Load config"
        loadingMessage="Reading the range..."
        loading={ctx.loadingConfig}
        onSearch={ctx.loadConfig}
      />
    );
  }

  return (
    <div className="h-[calc(100vh-3rem)] bg-bkg flex flex-col p-3 gap-3">
      <div className="flex gap-3 flex-1 min-h-0">
        <ConfigPanel />
        <div className="flex-1 min-w-0 flex flex-col gap-3">
          {!ctx.hasData ? (
            <div className="flex-1 bg-card_bg border border-brand_line rounded-xl flex items-center justify-center text-center px-6">
              <div className="max-w-[40ch]">
                <div className="text-[13.5px] font-semibold">
                  Nothing to export
                </div>
                <div className="text-[12.5px] text-content/70 mt-2 leading-relaxed">
                  {ctx.message ??
                    "There are no lines in this range for these stores."}
                </div>
                <div className="text-[12px] text-content/60 mt-3">
                  The column list is still here, so changing the dates keeps
                  every pick you have made.
                </div>
              </div>
            </div>
          ) : ctx.aggregating ? (
            <SummaryPreview />
          ) : (
            <CsvPreview />
          )}
          <ExportBar />
          <SqlModal />
          {ctx.queryOpen && <QueryModal />}
          {ctx.buildsOpen && <DownloadsModal />}
          {ctx.savedOpen && <SavedExportsModal />}
        </div>
      </div>
    </div>
  );
};

export default ExportBuilder;
