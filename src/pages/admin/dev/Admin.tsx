import { useEffect, useState } from "react";
import { useAppDispatch } from "../../../hooks";
import { useAdminPageCtx } from "./hooks";
import { useToast } from "../../../components/toasts/hooks/useToast";
import { resetCompanyForm, setAdminForm, setCompanies } from "../../../features/adminPageSlice";
import type { AdminForm } from "../../../features/adminPageSlice";
import { getCompanies } from "../../../api/company";
import type { CompanyJsonResp, JsonError } from "../../../interfaces";
import { formatGoliathDate } from "../../../utils";
import { useAppSelector } from "../../../hooks";
import { MagnifyingGlassIcon, ArrowDownTrayIcon } from "@heroicons/react/20/solid";
import CreateComp from "./CreateComp";
import UpdateComp from "./UpdateComp";
import DeleteComp from "./DeleteComp";
import StoreActivityComp from "./StoreActivityComp";

const TABS: { id: AdminForm; label: string }[] = [
  { id: "create", label: "Create" },
  { id: "update", label: "Update" },
  { id: "delete", label: "Delete" },
  { id: "store_activity", label: "Store activity" },
];

const Admin = () => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const context = useAdminPageCtx();
  const { startDate, endDate } = useAppSelector((state) => state.search);
  const [searchOpen, setSearchOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);

  useEffect(() => {
    dispatch(resetCompanyForm());
  }, [context.adminForm, dispatch]);

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
      case "create":
        return <CreateComp />;
      case "update":
        return <UpdateComp />;
      case "delete":
        return <DeleteComp />;
      case "store_activity":
        return (
          <StoreActivityComp
            searchOpen={searchOpen}
            setSearchOpen={setSearchOpen}
            exportOpen={exportOpen}
            setExportOpen={setExportOpen}
          />
        );
    }
  };

  const missingCount = context.companyStoresActivity.filter((s) => s.inactive_or_missing_days > 0).length;

  return (
    <div className="h-[calc(100vh-3rem)] overflow-hidden p-4">
      <div className="flex flex-col h-full rounded-xl shadow-lg overflow-hidden bg-custom-white">

        {context.adminForm === "store_activity" ? (
          <div className="bg-[#1e2a4a] px-3 pt-1 pb-2.5 flex-shrink-0 flex flex-col gap-0">
            <div className="flex items-end gap-3 min-h-[22px]">
              <span className="text-white font-semibold text-[13px] flex-shrink-0">Admin</span>
              <span className="text-white/45 text-[10px] flex-shrink-0">
                {formatGoliathDate(startDate)} – {formatGoliathDate(endDate)}
              </span>
              <div className="flex-1" />
              <span className="text-white/45 text-[10px] uppercase tracking-wide">Stores</span>
              <span className="text-white text-[13px] font-medium">{context.companyStoresActivity.length}</span>
              <div className="w-px h-4 bg-white/15" />
              <span className="text-white/45 text-[10px] uppercase tracking-wide">Missing</span>
              <span className="text-white text-[13px] font-medium">{missingCount}</span>
            </div>
            <div className="flex items-center gap-2 pt-1.5 mt-1 border-t border-white/[0.08]">
              <button
                onClick={() => setSearchOpen(true)}
                aria-label="New search"
                className="w-[22px] h-[22px] flex items-center justify-center rounded border border-white/20 text-white/60 hover:text-white hover:border-white/40 transition-colors flex-shrink-0"
              >
                <MagnifyingGlassIcon className="w-3.5 h-3.5" />
              </button>
              <span className="text-[11px] font-medium text-white truncate">{context.companyForm.name}</span>
              <div className="flex-1" />
              <button
                onClick={() => setExportOpen(true)}
                title="Export CSV"
                className="w-[22px] h-[22px] flex items-center justify-center rounded border border-white/20 text-white/60 hover:text-white hover:border-white/40 transition-colors flex-shrink-0"
              >
                <ArrowDownTrayIcon className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-[#1e2a4a] px-3 py-2 flex-shrink-0">
            <span className="text-white font-semibold text-[13px]">Admin</span>
          </div>
        )}

        <div className="flex border-b border-gray-100 flex-shrink-0">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => dispatch(setAdminForm(tab.id))}
              className={`text-[11px] font-semibold py-2.5 whitespace-nowrap border-b-2 transition-colors flex-1 text-center ${
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
