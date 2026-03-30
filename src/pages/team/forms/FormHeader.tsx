import { useEffect } from "react";
import {
  setSelectedForm,
  setSelectedUserStores,
} from "../../../features/usersSlice";
import { useAppDispatch, useAppSelector } from "../../../hooks";

const FormHeader = () => {
  const dispatch = useAppDispatch();
  const { selectedForm } = useAppSelector((state) => state.users);
  const user = useAppSelector((state) => state.user);

  useEffect(() => {
    dispatch(setSelectedUserStores({ assigned: [], unassigned: [] }));
  }, [selectedForm]);

  const handleFormSelection = (x: number) => {
    dispatch(setSelectedForm(x));
  };

  return (
    <div className="bg-custom-white rounded-lg shadow-lg min-w-36 select-none">
      <div className="bg-blue-500 text-custom-white font-medium px-4 rounded-t-lg py-0.5">
        Forms
      </div>
      <div className="flex flex-col gap-1 p-2">
        <div
          data-testid="team-users-form"
          className={`${selectedForm === 1 ? "bg-orange-200" : ""} rounded-full hover:cursor-pointer hover: hover:bg-blue-200 transition-all duration-200 py-1 px-2`}
          onClick={() => handleFormSelection(1)}
        >
          Users
        </div>
        <div
          data-testid="team-bg-form"
          className={`${selectedForm === 2 ? "bg-orange-200" : ""} rounded-full hover:cursor-pointer hover: hover:bg-blue-200 transition-all duration-200 py-1 px-2`}
          onClick={() => handleFormSelection(2)}
        >
          Base Groups
        </div>
        <div
          data-testid="team-stores-form"
          className={`${selectedForm === 3 ? "bg-orange-200" : ""} rounded-full hover:cursor-pointer hover: hover:bg-blue-200 transition-all duration-200 py-1 px-2`}
          onClick={() => handleFormSelection(3)}
        >
          Stores
        </div>
        <div
          data-testid="team-companies-form"
          className={`${selectedForm === 4 ? "bg-orange-200" : ""} rounded-full hover:cursor-pointer hover: hover:bg-blue-200 transition-all duration-200 py-1 px-2`}
          onClick={() => handleFormSelection(4)}
        >
          Companies
        </div>
        <div
          data-testid="team-admin-form"
          className={`${selectedForm === 5 ? "bg-orange-200" : ""} ${user.userLevel >= 7 ? "" : "hidden"} rounded-full hover:cursor-pointer hover: hover:bg-blue-200 transition-all duration-200 py-1 px-2`}
          onClick={() => handleFormSelection(5)}
        >
          Admin
        </div>
      </div>
    </div>
  );
};

export default FormHeader;
