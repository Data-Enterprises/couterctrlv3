import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../../hooks";
import { resetUserInfo } from "../../../features/usersSlice";

import CreateBaseGroup from "./CreateBaseGroup";
import UpdateBaseGroup from "./UpdateBaseGroup";
import DeleteBaseGroup from "./DeleteBaseGroup";
import AssignUserToBG from "./AssignUserToBaseGroup";
import SingleSelect from "../../../components/SingleSelect";

type BaseGroupOption = "create" | "update" | "delete" | "assign_to_user" | "";

const options = [
  { label: "Create", value: "create" },
  { label: "Update", value: "update" },
  { label: "Delete", value: "delete" },
  { label: "Assign/Unassign User to Base Group", value: "assign_to_user" },
];

const BaseGroupControls = () => {
  const dispatch = useAppDispatch();
  const [bgOption, setBgOption] = useState<BaseGroupOption>("");
  const isDesktop = useAppSelector((state) => state.app.isDesktop);

  useEffect(() => {
    dispatch(resetUserInfo());
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

    const handleMobileFormSelect = (val: string | number) => {
    const form = val as BaseGroupOption;
    setBgOption(form);
    };

  return (
    <div className={`${isDesktop ? "space-y-4" : "space-y-2"} w-full`}>
      {isDesktop ? (
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
            Assign/Unassign User
          </button>
        </div>
      ) : (
        <SingleSelect
          label="Base Group Forms"
          data={options}
          displayKey="label"
          valueKey="value"
          onSelect={handleMobileFormSelect}
        />
      )}
      {renderForm()}
    </div>
  );
};

export default BaseGroupControls;
