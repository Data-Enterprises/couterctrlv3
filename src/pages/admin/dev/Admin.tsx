import { useEffect, useState } from "react";
import { useAppDispatch } from "../../../hooks";
import { useAdminPageCtx } from "./hooks";
import { useToast } from "../../../components/toasts/hooks/useToast";
import { setAdminForm, setCompanies } from "../../../features/adminPageSlice";
import type { AdminForm } from "../../../features/adminPageSlice";
import { getCompanies } from "../../../api/company";
import type { CompanyJsonResp, JsonError } from "../../../interfaces";
import { ArrowDownTrayIcon } from "@heroicons/react/20/solid";
import CompanyGrid from "./CompanyGrid";
import StoreActivityComp from "./StoreActivityComp";
import NewStoreName from "./NewStoreName";

const TABS: { id: AdminForm; label: string }[] = [
  { id: "companies", label: "Companies" },
  { id: "store_activity", label: "Store activity" },
  { id: "new_store_name", label: "New store name" },
];

const Admin = () => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const context = useAdminPageCtx();
  const [exportOpen, setExportOpen] = useState(false);

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
        return <CompanyGrid />;
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

  return (
    <div className="min-h-[calc(100vh-3rem)] pt-12 px-4 pb-4 flex justify-center">
      <div className="max-w-[95vw] flex flex-col rounded-xl shadow-lg overflow-hidden bg-custom-white self-start">
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
                title="Export CSV"
                className="w-[20px] h-[20px] flex items-center justify-center rounded border border-white/20 text-custom-white/60 hover:text-custom-white hover:border-white/40 transition-colors flex-shrink-0"
              >
                <ArrowDownTrayIcon className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>

        <div className="flex border-b border-gray-100 flex-shrink-0">
          {TABS.map((tab) => (
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

        {renderActiveTab()}
      </div>
    </div>
  );
};

export default Admin;
