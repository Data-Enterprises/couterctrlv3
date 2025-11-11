import { useEffect, useState } from "react";
import TextInput from "../../components/TextInput";
import SingleSelect from "../../components/SingleSelect";
import { roles, formData } from ".";

const UserInfo = () => {
  const [userInfo, setUserInfo] = useState<typeof formData>(formData);

  useEffect(() => {
    console.log(userInfo);
  }, [userInfo]);

  const handleQueryChange = (field: string, value: string) => {
    setUserInfo((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleRoleSelection = (selection: string | number) => {
    setUserInfo((prev) => ({
      ...prev,
      role: selection as string,
    }));
  };

  return (
    <div className="h-full w-full ">
      <div className="text-lg font-medium">Personal Information</div>
      <div className="grid grid-cols-2 gap-x-6 gap-y-4">
        <TextInput
          name="username"
          title="Username"
          query={userInfo.username}
          setQuery={handleQueryChange}
        />
        <TextInput
          name="email"
          title="Email"
          query={userInfo.email}
          setQuery={handleQueryChange}
        />
        <TextInput
          name="firstName"
          title="First Name"
          query={userInfo.firstName}
          setQuery={handleQueryChange}
        />
        <TextInput
          name="lastName"
          title="Last Name"
          query={userInfo.lastName}
          setQuery={handleQueryChange}
        />
        <SingleSelect
          data={[]}
          valueKey={""}
          displayKey={""}
          label={"User Level"}
          onSelect={function (selection: string | number): void {
            throw new Error("Function not implemented." + selection);
          }}
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
          setQuery={handleQueryChange}
        />
        <TextInput
          name="confirmPassword"
          title="Confirm Password"
          query={userInfo["confirmPassword"]}
          setQuery={handleQueryChange}
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
