import { useEffect } from "react";
import {
  setSelectedForm,
  setSelectedUserStores,
} from "../../../features/usersSlice";
import { useAppDispatch, useAppSelector } from "../../../hooks";
import UserForms from "../formControls/UserForms";
import BaseGroupForms from "../formControls/BaseGroupForms";
import StoresForms from "../formControls/StoresForms";
import CompanyForms from "../formControls/CompanyForms";
import AdminForms from "../formControls/AdminForms";

const MainForms = () => {
  const dispatch = useAppDispatch();
  const { selectedForm } = useAppSelector((state) => state.users);
  const user = useAppSelector((state) => state.user);

  useEffect(() => {
    dispatch(setSelectedUserStores({ assigned: [], unassigned: [] }));
  }, [selectedForm]);

  const handleFormSelection = (x: number) => {
    dispatch(setSelectedForm(x));
  };

  if (selectedForm === 1) {
    return<UserForms />;
  }

  if (selectedForm === 2) {
    return <BaseGroupForms />;
  }

  if (selectedForm === 3) {
    return <StoresForms />;
  }

  if (selectedForm === 4) {
    return <CompanyForms />;
  }

  if (selectedForm === 5) {
    return <AdminForms />;
  }

  return (
    <div className="bg-custom-white rounded-lg shadow-lg min-w-36 text-sm select-none">
      <div className="font-medium px-2 rounded-t-lg py-0.5">
        Forms
      </div>
      <div className="grid grid-cols-2">
        <div className="bg-gradient-to-r from-blue-200 to-custom-white h-[1.5px]"></div>
        <div className="bg-gradient-to-l from-blue-200 to-custom-white h-[1.5px]"></div>
      </div>
      <div className="flex flex-col gap-1">
        <div
          data-testid="team-users-form"
          className={`${selectedForm === 1 ? "bg-orange-200" : ""} hover:cursor-pointer hover: hover:bg-blue-200 transition-all duration-200 py-1 px-2`}
          onClick={() => handleFormSelection(1)}
        >
          Users
        </div>
        <div
          data-testid="team-bg-form"
          className={`${selectedForm === 2 ? "bg-orange-200" : ""} hover:cursor-pointer hover: hover:bg-blue-200 transition-all duration-200 py-1 px-2`}
          onClick={() => handleFormSelection(2)}
        >
          Base Groups
        </div>
        <div
          data-testid="team-stores-form"
          className={`${selectedForm === 3 ? "bg-orange-200" : ""} hover:cursor-pointer hover: hover:bg-blue-200 transition-all duration-200 py-1 px-2`}
          onClick={() => handleFormSelection(3)}
        >
          Stores
        </div>
        <div
          data-testid="team-companies-form"
          className={`${selectedForm === 4 ? "bg-orange-200" : ""} hover:cursor-pointer hover: hover:bg-blue-200 transition-all duration-200 py-1 px-2`}
          onClick={() => handleFormSelection(4)}
        >
          Companies
        </div>
        <div
          data-testid="team-admin-form"
          className={`${selectedForm === 5 ? "bg-orange-200" : ""} ${user.userLevel >= 7 ? "" : "hidden"} rounded-b-lg hover:cursor-pointer hover: hover:bg-blue-200 transition-all duration-200 py-1 px-2`}
          onClick={() => handleFormSelection(5)}
        >
          Admin
        </div>
      </div>
    </div>
  );
};

export default MainForms;
