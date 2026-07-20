import { useMemo, useState } from "react";
import { PencilIcon, TrashIcon, PlusIcon } from "@heroicons/react/20/solid";
import { useOrganizationCtx } from "../hooks";
import { useToast } from "../../../components/toasts/hooks/useToast";
import {
  setRefresh,
  setSelectedUserForm,
  setSelectedUserId,
  setSelectedUserInfo,
} from "../../../features/usersSlice";
import { deleteUser } from "../../../api/team";
import type { JsonError, User } from "../../../interfaces";
import { roles } from "../constants";
import SelectFilter from "../../../components/filters/SelectFilter";
import TextFilter from "../../../components/filters/TextFilter";
import IconButton from "../../../components/IconButton";
import ConfirmModal from "../../../components/ConfirmModal";

interface UserGridProps {
  onOpenCreate: () => void;
}

const formatDate = (dateStr: string | null) => {
  if (!dateStr) return "N/A";
  const split = dateStr.split("-");
  return `${split[1]}/${split[2]}/${split[0]}`;
};

const UserGrid = ({ onOpenCreate }: UserGridProps) => {
  const toast = useToast();
  const ctx = useOrganizationCtx();
  const [companyFilter, setCompanyFilter] = useState("");
  const [levelFilter, setLevelFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [noCompanyOnly, setNoCompanyOnly] = useState(false);
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
      const companyCheck = noCompanyOnly
        ? u.companies.length === 0
        : companyFilter
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
    noCompanyOnly,
    levelFilter,
    roleFilter,
    searchType,
    searchText,
  ]);

  const noCompanyCount = useMemo(
    () => ctx.users.filter((u) => u.companies.length === 0).length,
    [ctx.users],
  );

  const handleEdit = (u: User) => {
    ctx.dispatch(setSelectedUserId(u.id));
    ctx.dispatch(setSelectedUserInfo(u));
    ctx.dispatch(setSelectedUserForm("user_info"));
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
    <div className="flex-1 flex flex-col min-h-0 p-4 w-[900px]">
      <div className="flex flex-nowrap items-center gap-2 mb-3">
        <SelectFilter
          options={ctx.companies.map((c) => ({
            value: String(c.company),
            label: c.name,
          }))}
          value={companyFilter}
          onChange={(v) => {
            setCompanyFilter(v);
            setNoCompanyOnly(false);
          }}
          placeholder="All companies"
          className="w-[150px] flex-shrink-0"
        />
        <button
          onClick={() => {
            setNoCompanyOnly((v) => !v);
            setCompanyFilter("");
          }}
          className={`text-[10.5px] font-medium px-2.5 py-1 rounded-full flex-shrink-0 whitespace-nowrap ${
            noCompanyOnly
              ? "bg-[#1e2a4a] text-custom-white"
              : "bg-custom-white border border-gray-200 text-content"
          }`}
        >
          No company ({noCompanyCount})
        </button>
        <SelectFilter
          options={ctx.userLevels.map((l) => ({
            value: String(l.id),
            label: l.name,
          }))}
          value={levelFilter}
          onChange={setLevelFilter}
          placeholder="All levels"
          className="w-[130px] flex-shrink-0"
        />
        <SelectFilter
          options={roles.map((r) => ({
            value: String(r.value),
            label: r.label,
          }))}
          value={roleFilter}
          onChange={setRoleFilter}
          placeholder="All roles"
          className="w-[120px] flex-shrink-0"
        />
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
          className="flex-1 min-w-[100px]"
        />
        <button
          onClick={onOpenCreate}
          className="flex items-center gap-1 text-[11.5px] font-medium px-3 py-1.5 rounded-md text-custom-white bg-[#1e2a4a] hover:bg-[#1e2a4a]/85 flex-shrink-0"
        >
          <PlusIcon className="w-3.5 h-3.5" />
          New user
        </button>
      </div>

      <div className="border border-gray-100 rounded-lg overflow-hidden flex-1 min-h-0 flex flex-col">
        <div className="grid grid-cols-[16%_34%_14%_12%_14%_10%] px-3 py-2 bg-gray-50 text-[9px] font-bold uppercase tracking-wide text-content flex-shrink-0">
          <div>Username</div>
          <div>Email</div>
          <div>Role</div>
          <div>Level</div>
          <div>Last visited</div>
          <div></div>
        </div>
        <div className="max-h-96 overflow-y-auto thin-scrollbar">
          {filtered.map((u) => {
            const outranked = isOutranked(u.user_level);
            return (
              <div
                key={u.id}
                className={`grid grid-cols-[16%_34%_14%_12%_14%_10%] px-3 py-2 text-[12px] items-center border-b border-gray-100 ${outranked ? "bg-gray-50 text-content/40" : "text-content"}`}
              >
                <div className="truncate">{u.username}</div>
                <div className="truncate">{u.email}</div>
                <div>{renderRoleText(u.role)}</div>
                <div>{renderLvlText(u.user_level)}</div>
                <div>{formatDate(u.last_visit)}</div>
                <div className="flex items-center justify-end gap-1">
                  {outranked ? (
                    <span className="text-[10px] italic text-content/40">
                      Unauthorized
                    </span>
                  ) : (
                    <>
                      <IconButton
                        icon={PencilIcon}
                        title="Edit"
                        onClick={() => handleEdit(u)}
                      />
                      <IconButton
                        icon={TrashIcon}
                        title="Delete"
                        variant="danger"
                        onClick={() => setDeletingUser(u)}
                      />
                    </>
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

      {deletingUser && (
        <ConfirmModal
          title={`Delete ${deletingUser.username}?`}
          message="This can't be undone."
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeletingUser(null)}
        />
      )}
    </div>
  );
};

export default UserGrid;
