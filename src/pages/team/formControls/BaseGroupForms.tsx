import { useAppSelector, useAppDispatch } from "../../../hooks";
import { setBGOption, setSelectedForm } from "../../../features/usersSlice";

const BaseGroupForms = () => {
  const dispatch = useAppDispatch();
  const { bgOption } = useAppSelector((state) => state.users);

  const handleGoBack = () => {
    dispatch(setBGOption(""));
    dispatch(setSelectedForm(0));
  };

  return (
    <div className="bg-custom-white rounded-lg shadow-lg min-w-36 text-[13px] select-none">
      <div className="font-medium px-2 rounded-t-lg py-0.5">Base Group Forms</div>
      <div className="grid grid-cols-2">
        <div className="bg-gradient-to-r from-blue-200 to-custom-white h-[1.5px]"></div>
        <div className="bg-gradient-to-l from-blue-200 to-custom-white h-[1.5px]"></div>
      </div>
      <div
        data-testid="bg-go-back-form-btn"
        className={`hover:cursor-pointer hover: hover:bg-blue-200 transition-all duration-200 py-1 px-2`}
        onClick={handleGoBack}
      >
        Go Back
      </div>
      <div
        data-testid="bg-create-form-btn"
        className={`${bgOption === "create" ? "bg-orange-200" : ""} hover:cursor-pointer hover: hover:bg-blue-200 transition-all duration-200 py-1 px-2`}
        onClick={() => dispatch(setBGOption("create"))}
      >
        New Base Group
      </div>
      <div
        data-testid="bg-update-form-btn"
        className={`${bgOption === "update" ? "bg-orange-200" : ""} hover:cursor-pointer hover: hover:bg-blue-200 transition-all duration-200 py-1 px-2`}
        onClick={() => dispatch(setBGOption("update"))}
      >
        Update Name
      </div>
      <div
        data-testid="bg-delete-form-btn"
        className={`${bgOption === "delete" ? "bg-orange-200" : ""} hover:cursor-pointer hover: hover:bg-blue-200 transition-all duration-200 py-1 px-2`}
        onClick={() => dispatch(setBGOption("delete"))}
      >
        Delete Base Group
      </div>
      <div
        data-testid="bg-assign-form-btn"
        className={`${bgOption === "assign_to_user" ? "bg-orange-200" : ""} hover:cursor-pointer hover: hover:bg-blue-200 transition-all duration-200 py-1 px-2`}
        onClick={() => dispatch(setBGOption("assign_to_user"))}
      >
        Assign/Unassign User
      </div>
    </div>
  );
};

export default BaseGroupForms;
