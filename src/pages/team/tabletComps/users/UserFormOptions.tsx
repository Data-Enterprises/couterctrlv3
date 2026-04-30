import { useAppDispatch, useAppSelector } from "../../../../hooks";
import {
  setSelectedForm,
  setSelectedUserForm,
} from "../../../../features/usersSlice";
import {
  ArrowLeftIcon,
  UserCircleIcon,
  UserGroupIcon,
  LinkSlashIcon
} from "@heroicons/react/24/solid";

const UserFormOptions = () => {
  const dispatch = useAppDispatch();
  const selectedUserForm = useAppSelector(
    (state) => state.users.selectedUserForm,
  );

  const handleInnerNav = (form: string) => {
    switch (form) {
      case "create":
        dispatch(setSelectedUserForm("create"));
        break;
      // case "update":
      //   dispatch(setSelectedUserForm("update"));
      //   break;
      case "delete":
        dispatch(setSelectedUserForm("delete"));
        break;
      // case "update_password":
      //   break;
      // case "reset_security":
      //   break;
      case "user_info":
        dispatch(setSelectedUserForm("user_info"));
        break;
      default:
        dispatch(setSelectedUserForm(""));
        dispatch(setSelectedForm(0));
    }
  };

  return (
    <div className="grid grid-cols-4 gap-3">
      <div
        className={`p-3 bg-custom-white rounded-lg shadow-lg flex flex-col justify-center items-center`}
        onClick={() => handleInnerNav("")}
      >
        <ArrowLeftIcon className="w-12 h-12" />
        <div>Go Back</div>
      </div>
      <div
        className={`p-3 bg-custom-white rounded-lg shadow-lg flex flex-col justify-center items-center ${selectedUserForm === "create" ? "bg-orange-200" : "bg-custom-white"} transition-all duration-200`}
        onClick={() => handleInnerNav("create")}
      >
        <UserCircleIcon className="w-12 h-12" />
        <div>New User</div>
      </div>
      <div
        className={`p-3 bg-custom-white rounded-lg shadow-lg flex flex-col justify-center items-center ${selectedUserForm === "user_info" ? "bg-orange-200" : "bg-custom-white"} transition-all duration-200`}
        onClick={() => handleInnerNav("user_info")}
      >
        <UserGroupIcon className="w-12 h-12" />
        <div>User Info</div>
      </div>
      <div
        className={`p-3 bg-custom-white rounded-lg shadow-lg flex flex-col justify-center items-center ${selectedUserForm === "delete" ? "bg-orange-200" : "bg-custom-white"} transition-all duration-200`}
        onClick={() => handleInnerNav("delete")}
      >
        <LinkSlashIcon className="w-12 h-12" />
        <div>Delete User</div>
      </div>
    </div>
  );
};

export default UserFormOptions;
