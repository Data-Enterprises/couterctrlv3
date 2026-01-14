import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "../hooks";
import { useToast } from "./toasts/hooks/useToast";
import type { JsonError, Store } from "../interfaces";
import { useNavigate } from "react-router";

import { getUserStores, getUserPrefs } from "../api/user";
import { getGroups } from "../api/groups";

import { setUserId } from "../features/userSlice";
import { setGroups, type Group } from "../features/groupSlice";
import { setLastRoute } from "../features/navSlice";
import {
  setLastStore,
  setLastGroup,
  setType,
  type SEARCH_TYPE,
  setSelectedGroup,
  setSelectedStore,
} from "../features/searchSlice";
import { setAssignedStores, setUnassignedStores } from "../features/userSlice";
import { setAllAvailableStores } from "../features/storeSlice";
import { setLoggedIn } from "../features/appSlice";

// This component is hidden and is strictly used for fetching user data on user login
const UserDataLoader = () => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const navigation = useNavigate();
  const context = useAppSelector((state) => state.app);
  const user = useAppSelector((state) => state.user);
  const search = useAppSelector((state) => state.search);
  const [readyToLogin, setReadyToLogin] = useState({
    groups: false,
    stores: false,
  });

  const getDefaultType = (searchType: string): SEARCH_TYPE => {
    switch (searchType) {
      case "1":
        return "Stores";
      case "2":
        return "Group";
      case "3":
        return "Store";
      default:
        return searchType as SEARCH_TYPE;
    }
  };

  useEffect(() => {
    if (!context.token) return;
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
            : getDefaultType(prefs.last_search_type);
          dispatch(setType(type));
          const lastRoute = !prefs.last_route ? "/" : prefs.last_route;
          dispatch(setLastRoute(lastRoute));

          // navigate to last route
          if (lastRoute !== "/") {
            navigation(lastRoute);
          }
        }
      })
      .catch((err: JsonError) => {
        toast.error("Error getting user preferences: " + err.message);
      });
  }, [context.token]);

  useEffect(() => {
    // c5 - changed this from "and" to "or" 1-14-2026
    if (!context.token || !user.userid) return;
    getUserStores(context.url, context.token, user.userid)
      .then((resp) => {
        const j = resp.data;
        if (j.error === 0) {
          const all = (j.all_stores_for_user ?? []).filter(
            (s: Store) => s.store_number !== null && s.store_name !== null
          );
          const assigned = j.assigned_stores.filter(
            (s: Store) => s.store_number !== null && s.store_name !== null
          );
          const unassigned = j.unassigned_stores.filter(
            (s: Store) => s.store_number !== null && s.store_name !== null
          );

          dispatch(setAllAvailableStores(all));
          dispatch(setAssignedStores(assigned));
          dispatch(setUnassignedStores(unassigned));
          // On login, if last_search_type is Store => then set that selected store in search slice
          // This is for default loading of data when user logs in
          const stores = j.assigned_stores;
          const selectedStore = stores.find(
            (s: any) => s.storeid === search.lastStore
          );
          if (selectedStore) {
            dispatch(setSelectedStore(selectedStore));
          }
        }
      })
      .then(() => {
        setReadyToLogin((prev) => ({ ...prev, stores: true }));
      })
      .catch((err: JsonError) => {
        toast.error("Error getting user stores: " + err.message);
      });

    getGroups(context.url, context.token)
      .then((resp) => {
        const j = resp.data;
        if (j.error == "0") {
          const groups = j.groups.filter(
            (g: Group) => g.userid === user.userid
          );
          dispatch(setGroups(groups));
          // On login, if last_search_type is Group => then set that selected group in search slice
          // This is for default loading of data when user logs in
          const selectedGroup = groups.find(
            (g: Group) => g.id === search.lastGroup
          );
          if (selectedGroup) {
            dispatch(setSelectedGroup(selectedGroup));
          }
        }
      })
      .then(() => {
        setReadyToLogin((prev) => ({ ...prev, groups: true }));
      })
      .catch((err: JsonError) => {
        toast.error(err.message);
      });
  }, [user.userid]);

  useEffect(() => {
    if (readyToLogin.groups && readyToLogin.stores) {
      dispatch(setLoggedIn(true));
      setReadyToLogin({ stores: false, groups: false });
    }
  }, [readyToLogin.groups, readyToLogin.stores]);

  return null;
};

export default UserDataLoader;
