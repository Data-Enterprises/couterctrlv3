import { useEffect } from "react";
import { useAppSelector, useAppDispatch } from "../../../hooks";
import { useToast } from "../../../components/toasts/hooks/useToast";

import { getCompanies } from "../../../api/company";
import {
  resetCompanyInfo,
  setCompanies,
  setRefreshCompanies,
  setUserAssignedCompanies,
  setUserUnassignedCompanies,
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

  return renderForm()
};

export default CompanyControls;
