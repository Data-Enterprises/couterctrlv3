import { useState } from "react";
import { useAppSelector, useAppDispatch } from "../../../hooks";
import { useToast } from "../../../components/toasts/hooks/useToast";
import { deleteCompany } from "../../../api/company";
import {
  resetCompanyInfo,
  setRefreshCompanies,
  setSelectedCompanyFormId,
} from "../../../features/companySlice";
import Input from "../../../components/inputs/Input";
import type { JsonError } from "../../../interfaces";

const DeleteCompany = () => {
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

  // if (isDeleting) {
  //   return (
  //     <div className="bg-custom-white rounded-lg shadow-lg p-2 text-[13px] w-[25vw] text-center">
  //       <div>Are you sure you want to delete</div>
  //       <div>
  //         Company = <span className="font-medium">{companyInfo.name}</span>
  //       </div>

  //       <div className="mt-2 grid grid-cols-2 gap-2">
  //         <button data-testid="delete-company-submit-btn" className="btn-themeGreen" onClick={handleSubmit}>
  //           Yes
  //         </button>
  //         <button
  //           data-testid="delete-company-reset-stepone-btn"
  //           className="btn-themeOrange"
  //           onClick={() => setIsDeleting(false)}
  //         >
  //           No
  //         </button>
  //       </div>
  //     </div>
  //   );
  // }

  const filteredCompanies = [...companies].filter((c) =>
    user.companies.some((uc) => uc.company === c.id),
  );

  return (
    <div
      data-testid="delete-company-form-container"
      className="bg-custom-white rounded-lg shadow-lg p-2 w-[25vw]"
    >
      <div className="text-[13px]">
        <div className="font-medium">Select company to delete</div>
        <div className="select-none grid rounded-lg p-1 max-h-[45vh] overflow-hidden overflow-y-auto">
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
          className={`${selectedCompanyId === 0 && "opacity-50 pointer-events-none"} mt-2 w-full btn-themeOrange bg-[rgb(30,45,80)] border-[rgb(30,45,80)] hover:bg-[rgb(30,45,80)]/75 hover:text-custom-white px-0 py-1.5`}
          onClick={() => setIsDeleting(true)}
        >
          Delete
        </button>
      </div>
      {isDeleting && (
        <div className="text-[13px] text-center">
          <div className="h-[1.5px] grid grid-cols-2 mt-2 mb-1">
            <div className="bg-gradient-to-r from-content/60 to-custom-white"></div>
            <div className="bg-gradient-to-l from-content/60 to-custom-white"></div>
          </div>
          <div>Are you sure you want to delete</div>
          <div>
            Company = <span className="font-medium">{companyInfo.name}</span>
          </div>

          <div className="mt-2 grid grid-cols-2 gap-2">
            <button
              data-testid="delete-company-submit-btn"
              className="btn-themeGreen bg-red-600 border-red-600 hover:bg-red-600/75 hover:text-custom-white px-0 py-1.5"
              onClick={handleSubmit}
            >
              Yes
            </button>
            <button
              data-testid="delete-company-reset-stepone-btn"
              className="btn-themeOrange bg-[rgb(30,45,80)] border-[rgb(30,45,80)] hover:bg-[rgb(30,45,80)]/75 hover:text-custom-white px-0 py-1.5"
              onClick={() => setIsDeleting(false)}
            >
              No
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeleteCompany;
