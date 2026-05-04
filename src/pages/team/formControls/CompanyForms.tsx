import {
  resetCompanyInfo,
  setSelectedCompanyForm,
  setUserAssignedCompanies,
  type CompanyFormType,
} from "../../../features/companySlice";
import { resetUserInfo, setSelectedForm } from "../../../features/usersSlice";
import { useAppSelector, useAppDispatch } from "../../../hooks";

const CompanyForms = () => {
  const dispatch = useAppDispatch();
  const { selectedForm } = useAppSelector((state) => state.company);

  const handleFormSelect = (form: CompanyFormType) => {
    dispatch(setSelectedCompanyForm(form));
  };

  const handleGoBack = () => {
    dispatch(setSelectedForm(0));
    dispatch(setSelectedCompanyForm(""));
    dispatch(resetCompanyInfo());
    dispatch(setUserAssignedCompanies([]));
    dispatch(resetUserInfo());
  };

  return (
    <div className="bg-custom-white rounded-lg shadow-lg min-w-36 text-sm select-none">
      <div className="font-medium px-2 rounded-t-lg py-0.5">Company Forms</div>
      <div className="grid grid-cols-2">
        <div className="bg-gradient-to-r from-blue-200 to-custom-white h-[1.5px]"></div>
        <div className="bg-gradient-to-l from-blue-200 to-custom-white h-[1.5px]"></div>
      </div>
      <div
        data-testid="goback-company-form"
        className={`hover:cursor-pointer hover: hover:bg-blue-200 transition-all duration-200 py-1 px-2`}
        onClick={handleGoBack}
      >
        Go Back
      </div>
      <div
        data-testid="create-company-form"
        className={`${selectedForm === "create" ? "bg-orange-200" : ""} hover:cursor-pointer hover: hover:bg-blue-200 transition-all duration-200 py-1 px-2`}
        onClick={() => handleFormSelect("create")}
      >
        Create
      </div>
      <div
        data-testid="update-company-form"
        className={`${selectedForm === "update" ? "bg-orange-200" : ""} hover:cursor-pointer hover: hover:bg-blue-200 transition-all duration-200 py-1 px-2`}
        onClick={() => handleFormSelect("update")}
      >
        Update
      </div>
      <div
        data-testid="delete-company-form"
        className={`${selectedForm === "delete" ? "bg-orange-200" : ""} hover:cursor-pointer hover: hover:bg-blue-200 transition-all duration-200 py-1 px-2`}
        onClick={() => handleFormSelect("delete")}
      >
        Delete
      </div>
      <div
        data-testid="assign-company-to-user-form"
        className={`${selectedForm === "assign_to_user" ? "bg-orange-200" : ""} hover:cursor-pointer hover: hover:bg-blue-200 transition-all duration-200 py-1 px-2`}
        onClick={() => handleFormSelect("assign_to_user")}
      >
        Assign/Unassign User
      </div>
    </div>
  );
};

export default CompanyForms;
