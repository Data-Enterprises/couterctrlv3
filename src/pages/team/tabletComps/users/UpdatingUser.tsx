import { useAppDispatch } from "../../../../hooks";

import {
  resetUserInfo,
  setSelectedUserId,
} from "../../../../features/usersSlice";

import {
  KeyIcon,
  UserCircleIcon,
  ArrowLeftCircleIcon,
  BuildingOfficeIcon,
  BuildingStorefrontIcon,
} from "@heroicons/react/24/outline";
import { useState } from "react";

import UserInfoCard from "./UserInfoCard";
import UserCompanyUpdate from "./innerForms/UserCompanyUpdate";
import PasswordSecurity from "./innerForms/PasswordSecurity";
import UpdateUserInfo from "./innerForms/UpdateUserInfo";
import UserBGUpdate from "./innerForms/UserBGUpdate";
import UserStoresUpdate from "./innerForms/UserStoresUpdate";

interface UpdatingUserFormProps {
  goBack: () => void;
}

const UpdatingUserForm = ({ goBack }: UpdatingUserFormProps) => {
  const dispatch = useAppDispatch();
  const [innerForm, setInnerForm] = useState<number>(0);
  const handleGoBack = () => {
    goBack();
    dispatch(resetUserInfo());
    dispatch(setSelectedUserId(0));
  };

  return (
    <div className="">
      {/* Nav */}
      <UserInfoCard />
      <div className="grid grid-cols-[15%_20%_20%_20%_20%] gap-3 mb-3">
        <div
          className="flex flex-col items-center justify-center py-2 bg-custom-white rounded-lg shadow-md"
          onClick={handleGoBack}
        >
          <ArrowLeftCircleIcon className="h-8 w-8" />
          <div>Users</div>
        </div>
        <div
          className={`flex flex-col items-center justify-center py-2 ${innerForm === 1 ? "bg-[rgb(30,45,80)]/50 text-custom-white" : "bg-custom-white"} rounded-lg shadow-md`}
          onClick={() => setInnerForm(1)}
        >
          <UserCircleIcon className="h-8 w-8" />
          <div>Basic Info</div>
        </div>
        <div
          className={`flex flex-col items-center justify-center py-2 ${innerForm === 2 ? "bg-[rgb(30,45,80)]/50 text-custom-white" : "bg-custom-white"} rounded-lg shadow-md`}
          onClick={() => setInnerForm(2)}
        >
          <BuildingOfficeIcon className="w-8 h-8" />
          <div>Company/B. Groups</div>
        </div>
        <div
          className={`flex flex-col items-center justify-center py-2 ${innerForm === 3 ? "bg-[rgb(30,45,80)]/50 text-custom-white" : "bg-custom-white"} rounded-lg shadow-md`}
          onClick={() => setInnerForm(3)}
        >
          <BuildingStorefrontIcon className="w-8 h-8" />
          <div>Stores</div>
        </div>
        <div
          className={`flex flex-col items-center justify-center py-2 ${innerForm === 4 ? "bg-[rgb(30,45,80)]/50 text-custom-white" : "bg-custom-white"} rounded-lg shadow-md`}
          onClick={() => setInnerForm(4)}
        >
          <KeyIcon className="h-8 w-8" />
          <div>Password/Security</div>
        </div>
      </div>

      {/* Forms */}
      {innerForm === 1 ? <UpdateUserInfo /> : null}

      {innerForm === 2 ? (
        <div className="space-y-3">
          <UserCompanyUpdate />
          <UserBGUpdate />
        </div>
      ) : null}
      {innerForm === 3 ? <UserStoresUpdate /> : null}
      {innerForm === 4 ? <PasswordSecurity /> : null}
    </div>
  );
};

export default UpdatingUserForm;
