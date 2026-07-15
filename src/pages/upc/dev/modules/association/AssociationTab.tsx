import { useEffect } from "react";
import { useUpcDevCtx } from "../../hooks/useUpcDevCtx";
import { useAppDispatch } from "../../../../../hooks";
import {
  setDevItemAssociations,
  setDevAssociationLoaded,
  setDevAssociationLoading,
  addDevAssociationLevel,
  truncateDevAssociationLevels,
  addDevAssocUpcParam,
  setDevReQueryAssociations,
  type ItemAssociate,
} from "../../../../../features/upcDevSlice";
import { getItemAssociation } from "../../../../../api/upc";

const fmtDate = (d: string) => {
  const [m, day, y] = d.split("/");
  return `${y}-${m.padStart(2, "0")}-${day.padStart(2, "0")}`;
};

const AssociationTab = () => {
  const ctx = useUpcDevCtx();
  const dispatch = useAppDispatch();
  const fetchInitial = async () => {
    if (!ctx.upcs.length || !ctx.storeids) return;
    dispatch(setDevAssociationLoading(true));
    try {
      const res = await getItemAssociation(
        ctx.url,
        ctx.token,
        fmtDate(ctx.startDate),
        fmtDate(ctx.endDate),
        ctx.storeids.split(",").map(Number).filter(Boolean),
        ctx.upcs,
        20,
        "all",
      );
      if (!res.data.error && res.data.items?.length) {
        dispatch(setDevItemAssociations([res.data.items as ItemAssociate[]]));
      } else {
        dispatch(setDevItemAssociations([]));
      }
    } finally {
      dispatch(setDevAssociationLoaded(true));
      dispatch(setDevAssociationLoading(false));
      dispatch(setDevReQueryAssociations(false));
    }
  };

  useEffect(() => {
    if (!ctx.associationLoaded && !ctx.associationLoading) {
      fetchInitial();
    }
  }, []);

  useEffect(() => {
    if (ctx.reQueryAssociations) {
      fetchInitial();
    }
  }, [ctx.reQueryAssociations]);

  const handleDrillDown = async (item: ItemAssociate, levelIndex: number) => {
    dispatch(truncateDevAssociationLevels(levelIndex + 1));
    dispatch(addDevAssocUpcParam(item.product_code));
    dispatch(setDevAssociationLoading(true));
    try {
      const params = [...ctx.selectedAssociationUpcParam, item.product_code];
      const res = await getItemAssociation(
        ctx.url,
        ctx.token,
        fmtDate(ctx.startDate),
        fmtDate(ctx.endDate),
        ctx.storeids.split(",").map(Number).filter(Boolean),
        params,
        20,
        "all",
      );
      if (!res.data.error && res.data.items?.length) {
        dispatch(addDevAssociationLevel(res.data.items as ItemAssociate[]));
      }
    } finally {
      dispatch(setDevAssociationLoading(false));
    }
  };

  if (!ctx.upcs.length) {
    return (
      <div className="flex items-center justify-center h-full text-[11px] text-content/30">
        Add UPCs to see associations
      </div>
    );
  }

  if (ctx.associationLoading) {
    return (
      <div className="flex items-center justify-center h-full text-[11px] text-content/40">
        Loading associations…
      </div>
    );
  }

  if (ctx.associationLoaded && !ctx.itemAssociations.length) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-2">
        <p className="text-[11px] text-content/30">No association data loaded</p>
        <button
          onClick={fetchInitial}
          className="px-3 py-1.5 rounded text-[11px] font-medium text-custom-white"
          style={{ background: "#1e2a4a" }}
        >
          Load Associations
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-x-auto overflow-y-hidden min-h-0">
      <div className="flex gap-0 h-full min-w-max">
        {ctx.itemAssociations.map((level, li) => (
          <div
            key={li}
            className="flex flex-col border-r border-gray-100"
            style={{ width: 220, minWidth: 220 }}
          >
            <div className="px-3 py-1.5 bg-gray-50 border-b border-gray-100 flex-shrink-0">
              <span className="text-[9px] font-semibold uppercase tracking-wide text-content/40">
                {li === 0 ? "Level 1" : `Level ${li + 1}`}
              </span>
            </div>
            <div className="flex-1 overflow-y-auto thin-scrollbar">
              {level.map((item) => (
                <button
                  key={item.product_code}
                  onClick={() => handleDrillDown(item, li)}
                  className="w-full text-left px-3 py-2 border-b border-gray-100 hover:bg-blue-50/60 transition-colors"
                >
                  <div className="text-[10px] font-medium text-content truncate">{item.product_description}</div>
                  <div className="flex items-center justify-between mt-0.5">
                    <span className="text-[9px] text-content/40 tabular-nums">{item.product_code}</span>
                    <span className="text-[9px] font-semibold text-content/70 tabular-nums">{item.qty} qty</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AssociationTab;
