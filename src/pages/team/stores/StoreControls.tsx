import { useEffect } from "react";
import { useAppSelector, useAppDispatch } from "../../../hooks";

import StoreInfo from "./StoreInfo";
import AssignBaseGroup from "./AssignBaseGroup";
import AssignStoresToUser from "./AssignStoresToUser";
import { setStoresFormOption } from "../../../features/usersSlice";

const StoreControls = () => {
  const dispatch = useAppDispatch();
  const { storesOption } = useAppSelector((state) => state.users);

  useEffect(() => {
    return () => {
      dispatch(setStoresFormOption(""));
    };
  }, []);

  const renderForm = () => {
    switch (storesOption) {
      case "assign":
        return <AssignStoresToUser />;
      case "info":
        return <StoreInfo />;
      case "bg_assign":
        return <AssignBaseGroup />;
      default:
        return null;
    }
  };

  return <div className="flex flex-col gap-4 ">{renderForm()}</div>;
};

export default StoreControls;
