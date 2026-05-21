import { useAppDispatch } from "../../../hooks";
import { useAdminContext, useAdminFormActions } from "../hooks";
import { useToast } from "../../../components/toasts/hooks/useToast";
import Input from "../../../components/inputs/Input";
import { resetCompanyForm, setRefresh } from "../../../features/adminSlice";
import { createCompany } from "../../../api/company";
import type { JsonError } from "../../../interfaces";

const CreateComp = () => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const context = useAdminContext();
  const actions = useAdminFormActions();

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
        }
      })
      .catch((err: JsonError) => toast.error(err.message));
  };

  const alreadyExists = context.companies.some(
    (c) => c.name.toLowerCase() === context.companyForm.name.toLowerCase(),
  );

  const matchesFormName = (name: string) => {
    return name.toLowerCase() === context.companyForm.name.toLowerCase();
  };

  const { address, city, contact_email, state, zip, phone } =
    context.companyForm;

  const canSubmit =
    address !== "" &&
    city !== "" &&
    contact_email !== "" &&
    state !== "" &&
    zip !== 0 &&
    phone !== "" &&
    !alreadyExists;

  const canClear =
    address !== "" ||
    city !== "" ||
    contact_email !== "" ||
    state !== "" ||
    zip !== 0 ||
    phone !== "";

  return (
    <div className="bg-custom-white p-2 rounded-lg shadow-lg text-sm min-w-[570px] max-w-[570px]">
      <div className="text-[12px] font-medium leading-snug">
        Existing Companies
      </div>
      <div className="grid grid-cols-2 h-[1.5px] mb-2">
        <div className="bg-gradient-to-r from-[rgb(30,45,80)]/50 to-custom-white"></div>
        <div className="bg-gradient-to-l from-[rgb(30,45,80)]/50 to-custom-white"></div>
      </div>
      <div className="flex flex-wrap gap-2 bg-bkg shadow-md p-2 max-h-36 rounded-md mb-2 text-[11px] overflow-y-auto">
        {context.companies.map((c, i) => (
          <div
            key={i}
            className={`cursor-default select-none rounded-full px-2 py-[1px] shadow-md ${matchesFormName(c.name) ? "bg-[rgb(30,45,80)]/75 text-custom-white" : "bg-custom-white"}`}
          >
            {c.name}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="relative">
          <Input
            label="Name"
            value={context.companyForm.name}
            setValue={actions.setName}
            className="py-1 text-[13px]"
          />
          <div
            className={`${alreadyExists ? "absolute" : "hidden"} -top-0.5 right-1 text-red-600 font-medium text-[11px]`}
          >
            Company name already exists
          </div>
        </div>
        <Input
          label="Address"
          value={context.companyForm.address}
          setValue={actions.setAddress}
          className="py-1 text-[13px]"
        />
        <Input
          label="City"
          value={context.companyForm.city}
          setValue={actions.setCity}
          className="py-1 text-[13px]"
        />
        <Input
          label="State"
          value={context.companyForm.state}
          setValue={actions.setState}
          className="py-1 text-[13px]"
        />
        <Input
          label="Zip"
          value={
            context.companyForm.zip === 0
              ? ""
              : context.companyForm.zip.toString()
          }
          setValue={actions.setZip}
          className="py-1 text-[13px]"
        />
        <Input
          label="Phone"
          value={context.companyForm.phone}
          setValue={actions.setPhone}
          className="py-1 text-[13px]"
        />
        <Input
          label="Contact Email"
          value={context.companyForm.contact_email}
          setValue={actions.setContactEmail}
          className="py-1 text-[13px]"
        />
        <div className="grid grid-cols-2 items-end gap-2">
          <button
            className={`${!canSubmit ? "opacity-50 pointer-events-none" : ""} btn-themeBlue bg-[rgb(30,45,80)] border-[rgb(30,45,80)] hover:bg-[rgb(30,45,80)]/75 hover:text-custom-white py-1.5 text-[13px] px-0`}
            onClick={handleCreateComp}
          >
            Submit
          </button>
          <button
            className={`${!canClear ? "opacity-50 pointer-events-none" : ""} btn-themeBlue bg-[rgb(30,45,80)] border-[rgb(30,45,80)] hover:bg-[rgb(30,45,80)]/75 hover:text-custom-white px-0 py-1.5 text-[13px]`}
            onClick={handleReset}
          >
            Reset Fields
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateComp;
