import { useEffect, useState } from "react";
import { getAllUsers } from "../../../api/user";
import { useAppSelector, useAppDispatch } from "../../../hooks";
import { useToast } from "../../../components/toasts/hooks/useToast";
import type { JsonError, User } from "../../../interfaces";
import {
  setSelectedCompanyId,
  setSelectedUserId,
  setSelectedUserInfo,
  setUsers,
} from "../../../features/usersSlice";

// For the table
import SearchUser from "../forms/SearchUser";
import { roles } from "..";

const UserGrid = () => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const context = useAppSelector((state) => state.app);
  const {
    users,
    refresh,
    selectedCompanyId,
    userLevels,
    userFilterType,
    userFilterText,
  } = useAppSelector((state) => state.users);
  const { companies, userLevel } = useAppSelector((state) => state.user);
  const [filtered, setFiltered] = useState<User[]>([]);

  useEffect(() => {
    if (refresh) {
      getData();
    }
  }, [refresh]);

  const renderRoleText = (role: number | null) => {
    const roleName = roles.find((r) => r.value == role);
    if (roleName) {
      return roleName.label;
    }
    return "";
  };

  const renderLvlText = (lvl: number) => {
    const lvlInfo = userLevels.find((l) => l.id === lvl);
    if (lvlInfo) {
      return lvlInfo.name;
    }
    return "N/A";
  };

  // Filter the table by searching for the username
  useEffect(() => {
    if (userFilterText.trim() === "" && !selectedCompanyId) {
      setFiltered(users);
    } else {
      // one or the othe or both
      const lowerText = userFilterText.toLowerCase();
      const isUsername = userFilterType === "name";

      const filteredUsers = users.filter((user) => {
        if (!isUsername && user.email !== null) {
          return user.email.toLowerCase().includes(lowerText);
        }

        const textCheck = user.username.toLowerCase().includes(lowerText);
        const companyCheck = selectedCompanyId
          ? user.companies.some((c) => c.company === selectedCompanyId)
          : true;
        return textCheck && companyCheck;
      });
      setFiltered(filteredUsers);
    }
  }, [userFilterText, userFilterType, selectedCompanyId]);

  const getData = () => {
    getAllUsers(context.url, context.token)
      .then((resp) => {
        const j = resp.data;
        if (j.error === 0) {
          const companyIds = [...companies].map((c) => c.company);
          const filtered = [...j.users].filter((u: User) => {
            const isDcrUser = u.companies.find(
              (c) => c.company === 5 && c.name === "DCR",
            );

            if (isDcrUser) {
              return false;
            } else {
              let valid = false;
              u.companies.forEach((c) => {
                if (companyIds.includes(c.company)) {
                  valid = true;
                  return;
                }
              });
              return valid;
            }
          });

          const isDcrUser = companies.find(
            (c) => c.company === 5 && c.name === "DCR",
          );

          if (isDcrUser) {
            // aka Stephn/Tommy/Mike
            dispatch(setUsers(j.users));
            setFiltered(j.users);
          } else {
            dispatch(setUsers(filtered));
            setFiltered(filtered);
          }
        }
      })
      .catch((err: JsonError) => {
        toast.error("Error fetching users " + err.message);
      });
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) {
      return "N/A";
    }
    const split = dateStr.split("-");
    return `${split[1]}/${split[2]}/${split[0]}`;
  };

  const handleViewInfoClick = (u: User) => {
    dispatch(setSelectedUserId(u.id));
    dispatch(setSelectedUserInfo(u));
  };

  const isOutranked = (lvl: number) => {
    return lvl > userLevel;
  };

  const handleCompanySelect = (companyId: number) => {
    dispatch(setSelectedUserId(0));
    if (selectedCompanyId === companyId) {
      dispatch(setSelectedCompanyId(0));
    } else {
      dispatch(setSelectedCompanyId(companyId));
    }
  };

  return (
    <div
      data-testid="user-grid-container"
      className="w-full h-full no-scrollbar space-y-2"
    >
      <SearchUser />
      <div className="flex flex-wrap text-[11px] gap-2">
        {companies.map((c, i) => (
          <div
            key={i}
            className={`px-2 py-0.5 rounded-full text-content ${selectedCompanyId === c.company ? "bg-[rgb(30,45,80)] text-custom-white" : "bg-custom-white"} shadow select-none`}
            onClick={() => handleCompanySelect(c.company)}
          >
            {c.name}
          </div>
        ))}
      </div>
      <div className="text-[12.5px] bg-custom-white rounded-lg shadow-lg py-2">
        <div className="grid grid-cols-[16%_11%_33%_14%_14%_12%] px-2">
          <div className="font-medium">Username</div>
          <div className="font-medium">Last Visit</div>
          <div className="font-medium">Email</div>
          <div className="font-medium">User Level</div>
          <div className="font-medium">User Role</div>
          <div className="font-medium">Update</div>
        </div>
        <div className="grid grid-cols-2 h-[1.5px] px-2 my-1">
          <div className="bg-gradient-to-r from-[rgb(30,45,80)] to-custom-white"></div>
          <div className="bg-gradient-to-l from-[rgb(30,45,80)] to-custom-white"></div>
        </div>
        <div className="max-h-[calc(100vh-23rem)] grid gap-1 overflow-y-auto no-scrollbar">
          {filtered.map((u, i) => {
            return (
              <div
                key={i}
                className="grid grid-cols-[16%_11%_33%_14%_14%_12%] px-2 border-b items-center py-0.5"
              >
                <div className="select-none">{u.username}</div>
                <div className="select-none">{formatDate(u.last_visit)}</div>
                <div className="select-none">{u.email}</div>
                <div className="select-none">{renderLvlText(u.user_level)}</div>
                <div className="select-none">{renderRoleText(u.role)}</div>
                {!isOutranked(u.user_level) ? (
                  <div
                    className="bg-[rgb(30,45,80)] text-[11.5px] select-none text-custom-white text-center py-0.5 rounded-full cursor-pointer transition-all duration-200 hover:bg-[rgb(30,45,80)]/75 hover:shadow-md"
                    onClick={() => handleViewInfoClick(u)}
                  >
                    View Info
                  </div>
                ) : (
                  <div className="bg-red-600 text-[11.5px] text-custom-white text-center py-0.5 rounded-full select-none pointer-events-none">
                    Unauthorized
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default UserGrid;
