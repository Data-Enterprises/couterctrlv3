import { useState, useEffect } from "react";
import { useAppSelector, useAppDispatch } from "../../../hooks";
import { useToast } from "../../../components/toasts/hooks/useToast";
import { formatGoliathDate } from "../../../utils";

import type {
  JsonError,
  MissingStore,
  StoresMissingSalesJsonResp,
} from "../../../interfaces";
import { getStoresMissingSales } from "../../../api/admin";
import { setMissingStores } from "../../../features/adminSlice";

import SingleSelect from "../../../components/SingleSelect";
import SingleDatePicker from "../../../components/datePickers/SingleDatePicker";
import LoadingIndicator from "../../../components/loading/LoadingIndicator";
import { WarningIcon } from "../../../components/toasts/Icons";
import Input from "../../../components/inputs/Input";

const StoresMissingSalesForm = () => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const { url, token } = useAppSelector((state) => state.app);
  const { companies } = useAppSelector((state) => state.user);
  const { singleDate } = useAppSelector((state) => state.search);
  const { storesMissingSales } = useAppSelector((state) => state.admin);

  const [companyId, setCompanyId] = useState<number>(0);
  const [isLoadingStores, setIsLoadingStores] = useState<boolean>(false);
  const [showNoResults, setShowNoResults] = useState<boolean>(false);
  const [storeNameFilter, setStoreNameFilter] = useState<string>("");
  const [filteredStores, setFilteredStores] = useState<MissingStore[]>([]);

  useEffect(() => {
    if (storesMissingSales.length) {
      const filtered = storesMissingSales.filter((s) =>
        s.store_name.toLowerCase().includes(storeNameFilter.toLowerCase()),
      );
      setFilteredStores(filtered);
    }
  }, [storesMissingSales, storeNameFilter]);

  const handleCompanySelect = (company: string | number) => {
    setCompanyId(Number(company));
  };

  const canSubmit =
    companyId > 0 && singleDate !== null ? "" : "opacity-50 cursor-not-allowed";

  const handleSubmit = () => {
    if (storesMissingSales.length) {
      dispatch(setMissingStores([]));
    }
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
    setStoreNameFilter(x);
  };

  return (
    <div className="flex gap-4">
      <div className="min-w-[50%] max-w-[50%]">
        {/* filters */}
        <div className="space-y-2 bg-custom-white rounded-lg shadow-lg p-4">
          <SingleSelect
            label="Company"
            data={companies}
            displayKey="name"
            valueKey="company"
            onSelect={handleCompanySelect}
          />
          <SingleDatePicker />
          <button
            className={`btn-themeBlue w-full ${canSubmit}`}
            onClick={handleSubmit}
          >
            Submit
          </button>
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
        <div className="min-w-[47%] max-w-[47%] overflow-hidden max-h-[75vh] rounded-b-lg">
          <Input
            label="Search Store Name"
            value={storeNameFilter}
            setValue={handleFilterChange}
            className="mb-2"
          />
          <div className="bg-[rgb(30,45,80)] rounded-t-lg grid grid-cols-[60%_20%_20%] text-custom-white font-medium py-0.5">
            <div className="pl-2 border-r">Name</div>
            <div className="pl-2 border-r">Num</div>
            <div className="pl-2">ID</div>
          </div>
          <div className=" max-h-[100%] overflow-hidden overflow-y-scroll no-scrollbar">
            {filteredStores.map((s) => (
              <div
                key={s.storeid}
                className="grid grid-cols-[60%_20%_20%] text-sm odd:bg-custom-white even:bg-[#afb0b3] py-1"
              >
                <div className="pl-2 border-r">{s.store_name}</div>
                <div className="pl-2 border-r">{s.store_number}</div>
                <div className="pl-2">{s.storeid}</div>
              </div>
              // <div key={s.storeid} className="rounded-lg shadow-lg text-sm p-2">
              //   <div className="flex gap-1">
              //     <div className="font-medium">Name:</div>
              //     <div>{s.store_name}</div>
              //   </div>
              //   <div className="flex gap-1">
              //     <div className="font-medium">Number:</div>
              //     <div>{s.store_number}</div>
              //   </div>
              //   <div className="flex gap-1">
              //     <div className="font-medium">ID:</div>
              //     <div>{s.storeid}</div>
              //   </div>
              // </div>
            ))}
          </div>
        </div>
      ) : showNoResults ? (
        <div className="bg-custom-white rounded-lg shadow-lg p-4 min-w-[47%] max-w-[47%] flex flex-col gap-2 items-center justify-center text-center font-medium text-sm">
          <WarningIcon fill="#f97316" height={75} width={75} />
          <div>No stores missing sales for {singleDate} found</div>
        </div>
      ) : null}
    </div>
  );
};

export default StoresMissingSalesForm;
