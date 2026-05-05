import { useEffect, useState } from "react";
import { useAppSelector, useAppDispatch } from "../../../hooks";
import { useToast } from "../../../components/toasts/hooks/useToast";

import UpdateInputs from "./UpdateInputs";
import UpdateCompanyBG from "./UpdateCompanyBG";
import { getBaseGroups } from "../../../api/baseGroups";
import { setBaseGroups, setCompany } from "../../../features/baseGroupSlice";
import type { JsonError } from "../../../interfaces";
import UpdateUserStores from "./UpdateUserStores";

const UpdateUserForm = () => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.user);
  const [updateStep, setUpdateStep] = useState<number>(1);
  const { url, token } = useAppSelector((state) => state.app);
  const { baseGroups } = useAppSelector((state) => state.baseGroup);
  const { selectedUserId, userInfo } = useAppSelector((state) => state.users);
  const isHidden = selectedUserId === 0 || !userInfo;

  useEffect(() => {
    if (updateStep === 2 && baseGroups.length === 0) {
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
          Company/Base Groups
        </div>

        <div
          className={`
            ${updateStep === 3 ? "bg-[rgb(30,45,80)] text-custom-white" : "text-content bg-content/10"} 
            px-4 rounded-full py-0.5 cursor-pointer transition-all duration-200 hover:bg-[rgb(30,45,80)]/75 hover:text-custom-white`}
          onClick={() => setUpdateStep(3)}
        >
          Stores
        </div>
      </div>
      {updateStep === 1 && <UpdateInputs />}
      {updateStep === 2 && <UpdateCompanyBG />}
      {updateStep === 3 && <UpdateUserStores />}
    </div>
  );
};

export default UpdateUserForm;
