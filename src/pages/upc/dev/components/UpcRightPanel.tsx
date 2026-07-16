import { useState } from "react";
import { ArrowDownTrayIcon } from "@heroicons/react/16/solid";
import { useUpcDevCtx } from "../hooks/useUpcDevCtx";
import { useAppDispatch } from "../../../../hooks";
import { setDevActiveTab, UPC_DEV_TABS } from "../../../../features/upcDevSlice";

import UpcKpiStrip from "./UpcKpiStrip";
import UpcExportModal from "./UpcExportModal";
import SalesCompTab from "../modules/salesComp/SalesCompTab";

import PriceOptTab from "../modules/priceOpt/PriceOptTab";
import TrendTab from "../modules/trend/TrendTab";
import AssociationTab from "../modules/association/AssociationTab";

const UpcRightPanel = () => {
  const ctx = useUpcDevCtx();
  const dispatch = useAppDispatch();
  const [exportOpen, setExportOpen] = useState(false);

  const activeTabLabel = UPC_DEV_TABS.find((t) => t.id === ctx.activeTab)?.label ?? "";

  return (
    <div className="flex-1 min-w-0 shadow-lg">
      <div className="bg-custom-white rounded-xl shadow-sm overflow-hidden flex flex-col h-full">

        {/* 1-row navy header */}
        <div className="flex-shrink-0 px-4 py-3 flex items-start justify-between bg-[#1e2a4a]">
          <div>
            <div className="text-[13px] font-semibold text-custom-white leading-tight">
              {activeTabLabel}
            </div>
            <div className="text-[10px] mt-0.5" style={{ color: "rgb(var(--color-custom-white) / 0.50)" }}>
              {ctx.selectedUpcs.length > 0
                ? `${ctx.selectedUpcs.length} of ${ctx.upcItems.length} selected`
                : "Select UPCs to view report"}
            </div>
          </div>
          <button
            className="flex items-center justify-center w-[22px] h-[22px] rounded border text-custom-white/60 hover:text-custom-white hover:border-custom-white/40 transition-colors"
            style={{ borderColor: "rgb(var(--color-custom-white) / 0.20)" }}
            onClick={() => setExportOpen(true)}
            title="Export"
          >
            <ArrowDownTrayIcon className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Tabs — above the KPI strip, since the strip's content is now
            tab-contextual rather than one fixed shape */}
        <div className="flex items-center border-b border-gray-100 px-3 flex-shrink-0 overflow-x-auto thin-scrollbar">
          {UPC_DEV_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => dispatch(setDevActiveTab(tab.id))}
              className={`px-3 py-2 text-[12px] font-medium border-b-2 transition-colors whitespace-nowrap ${
                ctx.activeTab === tab.id
                  ? "border-[#1e2a4a] text-content"
                  : "border-transparent text-content"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* KPI strip — per-tab content */}
        <UpcKpiStrip />

        {/* Tab content — all tabs always mounted so background fetches fire immediately */}
        <div className="flex-1 overflow-hidden flex flex-col min-h-0 relative">
          {ctx.selectedUpcs.length === 0 && (
            <div className="absolute inset-0 z-10 bg-custom-white flex flex-col items-center justify-center gap-2">
              <div className="text-[11px] font-medium text-content/40">No UPCs selected</div>
              <div className="text-[10px] text-content/30">Select one or more items from the left panel</div>
            </div>
          )}
          <div className={ctx.activeTab === "salesComp" ? "flex flex-col flex-1 min-h-0" : "hidden"}><SalesCompTab /></div>

          <div className={ctx.activeTab === "priceOpt" ? "flex flex-col flex-1 min-h-0" : "hidden"}><PriceOptTab /></div>
          <div className={ctx.activeTab === "trend" ? "flex flex-col flex-1 min-h-0" : "hidden"}><TrendTab /></div>
          <div className={ctx.activeTab === "association" ? "flex flex-col flex-1 min-h-0" : "hidden"}><AssociationTab /></div>
        </div>
      </div>

      {exportOpen && (
        <UpcExportModal onClose={() => setExportOpen(false)} />
      )}
    </div>
  );
};

export default UpcRightPanel;
