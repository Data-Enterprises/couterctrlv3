import { useAppSelector, useAppDispatch } from "../../hooks";
import { roles, userLevels } from ".";
import { setUserInfo, type FormData } from "../../features/usersSlice";
import TextInput from "../../components/TextInput";
import SingleSelect from "../../components/SingleSelect";

const UserInfo = () => {
  const dispatch = useAppDispatch();
  const userInfo = useAppSelector((state) => state.users.userInfo);

  const handleQueryChange = (field: keyof FormData, value: string) => {
    dispatch(setUserInfo({ key: field, value }));
  };

  const handleRoleSelection = (selection: string | number) => {
    const role = Number(selection);
    dispatch(setUserInfo({ key: "role", value: role }));
  };

  const handleLevelSelection = (selection: string | number) => {
    const level = Number(selection);
    dispatch(setUserInfo({ key: "user_level", value: level }));
  };

  return (
    <div className="h-full w-full ">
      <div className="text-lg font-medium">Personal Information</div>
      <div className="grid grid-cols-2 gap-x-6 gap-y-4">
        <TextInput
          name="username"
          title="Username"
          query={userInfo.username}
          setQuery={(key, value) =>
            handleQueryChange(key as keyof FormData, value)
          }
        />
        <TextInput
          name="email"
          title="Email"
          query={userInfo.email}
          setQuery={(key, value) =>
            handleQueryChange(key as keyof FormData, value)
          }
        />
        <TextInput
          name="firstName"
          title="First Name"
          query={userInfo.firstName}
          setQuery={(key, value) =>
            handleQueryChange(key as keyof FormData, value)
          }
        />
        <TextInput
          name="lastName"
          title="Last Name"
          query={userInfo.lastName}
          setQuery={(key, value) =>
            handleQueryChange(key as keyof FormData, value)
          }
        />
        <SingleSelect
          data={userLevels}
          valueKey="levelId"
          displayKey="levelDescription"
          label={"User Level"}
          onSelect={handleLevelSelection}
        />
        <SingleSelect
          data={[]}
          valueKey={""}
          displayKey={""}
          label={"Company"}
          onSelect={function (selection: string | number): void {
            throw new Error("Function not implemented." + selection);
          }}
        />
        <TextInput
          name="password"
          title="Password"
          query={userInfo.password}
          setQuery={(key, value) =>
            handleQueryChange(key as keyof FormData, value)
          }
        />
        <TextInput
          name="confirmPassword"
          title="Confirm Password"
          query={userInfo["confirmPassword"]}
          setQuery={(key, value) =>
            handleQueryChange(key as keyof FormData, value)
          }
        />
        <SingleSelect
          data={roles}
          defaultQuery="Admin"
          defaultValue={"9"}
          displayKey="label"
          valueKey="value"
          label="Role"
          onSelect={handleRoleSelection}
        />
        <div className="flex justify-between items-end">
          <div>
            <button className="btn-themeGreen px-7">Reset Security</button>
          </div>
          <div>
            <button className="btn-themeGreen px-7">Reset Password</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserInfo;
