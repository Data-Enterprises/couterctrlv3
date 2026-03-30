import { useState } from "react";
import { useAppSelector } from "../../../hooks";
import StoreInfo from "./StoreInfo";
import AssignBaseGroup from "./AssignBaseGroup";
import AssignStoresToUser from "./AssignStoresToUser";
import SingleSelect from "../../../components/SingleSelect";

type StoreFormOption = "assign" | "info" | "bg_assign" | "";

const options = [
  { label: "Assign/Unassign Stores", value: "assign" },
  { label: "Store Info", value: "info" },
  { label: "Assign/Unassign Base Groups", value: "bg_assign" },
];

const StoreControls = () => {
  const [option, setOption] = useState<StoreFormOption>("");
  const { isDesktop } = useAppSelector((state) => state.app);

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

  const handleMobileStoreFormSelect = (val: string | number) => {
    const form = String(val) as StoreFormOption;
    setOption(form);
  };

  return (
    <div className="flex flex-col gap-4 ">
      {/* w-[80%] is just so we don't have it too stretched out */}
      {isDesktop ? (
        <div className="bg-custom-white p-4 rounded-lg shadow-lg grid grid-cols-3 gap-2 w-[59%]">
          <button
            data-testid="user-store-assign-btn"
            className={`${option === "assign" ? "btn-themeGreen" : "btn-themeBlue"} px-0`}
            onClick={() => setOption("assign")}
          >
            Assign/Unassign Stores
          </button>
          <button
            data-testid="user-store-info-btn"
            className={`${option === "info" ? "btn-themeGreen" : "btn-themeBlue"} px-0`}
            onClick={() => setOption("info")}
          >
            Store Info
          </button>
          <button
            data-testid="bg-store-assign-btn"
            className={`${option === "bg_assign" ? "btn-themeGreen" : "btn-themeBlue"} px-0`}
            onClick={() => setOption("bg_assign")}
          >
            Assign/Unassign Base Groups
          </button>
        </div>
      ) : (
        <SingleSelect
          label="Store Forms"
          data={options}
          displayKey="label"
          valueKey="value"
          onSelect={handleMobileStoreFormSelect}
        />
      )}
      {renderForm()}
    </div>
  );
};

export default StoreControls;
