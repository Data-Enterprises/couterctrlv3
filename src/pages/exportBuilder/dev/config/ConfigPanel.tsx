// Hooks
import { useState } from "react";
import { useExportBuilderCtx } from "../hooks/index";
import { useConfigText } from "./hooks";

// Redux
import { clearSelections } from "../../../../features/dev/devExportBuilderSlice";

// Utils
import { HELP_CONTENT } from "../../../../components-dev/help/content";

// Interfaces
import type { Section } from "./interfaces";

// Components
import HelpPanel from "../../../../components-dev/help/HelpPanel";
import AggregatesSection from "./components/AggregatesSection";
import ColumnsSection from "./components/ColumnsSection";
import ConfigHeader from "./components/ConfigHeader";
import DataLine from "./components/DataLine";
import DaysSection from "./components/DaysSection";
import FileLine from "./components/FileLine";
import GroupBySection from "./components/GroupBySection";
import ListFilterSection from "./components/ListFilterSection";
import OutputSection from "./components/OutputSection";
import ProductsSection from "./components/ProductsSection";
import StoresSection from "./components/StoresSection";

interface ConfigPanelProps {
  /** Change on the Data line: the search card, over the page. */
  onChangeSearch: () => void;
}

/**
 * The left panel: what the file holds, one fold-open row per question
 * (stores, days, the source's lists, products, columns, group by, aggregates,
 * output). Everything starts shut; each row's summary is its answer, so the
 * panel reads as decisions already made.
 *
 * Stores, lists and columns are the preview response and nothing else, so
 * nothing here has to be kept in step with the table. Output is the export
 * endpoint's switches, which the preview knows nothing about.
 */
const ConfigPanel = ({ onChangeSearch }: ConfigPanelProps) => {
  const ctx = useExportBuilderCtx();
  const [open, setOpen] = useState<Section | null>(null);
  const [help, setHelp] = useState(false);

  const {
    columnQuery,
    setColumnQuery,
    listQuery,
    setListQuery,
    groupQuery,
    setGroupQuery,
    codeText,
    onCodeText,
    clearCodes,
    descriptionText,
    onDescriptionText,
    clearTerms,
    fileName,
    onFileName,
  } = useConfigText({
    columns: ctx.columns,
    filePrefix: ctx.flags.filePrefix,
    productCodes: ctx.productCodes,
    productDescriptions: ctx.productDescriptions,
    dispatch: ctx.dispatch,
  });

  /** Opens a row, or shuts it when it is the one open. */
  const toggle = (section: Section) =>
    setOpen((current) => (current === section ? null : section));

  return (
    // Width belongs to the shell now, which animates it. This keeps its own so
    // the contents hold their layout while the sleeve closes over them.
    <div className="w-[340px] h-full cc-panel min-h-0 border border-brand_line">
      <ConfigHeader
        onHelp={() => setHelp(true)}
        onClear={() => {
          ctx.dispatch(clearSelections());
          setOpen(null);
        }}
      />
      <DataLine
        sourceLabel={ctx.source.label}
        building={ctx.building}
        onChangeSearch={onChangeSearch}
      />
      <FileLine
        aggregating={ctx.aggregating}
        keyCount={ctx.groupBy.length}
        measureCount={ctx.measureItems.length}
        selectedCount={ctx.selectedColumns.length}
        columnCount={ctx.columns.length}
      />

      <div className="flex flex-col gap-2 px-2.5 pb-2.5 min-h-0 overflow-y-auto thin-scrollbar">
        <StoresSection
          stores={ctx.stores}
          selectedStoreIds={ctx.selectedStoreIds}
          dispatch={ctx.dispatch}
          isOpen={open === "stores"}
          onToggle={() => toggle("stores")}
        />

        {ctx.days.length > 1 && (
          <DaysSection
            days={ctx.days}
            selectedDays={ctx.selectedDays}
            dispatch={ctx.dispatch}
            isOpen={open === "days"}
            onToggle={() => toggle("days")}
          />
        )}

        {ctx.source.lists.map((list) => (
          <ListFilterSection
            key={list.filter}
            list={list}
            items={ctx.lists[list.filter] ?? []}
            picked={ctx.picks[list.filter] ?? []}
            query={listQuery[list.filter] ?? ""}
            onQuery={(value) =>
              setListQuery((q) => ({ ...q, [list.filter]: value }))
            }
            dispatch={ctx.dispatch}
            isOpen={open === list.filter}
            onToggle={() => toggle(list.filter)}
          />
        ))}

        <ProductsSection
          productCodes={ctx.productCodes}
          productDescriptions={ctx.productDescriptions}
          codeText={codeText}
          onCodeText={onCodeText}
          onClearCodes={clearCodes}
          descriptionText={descriptionText}
          onDescriptionText={onDescriptionText}
          onClearTerms={clearTerms}
          isOpen={open === "productCodes"}
          onToggle={() => toggle("productCodes")}
        />

        <ColumnsSection
          aggregating={ctx.aggregating}
          columns={ctx.columns}
          columnOrder={ctx.columnOrder}
          selectedColumns={ctx.selectedColumns}
          columnQuery={columnQuery}
          onColumnQuery={setColumnQuery}
          dispatch={ctx.dispatch}
          isOpen={open === "columns"}
          onToggle={() => toggle("columns")}
        />

        <GroupBySection
          groupBy={ctx.groupBy}
          measureCount={ctx.measureItems.length}
          columns={ctx.columns}
          groupQuery={groupQuery}
          onGroupQuery={setGroupQuery}
          dispatch={ctx.dispatch}
          isOpen={open === "groupBy"}
          onToggle={() => toggle("groupBy")}
        />

        <AggregatesSection
          aggregates={ctx.aggregates}
          computed={ctx.computed}
          measureCount={ctx.measureItems.length}
          columns={ctx.columns}
          dispatch={ctx.dispatch}
          isOpen={open === "aggregates"}
          onToggle={() => toggle("aggregates")}
        />

        <OutputSection
          flags={ctx.flags}
          dateFormats={ctx.dateFormats}
          fileName={fileName}
          onFileName={onFileName}
          source={ctx.source}
          rowFlags={ctx.rowFlags}
          orderBy={ctx.orderBy}
          sortableKeys={ctx.sortableKeys}
          aggregating={ctx.aggregating}
          dispatch={ctx.dispatch}
          isOpen={open === "output"}
          onToggle={() => toggle("output")}
        />
      </div>

      {help && (
        <HelpPanel
          content={HELP_CONTENT["data-export"]}
          onClose={() => setHelp(false)}
        />
      )}
    </div>
  );
};

export default ConfigPanel;
