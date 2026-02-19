import { useState } from "react";
import CreateBaseGroup from "./CreateBaseGroup";
import UpdateBaseGroup from "./UpdateBaseGroup";
import DeleteBaseGroup from "./DeleteBaseGroup";

type BaseGroupOption = "create" | "update" | "delete" | "";

const BaseGroupControls = () => {
  const [bgOption, setBgOption] = useState<BaseGroupOption>("");

  const renderForm = () => {
    switch (bgOption) {
      case "create":
        return <CreateBaseGroup />;
      case "update":
        return <UpdateBaseGroup />;
      case "delete":
        return <DeleteBaseGroup />
      default:
        return null;
    }
  };

  return (
    <div className="w-2/3 space-y-4">
      <div className="grid grid-cols-3 gap-4 p-4 bg-custom-white rounded-lg shadow-lg">
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
      </div>
      {renderForm()}
    </div>
  );
};

export default BaseGroupControls;
