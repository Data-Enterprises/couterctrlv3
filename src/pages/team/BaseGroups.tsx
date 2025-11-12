import { useAppSelector } from "../../hooks";
import type { FilterOption } from "../../features/groupSlice";

const BaseGroups = () => {
  const baseGroups = useAppSelector((state) => state.users.baseGroups);

  const renderGroupAmount = (arg: FilterOption) => {
    if (arg === "all") return baseGroups.length;
    if (arg === "active")
      return baseGroups.filter((group) => group.active).length;
    if (arg === "inactive")
      return baseGroups.filter((group) => !group.active).length;
  };

  return (
    <div className="select-none">
      <div className="flex gap-2">
        <div className="bg-blue-500 text-custom-white px-2 py-0.5 rounded-t-lg text-sm">
          {renderGroupAmount("all")} All Groups
        </div>
        <div className="bg-emerald-500 text-custom-white px-2 py-0.5 rounded-t-lg text-sm">
          {renderGroupAmount("active")} Active Groups
        </div>
        <div className="bg-orange-500 text-custom-white px-2 py-0.5 rounded-t-lg text-sm">
          {renderGroupAmount("inactive")} Inactive Groups
        </div>
      </div>
      <div className="w-full min-h-[93.4%] max-h-[93.4%] rounded-b-lg rounded-tr-lg px-4 border-2 border-content/10 relative">
        <div
          className="absolute w-full pr-8 top-4 max-h-[75%] overflow-hidden grid grid-cols-3 
            text gap-4 overflow-y-scroll no-scrollbar rounded-lg text-sm"
        >
          {baseGroups.map((group, i) => (
            <div
              key={i}
              className="flex justify-between bg-custom-white p-4 rounded-lg shadow-lg hover:shadow-inner 
                hover:bg-blue-200/50 transition-all duration-200 cursor-pointer"
            >
              <div>{group.name}</div>
              <div
                className={`${
                  group.active ? "text-emerald-500" : "text-orange-500"
                } font-medium`}
              >
                {group.active ? "Active" : "Inactive"}
              </div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-4 absolute w-full pr-8 bottom-4">
          <button className="btn-themeOrange">Delete User</button>
          <button className="btn-themeBlue">Update Password</button>
          <button className="btn-themeBlue">Update User</button>
        </div>
      </div>
    </div>
  );
};

export default BaseGroups;
