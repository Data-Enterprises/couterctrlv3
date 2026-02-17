import { setSelectedForm } from "../../../features/usersSlice";
import { useAppDispatch, useAppSelector } from "../../../hooks";

const FormHeader = () => {
  const dispatch = useAppDispatch();
  const { selectedForm } = useAppSelector((state) => state.users);

  const handleFormSelection = (x: number) => {
    dispatch(setSelectedForm(x));
  };

  return (
    <div className="bg-custom-white rounded-lg shadow-lg">
      <div className="bg-blue-500 text-custom-white font-medium px-4 rounded-t-lg py-0.5">
        Forms
      </div>
      <div className="grid grid-cols-2 gap-4 p-4">
        <button
          className={`${selectedForm === 1 ? "btn-themeGreen" : "btn-themeBlue"}`}
          onClick={() => handleFormSelection(1)}
        >
          Users
        </button>
        <button
          className={`${selectedForm === 2 ? "btn-themeGreen" : "btn-themeBlue"}`}
          onClick={() => handleFormSelection(2)}
        >
          Base Groups
        </button>
      </div>
    </div>
  );
};

export default FormHeader;
