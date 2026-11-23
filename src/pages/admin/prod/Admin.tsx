// Hooks
import { useEffect, useState } from "react";
import { useAdminPageCtx } from "./hooks";
import { useResizableBox } from "../../../hooks/useResizableBox";
import { useToast } from "../../../components/toasts/hooks/useToast";

// Redux
import {
  setAdminForm,
  setCompanies,
} from "../../../features/adminPageSlice";

// API
import { getCompanies } from "../../../api/company";

// Utils
import { adminPanel, adminTabs } from "./utils";

// Interfaces
import type { CompanyJsonResp, JsonError } from "../../../interfaces";

// Components
import ResizeHandle from "../../../components/ResizeHandle";
import NoAdminAccess from "./components/NoAdminAccess";
import AdminHeader from "./components/AdminHeader";
import AdminTabs from "./components/AdminTabs";
import CompanyGrid from "./companies/CompanyGrid";
import StoreActivityComp from "./storeActivity/StoreActivityComp";
import SubDeptExclusions from "./subExclusions/SubDeptExclusions";
import StoreRecords from "./stores/StoreRecords";

/** The dev Admin page: a resizable box with tabs for Companies, Store Activity, Store Records and Sub Dept
 *  Exclusions. The Store Activity header shows the store and missing counts and an Export CSV button.
 *  Accounts below the access level see a "not available" notice instead. */
const Admin = () => {
  const toast = useToast();
  const context = useAdminPageCtx();
  const { dispatch } = context;
  const [exportOpen, setExportOpen] = useState<boolean>(false);
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
    (t) =>
      (context.isProgrammer || !t.programmerOnly) &&
      (context.canSeeAllStores || !t.supportOnly),
  );

  useEffect(() => {
    if (!tabs.some((t) => t.id === context.adminForm)) {
      dispatch(setAdminForm(tabs[0].id));
    }
  }, [context.isProgrammer, context.canSeeAllStores, context.adminForm]);

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
  if (!context.canOpenAdmin) return <NoAdminAccess />;

  return (
    <div className="min-h-[calc(100vh-3rem)] pt-12 px-4 pb-4 flex justify-center">
      <div
        ref={boxRef}
        className="relative max-w-[95vw] max-h-[calc(100vh-8rem)] cc-panel shadow-lg self-start"
        style={{ width, height }}
      >
        <AdminHeader
          showActivity={context.adminForm === "store_activity"}
          storeCount={context.companyStoresActivity.length}
          missingCount={missingCount}
          onExport={() => setExportOpen(true)}
        />

        <AdminTabs
          tabs={tabs}
          active={context.adminForm}
          onPick={(id) => dispatch(setAdminForm(id))}
        />

        <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
          {renderActiveTab()}
        </div>

        <ResizeHandle {...handleProps} />
      </div>
    </div>
  );
};

export default Admin;
