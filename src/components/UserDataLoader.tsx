import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../hooks";
import { useToast } from "./toasts/hooks/useToast";

// API
import { getUserStores, getUserPrefs } from "../api/user";
import { getGroups } from "../api/groups";

// Slices
import { setUserId } from "../features/userSlice";
import { setGroups, type Group } from "../features/groupSlice";
import { setLastRoute } from "../features/navSlice";
import { setLastStore, setLastGroup, setType } from "../features/searchSlice";
import type { JsonError } from "../interfaces";

// This component is hidden and is strictly used for fetching user data on user login
const UserDataLoader = () => {
  const toast = useToast();
  const dispatch = useAppDispatch();

  // Grabbing what I need to make the api calls
  const context = useAppSelector((state) => state.app);
  const user = useAppSelector((state) => state.user);

  useEffect(() => {
    if (!context.token) return;

    // Getting the user groups
    getGroups(context.url, context.token)
      .then((resp) => {
        const j = resp.data;
        if (j.error == "0") {
          const groups = j.groups.filter(
            (g: Group) => g.userid === user.userid
          );
          dispatch(setGroups(groups));
        }
      })
      .catch((err: JsonError) => {
        toast.error(err.message);
      });

    // Getting assigned stores
    getUserPrefs(context.url, context.token)
      .then((resp) => {
        const j = resp.data;
        if (j.error === 0) {
          const prefs = j.prefs[0];
          dispatch(setUserId(prefs.userid));

          // In case it's a new user with no prefs yet
          const lastSearch = !prefs.last_search ? 0 : prefs.last_search;
          dispatch(setLastStore(lastSearch));
          const lastGroup = !prefs.last_group ? 0 : prefs.last_group;
          dispatch(setLastGroup(lastGroup));
          const type = !prefs.last_search_type
            ? "Stores"
            : prefs.last_search_type;
          dispatch(setType(type));
          const lastRoute = !prefs.last_route ? "/" : prefs.last_route;
          dispatch(setLastRoute(lastRoute));
        }
      })
      .catch((err: JsonError) => {
        toast.error("Error getting user preferences: " + err.message);
      });
  }, [context.token]); // having dispatch in the dependency array breaks the sign out test for Login.test.tsx

  useEffect(() => {
    if (!context.token || !user.userid) return;
    getUserStores(context.url, context.token, user.userid)
      .then((resp) => {
        const j = resp.data;
        if (j.error === 0) {
          const allUserStores = j.all_stores_for_user;
          const assignedStores = j.assigned_stores;
          const unassignedStores = j.unassigned_stores;
        }
      })
      .catch((err: JsonError) => {
        toast.error("Error getting user stores: " + err.message);
      });
  }, [user.userid]);

  return null;
};

export default UserDataLoader;
