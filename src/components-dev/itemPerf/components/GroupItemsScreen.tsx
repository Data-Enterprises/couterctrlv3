// Hooks
import { useAppDispatch, useAppSelector } from "../../../hooks";
import { useItemPerfCtx } from "../hooks";

// Redux
import { openItemDetail, selectPerfItem } from "../../../features/dev/devItemPerfSlice";

// Components
import MobilePerfDetail from "../../mobile/MobilePerfDetail";
import MarginRowList from "./MarginRowList";
import ItemPerfInfoSheet from "./ItemPerfInfoSheet";

/** The items inside one department, vendor or category. */
const GroupItemsScreen = () => {
  const dispatch = useAppDispatch();
  const perf = useAppSelector((s) => s.dev.itemPerf);
  const { storeName, dayLabel, windowLabel, listLabel, query } = useItemPerfCtx();
  return (
    <>
      <MobilePerfDetail
        tabs={[{ key: "items", label: "Items" }]}
        active="items"
        onTab={() => {}}
        scopeName={`${perf.openGroup?.label ?? ""} · ${storeName}`}
        when={dayLabel || windowLabel}
        backLabel={listLabel}
        onBack={() => dispatch(openItemDetail(false))}
        levelKey={`items|${perf.openGroup?.key ?? ""}`}
      >
          <MarginRowList
            onRow={(r) => dispatch(selectPerfItem(r.key))}
            emptyText={
              query
                ? `Nothing matches "${query}".`
                : "Nothing recorded for this selection."
            }
            withQuery
          />
      </MobilePerfDetail>
      <ItemPerfInfoSheet />
    </>
  );
};

export default GroupItemsScreen;
