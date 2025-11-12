import { useAppSelector, useAppDispatch } from "../../hooks";
import { inputs } from ".";
import { setUserInfo, type FormData } from "../../features/usersSlice";
import TextInput from "../../components/TextInput";
import SingleSelect from "../../components/SingleSelect";

const UserInfo = () => {
  const dispatch = useAppDispatch();
  const userInfo = useAppSelector((state) => state.users.userInfo);

  // For the text fields
  const handleQueryChange = (field: keyof FormData, value: string) => {
    dispatch(setUserInfo({ key: field, value }));
  };

  // For the SingleSelect components
  const handleRoleSelection = (selection: string | number) => {
    const role = Number(selection);
    dispatch(setUserInfo({ key: "role", value: role }));
  };

  const handleLevelSelection = (selection: string | number) => {
    const level = Number(selection);
    dispatch(setUserInfo({ key: "user_level", value: level }));
  };

  const handleCompanySelection = (selection: string | number) => {
    const company = Number(selection);
    dispatch(setUserInfo({ key: "company", value: company }));
  };

  const returnOnSelectFunction = (name: string) => {
    if (!name) return () => {};
    if (name === "role") return handleRoleSelection;
    if (name === "user_level") return handleLevelSelection;
    if (name === "company") return handleCompanySelection;
  };

  return (
    <div className="h-full w-full ">
      <div className="text-lg font-medium">Personal Information</div>
      <div className="grid grid-cols-2 gap-x-6 gap-y-4">
        {inputs.map((input, i) => {
          return input.type === "text" ? (
            <TextInput
              key={i}
              name={input.name}
              query={userInfo[input.name as keyof FormData] as string}
              setQuery={(field, value) =>
                handleQueryChange(field as keyof FormData, value)
              }
              title={input.title}
            />
          ) : (
            <SingleSelect
              data={input.data!}
              valueKey={"value"}
              displayKey={"label"}
              label={input.title}
              onSelect={returnOnSelectFunction(input.name)}
            />
          );
        })}
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
