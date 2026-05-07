import { useAppSelector, useAppDispatch } from "../../../../hooks";
import type { User } from "../../../../interfaces";
import {
  resetUserInfo,
  setSelectedUserId,
  setSelectedUserInfo,
  setUserFilterText,
} from "../../../../features/usersSlice";
import Input from "../../../../components/inputs/Input";
import { useState } from "react";
import UpdatingUserForm from "./UpdatingUser";
import DeleteFormModal from "../DeleteFormModal";

const UserInfoForm = () => {
  const dispatch = useAppDispatch();
  const ctx = useAppSelector((state) => state.users);
  const user = useAppSelector((state) => state.user);
  const [openModal, setOpenModal] = useState<boolean>(false);
  const [selectedCompanies, setSelectedCompanies] = useState<number[]>([]);
  const [selectedUserLevels, setSelectedUserLevels] = useState<number[]>([]);
  const [textOption, setTextOption] = useState<"username" | "email">(
    "username",
  );
  const [isUpdating, setIsUpdating] = useState<boolean>(false);

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

  const handleCompanySelect = (company: number) => {
    setSelectedCompanies((prev) =>
      prev.includes(company)
        ? prev.filter((c) => c !== company)
        : [...prev, company],
    );
  };

  const handleUserLevelSelect = (level: number) => {
    setSelectedUserLevels((prev) =>
      prev.includes(level) ? prev.filter((l) => l !== level) : [...prev, level],
    );
  };

  const filteredUsers = () => {
    return ctx.users.filter((u) => {
      const matchesCompany =
        selectedCompanies.length === 0 ||
        u.companies.some((c) => selectedCompanies.includes(c.company));

      const matchesUserLevel =
        selectedUserLevels.length === 0 ||
        selectedUserLevels.includes(u.user_level);

      const matchesSearch =
        ctx.userFilterText.trim() === "" ||
        (textOption === "username"
          ? u.username.toLowerCase().includes(ctx.userFilterText.toLowerCase())
          : u.email !== null
            ? u.email.toLowerCase().includes(ctx.userFilterText.toLowerCase())
            : false);

      return matchesCompany && matchesUserLevel && matchesSearch;
    });
  };

  if (isUpdating)
    return <UpdatingUserForm goBack={() => setIsUpdating(false)} />;

  const handleUserCardBtnClick = (u: User) => {
    if (ctx.selectedUserForm === "delete") {
      setOpenModal(true);
      dispatch(setSelectedUserInfo(u));
      return;
    }
    dispatch(setSelectedUserId(u.id));
    dispatch(setSelectedUserInfo(u));
    setIsUpdating(true);
  };

  const onClose = () => {
    setOpenModal(false);
    dispatch(setSelectedUserId(0));
    dispatch(resetUserInfo());
  };

  return (
    <div className="space-y-4">
      <DeleteFormModal
        isOpen={openModal}
        onClose={onClose}
        formType="user"
      />
      {/* User Filters */}
      <div className="">
        <div>
          <div className="pl-0.5">Companies</div>
          <div className="flex flex-wrap gap-2 text-[14px]">
            {user.companies.map((c, i) => (
              <button
                key={i}
                className={`py-1.5 px-2 rounded-full border transition-all duration-200 ${
                  selectedCompanies.includes(c.company)
                    ? "bg-[rgb(30,45,80)]/95 text-custom-white border-transparent"
                    : "bg-custom-white text-content border-slate-300"
                }`}
                onClick={() => handleCompanySelect(c.company)}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>
        <div>
          <div className="pl-0.5">User Levels</div>
          <div className="flex flex-wrap gap-2 text-[14px]">
            {ctx.userLevels.map((l, i) => (
              <button
                key={i}
                className={`py-1.5 px-2 rounded-full border transition-all duration-200 ${
                  selectedUserLevels.includes(l.id)
                    ? "bg-[rgb(30,45,80)]/95 text-custom-white border-transparent"
                    : "bg-custom-white text-content border-slate-300"
                }`}
                onClick={() => handleUserLevelSelect(l.id)}
              >
                {l.name}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-3 items-end">
          <Input
            label={`Search Users ${filteredUsers().length}`}
            value={ctx.userFilterText}
            setValue={handleTextChange}
          />
          <button
            className={`${textOption === "username" ? "bg-[rgb(30,45,80)]/95" : "bg-[rgb(30,45,80)]/45"} transition-all duration-200 text-custom-white py-2 w-1/4 rounded-xl`}
            onClick={() => setTextOption("username")}
          >
            Username
          </button>
          <button
            className={`${textOption === "email" ? "bg-[rgb(30,45,80)]/95" : "bg-[rgb(30,45,80)]/45"} transition-all duration-200 text-custom-white py-2 w-1/4 rounded-xl`}
            onClick={() => setTextOption("email")}
          >
            Email
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[calc(100vh-305px)] overflow-y-auto">
        {filteredUsers().map((user, i) => (
          <div
            key={i}
            className="border p-4 rounded-lg bg-custom-white shadow flex flex-col justify-between gap-3"
          >
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
            <div className="grid font-medium">
              {!isOutranked(user) ? (
                <button
                  className={`${ctx.selectedUserForm === "user_info" ? "bg-[rgb(30,45,80)]/95" : "bg-red-600"} text-custom-white py-3 px-0 rounded-2xl shadow`}
                  onClick={() => handleUserCardBtnClick(user)}
                >
                  {ctx.selectedUserForm === "user_info"
                    ? "Update Info"
                    : "Delete User"}
                </button>
              ) : (
                <div className="bg-[rgb(30,45,80)]/50 text-custom-white py-3 px-0 rounded-2xl shadow text-center">
                  You are not authorized to update this user
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UserInfoForm;
