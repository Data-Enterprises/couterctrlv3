import { useMemo, useState } from "react";
import {
  PencilIcon,
  TrashIcon,
  PlusIcon,
  ArrowPathIcon,
  KeyIcon,
} from "@heroicons/react/20/solid";
import { useOrganizationCtx } from "../hooks";
import { useToast } from "../../../components/toasts/hooks/useToast";
import {
  setRefresh,
  setSelectedUserForm,
  setSelectedUserId,
  setSelectedUserInfo,
} from "../../../features/usersSlice";
import { deleteUser, reactivateUser } from "../../../api/team";
import type { JsonError, User } from "../../../interfaces";
import { roles } from "../constants";
import SelectFilter from "../../../components/filters/SelectFilter";
import TextFilter from "../../../components/filters/TextFilter";
import IconButton from "../../../components/IconButton";
import ConfirmModal from "../../../components/ConfirmModal";
import SecurityTab from "./view/SecurityTab";

interface UserGridProps {
  onOpenCreate: () => void;
}

const NO_COMPANY_VALUE = "none";

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
  const [searchType, setSearchType] = useState<"name" | "email">("name");
  const [searchText, setSearchText] = useState("");
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [securityUser, setSecurityUser] = useState<User | null>(null);
  const [statusFilter, setStatusFilter] = useState("");
  const showInactive = statusFilter === "inactive";

  const isOutranked = (lvl: number) => lvl > ctx.userLevel;

  const renderRoleText = (role: number | null) =>
    roles.find((r) => r.value == role)?.label ?? "";
  const renderLvlText = (lvl: number) =>
    ctx.userLevels.find((l) => l.id === lvl)?.name ?? "N/A";

  const sourceUsers = showInactive ? ctx.inactiveUsers : ctx.users;

  const filtered = useMemo(() => {
    return sourceUsers.filter((u) => {
      const companyCheck =
        companyFilter === NO_COMPANY_VALUE
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
    sourceUsers,
    companyFilter,
    levelFilter,
    roleFilter,
    searchType,
    searchText,
  ]);

  const noCompanyCount = useMemo(
    () => sourceUsers.filter((u) => u.companies.length === 0).length,
    [sourceUsers],
  );

  const companyOptions = useMemo(
    () => [
      { value: NO_COMPANY_VALUE, label: `No company (${noCompanyCount})` },
      ...ctx.companies.map((c) => ({
        value: String(c.company),
        label: c.name,
      })),
    ],
    [ctx.companies, noCompanyCount],
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

  const handleReactivate = (u: User) => {
    reactivateUser(ctx.url, ctx.token, u.username)
      .then((resp) => {
        const j = resp.data;
        if (j.error === 0) {
          toast.success("User reactivated successfully");
          ctx.dispatch(setRefresh(true));
        } else {
          toast.warn("Error reactivating user: " + j.msg);
        }
      })
      .catch((err: JsonError) =>
        toast.error("Error reactivating user: " + err.message),
      );
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 p-4 w-[900px]">
      <div className="flex flex-nowrap items-center gap-2 mb-3">
        <SelectFilter
          options={companyOptions}
          value={companyFilter}
          onChange={setCompanyFilter}
          placeholder="All companies"
          className="w-[150px] flex-shrink-0"
        />
        <SelectFilter
          options={[
            { value: "inactive", label: `Inactive (${ctx.inactiveUsers.length})` },
          ]}
          value={statusFilter}
          onChange={setStatusFilter}
          placeholder="Active"
          className="w-[110px] flex-shrink-0"
        />
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
          New
        </button>
      </div>

      <div className="border border-gray-100 rounded-lg overflow-hidden flex-1 min-h-0 flex flex-col">
        <div className="grid grid-cols-[16%_32%_14%_12%_14%_12%] px-3 py-2 bg-gray-50 text-[9px] font-bold uppercase tracking-wide text-content flex-shrink-0">
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
                className={`grid grid-cols-[16%_32%_14%_12%_14%_12%] px-3 py-2 text-[12px] items-center border-b border-gray-100 ${outranked ? "bg-gray-50 text-content/40" : "text-content"}`}
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
                  ) : showInactive ? (
                    <IconButton
                      icon={ArrowPathIcon}
                      title="Reactivate"
                      onClick={() => handleReactivate(u)}
                    />
                  ) : (
                    <>
                      <IconButton
                        icon={PencilIcon}
                        title="Edit"
                        onClick={() => handleEdit(u)}
                      />
                      <IconButton
                        icon={KeyIcon}
                        title="Password & security"
                        onClick={() => setSecurityUser(u)}
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

      {securityUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35">
          <div className="bg-custom-white rounded-xl p-5 w-[480px] shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="text-[14px] font-medium text-content">
                Password & security — {securityUser.username}
              </div>
              <button
                onClick={() => setSecurityUser(null)}
                className="text-[11px] text-content/60"
              >
                Close
              </button>
            </div>
            <SecurityTab user={securityUser} />
          </div>
        </div>
      )}
    </div>
  );
};

export default UserGrid;
