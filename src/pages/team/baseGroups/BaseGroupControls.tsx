import { useEffect, useState } from "react";
import { useAppDispatch } from "../../../hooks";
import { resetUserInfo } from "../../../features/usersSlice";

import CreateBaseGroup from "./CreateBaseGroup";
import UpdateBaseGroup from "./UpdateBaseGroup";
import DeleteBaseGroup from "./DeleteBaseGroup";
import AssignUserToBG from "./AssignUserToBaseGroup";

type BaseGroupOption = "create" | "update" | "delete" | "assign_to_user" | "";

const BaseGroupControls = () => {
  const dispatch = useAppDispatch();
  const [bgOption, setBgOption] = useState<BaseGroupOption>("");

  useEffect(() => {
    dispatch(resetUserInfo())
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
        return <AssignUserToBG />
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-2 p-4 bg-custom-white rounded-lg shadow-lg">
        <button
          className={`${bgOption === "create" ? "btn-themeGreen" : "btn-themeBlue"} px-0`}
          onClick={() => setBgOption("create")}
        >
          Create
        </button>
        <button
          className={`${bgOption === "update" ? "btn-themeGreen" : "btn-themeBlue"} px-0`}
          onClick={() => setBgOption("update")}
        >
          Update
        </button>
        <button
          className={`${bgOption === "delete" ? "btn-themeGreen" : "btn-themeBlue"} px-0`}
          onClick={() => setBgOption("delete")}
        >
          Delete
        </button>
        <button
          className={`${bgOption === "assign_to_user" ? "btn-themeGreen" : "btn-themeBlue"} px-0`}
          onClick={() => setBgOption("assign_to_user")}
        >
          Assign User
        </button>
      </div>
      {renderForm()}
    </div>
  );
};

export default BaseGroupControls;
