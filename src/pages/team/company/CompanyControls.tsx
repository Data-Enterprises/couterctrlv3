import { useEffect } from "react";
import { useAppSelector, useAppDispatch } from "../../../hooks";
import { useToast } from "../../../components/toasts/hooks/useToast";

import { getCompanies } from "../../../api/company";
import {
  setCompanies,
  setSelectedCompanyForm,
  type CompanyFormType,
} from "../../../features/companySlice";
import type { CompanyJsonResp, JsonError } from "../../../interfaces";

const CompanyControls = () => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const { url, token } = useAppSelector((state) => state.app);
  const { selectedForm, refreshCompanies } = useAppSelector(
    (state) => state.company,
  );

  useEffect(() => {
    if (refreshCompanies) {
      getCompanies(url, token)
        .then((resp) => {
          const j: CompanyJsonResp = resp.data;
          if (j.error === 0) {
            setCompanies(j.companies);
          }
        })
        .catch((err: JsonError) => toast.error(err.message));
    }
  }, [refreshCompanies]);

  const handleFormSelect = (form: CompanyFormType) => {
    dispatch(setSelectedCompanyForm(form));
  };

  return (
    <div className="absolute w-">
      <div className="bg-custom-white rounded-lg shadow-lg p-4 grid grid-cols-4 gap-2">
        <button
          className={`${selectedForm === "create" ? "btn-themeGreen" : "btn-themeBlue"}`}
          onClick={() => handleFormSelect("create")}
        >
          Create
        </button>
        <button
          className={`${selectedForm === "update" ? "btn-themeGreen" : "btn-themeBlue"}`}
          onClick={() => handleFormSelect("update")}
        >
          Update
        </button>
        <button
          className={`${selectedForm === "delete" ? "btn-themeGreen" : "btn-themeBlue"}`}
          onClick={() => handleFormSelect("delete")}
        >
          Delete
        </button>
        <button
          className={`${selectedForm === "assign_to_user" ? "btn-themeGreen" : "btn-themeBlue"}`}
          onClick={() => handleFormSelect("assign_to_user")}
        >
          Assign User
        </button>
      </div>
    </div>
  );
};

export default CompanyControls;
