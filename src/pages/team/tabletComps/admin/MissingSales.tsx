import { useState, useEffect } from "react";
import { useAppSelector, useAppDispatch } from "../../../../hooks";
import { useToast } from "../../../../components/toasts/hooks/useToast";
import { formatGoliathDate } from "../../../../utils";

import type {
  JsonError,
  StoresMissingSalesJsonResp,
} from "../../../../interfaces";
import { getStoresMissingSales } from "../../../../api/admin";
import {
  setExportMissingStoresModalOpen,
  setMissingStores,
  setStoreNameFilter,
} from "../../../../features/adminSlice";

import SingleDatePicker from "../../../../components/datePickers/SingleDatePicker";
import LoadingIndicator from "../../../../components/loading/LoadingIndicator";
import { SuccessIcon } from "../../../../components/toasts/Icons";
import Input from "../../../../components/inputs/Input";

const MissingSales = () => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const { url, token } = useAppSelector((state) => state.app);
  const { companies } = useAppSelector((state) => state.user);
  const { singleDate } = useAppSelector((state) => state.search);
  const { storesMissingSales, filteredMissingStores, storeNameFilter } =
    useAppSelector((state) => state.admin);

  const [companyId, setCompanyId] = useState<number>(0);
  const [isLoadingStores, setIsLoadingStores] = useState<boolean>(false);
  const [showNoResults, setShowNoResults] = useState<boolean>(false);

  useEffect(() => {
    return () => {
      dispatch(setMissingStores([]));
      dispatch(setStoreNameFilter(""));
    };
  }, []);

  const handleCompanySelect = (company: string | number) => {
    setCompanyId(Number(company));
  };

  const canSubmit =
    companyId > 0 && singleDate !== null ? "" : "opacity-50 cursor-not-allowed";

  const canExport = storesMissingSales.length
    ? ""
    : "opacity-50 cursor-not-allowed";

  const handleSubmit = () => {
    if (storesMissingSales.length) {
      dispatch(setMissingStores([]));
    }
    dispatch(setStoreNameFilter(""));
    setShowNoResults(false);
    setIsLoadingStores(true);
    getStoresMissingSales(url, token, companyId, formatGoliathDate(singleDate))
      .then((resp) => {
        const j: StoresMissingSalesJsonResp = resp.data;
        if (j.error === 0 && j.missing.length) {
          dispatch(setMissingStores(j.missing));
        } else {
          setShowNoResults(true);
        }
      })
      .catch((err: JsonError) => toast.error(err.message))
      .finally(() => setIsLoadingStores(false));
  };

  const handleFilterChange = (x: string) => {
    dispatch(setStoreNameFilter(x));
  };

  const openExportModal = () => {
    dispatch(setExportMissingStoresModalOpen(true));
  };

  const handleRefresh = () => {
    dispatch(setMissingStores([]));
  };

  return (
    <div className="flex gap-2">
      <div className="min-w-[50%] max-w-[50%]">
        {/* filters */}
        <div className="space-y-1.5 bg-custom-white rounded-lg shadow-lg p-2">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 mb-1.5">
              Companies
            </div>
            <div className="flex flex-wrap gap-1.5">
              {companies.map((c, i) => (
                <button
                  key={i}
                  onClick={() => handleCompanySelect(c.company)}
                  className={`px-2 py-1.5 rounded-full text-[11.5px] font-medium transition-all duration-200 ${
                    companyId === c.company
                      ? "bg-[rgb(30,45,80)]/75 text-custom-white shadow-md"
                      : "bg-bkg"
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>
          <SingleDatePicker className="py-1 text-[13px]" />
          <div className="grid grid-cols-2 gap-2">
            <button
              data-testid="no-sales-submit-btn"
              className={`btn-themeBlue text-[13px] bg-[rgb(30,45,80)] border-[rgb(30,45,80)] hover:bg-[rgb(30,45,80)]/75 hover:text-custom-white px-0 py-1.5 ${canSubmit}`}
              onClick={handleSubmit}
            >
              Submit
            </button>
            <button
              data-testid="export-missing-stores-btn"
              className={`btn-themeGreen text-[13px] bg-[rgb(30,45,80)] border-[rgb(30,45,80)] hover:bg-[rgb(30,45,80)]/75 hover:text-custom-white px-0 py-1.5 ${canExport}`}
              onClick={openExportModal}
            >
              Export
            </button>
            <button
              data-testid="refresh-missing-stores-btn"
              className="btn-themeBlue text-[13px] bg-[rgb(30,45,80)] border-[rgb(30,45,80)] hover:bg-[rgb(30,45,80)]/75 hover:text-custom-white px-0 py-1.5 col-span-2"
              onClick={handleRefresh}
            >
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* To show only when fetching stores */}
      {isLoadingStores ? (
        <div className="min-w-[47%] max-w-[47%] relative">
          <LoadingIndicator message="Fetching missing sales..." />
        </div>
      ) : null}

      {/* To show when stores missing sales are fetched */}
      {!isLoadingStores && storesMissingSales.length ? (
        <div className="min-w-[47%] max-w-[47%] overflow-hidden max-h-[75vh] bg-custom-white p-3 rounded-xl shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <div className="text-[13px] font-semibold ">
              Stores Missing Sales
            </div>
            <div className="rounded-full bg-slate-200/70 px-2.5 py-1 text-[11px] font-medium text-slate-700">
              {filteredMissingStores.length}
            </div>
          </div>

          <Input
            label="Search stores"
            value={storeNameFilter}
            setValue={handleFilterChange}
            className="mb-2 py-1.5 text-[13px]"
          />

          <div className="space-y-2 max-h-[50vh] overflow-y-auto no-scrollbar pr-1">
            {filteredMissingStores.map((s) => (
              <div
                key={s.storeid}
                className="group rounded-xl border border-slate-200/70 bg-bkg p-3 shadow-sm hover:border-slate-300 hover:bg-slate-50 hover:shadow-md transition-all duration-200"
              >
                <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 mb-1">
                  Store Name
                </div>
                <div className="text-[14px] font-semibold text-slate-900 mb-1">
                  {s.store_name}
                </div>
                <div className="grid grid-cols-2 gap-3 text-[12px]">
                  <div>
                    <div className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
                      Store Number
                    </div>
                    <div className="font-medium text-slate-800">
                      {s.store_number}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
                      Store ID
                    </div>
                    <div className="font-medium text-slate-800">
                      {s.storeid}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : showNoResults ? (
        <div className="bg-gradient-to-b from-white to-slate-50 rounded-2xl shadow-sm p-6 min-w-[47%] max-w-[47%] border border-slate-200/50 flex flex-col gap-3 items-center justify-center text-center">
          <SuccessIcon fill="#10b981" height={75} width={75} />
          <div className="text-lg font-semibold text-slate-800">
            No stores missing sales for {singleDate} found
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default MissingSales;
