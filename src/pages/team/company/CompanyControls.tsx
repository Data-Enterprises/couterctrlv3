import { useEffect } from "react";
import { useAppSelector, useAppDispatch } from "../../../hooks";
import { useToast } from "../../../components/toasts/hooks/useToast";

import { getCompanies } from "../../../api/company";
import {
  resetCompanyInfo,
  setCompanies,
  setRefreshCompanies,
  setSelectedCompanyForm,
  type CompanyFormType,
} from "../../../features/companySlice";
import type { CompanyJsonResp, JsonError } from "../../../interfaces";
import CreateCompany from "./CreateCompany";
import UpdateCompany from "./UpdateCompany";
import DeleteCompany from "./DeleteCompany";
import AssignCompanyToUser from "./AssignCompanyToUser";

const CompanyControls = () => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const { url, token } = useAppSelector((state) => state.app);
  const { selectedForm, refreshCompanies } = useAppSelector(
    (state) => state.company,
  );

  useEffect(() => {
    dispatch(resetCompanyInfo());
  }, [selectedForm]);

  useEffect(() => {
    if (refreshCompanies) {
      getCompanies(url, token)
        .then((resp) => {
          const j: CompanyJsonResp = resp.data;
          if (j.error === 0) {
            dispatch(setCompanies(j.companies));
            dispatch(setRefreshCompanies(false));
          }
        })
        .catch((err: JsonError) => toast.error(err.message));
    }
  }, [refreshCompanies]);

  const handleFormSelect = (form: CompanyFormType) => {
    dispatch(setSelectedCompanyForm(form));
  };

  const renderForm = () => {
    switch (selectedForm) {
      case "create":
        return <CreateCompany />;
      case "update":
        return <UpdateCompany />;
      case "delete":
        return <DeleteCompany />;
      case "assign_to_user":
        return <AssignCompanyToUser />;
      default:
        return null;
    }
  };

  return (
    <div className="">
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
      <div className="mt-4">{renderForm()}</div>
    </div>
  );
};

export default CompanyControls;
