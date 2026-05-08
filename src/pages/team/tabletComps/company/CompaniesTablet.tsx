import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../../../../hooks";
import { useToast } from "../../../../components/toasts/hooks/useToast";
import {
  resetCompanyInfo,
  setCompanies,
  setRefreshCompanies,
  setUserAssignedCompanies,
  setUserUnassignedCompanies,
} from "../../../../features/companySlice";
import { resetUserInfo } from "../../../../features/usersSlice";
import { getCompanies } from "../../../../api/company";
import type { CompanyJsonResp, JsonError } from "../../../../interfaces";

import CompanyFormOptions from "./CompanyFormOptions";
import NewCompanyForm from "./NewCompanyForm";
import UpdateCompanyForm from "./UpdateCompanyForm";
import DeleteCompanyForm from "./DeleteCompanyForm";
import UserCompanyAssignForm from "./UserCompanyAssignForm";

const CompaniesTablet = () => {
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
    dispatch(resetUserInfo());
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

  const renderCompanyForm = () => {
    switch (selectedForm) {
      case "create":
        return <NewCompanyForm />;
      case "update":
        return <UpdateCompanyForm />;
      case "delete":
        return <DeleteCompanyForm />;
      case "assign_to_user":
        return <UserCompanyAssignForm />;
      default:
        return null;
    }
  };

  return (
    <div className=" grid grid-cols-[17%_81.6%] gap-3">
      <CompanyFormOptions />
      {renderCompanyForm()}
    </div>
  );
};

export default CompaniesTablet;
