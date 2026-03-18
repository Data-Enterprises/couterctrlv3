import { useEffect } from "react";
import { useAppSelector, useAppDispatch } from "../../../hooks";
import { useToast } from "../../../components/toasts/hooks/useToast";

import { getCompanies } from "../../../api/company";
import {
  resetCompanyInfo,
  setCompanies,
  setRefreshCompanies,
  setSelectedCompanyForm,
  setUserAssignedCompanies,
  setUserUnassignedCompanies,
  type CompanyFormType,
} from "../../../features/companySlice";
import type { CompanyJsonResp, JsonError } from "../../../interfaces";
import CreateCompany from "./CreateCompany";
import UpdateCompany from "./UpdateCompany";
import DeleteCompany from "./DeleteCompany";
import AssignCompanyToUser from "./AssignCompanyToUser";
import { resetUserInfo } from "../../../features/usersSlice";

const CompanyControls = () => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const { url, token } = useAppSelector((state) => state.app);
  const { selectedForm, refreshCompanies } = useAppSelector(
    (state) => state.company,
  );

  useEffect(() => {
    dispatch(resetCompanyInfo());
    dispatch(setUserAssignedCompanies([]));
    dispatch(setUserUnassignedCompanies([]));
    dispatch(resetUserInfo())
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
      <div className="bg-custom-white rounded-lg shadow-lg p-4 grid grid-cols-4 gap-2 w-[50vw]">
        <button
          data-testid="create-company-form"
          className={`${selectedForm === "create" ? "btn-themeGreen" : "btn-themeBlue"} px-0`}
          onClick={() => handleFormSelect("create")}
        >
          Create
        </button>
        <button
          data-testid="update-company-form"
          className={`${selectedForm === "update" ? "btn-themeGreen" : "btn-themeBlue"} px-0`}
          onClick={() => handleFormSelect("update")}
        >
          Update
        </button>
        <button
          data-testid="delete-company-form"
          className={`${selectedForm === "delete" ? "btn-themeGreen" : "btn-themeBlue"} px-0`}
          onClick={() => handleFormSelect("delete")}
        >
          Delete
        </button>
        <button
          data-testid="assign-company-to-user-form"
          className={`${selectedForm === "assign_to_user" ? "btn-themeGreen" : "btn-themeBlue"} px-0`}
          onClick={() => handleFormSelect("assign_to_user")}
        >
          Assign/Unassign User
        </button>
      </div>
      <div className="mt-4">{renderForm()}</div>
    </div>
  );
};

export default CompanyControls;
