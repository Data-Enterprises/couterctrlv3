import { useEffect, useState } from "react";
import { useAppSelector, useAppDispatch } from "../../../hooks";
import { useToast } from "../../../components/toasts/hooks/useToast";

import UpdateInputs from "./UpdateInputs";
import UpdateCompanyBG from "./UpdateUserCompany";
import { getBaseGroups } from "../../../api/baseGroups";
import {
  setActiveBaseGroups,
  setBaseGroups,
  setCompany,
  setInactiveBaseGroups,
} from "../../../features/baseGroupSlice";
import type { JsonError } from "../../../interfaces";
import UpdateUserStores from "./UpdateUserStores";
import { getBaseGroupsAssignedToUser } from "../../../api/team";
import UpdateUserBG from "./UpdateUserBG";

const UpdateUserForm = () => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.user);
  const [updateStep, setUpdateStep] = useState<number>(1);
  const { url, token } = useAppSelector((state) => state.app);
  const { selectedUserId, userInfo } = useAppSelector((state) => state.users);
  const isHidden = selectedUserId === 0 || !userInfo;

  useEffect(() => {
    if (updateStep === 2) {
      getBaseGroupsAssignedToUser(url, token, selectedUserId)
        .then((resp) => {
          const j = resp.data;
          if (j.error === 0) {
            dispatch(setActiveBaseGroups(j.active));
            dispatch(setInactiveBaseGroups(j.inactive));
          }
        })
        .catch((err: JsonError) => toast.error(err.message));
      getBaseGroups(url, token, user.companies[0].company)
        .then((resp) => {
          const j = resp.data;
          if (j.error === 0) {
            dispatch(setBaseGroups(j.groups));
            dispatch(setCompany(j.company[0]));
          }
        })
        .catch((err: JsonError) => toast.error(err.message));
    }
  }, [updateStep]);

  return (
    <div
      className={`w-full bg-custom-white p-2 rounded-lg shadow-lg ${isHidden ? "hidden" : ""}`}
    >
      <div className="flex gap-2 text-[12px] mb-2 items-center select-none">
        <div
          className={`
            ${updateStep === 1 ? "bg-[rgb(30,45,80)] text-custom-white" : "text-content bg-content/10"} 
            px-4 rounded-full py-0.5 cursor-pointer transition-all duration-200 hover:bg-[rgb(30,45,80)]/75 hover:text-custom-white`}
          onClick={() => setUpdateStep(1)}
        >
          User Info
        </div>
        <div
          className={`
            ${updateStep === 2 ? "bg-[rgb(30,45,80)] text-custom-white" : "text-content bg-content/10"} 
            px-4 rounded-full py-0.5 cursor-pointer transition-all duration-200 hover:bg-[rgb(30,45,80)]/75 hover:text-custom-white`}
          onClick={() => setUpdateStep(2)}
        >
          Companies
        </div>

        <div
          className={`
            ${updateStep === 3 ? "bg-[rgb(30,45,80)] text-custom-white" : "text-content bg-content/10"} 
            px-4 rounded-full py-0.5 cursor-pointer transition-all duration-200 hover:bg-[rgb(30,45,80)]/75 hover:text-custom-white`}
          onClick={() => setUpdateStep(3)}
        >
          Base Groups
        </div>

        <div
          className={`
            ${updateStep === 4 ? "bg-[rgb(30,45,80)] text-custom-white" : "text-content bg-content/10"} 
            px-4 rounded-full py-0.5 cursor-pointer transition-all duration-200 hover:bg-[rgb(30,45,80)]/75 hover:text-custom-white`}
          onClick={() => setUpdateStep(4)}
        >
          Stores
        </div>
        <div
          className={`
            ${updateStep === 5 ? "bg-[rgb(30,45,80)] text-custom-white" : "text-content bg-content/10"} 
            px-4 rounded-full py-0.5 cursor-pointer transition-all duration-200 hover:bg-[rgb(30,45,80)]/75 hover:text-custom-white`}
          onClick={() => setUpdateStep(5)}
        >
          Password/Security
        </div>
      </div>
      {updateStep === 1 && <UpdateInputs />}
      {updateStep === 2 && <UpdateCompanyBG />}
      {updateStep === 3 && <UpdateUserBG />}
      {updateStep === 4 && <UpdateUserStores />}
    </div>
  );
};

export default UpdateUserForm;
