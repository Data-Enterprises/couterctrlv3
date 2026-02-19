import { useEffect } from "react";
import { setSelectedForm, setSelectedUserStores } from "../../../features/usersSlice";
import { useAppDispatch, useAppSelector } from "../../../hooks";

const FormHeader = () => {
  const dispatch = useAppDispatch();
  const { selectedForm } = useAppSelector((state) => state.users);

  useEffect(() => {
    dispatch(setSelectedUserStores({assigned: [], unassigned: []}))
  }, [selectedForm]);

  const handleFormSelection = (x: number) => {
    dispatch(setSelectedForm(x));
  };

  return (
    <div className="bg-custom-white rounded-lg shadow-lg min-w-36">
      <div className="bg-blue-500 text-custom-white font-medium px-4 rounded-t-lg py-0.5">
        Forms
      </div>
      <div className="grid gap-1 p-2">
        <div
          className={`${selectedForm === 1 ? "bg-orange-200" : ""} rounded-full hover:cursor-pointer hover: hover:bg-blue-200 transition-all duration-200 py-1 px-2`}
          onClick={() => handleFormSelection(1)}
        >
          Users
        </div>
        <div
          className={`${selectedForm === 2 ? "bg-orange-200" : ""} rounded-full hover:cursor-pointer hover: hover:bg-blue-200 transition-all duration-200 py-1 px-2`}
          onClick={() => handleFormSelection(2)}
        >
          Base Groups
        </div>
        <div
          className={`${selectedForm === 3 ? "bg-orange-200" : ""} rounded-full hover:cursor-pointer hover: hover:bg-blue-200 transition-all duration-200 py-1 px-2`}
          onClick={() => handleFormSelection(3)}
        >
          Stores
        </div>
      </div>
    </div>
  );
};

export default FormHeader;
