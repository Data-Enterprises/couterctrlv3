import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../../../hooks";
import { resetUserInfo } from "../../../features/usersSlice";

import CreateBaseGroup from "./CreateBaseGroup";
import UpdateBaseGroup from "./UpdateBaseGroup";
import DeleteBaseGroup from "./DeleteBaseGroup";
import AssignUserToBG from "./AssignUserToBaseGroup";
import { setBGStores } from "../../../features/baseGroupSlice";

const BaseGroupControls = () => {
  const dispatch = useAppDispatch();
  const { bgOption } = useAppSelector((state) => state.users);

  useEffect(() => {
    dispatch(resetUserInfo());
    dispatch(setBGStores({ assigned: [], unassigned: [] }));
  }, [bgOption]);

  const renderForm = () => {
    switch (bgOption) {
      case "create":
        return <CreateBaseGroup />;
      case "update":
        return <UpdateBaseGroup />;
      case "delete":
        return <DeleteBaseGroup />;
      case "assign_to_user":
        return <AssignUserToBG />;
      default:
        return null;
    }
  };

  return <div className={`space-y-4 w-full`}>{renderForm()}</div>;
};

export default BaseGroupControls;
