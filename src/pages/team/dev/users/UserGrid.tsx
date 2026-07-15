import { useMemo, useState } from "react";
import { useTeamCtx } from "../hooks";
import { useToast } from "../../../../components/toasts/hooks/useToast";
import {
  setRefresh,
  setSelectedUserForm,
  setSelectedUserId,
  setSelectedUserInfo,
} from "../../../../features/usersSlice";
import { deleteUser } from "../../../../api/team";
import type { JsonError, User } from "../../../../interfaces";
import { roles } from "../..";
import SelectFilter from "../../../../components/filters/SelectFilter";
import TextFilter from "../../../../components/filters/TextFilter";

interface UserGridProps {
  mode: "info" | "delete";
}

const formatDate = (dateStr: string | null) => {
  if (!dateStr) return "N/A";
  const split = dateStr.split("-");
  return `${split[1]}/${split[2]}/${split[0]}`;
};

const UserGrid = ({ mode }: UserGridProps) => {
  const toast = useToast();
  const ctx = useTeamCtx();
  const [companyFilter, setCompanyFilter] = useState("");
  const [levelFilter, setLevelFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [searchType, setSearchType] = useState<"name" | "email">("name");
  const [searchText, setSearchText] = useState("");
  const [deletingUser, setDeletingUser] = useState<User | null>(null);

  const isOutranked = (lvl: number) => lvl > ctx.userLevel;

  const renderRoleText = (role: number | null) =>
    roles.find((r) => r.value == role)?.label ?? "";
  const renderLvlText = (lvl: number) =>
    ctx.userLevels.find((l) => l.id === lvl)?.name ?? "N/A";

  const filtered = useMemo(() => {
    return ctx.users.filter((u) => {
      const companyCheck = companyFilter
        ? u.companies.some((c) => c.company === Number(companyFilter))
        : true;
      const levelCheck = levelFilter
        ? u.user_level === Number(levelFilter)
        : true;
      const roleCheck = roleFilter ? u.role === Number(roleFilter) : true;
      const lowerText = searchText.toLowerCase();
      const textCheck =
        searchText.trim() === ""
          ? true
          : searchType === "name"
            ? u.username.toLowerCase().includes(lowerText)
            : (u.email ?? "").toLowerCase().includes(lowerText);
      return companyCheck && levelCheck && roleCheck && textCheck;
    });
  }, [
    ctx.users,
    companyFilter,
    levelFilter,
    roleFilter,
    searchType,
    searchText,
  ]);

  const handleActionClick = (u: User) => {
    if (mode === "info") {
      ctx.dispatch(setSelectedUserId(u.id));
      ctx.dispatch(setSelectedUserInfo(u));
      ctx.dispatch(setSelectedUserForm("user_info"));
    } else {
      setDeletingUser(u);
    }
  };

  const handleDeleteConfirm = () => {
    if (!deletingUser) return;
    deleteUser(ctx.url, ctx.token, deletingUser.username)
      .then((resp) => {
        const j = resp.data;
        if (j.error === 0) {
          toast.success("User deleted successfully");
          setDeletingUser(null);
          ctx.dispatch(setRefresh(true));
        } else {
          toast.warn("Error deleting user: " + j.msg);
        }
      })
      .catch((err: JsonError) =>
        toast.error("Error deleting user: " + err.message),
      );
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 p-4">
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <SelectFilter
          options={ctx.companies.map((c) => ({
            value: String(c.company),
            label: c.name,
          }))}
          value={companyFilter}
          onChange={setCompanyFilter}
          placeholder="All companies"
          className="w-[150px]"
        />
        <SelectFilter
          options={ctx.userLevels.map((l) => ({
            value: String(l.id),
            label: l.name,
          }))}
          value={levelFilter}
          onChange={setLevelFilter}
          placeholder="All levels"
          className="w-[130px]"
        />
        <SelectFilter
          options={roles.map((r) => ({
            value: String(r.value),
            label: r.label,
          }))}
          value={roleFilter}
          onChange={setRoleFilter}
          placeholder="All roles"
          className="w-[120px]"
        />
        <div className="w-px h-4 bg-gray-200" />
        <div className="flex rounded overflow-hidden flex-shrink-0">
          <button
            onClick={() => setSearchType("name")}
            className={`text-[10px] px-2.5 py-1 ${searchType === "name" ? "bg-[#1e2a4a] text-custom-white" : "bg-custom-white border border-gray-200 text-content"}`}
          >
            Username
          </button>
          <button
            onClick={() => setSearchType("email")}
            className={`text-[10px] px-2.5 py-1 ${searchType === "email" ? "bg-[#1e2a4a] text-custom-white" : "bg-custom-white border border-gray-200 text-content"}`}
          >
            Email
          </button>
        </div>
        <TextFilter
          value={searchText}
          onChange={setSearchText}
          placeholder="Search…"
          className="min-w-[140px]"
        />
      </div>

      <div className="border border-gray-100 rounded-lg overflow-hidden flex-1 min-h-0 flex flex-col">
        <div className="grid grid-cols-[16%_11%_33%_14%_14%_12%] px-3 py-2 bg-gray-50 text-[9px] font-bold uppercase tracking-wide text-content flex-shrink-0">
          <div>Username</div>
          <div>Last visit</div>
          <div>Email</div>
          <div>Level</div>
          <div>Role</div>
          <div className="text-right">Action</div>
        </div>
        <div className="max-h-96 overflow-y-auto thin-scrollbar">
          {filtered.map((u) => {
            const outranked = isOutranked(u.user_level);
            return (
              <div
                key={u.id}
                className={`grid grid-cols-[16%_11%_33%_14%_14%_12%] px-3 py-2 text-[12px] items-center border-b border-gray-100 ${outranked ? "bg-gray-50 text-content/40" : "text-content"}`}
              >
                <div className="truncate">{u.username}</div>
                <div>{formatDate(u.last_visit)}</div>
                <div className="truncate">{u.email}</div>
                <div>{renderLvlText(u.user_level)}</div>
                <div>{renderRoleText(u.role)}</div>
                <div className="text-right">
                  {outranked ? (
                    <span className="text-[10px] italic text-content/40">
                      Unauthorized
                    </span>
                  ) : (
                    <button
                      onClick={() => handleActionClick(u)}
                      className={`text-[11px] font-medium px-3 py-1 rounded-md text-white ${mode === "info" ? "bg-[#1e2a4a] hover:bg-[#1e2a4a]/85" : "bg-red-600 hover:bg-red-600/85"}`}
                    >
                      {mode === "info" ? "View info" : "Delete"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div className="flex items-center justify-center py-8 text-[12px] text-content">
              No users found
            </div>
          )}
        </div>
      </div>

      {mode === "delete" && deletingUser && (
        <div className="border border-red-300 bg-red-50 rounded-lg px-3.5 py-3 mt-3">
          <div className="text-[12px] text-red-800 mb-2.5">
            Delete {deletingUser.username}? This can't be undone.
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleDeleteConfirm}
              className="text-[12px] font-medium px-3.5 py-1.5 rounded-md bg-red-600 hover:bg-red-600/85 text-white transition-colors"
            >
              Yes, delete
            </button>
            <button
              onClick={() => setDeletingUser(null)}
              className="text-[12px] font-medium px-3.5 py-1.5 rounded-md bg-custom-white border border-gray-200 text-content transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserGrid;
