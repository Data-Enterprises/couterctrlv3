import { useAppDispatch, useAppSelector } from "../../../hooks";
import { resetUserInfo, setSelectedForm, setSelectedUserForm, setStoresFormOption } from "../../../features/usersSlice";

const StoresForms = () => {
  const dispatch = useAppDispatch();
  const { storesOption } = useAppSelector((state) => state.users);

    const handleGoBack = () => {
      dispatch(setSelectedUserForm(""));
      dispatch(resetUserInfo());
      dispatch(setSelectedForm(0));
    };

  return (
    <div className="bg-custom-white rounded-lg shadow-lg min-w-36 text-[13px] select-none">
      <div className="font-medium px-2 rounded-t-lg py-0.5">Stores Forms</div>
      <div className="grid grid-cols-2">
        <div className="bg-gradient-to-r from-blue-200 to-custom-white h-[1.5px]"></div>
        <div className="bg-gradient-to-l from-blue-200 to-custom-white h-[1.5px]"></div>
      </div>
      <div
        data-testid="stores-go-back-form-btn"
        className={`hover:cursor-pointer hover: hover:bg-blue-200 transition-all duration-200 py-1 px-2`}
        onClick={handleGoBack}
      >
        Go Back
      </div>
      <div
        data-testid="user-store-assign-btn"
        className={`${storesOption === "assign" ? "bg-orange-200" : ""} hover:cursor-pointer hover: hover:bg-blue-200 transition-all duration-200 py-1 px-2`}
        onClick={() => dispatch(setStoresFormOption("assign"))}
      >
        Assign/Unassign Stores
      </div>
      <div
        data-testid="user-store-info-btn"
        className={`${storesOption === "info" ? "bg-orange-200" : ""} hover:cursor-pointer hover: hover:bg-blue-200 transition-all duration-200 py-1 px-2`}
        onClick={() => dispatch(setStoresFormOption("info"))}
      >
        Store Info
      </div>
      <div
        data-testid="bg-store-assign-btn"
        className={`${storesOption === "bg_assign" ? "bg-orange-200" : ""} hover:cursor-pointer hover: hover:bg-blue-200 transition-all duration-200 py-1 px-2`}
        onClick={() => dispatch(setStoresFormOption("bg_assign"))}
      >
        Assign/Unassign Base Groups
      </div>
    </div>
  );
};

export default StoresForms;