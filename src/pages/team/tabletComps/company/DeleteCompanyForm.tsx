import { useState } from "react";
import { useAppSelector, useAppDispatch } from "../../../../hooks";
import { useToast } from "../../../../components/toasts/hooks/useToast";
import { deleteCompany } from "../../../../api/company";
import {
  resetCompanyInfo,
  setRefreshCompanies,
  setSelectedCompanyFormId,
} from "../../../../features/companySlice";
import Input from "../../../../components/inputs/Input";
import type { JsonError } from "../../../../interfaces";

const DeleteCompanyForm = () => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const { url, token } = useAppSelector((state) => state.app);
  const user = useAppSelector((state) => state.user);
  const { companies, selectedCompanyId, companyInfo } = useAppSelector(
    (state) => state.company,
  );

  const handleCompanyClick = (id: number) => {
    if (selectedCompanyId === id) {
      dispatch(resetCompanyInfo());
    } else {
      dispatch(setSelectedCompanyFormId(id));
    }
  };

  const handleSubmit = () => {
    deleteCompany(url, token, selectedCompanyId)
      .then((resp) => {
        const j = resp.data;
        if (j.error === 0) {
          toast.success(
            `Company: ${companyInfo.name} deleted, refreshing company list...`,
          );
          dispatch(resetCompanyInfo());
          setIsDeleting(false);
          dispatch(setRefreshCompanies(true));
        }
      })
      .catch((err: JsonError) => toast.error(err.message));
  };

  const filteredCompanies = [...companies].filter((c) =>
    user.companies.some((uc) => uc.company === c.id),
  );

  return (
    <div data-testid="delete-company-form-container">
      <div className="bg-custom-white rounded-lg shadow-lg p-2 w-3/4">
        <div className="text-[13px]">
          <div className="font-medium">Select company to delete</div>
          <div className="select-none grid grid-cols-2 gap-2 rounded-lg p-1 max-h-[60vh] overflow-hidden overflow-y-auto">
            {filteredCompanies.map((c, i) => (
              <div
                key={c.id}
                data-testid={`delete-company-select-${i}`}
                className={`${selectedCompanyId === c.id && "bg-[rgb(30,45,80)] text-custom-white"} rounded-full py-1 pl-2 border-b transition-all duration-200 cursor-pointer hover:bg-[rgb(30,45,80)]/75 hover:text-custom-white`}
                onClick={() => handleCompanyClick(c.id)}
              >
                {c.name}
              </div>
            ))}
          </div>
          <Input
            label="Company Name"
            value={companyInfo.name}
            setValue={() => {}}
            className="opacity-50 pointer-events-none py-1 text-[13px]"
          />
          <button
            data-testid="delete-company-step-one-btn"
            className={`${selectedCompanyId === 0 && "opacity-50 pointer-events-none"} mt-2 w-full btn-themeOrange bg-red-600 border-red-600 hover:text-custom-white px-0 py-1.5`}
            onClick={() => setIsDeleting(true)}
          >
            Delete
          </button>
        </div>
        {isDeleting ? (
          <div className="text-[13px] text-center">
            <div className="grid grid-cols-2 h-[1.5px] my-2">
              <div className="bg-gradient-to-r from-content/60 to-custom-white"></div>
              <div className="bg-gradient-to-l from-content/60 to-custom-white"></div>
            </div>
            <div>Are you sure you want to delete</div>
            <div>
              Company = <span className="font-medium">{companyInfo.name}</span>
            </div>
            <div className="text-center text-content/60 font-medium">
              This action cannot be undone
            </div>

            <div className="mt-2 grid grid-cols-2 gap-2">
              <button
                data-testid="delete-company-submit-btn"
                className="btn-themeGreen bg-red-600 border-red-600"
                onClick={handleSubmit}
              >
                Yes
              </button>
              <button
                data-testid="delete-company-reset-stepone-btn"
                className="btn-themeOrange bg-[rgb(30,45,80)] border-[rgb(30,45,80)]"
                onClick={() => setIsDeleting(false)}
              >
                No
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default DeleteCompanyForm;
