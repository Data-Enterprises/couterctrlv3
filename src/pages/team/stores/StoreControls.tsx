import { useState } from "react";
import StoreInfo from "./StoreInfo";
import AssignBaseGroup from "./AssignBaseGroup";
import AssignStoresToUser from "./AssignStoresToUser";

type StoreFormOption = "assign" | "info" | "bg_assign" | "";

const StoreControls = () => {
  const [option, setOption] = useState<StoreFormOption>("");

  const renderForm = () => {
    switch (option) {
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

  return (
    <div className="flex flex-col gap-4 ">
      {/* w-[80%] is just so we don't have it too stretched out */}
      <div className="bg-custom-white p-4 rounded-lg shadow-lg grid grid-cols-3 gap-2 w-[50%]">
        <button
          className={`${option === "assign" ? "btn-themeGreen" : "btn-themeBlue"} px-0`}
          onClick={() => setOption("assign")}
        >
          Assign/Unassign
        </button>
        <button
          className={`${option === "info" ? "btn-themeGreen" : "btn-themeBlue"} px-0`}
          onClick={() => setOption("info")}
        >
          Store Info
        </button>
        <button
          className={`${option === "bg_assign" ? "btn-themeGreen" : "btn-themeBlue"} px-0`}
          onClick={() => setOption("bg_assign")}
        >
          Base Group Assign
        </button>
      </div>
      {renderForm()}
    </div>
  );
};

export default StoreControls;
