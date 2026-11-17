// Redux
import {
  setPicks,
  togglePick,
  type ExportListItem,
} from "../../../../../features/dev/devExportBuilderSlice";

// Interfaces
import type { AppDispatch } from "../../../../../store";
import type { ListFilter } from "../../utils/sources";

// Components
import Checkbox from "../../../../../components-dev/Checkbox";
import AllNone from "./AllNone";
import ChoiceLabel from "./ChoiceLabel";
import ConfigRow from "./ConfigRow";
import ListSearch from "./ListSearch";

interface ListFilterSectionProps {
  list: ListFilter;
  items: ExportListItem[];
  picked: string[];
  /** What is typed in this list's search box. */
  query: string;
  onQuery: (value: string) => void;
  dispatch: AppDispatch;
  isOpen: boolean;
  onToggle: () => void;
}

/** One of the source's lists (sale types, vendors, departments…): all or none,
 *  its note, a search box for a long list, and the choices as its look draws
 *  them. */
const ListFilterSection = ({
  list,
  items,
  picked,
  query,
  onQuery,
  dispatch,
  isOpen,
  onToggle,
}: ListFilterSectionProps) => {
  // A long list matches on what is on screen, the id or the name, since people
  // have only one of the two.
  const q = query.trim().toLowerCase();
  const shownItems = list.search
    ? items.filter(
        (i) =>
          i.value.toLowerCase().includes(q) ||
          i.label.toLowerCase().includes(q),
      )
    : items;
  const choice = (item: ExportListItem) => (
    <Checkbox
      key={item.value}
      checked={picked.includes(item.value)}
      onChange={() =>
        dispatch(togglePick({ filter: list.filter, value: item.value }))
      }
      className={
        list.search
          ? "py-1.5 text-[12.5px] border-b border-brand_line last:border-0"
          : "text-[12.5px]"
      }
      label={<ChoiceLabel list={list} item={item} />}
    />
  );

  return (
    <ConfigRow
      label={list.label}
      isOpen={isOpen}
      onToggle={onToggle}
      summary={
        picked.length === items.length
          ? `all ${items.length}`
          : `${picked.length} of ${items.length}`
      }
    >
      <div className="px-3 pb-3 flex flex-col gap-1.5">
        <AllNone
          onAll={() =>
            dispatch(
              setPicks({
                filter: list.filter,
                values: items.map((i) => i.value),
              }),
            )
          }
          onNone={() => dispatch(setPicks({ filter: list.filter, values: [] }))}
        />
        {list.note && (
          <span className="text-[11px] text-content/95">{list.note}</span>
        )}
        {list.search ? (
          <>
            <ListSearch
              label={list.search}
              value={query}
              onChange={onQuery}
              shown={shownItems.length}
              total={items.length}
            />
            <div className="overflow-y-auto thin-scrollbar flex flex-col max-h-[38vh]">
              {shownItems.map(choice)}
            </div>
          </>
        ) : (
          items.map(choice)
        )}
        {list.empty && items.length === 0 && (
          <span className="text-[12px] text-content/95">{list.empty}</span>
        )}
      </div>
    </ConfigRow>
  );
};

export default ListFilterSection;
