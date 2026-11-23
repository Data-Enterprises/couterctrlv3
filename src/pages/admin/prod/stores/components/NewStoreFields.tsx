// Components
import Input from "../../../../../components/inputs/Input";
import SelectFilter from "../../../../../components/filters/SelectFilter";

interface NewStoreFieldsProps {
  storeId: string;
  setStoreId: (value: string) => void;
  /** The ID is not a whole number. */
  idInvalid: boolean;
  /** Another store already has this ID. */
  idTaken: boolean;
  storeNumber: string;
  setStoreNumber: (value: string) => void;
  /** Another store already has this number. */
  numberTaken: boolean;
  storeName: string;
  setStoreName: (value: string) => void;
  companies: { value: string; label: string }[];
  company: string;
  setCompany: (value: string) => void;
}

/** The new-store fields: Store ID, Store number, name and company, with the
 *  ID and number checked against the stores already there. */
const NewStoreFields = ({
  storeId,
  setStoreId,
  idInvalid,
  idTaken,
  storeNumber,
  setStoreNumber,
  numberTaken,
  storeName,
  setStoreName,
  companies,
  company,
  setCompany,
}: NewStoreFieldsProps) => (
  <div className="grid gap-3 mb-4">
    <div>
      <Input
        label="Store ID"
        value={storeId}
        setValue={setStoreId}
        className="py-1.5 text-[13px]"
      />
      {idInvalid && (
        <div className="text-[12px] text-brand_danger mt-1 leading-snug">
          Store ID must be a whole number.
        </div>
      )}
      {idTaken && (
        <div className="text-[12px] text-brand_danger mt-1 leading-snug">
          Store ID {storeId.trim()} is already in use.
        </div>
      )}
    </div>

    <div>
      <Input
        label="Store number"
        value={storeNumber}
        setValue={setStoreNumber}
        className="py-1.5 text-[13px]"
      />
      {numberTaken && (
        <div className="text-[12px] text-brand_danger mt-1 leading-snug">
          {storeNumber.trim()} is already in use. Store numbers scope sales,
          orders and receiving — two stores cannot share one.
        </div>
      )}
    </div>

    <Input
      label="Store name"
      value={storeName}
      setValue={setStoreName}
      className="py-1.5 text-[13px]"
    />

    {/* Input draws its own label, so this matches it rather than
        introducing a second label treatment in one column. */}
    <div>
      <div className="flex justify-between text-[11px] md:text-[13px] items-end pr-1.5 leading-tight">
        <label className="font-medium pl-0.5">Company</label>
      </div>
      <SelectFilter
        options={companies}
        value={company}
        onChange={setCompany}
        placeholder="Pick a company"
        className="w-full"
      />
    </div>
  </div>
);

export default NewStoreFields;
