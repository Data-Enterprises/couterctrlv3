import type { ReactNode } from "react";
import SingleSelect from "./SingleSelect";
import type { Store } from "../interfaces";

interface SingleStoreSearchCardProps {
  title: string;
  description: string;
  buttonLabel?: string;
  stores: Store[];
  selectedStoreId: number;
  onStoreSelect: (id: number) => void;
  onSearch: () => void;
  loading?: boolean;
  datePicker: ReactNode;
  children?: ReactNode;
}

const SingleStoreSearchCard = ({
  title,
  description,
  buttonLabel = "Search",
  stores,
  selectedStoreId,
  onStoreSelect,
  onSearch,
  loading = false,
  datePicker,
  children,
}: SingleStoreSearchCardProps) => {
  const storeName = stores.find((s) => s.storeid === selectedStoreId)?.store_name ?? "";

  return (
    <div className="bg-custom-white rounded-2xl shadow-lg p-6 w-full max-w-sm flex flex-col gap-3">
      <div>
        <h2 className="text-base font-semibold text-content">{title}</h2>
        <p className="text-[12px] text-content/50 mt-1">{description}</p>
      </div>

      <SingleSelect
        label="Select Store"
        data={stores}
        displayKey="store_name"
        valueKey="storeid"
        onSelect={(id) => onStoreSelect(Number(id))}
        defaultQuery={selectedStoreId > 0 ? storeName : ""}
        innerClass="text-[13px] py-1"
        listClass="text-[13px]"
      />

      {datePicker}

      <button
        onClick={onSearch}
        disabled={selectedStoreId === 0 || loading}
        className="w-full py-2 text-sm font-semibold text-white rounded-lg bg-[#1e2a4a] hover:bg-[#2a3a63] transition-colors cursor-pointer select-none disabled:opacity-50"
      >
        {loading ? "Loading..." : buttonLabel}
      </button>

      {children}
    </div>
  );
};

export default SingleStoreSearchCard;
