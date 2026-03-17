import { useState, useEffect } from "react";
import { useAppSelector, useAppDispatch } from "../../../hooks";
import { useToast } from "../../../components/toasts/hooks/useToast";
import { formatGoliathDate } from "../../../utils";

import type {
  JsonError,
  StoresMissingSalesJsonResp,
} from "../../../interfaces";
import { getStoresMissingSales } from "../../../api/admin";
import {
  setExportMissingStoresModalOpen,
  setMissingStores,
  setStoreNameFilter,
} from "../../../features/adminSlice";

import SingleSelect from "../../../components/SingleSelect";
import SingleDatePicker from "../../../components/datePickers/SingleDatePicker";
import LoadingIndicator from "../../../components/loading/LoadingIndicator";
import { SuccessIcon } from "../../../components/toasts/Icons";
import Input from "../../../components/inputs/Input";

const StoresMissingSalesForm = () => {
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
    <div className="flex gap-4">
      <div className="min-w-[50%] max-w-[50%]">
        {/* filters */}
        <div className="space-y-2 bg-custom-white rounded-lg shadow-lg p-4">
          <SingleSelect
            id={1}
            label="Company"
            data={companies}
            displayKey="name"
            valueKey="company"
            onSelect={handleCompanySelect}
          />
          <SingleDatePicker />
          <div className="grid grid-cols-2 gap-2">
            <button
              data-testid="no-sales-submit-btn"
              className={`btn-themeBlue ${canSubmit}`}
              onClick={handleSubmit}
            >
              Submit
            </button>
            <button
              data-testid="export-missing-stores-btn"
              className={`btn-themeGreen ${canExport}`}
              onClick={openExportModal}
            >
              Export
            </button>
            <button
              data-testid="refresh-missing-stores-btn"
              className="btn-themeBlue col-span-2"
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
          <LoadingIndicator message="Fetching stores missing sales..." />
        </div>
      ) : null}

      {/* To show when stores missing sales are fetched */}
      {!isLoadingStores && storesMissingSales.length ? (
        <div className="min-w-[47%] max-w-[47%] overflow-hidden max-h-[75vh] bg-custom-white p-2 rounded-lg shadow-lg">
          <Input
            label={`Stores - ${filteredMissingStores.length}`}
            value={storeNameFilter}
            setValue={handleFilterChange}
            className="mb-2"
          />
          <div className="bg-[rgb(30,45,80)] rounded-t-lg grid grid-cols-[60%_20%_20%] text-custom-white font-medium py-0.5">
            <div className="pl-2 border-r">Name</div>
            <div className="pl-2 border-r">Num</div>
            <div className="pl-2">ID</div>
          </div>
          <div className=" max-h-[83%] overflow-hidden overflow-y-scroll no-scrollbar rounded-b-lg">
            {filteredMissingStores.map((s) => (
              <div
                key={s.storeid}
                className="grid grid-cols-[60%_20%_20%] text-sm odd:bg-custom-white even:bg-[#afb0b3] py-1"
              >
                <div className="pl-2 border-r">{s.store_name}</div>
                <div className="pl-2 border-r">{s.store_number}</div>
                <div className="pl-2">{s.storeid}</div>
              </div>
            ))}
          </div>
        </div>
      ) : showNoResults ? (
        <div className="bg-custom-white rounded-lg shadow-lg p-4 min-w-[47%] max-w-[47%] flex flex-col gap-2 items-center justify-center text-center font-medium text-sm">
          <SuccessIcon fill="#10b981" height={75} width={75} />
          <div>No stores missing sales for {singleDate} found</div>
        </div>
      ) : null}
    </div>
  );
};

export default StoresMissingSalesForm;
