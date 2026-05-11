import {
  MagnifyingGlassMinusIcon,
  ArrowLeftIcon,
  BuildingStorefrontIcon,
} from "@heroicons/react/24/solid";
import { useAppDispatch, useAppSelector } from "../../../../hooks";
import {
  setSelectedAdminForm,
  type AdminFormType,
} from "../../../../features/adminSlice";
import { setSelectedForm } from "../../../../features/usersSlice";

const AdminFormOptions = () => {
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
    <div>
      <div className="grid gap-3">
        <div
          data-testid="admin-new-store-name-form"
          className={`p-3 shadow-md bg-custom-white rounded-lg flex flex-col justify-center items-center`}
          onClick={handleGoBack}
        >
          <ArrowLeftIcon className="w-12 h-12" />
          <div>Go Back</div>
        </div>
        <div
          data-testid="admin-new-store-name-form"
          className={`p-3 shadow-md transition-all duration-200 ${selectedAdminForm === "store_name" ? "bg-orange-200" : "bg-custom-white"} rounded-lg flex flex-col justify-center items-center`}
          onClick={() => handleReset("store_name")}
        >
          <BuildingStorefrontIcon className="w-12 h-12" />
          <div>New Store Name</div>
        </div>
        <div
          data-testid="admin-stores-missing-sales-form"
          className={`p-3 shadow-md transition-all duration-200 ${selectedAdminForm === "store_missing_sales" ? "bg-orange-200" : "bg-custom-white"} rounded-lg flex flex-col justify-center items-center`}
          onClick={() => handleReset("store_missing_sales")}
        >
          <MagnifyingGlassMinusIcon className="w-12 h-12" />
          <div >Stores Missing Sales</div>
        </div>
      </div>
    </div>
  );
};

export default AdminFormOptions;
