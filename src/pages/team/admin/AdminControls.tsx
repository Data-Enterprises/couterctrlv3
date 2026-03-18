import {
  setSelectedAdminForm,
  type AdminFormType,
} from "../../../features/adminSlice";
import { useAppDispatch, useAppSelector } from "../../../hooks";

import NewStoreNameForm from "./NewStoreNameForm";
import StoresMissingSalesForm from "./StoresMissingSalesForm";

const AdminControls = () => {
  const dispatch = useAppDispatch();
  const { selectedAdminForm } = useAppSelector((state) => state.admin);

  const handleReset = (x: AdminFormType) => {
    dispatch(setSelectedAdminForm(x));
  };

  const renderForm = () => {
    switch (selectedAdminForm) {
      case "store_name":
        return <NewStoreNameForm />;
      case "store_missing_sales":
        return <StoresMissingSalesForm />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-custom-white rounded-lg shadow-lg grid grid-cols-2 gap-2 p-4 w-[50%] select-none">
        <button
          data-testid="admin-new-store-name-form"
          className={`${selectedAdminForm === "store_name" ? "btn-themeGreen" : "btn-themeBlue"} px-0`}
          onClick={() => handleReset("store_name")}
        >
          New Store Name
        </button>
        <button
          data-testid="admin-stores-missing-sales-form"
          className={`${selectedAdminForm === "store_missing_sales" ? "btn-themeGreen" : "btn-themeBlue"} px-0`}
          onClick={() => handleReset("store_missing_sales")}
        >
          Stores Missing Sales
        </button>
      </div>
      {renderForm()}
    </div>
  );
};

export default AdminControls;
