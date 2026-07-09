import { useAppDispatch } from "../../../hooks";
import { useAdminPageCtx, useAdminPageFormActions } from "./hooks";
import { useToast } from "../../../components/toasts/hooks/useToast";
import Input from "../../../components/inputs/Input";
import { resetCompanyForm, setRefresh } from "../../../features/adminPageSlice";
import { createCompany } from "../../../api/company";
import type { JsonError } from "../../../interfaces";
import CompanyPicker from "./CompanyPicker";

const CreateComp = () => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const context = useAdminPageCtx();
  const actions = useAdminPageFormActions();

  const handleReset = () => {
    dispatch(resetCompanyForm());
  };

  const handleCreateComp = () => {
    createCompany(context.url, context.token, context.companyForm)
      .then((resp) => {
        const j = resp.data;
        if (j.error === 0) {
          dispatch(setRefresh(true));
          handleReset();
          toast.success("Company created successfully");
        }
      })
      .catch((err: JsonError) => toast.error(err.message));
  };

  const alreadyExists = context.companies.some(
    (c) => c.name.toLowerCase() === context.companyForm.name.toLowerCase() && context.companyForm.name !== "",
  );

  const { address, city, contact_email, state, zip, phone, name } = context.companyForm;

  const canSubmit =
    name !== "" &&
    address !== "" &&
    city !== "" &&
    contact_email !== "" &&
    state !== "" &&
    zip !== 0 &&
    phone !== "" &&
    !alreadyExists;

  const canClear =
    name !== "" ||
    address !== "" ||
    city !== "" ||
    contact_email !== "" ||
    state !== "" ||
    zip !== 0 ||
    phone !== "";

  return (
    <div className="flex flex-1 min-h-0">
      <CompanyPicker companies={context.companies} mode="reference" collisionName={context.companyForm.name} />

      <div className="flex-1 p-5 overflow-y-auto thin-scrollbar">
        <div className="text-[13px] font-semibold text-content mb-0.5">New company</div>
        <div className="text-[11px] text-content mb-4">Fill in the details below</div>

        <div className="grid grid-cols-2 gap-3 max-w-xl">
          <div className="relative">
            <Input label="Name" value={name} setValue={actions.setName} className="py-1.5 text-[13px]" />
            {alreadyExists && (
              <div className="text-[10px] text-red-600 mt-1">Company name already exists</div>
            )}
          </div>
          <Input label="Address" value={address} setValue={actions.setAddress} className="py-1.5 text-[13px]" />
          <Input label="City" value={city} setValue={actions.setCity} className="py-1.5 text-[13px]" />
          <Input label="State" value={state} setValue={actions.setState} className="py-1.5 text-[13px]" />
          <Input
            label="Zip"
            value={zip === 0 ? "" : zip.toString()}
            setValue={actions.setZip}
            className="py-1.5 text-[13px]"
          />
          <Input label="Phone" value={phone} setValue={actions.setPhone} className="py-1.5 text-[13px]" />
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
          <button onClick={handleReset} disabled={!canClear} className="text-[11px] text-content disabled:opacity-40 transition-colors">
            Reset fields
          </button>
          <button
            onClick={handleCreateComp}
            disabled={!canSubmit}
            className={`text-[11px] font-medium px-4 py-1.5 rounded-md transition-colors text-white ${
              canSubmit ? "bg-[#1e2a4a] hover:bg-[#1e2a4a]/85" : "bg-gray-300 cursor-not-allowed"
            }`}
          >
            Create company
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateComp;
