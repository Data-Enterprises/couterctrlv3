// Hooks
import { useMemo } from "react";
import { useMarkdownsCtx, useVisibleMarkdowns } from "../hooks";

// Redux
import {
  clearMarkdownFilters,
  setMarkdownFilters,
} from "../../../../features/dev/devMarkdownsSlice";

// Utils
import { markAvailability } from "../../../../utils/filterAvailability";
import { FILTER_FIELDS, activeFilterCount, availableOptions, buildOptions } from "./utils";

// Interfaces
import type { MarkdownType } from "../../../../interfaces/markdowns";
import type { MarkdownFilterKey } from "../interfaces";

// Components
import MultiSelectFilter from "../../../../components-dev/filters/MultiSelectFilter";
import ThresholdFilter from "../../../../components-dev/filters/ThresholdFilter";
import Field from "../../../../components-dev/filters/Field";
import ConfigHeader from "./components/ConfigHeader";
import ConfigFooter from "./components/ConfigFooter";

interface MarkdownsConfigPanelProps {
  onOpenSearch: () => void;
}

/** The left panel, as Orders' browse view has it: a multi-select per filter,
 *  each built from the rows that came back; empty means all. */
const MarkdownsConfigPanel = ({ onOpenSearch }: MarkdownsConfigPanelProps) => {
  const ctx = useMarkdownsCtx();
  const visible = useVisibleMarkdowns();
  const { markdowns, filters, dispatch } = ctx;

  const options = useMemo(() => buildOptions(markdowns), [markdowns]);
  const reachable = useMemo(() => availableOptions(markdowns, filters), [markdowns, filters]);

  /** A filter's picks as the multi-select holds them: strings. */
  const picked = (key: MarkdownFilterKey) => (filters[key] as (string | number)[]).map(String);

  /** A multi-select's new picks, back in the filter's own type. */
  const setPicks = (key: MarkdownFilterKey, values: string[]) => {
    if (key === "subIds" || key === "categories")
      dispatch(setMarkdownFilters({ [key]: values.map(Number) }));
    else if (key === "types") dispatch(setMarkdownFilters({ types: values as MarkdownType[] }));
    else dispatch(setMarkdownFilters({ [key]: values }));
  };

  return (
    <div
      data-help="filters"
      className="cc-panel shadow-lg flex-shrink-0"
      style={{ width: 300 }}
    >
      <ConfigHeader onOpenSearch={onOpenSearch} />

      <div className="flex-1 overflow-y-auto thin-scrollbar p-3 flex flex-col gap-3">
        {FILTER_FIELDS.map((f) => (
          <Field key={f.key} label={f.label}>
            <MultiSelectFilter
              options={markAvailability(options[f.key], reachable[f.key], picked(f.key))}
              values={picked(f.key)}
              onChange={(v) => setPicks(f.key, v)}
              placeholder={f.all}
              noun={f.noun}
            />
          </Field>
        ))}

        <Field label="Markdown percent at least">
          <ThresholdFilter
            value={filters.minPercent === null ? null : { op: "gt", amount: filters.minPercent }}
            onChange={(v) => dispatch(setMarkdownFilters({ minPercent: v === null ? null : v.amount }))}
            showOp={false}
            suffix="%"
            placeholder="Markdown"
            stretch
          />
        </Field>
      </div>

      <ConfigFooter
        matched={visible.length}
        total={markdowns.length}
        active={activeFilterCount(filters)}
        onClear={() => dispatch(clearMarkdownFilters())}
      />
    </div>
  );
};

export default MarkdownsConfigPanel;
