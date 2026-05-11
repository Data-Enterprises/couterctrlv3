import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../../../../hooks";
import {
  resetUserInfo,
  setBGOption,
  setSelectedUserId,
} from "../../../../features/usersSlice";

import BGFormOptions from "./BGFormOptions";
import NewBGForm from "./NewBGForm";
import UpdateBGForm from "./UpdateBGForm";
import DeleteBGForm from "./DeleteBGForm";
import UserBGAssignForm from "./UserBGAssignForm";

const BaseGroupsTablet = () => {
  const dispatch = useAppDispatch();
  const { bgOption } = useAppSelector((state) => state.users);

  useEffect(() => {
    dispatch(resetUserInfo());
    dispatch(setSelectedUserId(0));
  }, [bgOption]);

  useEffect(() => {
    return () => {
      dispatch(setBGOption(""));
      dispatch(resetUserInfo());
      dispatch(setSelectedUserId(0));
    };
  }, []);

  const renderBGForm = () => {
    switch (bgOption) {
      case "create":
        return <NewBGForm />;
      case "update":
        return <UpdateBGForm />;
      case "delete":
        return <DeleteBGForm />;
      case "assign_to_user":
        return <UserBGAssignForm />;
      default:
        return null;
    }
  };

  return (
    <div className="grid grid-cols-[17.5%_81.1%] gap-3">
      <BGFormOptions />
      {renderBGForm()}
    </div>
  );
};

export default BaseGroupsTablet;
