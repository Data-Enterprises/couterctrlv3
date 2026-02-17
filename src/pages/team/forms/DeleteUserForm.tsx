import { useAppSelector } from "../../../hooks";
import { roles } from "..";

const DeleteUserForm = () => {
  const { userInfo, userLevels } = useAppSelector((state) => state.users);

  const findUserLvl = () => {
    const found = [...userLevels].find((ul) => ul.id === userInfo.user_level);
    if (found) {
      return found.name;
    }
    return "";
  };

  const findRole = () => {
    const found = roles.find((r) => r.value == userInfo.role);
    if (found) {
      return found.label;
    }
    return "";
  };

  return (
    <div className="grid grid-cols-3 gap-2 mt-4">
      <div>
        <div className="font-medium text-sm underline">Username</div>
        <div>{userInfo.username}</div>
      </div>
      <div>
        <div className="font-medium text-sm underline">Email</div>
        <div>{userInfo.email}</div>
      </div>
      <div>
        <div className="font-medium text-sm underline">First Name</div>
        <div>{userInfo.first_name}</div>
      </div>
      <div>
        <div className="font-medium text-sm underline">Last Name</div>
        <div>{userInfo.last_name}</div>
      </div>
      <div>
        <div className="font-medium text-sm underline">User Level</div>
        <div>{findUserLvl()}</div>
      </div>
      <div>
        <div className="font-medium text-sm underline">Role</div>
        <div>{findRole()}</div>
      </div>
    </div>
  );
};

export default DeleteUserForm;
