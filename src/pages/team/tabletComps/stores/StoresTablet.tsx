import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../../../../hooks";
import StoresFormOptions from "./StoresFormOptions";

import {
  resetUserInfo,
  setSelectedUserId,
  setSelectedUserStores,
  setStoresFormOption,
} from "../../../../features/usersSlice";
import UserStoresUpdate from "../users/innerForms/UserStoresUpdate";
import SearchUser from "../../forms/SearchUser";
import StoresInfoTablet from "./StoresInfoTablet";
import StoresBGAssignForm from "./StoresBGAssignForm";

const StoresTablet = () => {
  const dispatch = useAppDispatch();
  const { storesOption } = useAppSelector((state) => state.users);

  useEffect(() => {
    return () => {
      dispatch(setStoresFormOption(""));
      dispatch(resetUserInfo());
      dispatch(setSelectedUserId(0));
      dispatch(setSelectedUserStores({ assigned: [], unassigned: [] }));
    };
  }, []);

  const renderStoresForm = () => {
    switch (storesOption) {
      case "assign":
        return (
          <div className="space-y-3">
            <SearchUser />
            <UserStoresUpdate />
          </div>
        );
      case "info":
        return <StoresInfoTablet />;
      case "bg_assign":
        return <StoresBGAssignForm />
      default:
        return null;
    }
  };
  return (
    <div className=" grid grid-cols-[17%_81.6%] gap-3">
      <StoresFormOptions />
      {renderStoresForm()}
    </div>
  );
};

export default StoresTablet;
