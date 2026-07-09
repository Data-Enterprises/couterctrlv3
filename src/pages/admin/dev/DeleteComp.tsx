import { useAppDispatch } from "../../../hooks";
import { useAdminPageCtx } from "./hooks";
import { useToast } from "../../../components/toasts/hooks/useToast";
import {
  resetCompanyForm,
  setDeleteCompanyModalOpen,
  setRefresh,
  setSelectedCompanyForm,
} from "../../../features/adminPageSlice";
import { deleteCompany } from "../../../api/company";
import type { JsonError } from "../../../interfaces";
import CompanyPicker from "./CompanyPicker";

const fields: { label: string; key: "address" | "city" | "state" | "zip" | "phone" | "contact_email" }[] = [
  { label: "Address", key: "address" },
  { label: "City", key: "city" },
  { label: "State", key: "state" },
  { label: "Zip", key: "zip" },
  { label: "Phone", key: "phone" },
  { label: "Contact email", key: "contact_email" },
];

const DeleteComp = () => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const context = useAdminPageCtx();

  const handleReset = () => {
    dispatch(resetCompanyForm());
    dispatch(setDeleteCompanyModalOpen(false));
  };

  const handleSelect = (id: number) => {
    const form = context.companies.find((c) => c.id === id);
    if (!form) return;
    if (context.companyForm.id === form.id) {
      handleReset();
    } else {
      dispatch(setSelectedCompanyForm(form));
    }
  };

  const handleDeleteComp = () => {
    deleteCompany(context.url, context.token, context.companyForm.id)
      .then((resp) => {
        const j = resp.data;
        if (j.error === 0) {
          dispatch(setRefresh(true));
          handleReset();
          toast.success("Company deleted successfully");
        }
      })
      .catch((err: JsonError) => toast.error(err.message));
  };

  const { id, name } = context.companyForm;

  return (
    <div className="flex flex-1 min-h-0">
      <CompanyPicker companies={context.companies} mode="select" selectedId={id} onSelect={handleSelect} />

      <div className="flex-1 p-5 overflow-y-auto thin-scrollbar">
        {id > 0 ? (
          <>
            <div className="text-[13px] font-semibold text-content mb-0.5">{name}</div>
            <div className="text-[11px] text-content mb-4">Select a company to delete</div>

            <div className="grid grid-cols-2 gap-3 max-w-xl">
              {fields.map(({ label, key }) => (
                <div key={key}>
                  <div className="text-[9px] text-content mb-1">{label}</div>
                  <div className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-[13px] text-content">
                    {context.companyForm[key] || "—"}
                  </div>
                </div>
              ))}
            </div>

            {!context.deleteCompanyModalOpen && (
              <div className="flex justify-end mt-5">
                <button
                  onClick={() => dispatch(setDeleteCompanyModalOpen(true))}
                  className="text-[11px] font-medium px-4 py-1.5 rounded-md bg-red-600 hover:bg-red-600/85 text-white transition-colors"
                >
                  Delete
                </button>
              </div>
            )}

            {context.deleteCompanyModalOpen && (
              <div className="border border-red-300 bg-red-50 rounded-lg px-3.5 py-3 mt-5 max-w-xl">
                <div className="text-[11px] text-red-800 mb-2.5">
                  Delete {name}? This can't be undone.
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleDeleteComp}
                    className="text-[11px] font-medium px-3.5 py-1.5 rounded-md bg-red-600 hover:bg-red-600/85 text-white transition-colors"
                  >
                    Yes, delete
                  </button>
                  <button
                    onClick={() => dispatch(setDeleteCompanyModalOpen(false))}
                    className="text-[11px] font-medium px-3.5 py-1.5 rounded-md bg-white border border-gray-200 text-content transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            <div className="text-[13px] font-semibold text-content mb-0.5">Select a company</div>
            <div className="text-[11px] text-content">Pick a company from the list to delete</div>
          </>
        )}
      </div>
    </div>
  );
};

export default DeleteComp;
