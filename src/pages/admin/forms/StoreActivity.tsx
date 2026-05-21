import { useAppDispatch, useAppSelector } from "../../../hooks";
import { useAdminContext } from "../hooks";
import { useToast } from "../../../components/toasts/hooks/useToast";
import {
  resetCompanyForm,
  setCompanyStoresActivity,
  setIsLoadingStoreActivity,
  setSelectedCompanyForm,
} from "../../../features/adminSlice";
import { getAllStoreActivity } from "../../../api/admin";
import type { JsonError, StoreActivityJsonResp } from "../../../interfaces";
import { formatGoliathDate } from "../../../utils";
import DatePickers from "../../../components/datePickers/DatePickers";
import { storeActivityColumns } from "..";

import "./forms.css";
import ExportModal from "../../../components/modals/ExportModal";
import { useState } from "react";
import LoadingIndicator from "../../../components/loading/LoadingIndicator";

const StoreActivity = () => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const context = useAdminContext();
  const { startDate, endDate } = useAppSelector((state) => state.search);
  const [openExportModal, setOpenExportModal] = useState<boolean>(false);

  const handleCompanySelect = (x: number) => {
    const form = context.companies.find((comp) => comp.id === Number(x));
    dispatch(setSelectedCompanyForm(form!));
  };

  const isSelected = (id: number) => {
    return id === context.companyForm.id;
  };

  const fetchStoreActivity = () => {
    dispatch(setCompanyStoresActivity([]));
    dispatch(setIsLoadingStoreActivity(true));
    getAllStoreActivity(
      context.url,
      context.token,
      formatGoliathDate(startDate),
      formatGoliathDate(endDate),
      context.companyForm.id,
    )
      .then((resp) => {
        const j: StoreActivityJsonResp = resp.data;
        if (j.error === 0) {
          dispatch(setCompanyStoresActivity(j.stores));
        }
      })
      .catch((err: JsonError) =>
        toast.error("Error fetching store activity. " + err.message),
      )
      .finally(() => dispatch(setIsLoadingStoreActivity(false)));
  };

  const handleReset = () => {
    dispatch(resetCompanyForm());
    dispatch(setCompanyStoresActivity([]));
  };

  return (
    <div className="bg-custom-white p-2 rounded-lg shadow-lg text-sm min-w-[570px] max-w-[570px]">
      <ExportModal
        isOpen={openExportModal}
        onClose={() => setOpenExportModal(false)}
        data={context.companyStoresActivity}
        columns={storeActivityColumns}
      />
      <div className="text-[12px] font-medium leading-snug">
        Select a company and date range to view store activity
      </div>
      <div className="grid grid-cols-2 h-[1.5px] mb-2">
        <div className="bg-gradient-to-r from-[rgb(30,45,80)]/50 to-custom-white"></div>
        <div className="bg-gradient-to-l from-[rgb(30,45,80)]/50 to-custom-white"></div>
      </div>
      <div className="space-y-2">
        <div className="flex flex-wrap gap-2 bg-bkg shadow-md p-2 max-h-36 rounded-md mb-2 text-[11px] overflow-y-auto">
          {context.companies.map((c, i) => (
            <div
              key={i}
              className={`cursor-pointer hover:bg-[rgb(30,45,80)]/75 hover:text-custom-white transition-all duration-200 rounded-full px-2 py-[1px] shadow-md ${isSelected(c.id) ? "bg-[rgb(30,45,80)] text-custom-white" : "bg-custom-white"}`}
              onClick={() => handleCompanySelect(c.id)}
            >
              {c.name}
            </div>
          ))}
        </div>
        <DatePickers showBtn={false} />
        <div className="grid grid-cols-3 gap-2">
          <button
            className={`${context.companyForm.id === 0 ? "opacity-50 pointer-events-none" : ""} btn-themeBlue bg-[rgb(30,45,80)] border-[rgb(30,45,80)] hover:bg-[rgb(30,45,80)]/75 hover:text-custom-white px-0 py-1.5 text-[13px]`}
            onClick={fetchStoreActivity}
          >
            Search
          </button>
          <button
            className={`${context.companyStoresActivity.length === 0 ? "opacity-50 pointer-events-none" : ""} btn-themeBlue bg-[rgb(30,45,80)] border-[rgb(30,45,80)] hover:bg-[rgb(30,45,80)]/75 hover:text-custom-white px-0 py-1.5 text-[13px]`}
            onClick={() => setOpenExportModal(true)}
          >
            Export
          </button>
          <button
            className={`${context.companyStoresActivity.length === 0 ? "opacity-50 pointer-events-none" : ""} btn-themeBlue bg-[rgb(30,45,80)] border-[rgb(30,45,80)] hover:bg-[rgb(30,45,80)]/75 hover:text-custom-white px-0 py-1.5 text-[13px]`}
            onClick={handleReset}
          >
            Reset
          </button>
        </div>
      </div>

      {context.isLoadingStoreActivity ? (
        <div className="relative h-28">
          <LoadingIndicator message="Loading store activity" />
        </div>
      ) : null}

      {context.companyStoresActivity.length > 0 && (
        <div className="text-[12.5px] shadow-md mt-4 rounded-lg">
          <div className="select-none grid grid-cols-[0.6fr_1.8fr_0.8fr_0.8fr_1fr] pb-1 bg-[rgb(30,45,80)]/10 font-semibold px-2 rounded-t-lg">
            <div>ID</div>
            <div>Store Name</div>
            <div
              className={`${context.companyStoresActivity.length > 20 ? "pr-3" : ""} text-right`}
            >
              Total Days
            </div>
            <div
              className={`${context.companyStoresActivity.length > 20 ? "pr-3" : ""} text-right`}
            >
              Days Active
            </div>
            <div
              className={`${context.companyStoresActivity.length > 20 ? "pr-3" : ""} text-right`}
            >
              Days Missing
            </div>
          </div>

          <div className="max-h-[calc(100vh-350px)] overflow-y-auto text-[12px] leading-snug company-stores-scroll rounded-b-lg overflow-hidden px-2 cursor-default">
            {context.companyStoresActivity.map((s, i) => (
              <div
                key={i}
                className="grid grid-cols-[0.6fr_1.8fr_0.8fr_0.8fr_1fr] border-b last:border-none border-b-[rgb(30,45,80)]/50 py-1"
              >
                <div>{s.storeid}</div>
                <div className="text-nowrap truncate">{s.store_name}</div>
                <div className="pr-0.5 text-right">{s.total_days_in_range}</div>
                <div className="pr-0.5 text-right">{s.active_days}</div>
                <div className="pr-0.5 text-right">
                  {s.inactive_or_missing_days}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default StoreActivity;
