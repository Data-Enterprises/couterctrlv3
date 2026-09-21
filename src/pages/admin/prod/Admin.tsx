import { useEffect, useState } from "react";
import { useAppDispatch } from "../../../hooks";
import { useAdminPageCtx } from "./hooks";
import { useResizableBox } from "../../../hooks/useResizableBox";
import ResizeHandle from "../../../components/ResizeHandle";
import { useToast } from "../../../components/toasts/hooks/useToast";
import { setAdminForm, setCompanies } from "../../../features/adminPageSlice";
import type { AdminForm } from "../../../features/adminPageSlice";
import { getCompanies } from "../../../api/company";
import type { CompanyJsonResp, JsonError } from "../../../interfaces";
import { ArrowDownTrayIcon } from "@heroicons/react/20/solid";
import CompanyGrid from "./CompanyGrid";
import StoreActivityComp from "./StoreActivityComp";
import NewStoreName from "./NewStoreName";

/** `programmerOnly` tabs act on records that aren't scoped to anyone — creating
 *  and deleting companies is a change to the whole tenancy, not to one
 *  operator's data, so it stays with level 9. */
const TABS: { id: AdminForm; label: string; programmerOnly?: boolean }[] = [
  { id: "companies", label: "Companies", programmerOnly: true },
  { id: "store_activity", label: "Store activity" },
  { id: "new_store_name", label: "New store name" },
];

const Admin = () => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const context = useAdminPageCtx();
  const [exportOpen, setExportOpen] = useState(false);
  const { width, height, boxRef, handleProps } = useResizableBox({
    storageKey: "admin-panel-size",
    defaultWidth: 820,
    defaultHeight: 640,
    minWidth: 600,
    maxWidth: 1600,
    minHeight: 450,
    maxHeight: 950,
  });

  const tabs = TABS.filter((t) => context.isProgrammer || !t.programmerOnly);

  // `adminForm` persists in the slice, so a level-5 user arriving after a
  // programmer used the same session would otherwise land on a tab that is no
  // longer in their strip — visible content under an invisible tab.
  useEffect(() => {
    if (!context.isProgrammer && context.adminForm === "companies") {
      dispatch(setAdminForm("store_activity"));
    }
  }, [context.isProgrammer, context.adminForm]);

  useEffect(() => {
    if (context.refresh) {
      getCompanies(context.url, context.token)
        .then((resp) => {
          const j: CompanyJsonResp = resp.data;
          if (j.error === 0) {
            dispatch(setCompanies(j.companies));
          }
        })
        .catch((err: JsonError) => toast.error(err.message));
    }
  }, [context.refresh]);

  const renderActiveTab = () => {
    switch (context.adminForm) {
      case "companies":
        // Belt and braces: the tab is gone and the effect above redirects, but
        // a render can happen between the two.
        return context.isProgrammer ? <CompanyGrid /> : null;
      case "store_activity":
        return (
          <StoreActivityComp
            exportOpen={exportOpen}
            setExportOpen={setExportOpen}
          />
        );
      case "new_store_name":
        return <NewStoreName />;
    }
  };

  const missingCount = context.companyStoresActivity.filter(
    (s) => s.inactive_or_missing_days > 0,
  ).length;

  // Nav hides Admin below level 5, but nav visibility is not access control —
  // the route is reachable by typing it. This is the actual gate.
  if (!context.canOpenAdmin) {
    return (
      <div className="min-h-[calc(100vh-3rem)] pt-12 px-4 pb-4 flex justify-center">
        <div className="self-start bg-custom-white rounded-xl shadow-lg px-6 py-5 max-w-[420px]">
          <p className="text-[13px] font-semibold text-content">
            Admin access isn’t available on this account
          </p>
          <p className="text-[12px] text-content/85 mt-1.5 leading-snug">
            It needs a higher access level. Speak to whoever manages your users
            if this looks wrong.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-3rem)] pt-12 px-4 pb-4 flex justify-center">
      <div
        ref={boxRef}
        className="relative max-w-[95vw] max-h-[calc(100vh-8rem)] flex flex-col rounded-xl shadow-lg overflow-hidden bg-custom-white self-start"
        style={{ width, height }}
      >
        <div className="bg-[#1e2a4a] px-3 py-2 flex-shrink-0 flex items-center gap-3">
          <span className="text-custom-white font-semibold text-[13px] flex-shrink-0">
            Admin
          </span>
          {context.adminForm === "store_activity" && (
            <>
              <div className="flex-1" />
              <span className="text-custom-white text-[10px] uppercase tracking-wide">
                Stores
              </span>
              <span className="text-custom-white text-[12px] font-medium">
                {context.companyStoresActivity.length}
              </span>
              <div className="w-px h-3.5 bg-custom-white/15" />
              <span className="text-custom-white text-[10px] uppercase tracking-wide">
                Missing
              </span>
              <span className="text-custom-white text-[12px] font-medium">
                {missingCount}
              </span>
              <button
                onClick={() => setExportOpen(true)}
                disabled={context.companyStoresActivity.length === 0}
                title="Export CSV"
                className="w-[20px] h-[20px] flex items-center justify-center rounded border border-custom-white/20 text-custom-white/60 hover:text-custom-white hover:border-custom-white/40 transition-colors flex-shrink-0 disabled:opacity-30 disabled:pointer-events-none"
              >
                <ArrowDownTrayIcon className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>

        <div className="flex border-b border-gray-100 flex-shrink-0">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => dispatch(setAdminForm(tab.id))}
              className={`text-[12px] font-semibold py-2.5 px-4 whitespace-nowrap border-b-2 transition-colors ${
                context.adminForm === tab.id
                  ? "border-[#1e2a4a] text-[#1e2a4a]"
                  : "border-transparent text-content"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
          {renderActiveTab()}
        </div>

        <ResizeHandle {...handleProps} />
      </div>
    </div>
  );
};

export default Admin;
