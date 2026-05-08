import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../../../../hooks";
import StoresFormOptions from "./StoresFormOptions";

import {
  resetUserInfo,
  setSelectedUserId,
  setStoresFormOption,
} from "../../../../features/usersSlice";

const StoresTablet = () => {
  const dispatch = useAppDispatch();
  const { storesOption } = useAppSelector((state) => state.users);

  useEffect(() => {
    return () => {
      dispatch(setStoresFormOption(""));
      dispatch(resetUserInfo());
      dispatch(setSelectedUserId(0));
    };
  }, []);

  const renderStoresForm = () => {
    switch (storesOption) {
      case "assign":
        return <div>Create Store Form</div>;
      case "info":
        return <div>Delete Store Form</div>;
      case "bg_assign":
        return <div>Update Store Form</div>;
      default:
        return null;
    }
  };
  return (
    <div className=" grid grid-cols-[17%_81.8%] gap-3">
      <StoresFormOptions />
      {renderStoresForm()}
    </div>
  );
};

export default StoresTablet;
