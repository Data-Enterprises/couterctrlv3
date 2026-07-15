import { useAppDispatch } from "../../../hooks";
import { useAdminPageCtx, useAdminPageFormActions } from "./hooks";
import { useToast } from "../../../components/toasts/hooks/useToast";
import Input from "../../../components/inputs/Input";
import {
  resetCompanyForm,
  setRefresh,
  setSelectedCompanyForm,
} from "../../../features/adminPageSlice";
import { updateCompany } from "../../../api/company";
import type { JsonError } from "../../../interfaces";
import CompanyPicker from "./CompanyPicker";

const UpdateComp = () => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const context = useAdminPageCtx();
  const actions = useAdminPageFormActions();

  const handleReset = () => {
    dispatch(resetCompanyForm());
  };

  const handleSelect = (id: number) => {
    const form = context.companies.find((c) => c.id === id);
    if (!form) return;
    if (context.companyForm.id === form.id) {
      dispatch(resetCompanyForm());
    } else {
      dispatch(setSelectedCompanyForm(form));
    }
  };

  const handleUpdateComp = () => {
    updateCompany(context.url, context.token, context.companyForm)
      .then((resp) => {
        const j = resp.data;
        if (j.error === 0) {
          dispatch(setRefresh(true));
          handleReset();
          toast.success("Company updated successfully");
        }
      })
      .catch((err: JsonError) => toast.error(err.message));
  };

  const { id, address, city, contact_email, state, zip, phone, name } =
    context.companyForm;

  const canSubmit =
    id > 0 &&
    address !== "" &&
    city !== "" &&
    contact_email !== "" &&
    state !== "" &&
    zip !== 0 &&
    phone !== "";

  const canClear =
    id > 0 ||
    address !== "" ||
    city !== "" ||
    contact_email !== "" ||
    state !== "" ||
    zip !== 0 ||
    phone !== "";

  return (
    <div className="flex flex-1 min-h-0">
      <CompanyPicker
        companies={context.companies}
        mode="select"
        selectedId={id}
        onSelect={handleSelect}
      />

      <div className="flex-1 p-5 overflow-y-auto thin-scrollbar">
        {id > 0 ? (
          <>
            <div className="text-[13px] font-semibold text-content mb-0.5">
              {name}
            </div>
            <div className="text-[12px] text-content mb-4">
              Update company details
            </div>
          </>
        ) : (
          <>
            <div className="text-[13px] font-semibold text-content mb-0.5">
              Select a company
            </div>
            <div className="text-[12px] text-content mb-4">
              Pick a company from the list to update
            </div>
          </>
        )}

        <div className="grid grid-cols-2 gap-3 max-w-xl">
          <Input
            label="Name"
            value={name}
            setValue={actions.setName}
            className="py-1.5 text-[13px]"
          />
          <Input
            label="Address"
            value={address}
            setValue={actions.setAddress}
            className="py-1.5 text-[13px]"
          />
          <Input
            label="City"
            value={city}
            setValue={actions.setCity}
            className="py-1.5 text-[13px]"
          />
          <Input
            label="State"
            value={state}
            setValue={actions.setState}
            className="py-1.5 text-[13px]"
          />
          <Input
            label="Zip"
            value={zip === 0 ? "" : zip.toString()}
            setValue={actions.setZip}
            className="py-1.5 text-[13px]"
          />
          <Input
            label="Phone"
            value={phone}
            setValue={actions.setPhone}
            className="py-1.5 text-[13px]"
          />
          <div className="col-span-2">
            <Input
              label="Contact email"
              value={contact_email}
              setValue={actions.setContactEmail}
              className="py-1.5 text-[13px]"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-4 mt-5">
          <button
            onClick={handleReset}
            disabled={!canClear}
            className="text-[12px] text-content disabled:opacity-40 transition-colors"
          >
            Reset fields
          </button>
          <button
            onClick={handleUpdateComp}
            disabled={!canSubmit}
            className={`text-[12px] font-medium px-4 py-1.5 rounded-md transition-colors text-custom-white ${
              canSubmit
                ? "bg-[#1e2a4a] hover:bg-[#1e2a4a]/85"
                : "bg-gray-300 cursor-not-allowed"
            }`}
          >
            Save changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default UpdateComp;
