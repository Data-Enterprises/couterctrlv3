// Interfaces
import type {
  CompareFilter,
  CompareMetric,
  CompareTotals,
  compareDeptOptions,
} from "../utils/topItemsCompare";

// Components
import MultiSelectFilter from "../../../../../../../components/filters/MultiSelectFilter";
import SelectFilter from "../../../../../../../components/filters/SelectFilter";
import TextFilter from "../../../../../../../components/filters/TextFilter";

interface CompareFiltersProps {
  openStoreName: string;
  compareStoreName: string;
  totals: CompareTotals;
  itemCount: number;
  text: string;
  setText: (v: string) => void;
  filter: CompareFilter;
  setFilter: (f: CompareFilter) => void;
  deptOpts: ReturnType<typeof compareDeptOptions>;
  depts: string[];
  setDepts: (v: string[]) => void;
  metric: CompareMetric;
  setMetric: (m: CompareMetric) => void;
}

/** The comparison's filter bar: a search, which pile to show, departments,
 *  and whether a row reports the share gap or the sales gap. */
const CompareFilters = ({
  openStoreName,
  compareStoreName,
  totals,
  itemCount,
  text,
  setText,
  filter,
  setFilter,
  deptOpts,
  depts,
  setDepts,
  metric,
  setMetric,
}: CompareFiltersProps) => (
  <div
    data-help="top200-compare-filters"
    className="flex-shrink-0 flex items-center gap-2 px-4 py-2.5 border-b border-line_hair"
  >
    {/* The house search, not a hand-rolled one: SelectFilter is a fixed 24px
        and this was a rounded-lg at py-1.5 with no border, so the row never
        sat on one line. */}
    <TextFilter
      value={text}
      onChange={setText}
      placeholder="Item or code"
      className="w-[200px] flex-none"
    />

    {/*
      Dropdowns, not pills. A pile's label carries a store name, so three of
      them side by side ran to most of the row and truncated to "Only 015 -
      IGA HODGENVILL…" -- the part that tells two stores apart being the part
      that got cut. One control, four choices, and the chosen one reads in
      full.

      "" is the all-items value on purpose: SelectFilter adds its own clear
      row only when no option already holds "", and a second way to say the
      same thing is two answers to one question.
    */}
    <SelectFilter
      options={[
        { value: "both", label: `In both (${totals.both})` },
        {
          value: "mine",
          label: `Only ${openStoreName} (${totals.onlyMine})`,
        },
        {
          value: "theirs",
          label: `Only ${compareStoreName} (${totals.onlyTheirs})`,
        },
      ]}
      value={filter === "all" ? "" : filter}
      onChange={(v) => setFilter((v || "all") as CompareFilter)}
      placeholder={`All items (${itemCount})`}
      className="w-[210px] flex-none"
    />

    <MultiSelectFilter
      options={deptOpts}
      values={depts}
      onChange={setDepts}
      placeholder="All departments"
      noun="departments"
      className="w-[170px] flex-none"
    />

    {/* What a row REPORTS, not how the list is ordered -- the order follows
        it. `plain`, because this always holds a value: the active ring says
        "narrowing a list", which a choice of unit never does. */}
    <SelectFilter
      plain
      options={[
        { value: "", label: "Share gap" },
        { value: "sales", label: "Sales gap" },
      ]}
      value={metric === "sales" ? "sales" : ""}
      onChange={(v) => setMetric(v === "sales" ? "sales" : "share")}
      placeholder="Share gap"
      className="w-[120px] flex-none"
    />
  </div>
);

export default CompareFilters;
