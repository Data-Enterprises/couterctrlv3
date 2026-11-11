// Hooks
import { useEffect, useState } from "react";
import { useAdminPageCtx } from "./hooks";
import { useResizableBox } from "../../../hooks/useResizableBox";
import { useToast } from "../../../components/toasts/hooks/useToast";

// Redux
import {
  setAdminForm,
  setCompanies,
} from "../../../features/dev/devAdminPageSlice";

// API
import { getCompanies } from "../../../api/company";

// Utils
import { adminPanel, adminTabs } from "./utils";
import type { CompanyJsonResp, JsonError } from "../../../interfaces";

// Interfaces
import PageInfoButton from "../../../components-dev/PageInfoButton";
import ResizeHandle from "../../../components-dev/ResizeHandle";
import CompanyGrid from "./companies/CompanyGrid";
import StoreActivityComp from "./storeActivity/StoreActivityComp";
import SubDeptExclusions from "./subExclusions/SubDeptExclusions";
import StoreRecords from "./stores/StoreRecords";
import { ArrowDownTrayIcon } from "@heroicons/react/20/solid";

/** The dev Admin page: a resizable box with tabs for Companies, Store Activity, Store Records and Sub Dept
 *  Exclusions. The Store Activity header shows the store and missing counts and an Export CSV button.
 *  Accounts below the access level see a "not available" notice instead. */
const Admin = () => {
  const toast = useToast();
  const context = useAdminPageCtx();
  const { dispatch } = context;
  const [exportOpen, setExportOpen] = useState(false);
  const panel = adminPanel[context.adminForm] ?? adminPanel.companies;
  const { width, height, boxRef, handleProps } = useResizableBox({
    storageKey: panel.key,
    defaultWidth: panel.width,
    defaultHeight: panel.height,
    minWidth: 600,
    maxWidth: 1600,
    minHeight: 450,
    maxHeight: 950,
  });

  const tabs = adminTabs.filter(
    (t) => context.isProgrammer || !t.programmerOnly,
  );

  useEffect(() => {
    if (!tabs.some((t) => t.id === context.adminForm)) {
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
        return context.isProgrammer ? <CompanyGrid /> : null;
      case "store_activity":
        return (
          <StoreActivityComp
            exportOpen={exportOpen}
            setExportOpen={setExportOpen}
          />
        );
      case "store_records":
        return <StoreRecords />;
      case "sub_exclusions":
        return <SubDeptExclusions />;
    }
  };

  const missingCount = context.companyStoresActivity.filter(
    (s) => s.inactive_or_missing_days > 0,
  ).length;

  // The nav lists Admin from level 5 (prod still opens there), but the dev Admin opens at 7
  if (!context.canOpenAdmin) {
    return (
      <div className="min-h-[calc(100vh-3rem)] pt-12 px-4 pb-4 flex justify-center">
        <div className="self-start bg-custom-white rounded-xl shadow-lg px-6 py-5 max-w-[420px]">
          <p className="text-[13px] font-semibold text-content">
            Admin access isn’t available on this account
          </p>
          <p className="text-[12px] text-content/95 mt-1.5 leading-snug">
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
        <div className="bg-brand_navy px-3 py-2 flex-shrink-0 flex items-center gap-3">
          <span className="cc-navy-title text-[13px] flex-shrink-0">
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
                data-help="export"
                onClick={() => setExportOpen(true)}
                disabled={context.companyStoresActivity.length === 0}
                title="Export CSV"
                className="w-[20px] h-[20px] flex items-center justify-center rounded border border-custom-white/20 text-custom-white/95 hover:text-custom-white hover:border-custom-white/40 transition-colors flex-shrink-0 disabled:opacity-30 disabled:pointer-events-none"
              >
                <ArrowDownTrayIcon className="w-3.5 h-3.5" />
              </button>
            </>
          )}
          {context.adminForm !== "store_activity" && <div className="flex-1" />}
          <PageInfoButton page="admin" title="About Admin" />
        </div>

        <div className="flex border-b border-line_hair flex-shrink-0">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => dispatch(setAdminForm(tab.id))}
              className={`text-[12px] font-semibold py-2.5 px-4 whitespace-nowrap border-b-2 transition-colors ${
                context.adminForm === tab.id
                  ? "border-brand_navy text-brand_navy"
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
