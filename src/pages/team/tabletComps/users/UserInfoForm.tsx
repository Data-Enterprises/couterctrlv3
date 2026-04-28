import { useAppSelector, useAppDispatch } from "../../../../hooks";
import type { User } from "../../../../interfaces";
import { setUserFilterText } from "../../../../features/usersSlice";
import Input from "../../../../components/inputs/Input";
import SingleSelect from "../../../../components/SingleSelect";

const UserInfoForm = () => {
  const dispatch = useAppDispatch();
  const ctx = useAppSelector((state) => state.users);
  const user = useAppSelector((state) => state.user);

  const isOutranked = (current: User) => {
    return current.user_level > user.userLevel;
  };

  const formatDate = (dateStr: string) => {
    const split = dateStr.split("-");
    return `${split[1]}/${split[2]}/${split[0]}`;
  };

  const handleTextChange = (x: string) => {
    dispatch(setUserFilterText(x));
  };

  return (
    <div className="space-y-4">
      {/* User Filters */}
      <div className="grid grid-cols-3 gap-3">
        <SingleSelect
          data={user.companies}
          label="Company"
          valueKey="company"
          displayKey="name"
          onSelect={(value) => console.log(value)}
          innerClass="py-1.5"
        />
        <SingleSelect
          label="User Levels"
          data={ctx.userLevels}
          valueKey="id"
          displayKey="name"
          onSelect={(value) => console.log(value)}
          innerClass="py-1.5"
        />
        <Input
          label="Search Users"
          value={ctx.userFilterText}
          setValue={handleTextChange}
        />
      </div>

      {/* 1. Grid expands to 2 columns on tablets */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[calc(100vh-260px)] overflow-y-auto">
        {ctx.users.map((user, i) => (
          <div
            key={i}
            className="border p-4 rounded-lg bg-custom-white shadow flex flex-col justify-between gap-3"
          >
            {/* Header section with User info and Last Visit */}
            <div className="flex justify-between items-start">
              <div>
                <div className="font-medium text-lg">{user.username}</div>
                <div className="text-sm">
                  {user.first_name} {user.last_name}
                </div>
                <div className="text-xs text-content/60">{user.email}</div>
              </div>
              <div className="text-right text-xs text-content/60 italic space-y-">
                <div className="flex gap-2 justify-end">
                  <div>Last Visit:</div>
                  {user.last_visit ? formatDate(user.last_visit) : "Never"}
                </div>
                <div className="flex gap-2 justify-end">
                  <div>User Level:</div>
                  {ctx.userLevels.find((l) => l.id === user.user_level)?.name ||
                    "N/A"}
                </div>
              </div>
            </div>

            {/* Companies section - distinct block at the bottom */}
            <div className="pt-2 border-t border-content/10">
              <div className="text-xs font-semibold uppercase text-content/50 mb-1">
                Companies
              </div>
              <div className="text-sm">
                {user.companies.length > 0 ? (
                  user.companies.map((c) => c.name).join(", ")
                ) : (
                  <span className="text-content/40 italic">None</span>
                )}
              </div>
            </div>
            <div
              className={`${isOutranked(user) ? "hidden" : "font-medium grid grid-cols-3 gap-4"}`}
            >
              <button className="bg-[rgb(30,45,80)]/95 text-custom-white py-3 px-0 rounded-2xl shadow">
                Update Info
              </button>
              <button className="bg-[rgb(30,45,80)]/95 text-custom-white py-3 px-0 rounded-2xl shadow">
                Reset Password
              </button>
              <button className="bg-[rgb(30,45,80)]/95 text-custom-white py-3 px-0 rounded-2xl shadow">
                Reset Security
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UserInfoForm;
