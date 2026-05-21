import { useAppDispatch } from "../../../hooks";
import { useAdminContext, useAdminFormActions } from "../hooks";
import { useToast } from "../../../components/toasts/hooks/useToast";
import Input from "../../../components/inputs/Input";
import {
  resetCompanyForm,
  setDeleteCompanyModalOpen,
  setRefresh,
  setSelectedCompanyForm,
} from "../../../features/adminSlice";
import { deleteCompany } from "../../../api/company";
import type { JsonError } from "../../../interfaces";

const DeleteComp = () => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const context = useAdminContext();
  const actions = useAdminFormActions();

  const handleCompanySelect = (x: number) => {
    const form = context.companies.find((comp) => comp.id === Number(x));
    if (form) {
      if (context.companyForm.id === form.id) {
        dispatch(resetCompanyForm());
      } else {
        dispatch(setSelectedCompanyForm(form));
      }
    }
  };

  const handleReset = () => {
    dispatch(resetCompanyForm());
  };

  const handleDeleteComp = () => {
    deleteCompany(context.url, context.token, context.companyForm.id)
      .then((resp) => {
        const j = resp.data;
        if (j.error === 0) {
          dispatch(setRefresh(true));
          handleReset();
        }
      })
      .catch((err: JsonError) => toast.error(err.message));
  };

  const isSelected = (id: number) => {
    return id === context.companyForm.id;
  };

  const handleNoBtnClick = () => {
    dispatch(setDeleteCompanyModalOpen(false));
    dispatch(resetCompanyForm());
  };

  return (
    <div className="bg-custom-white p-2 rounded-lg shadow-lg text-sm min-w-[570px] max-w-[570px]">
      <div className="text-[12px] font-medium leading-snug">
        Select a company to delete
      </div>
      <div className="grid grid-cols-2 h-[1.5px] mb-2">
        <div className="bg-gradient-to-r from-[rgb(30,45,80)]/50 to-custom-white"></div>
        <div className="bg-gradient-to-l from-[rgb(30,45,80)]/50 to-custom-white"></div>
      </div>
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
      <div className="grid grid-cols-2 gap-2">
        <Input
          label="Name"
          value={context.companyForm.name}
          setValue={actions.setName}
          className="py-1 text-[13px]"
        />
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
        <div className="grid items-end gap-2">
          <button
            className={`${context.companyForm.id === 0 ? "opacity-50 pointer-events-none" : ""} btn-themeBlue bg-red-600 border-red-600 hover:bg-red-600/75 hover:text-custom-white py-1.5 text-[13px] px-0`}
            onClick={() => dispatch(setDeleteCompanyModalOpen(true))}
          >
            Delete
          </button>
        </div>
      </div>

      {context.deleteCompanyModalOpen ? (
        <div>
          <div className="grid grid-cols-2 h-[1.5px] mt-2">
            <div className="bg-gradient-to-r from-red-600/50 to-custom-white"></div>
            <div className="bg-gradient-to-l from-red-600/50 to-custom-white"></div>
          </div>
          <div className="flex flex-col gap-2 justify-center items-center mt-2">
            <div className="text-[12px] font-medium leading-snug text-center border border-red-600 rounded-md p-2 bg-red-100 w-1/2">
              <div>Are you sure you want to delete this company?</div>
              <div>Be advised this action cannot be undone...</div>
            </div>
            <div className="w-1/2 grid grid-cols-2 gap-2">
              <button
                className="btn-themeBlue bg-red-600 border-red-600 hover:bg-red-600/75 hover:text-custom-white py-1.5 text-[13px] px-0"
                onClick={handleDeleteComp}
              >
                Yes
              </button>
              <button
                className="btn-themeBlue bg-[rgb(30,45,80)] border-[rgb(30,45,80)] hover:bg-[rgb(30,45,80)]/75 hover:text-custom-white px-0 py-1.5 text-[13px]"
                onClick={handleNoBtnClick}
              >
                No
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default DeleteComp;
