// Hooks
import { useMemo } from "react";
import { useTop200View } from "../hooks";

// Utils
import {
  deptName,
  deptOptions,
  sortTopItems,
  type TopItemCompared,
} from "../utils/topItems";

// Components
import ItemListHead from "./components/ItemListHead";
import ItemListToolbar from "./components/ItemListToolbar";
import ItemRows from "./components/ItemRows";

interface ItemListProps {
  /** The store's top 200, ranked by sales and joined to last week and last
   *  year. */
  ranked: TopItemCompared[];
}

/** The ranked list on the left: the search and department filter, the column
 *  heads, and the rows, narrowed and sorted as the reader set them. */
const ItemList = ({ ranked }: ItemListProps) => {
  const { search, setSearch, dept, setDept, sort, setSort } = useTop200View();

  const depts = useMemo(() => deptOptions(ranked), [ranked]);

  const shown = useMemo(() => {
    const q = search.trim().toLowerCase();
    const matched = ranked.filter((r) => {
      if (dept && deptName(r.ty) !== dept) return false;
      if (!q) return true;
      return (
        r.ty.product_description.toLowerCase().includes(q) ||
        r.ty.product_code.includes(q)
      );
    });
    return sortTopItems(matched, sort);
  }, [ranked, search, sort, dept]);

  return (
    <div className="w-[471px] flex-shrink-0 flex flex-col border-r border-line_hair">
      <ItemListToolbar
        search={search}
        setSearch={setSearch}
        dept={dept}
        setDept={setDept}
        depts={depts}
        shown={shown}
        ranked={ranked}
      />

      <ItemListHead sort={sort} setSort={setSort} />

      <ItemRows shown={shown} />
    </div>
  );
};

export default ItemList;
