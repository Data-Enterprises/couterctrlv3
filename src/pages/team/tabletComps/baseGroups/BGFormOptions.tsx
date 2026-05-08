import { setBGOption, setSelectedForm } from "../../../../features/usersSlice";
import { useAppDispatch, useAppSelector } from "../../../../hooks";
import {
  PlusCircleIcon,
  ArrowLeftIcon,
  UserGroupIcon,
  LinkSlashIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/solid";

const BGFormOptions = () => {
  const dispatch = useAppDispatch();
  const { bgOption } = useAppSelector((state) => state.users);

  const handleInnerNav = (form: string) => {
    switch (form) {
      case "create":
        dispatch(setBGOption("create"));
        break;
      case "delete":
        dispatch(setBGOption("delete"));
        break;
      case "update":
        dispatch(setBGOption("update"));
        break;
      case "assign_to_user":
        dispatch(setBGOption("assign_to_user"));
        break;
      default:
        dispatch(setBGOption(""));
        dispatch(setSelectedForm(0));
    }
  };

  return (
    <div>
      <div className="grid gap-3">
        <div
          className={`p-3 bg-custom-white rounded-lg flex flex-col justify-center items-center`}
          onClick={() => handleInnerNav("")}
        >
          <ArrowLeftIcon className="w-12 h-12" />
          <div>Go Back</div>
        </div>
        <div
          className={`p-3 transition-all duration-200 ${bgOption === "create" ? "bg-orange-200" : "bg-custom-white"} rounded-lg flex flex-col justify-center items-center`}
          onClick={() => handleInnerNav("create")}
        >
          <PlusCircleIcon className="w-12 h-12" />
          <div>New Base Group</div>
        </div>
        <div
          className={`p-3 transition-all duration-200 ${bgOption === "update" ? "bg-orange-200" : "bg-custom-white"} rounded-lg flex flex-col justify-center items-center`}
          onClick={() => handleInnerNav("update")}
        >
          <ArrowPathIcon className="w-12 h-12" />
          <div>Update Name</div>
        </div>
        <div
          className={`p-3 transition-all duration-200 ${bgOption === "delete" ? "bg-orange-200" : "bg-custom-white"} rounded-lg flex flex-col justify-center items-center`}
          onClick={() => handleInnerNav("delete")}
        >
          <LinkSlashIcon className="w-12 h-12" />
          <div>Delete Base Group</div>
        </div>
        <div
          className={`p-3 transition-all duration-200 ${bgOption === "assign_to_user" ? "bg-orange-200" : "bg-custom-white"} rounded-lg flex flex-col justify-center items-center`}
          onClick={() => handleInnerNav("assign_to_user")}
        >
          <UserGroupIcon className="w-12 h-12" />
          <div>User Base Groups</div>
        </div>
      </div>
    </div>
  );
};

export default BGFormOptions;
