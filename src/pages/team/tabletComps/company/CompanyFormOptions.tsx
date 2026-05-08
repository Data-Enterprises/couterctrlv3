import {
  ArrowLeftIcon,
  ArrowPathIcon,
  PlusCircleIcon,
  LinkSlashIcon,
  UserIcon,
} from "@heroicons/react/24/solid";
import {
  resetCompanyInfo,
  setSelectedCompanyForm,
  setUserAssignedCompanies,
  type CompanyFormType,
} from "../../../../features/companySlice";
import {
  resetUserInfo,
  setSelectedForm,
} from "../../../../features/usersSlice";
import { useAppSelector, useAppDispatch } from "../../../../hooks";

const CompanyFormOptions = () => {
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
    <div>
      <div className="grid gap-3">
        <div
          data-testid="goback-company-form"
          className={`p-3 bg-custom-white rounded-lg flex flex-col justify-center items-center`}
          onClick={handleGoBack}
        >
          <ArrowLeftIcon className="w-12 h-12" />
          <div>Go Back</div>
        </div>
        <div
          data-testid="create-company-form"
          className={`p-3 transition-all duration-200 ${selectedForm === "create" ? "bg-orange-200" : "bg-custom-white"} rounded-lg flex flex-col justify-center items-center`}
          onClick={() => handleFormSelect("create")}
        >
          <PlusCircleIcon className="w-12 h-12" />
          <div>New Company</div>
        </div>
        <div
          data-testid="update-company-form"
          className={`p-3 transition-all duration-200 ${selectedForm === "update" ? "bg-orange-200" : "bg-custom-white"} rounded-lg flex flex-col justify-center items-center`}
          onClick={() => handleFormSelect("update")}
        >
          <ArrowPathIcon className="w-12 h-12" />
          <div>Update</div>
        </div>
        <div
          data-testid="delete-company-form"
          className={`p-3 transition-all duration-200 ${selectedForm === "delete" ? "bg-orange-200" : "bg-custom-white"} rounded-lg flex flex-col justify-center items-center`}
          onClick={() => handleFormSelect("delete")}
        >
          <LinkSlashIcon className="w-12 h-12" />
          <div>Delete</div>
        </div>
        <div
          data-testid="assign-company-to-user-form"
          className={`p-3 transition-all duration-200 ${selectedForm === "assign_to_user" ? "bg-orange-200" : "bg-custom-white"} rounded-lg flex flex-col justify-center items-center`}
          onClick={() => handleFormSelect("assign_to_user")}
        >
          <UserIcon className="w-12 h-12" />
          <div>User Companies</div>
        </div>
      </div>
    </div>
  );
};

export default CompanyFormOptions;
