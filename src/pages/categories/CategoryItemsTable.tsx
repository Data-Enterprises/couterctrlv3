import { useAppDispatch, useAppSelector } from "../../hooks";
import ItemMarginsTable from "../../components/ItemMarginsTable";
import {
  setItemThreshold,
  ITEM_THRESHOLD_DEFAULT,
} from "../../features/categoriesSlice";

/** The open category's items, on the shared item report.
 *
 *  Everything visual lives in components/ItemMarginsTable — this is only the
 *  wiring that says *which* rows, which is all that differs between here and
 *  the Vendors page.
 *
 *  The page's Sales/Qty toggle grades the item list too, same as it grades the
 *  category rows in the left panel — one control, one meaning. */
const CategoryItemsTable = () => {
  const dispatch = useAppDispatch();
  const { items, metric, selectedDay, loadingItems, itemThreshold } =
    useAppSelector((s) => s.categories);

  return (
    <ItemMarginsTable
      items={items}
      gradingMetric={metric === "qty" ? "qty" : "sales"}
      threshold={itemThreshold}
      thresholdDefault={ITEM_THRESHOLD_DEFAULT}
      onThresholdChange={(v) => dispatch(setItemThreshold(v))}
      selectedDay={selectedDay}
      loading={loadingItems}
    />
  );
};

export default CategoryItemsTable;
