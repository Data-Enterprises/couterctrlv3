import {
  setSelectedAdminForm,
  type AdminFormType,
} from "../../../features/adminSlice";
import { setSelectedForm } from "../../../features/usersSlice";
import { useAppDispatch, useAppSelector } from "../../../hooks";

const AdminForms = () => {
  const dispatch = useAppDispatch();
  const { selectedAdminForm } = useAppSelector((state) => state.admin);

  const handleReset = (x: AdminFormType) => {
    dispatch(setSelectedAdminForm(x));
  };

  const handleGoBack = () => {
    dispatch(setSelectedAdminForm(""));
    dispatch(setSelectedForm(0));
  };

  return (
    <div className="bg-custom-white rounded-lg shadow-lg min-w-36 text-sm select-none">
      <div className="font-medium px-2 rounded-t-lg py-0.5">Admin Forms</div>
      <div className="grid grid-cols-2">
        <div className="bg-gradient-to-r from-blue-200 to-custom-white h-[1.5px]"></div>
        <div className="bg-gradient-to-l from-blue-200 to-custom-white h-[1.5px]"></div>
      </div>
      <div
        data-testid="admin-new-store-name-form"
        className={`hover:cursor-pointer hover: hover:bg-blue-200 transition-all duration-200 py-1 px-2`}
        onClick={handleGoBack}
      >
        Go Back
      </div>
      <div
        data-testid="admin-new-store-name-form"
        className={`${selectedAdminForm === "store_name" ? "bg-orange-200" : ""} hover:cursor-pointer hover: hover:bg-blue-200 transition-all duration-200 py-1 px-2`}
        onClick={() => handleReset("store_name")}
      >
        New Store Name
      </div>
      <div
        data-testid="admin-stores-missing-sales-form"
        className={`${selectedAdminForm === "store_missing_sales" ? "bg-orange-200" : ""} hover:cursor-pointer hover: hover:bg-blue-200 transition-all duration-200 py-1 px-2`}
        onClick={() => handleReset("store_missing_sales")}
      >
        Stores Missing Sales
      </div>
    </div>
  );
};

export default AdminForms;
