import { useAppDispatch, useAppSelector } from "../../../../hooks";
import {
  setStoresFormOption,
  setSelectedForm,
} from "../../../../features/usersSlice";

import {
  IdentificationIcon,
  ArrowLeftIcon,
  UserIcon,
  UserGroupIcon,
} from "@heroicons/react/24/solid";

const StoresFormOptions = () => {
  const dispatch = useAppDispatch();
  const { storesOption } = useAppSelector((state) => state.users);

  const handleInnerNav = (form: string) => {
    switch (form) {
      case "assign":
        dispatch(setStoresFormOption("assign"));
        break;
      case "info":
        dispatch(setStoresFormOption("info"));
        break;
      case "bg_assign":
        dispatch(setStoresFormOption("bg_assign"));
        break;
      default:
        dispatch(setStoresFormOption(""));
        dispatch(setSelectedForm(0));
    }
  };

  return (
    <div>
      <div className="grid gap-3">
        <div
          className={`p-3 shadow-md bg-custom-white rounded-lg flex flex-col justify-center items-center`}
          onClick={() => handleInnerNav("")}
        >
          <ArrowLeftIcon className="w-12 h-12" />
          <div>Go Back</div>
        </div>
        <div
          className={`p-3 shadow-md transition-all duration-200 ${storesOption === "assign" ? "bg-orange-200" : "bg-custom-white"} rounded-lg flex flex-col justify-center items-center`}
          onClick={() => handleInnerNav("assign")}
        >
          <UserIcon className="w-12 h-12" />
          <div>User Stores</div>
        </div>
        <div
          className={`p-3 shadow-md transition-all duration-200 ${storesOption === "info" ? "bg-orange-200" : "bg-custom-white"} rounded-lg flex flex-col justify-center items-center`}
          onClick={() => handleInnerNav("info")}
        >
          <IdentificationIcon className="w-12 h-12" />
          <div>Stores Info</div>
        </div>
        <div
          className={`p-3 shadow-md transition-all duration-200 ${storesOption === "bg_assign" ? "bg-orange-200" : "bg-custom-white"} rounded-lg flex flex-col justify-center items-center`}
          onClick={() => handleInnerNav("bg_assign")}
        >
          <UserGroupIcon className="w-12 h-12" />
          <div>Base Group Stores</div>
        </div>
      </div>
    </div>
  );
};

export default StoresFormOptions;
