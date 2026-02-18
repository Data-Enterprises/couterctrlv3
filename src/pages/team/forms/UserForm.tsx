import { useAppSelector, useAppDispatch } from "../../../hooks";
import { roles } from "..";

// Components
import Input from "../../../components/inputs/Input";
import SingleSelect from "../../../components/SingleSelect";
import UserFormButtons from "./UserFormButtons";
import PasswordInput from "../../../components/inputs/PasswordInput";
import { setUserInfo } from "../../../features/usersSlice";
import { InfoIcon } from "../../../components/toasts/Icons";
// import CompanyAssign from "./CompanyAssign";
import PasswordSecurity from "./PasswordSecurity";

const UserForm = () => {
  const dispatch = useAppDispatch();
  const { userLevels, userInfo, selectedUserForm } = useAppSelector(
    (state) => state.users,
  );
  const user = useAppSelector((state) => state.user);

  const handleUsername = (x: string) => {
    dispatch(setUserInfo({ key: "username", value: x }));
  };

  const handleEmail = (x: string) => {
    dispatch(setUserInfo({ key: "email", value: x }));
  };

  const handleFirstName = (x: string) => {
    dispatch(setUserInfo({ key: "first_name", value: x }));
  };

  const handleLastName = (x: string) => {
    dispatch(setUserInfo({ key: "last_name", value: x }));
  };

  const handlePassword = (x: string) => {
    dispatch(setUserInfo({ key: "password", value: x }));
  };

  const handleConfirmPassword = (x: string) => {
    dispatch(setUserInfo({ key: "confirm_password", value: x }));
  };

  const handleUserLvlSelect = (x: string | number) => {
    dispatch(setUserInfo({ key: "user_level", value: Number(x) }));
  };

  const handleRoleSelect = (x: string | number) => {
    dispatch(setUserInfo({ key: "role", value: Number(x) }));
  };

  const findRole = () => {
    const role = userInfo.role;
    const found = roles.find((r) => r.value == role);
    if (found) {
      return found.label;
    }
    return "";
  };

  const findUserLvl = () => {
    const ul = userInfo.user_level;
    const found = userLevels.find((x) => x.id === ul);
    if (found) {
      return found.name;
    }
    return "";
  };

  return (
    <div className="bg-custom-white mt-4 space-y-2">
      <div className="flex items-center gap-2 select-none">
        <InfoIcon fill="#3b82f6" width={17} height={17} />
        <div className="text-sm font-medium text-content/70">
          Ensure all fields are valid and at least one company is assigned
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Input
          label="Username"
          value={userInfo.username}
          setValue={handleUsername}
        />
        <Input label="Email" value={userInfo.email} setValue={handleEmail} />
        <Input
          label="First Name"
          value={userInfo.first_name}
          setValue={handleFirstName}
        />
        <Input
          label="Last Name"
          value={userInfo.last_name}
          setValue={handleLastName}
        />
        <SingleSelect
          id={1}
          label="User Level"
          data={userLevels.filter((ul) => ul.id <= user.userLevel)}
          displayKey={"name"}
          valueKey="id"
          className="text-sm"
          innerClass="text-sm"
          onSelect={handleUserLvlSelect}
          resetQuery={true}
          defaultQuery={findUserLvl()}
        />
        <SingleSelect
          id={2}
          data={roles}
          valueKey={"value"}
          displayKey={"label"}
          label={"Role"}
          className="text-sm"
          innerClass="text-sm"
          onSelect={handleRoleSelect}
          resetQuery={true}
          defaultQuery={findRole()}
        />
        <PasswordInput
          label="Password"
          name="password"
          setText={handlePassword}
          text={userInfo.password}
          className="py-1.5"
          leftCompare={userInfo.password}
          rightCompare={userInfo.confirm_password}
        />
        <PasswordInput
          label="Confirm Password"
          name="confirm_password"
          setText={handleConfirmPassword}
          text={userInfo.confirm_password}
          className="py-1.5"
          leftCompare={userInfo.password}
          rightCompare={userInfo.confirm_password}
        />
      </div>
      {/* <CompanyAssign /> */}
      <UserFormButtons formType={selectedUserForm} />
      {selectedUserForm === "update" && <PasswordSecurity />}
    </div>
  );
};

export default UserForm;
