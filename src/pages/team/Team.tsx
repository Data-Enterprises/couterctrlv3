import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../../hooks";
import { useToast } from "../../components/toasts/hooks/useToast";

import { getBaseGroupsAssignedToUser } from "../../api/team";
import { setBaseGroups, resetUserInfo } from "../../features/usersSlice";

import UserInfo from "./UserInfo";
import UserGrid from "./UserGrid";
import BaseGroups from "./BaseGroups";

const Team = () => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const context = useAppSelector((state) => state.app);

  useEffect(() => {
    getBaseGroupsAssignedToUser(context.url, context.token, 0)
      .then((resp) => {
        const j = resp.data;
        if (j.error === 0) {
          dispatch(setBaseGroups(j.groups));
        }
      })
      .catch((err) => {
        toast.error("Error fetching base groups " + err.message);
      });
  }, [resetUserInfo]);

  /**
   * After this is finished, make sure you account for houchens users???
   * Delete User button needs a modal => as always
   */

  return (
    <div data-testid="team-page" className={`w-full h-[calc(100vh-3rem)] p-4`}>
      <div className="grid grid-cols-2 gap-8 h-full">
        <div className="grid">
          <UserGrid />
        </div>
        <div className="grid grid-rows-2">
          <UserInfo />
          <BaseGroups />
        </div>
      </div>
    </div>
  );
};

export default Team;
