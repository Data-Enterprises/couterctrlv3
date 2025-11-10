import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../hooks";
import { useToast } from "./toasts/hooks/useToast";

//Groups
import { getGroups } from "../api/groups";
import { setGroups, type Group } from "../features/groupSlice";

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
      .catch((err) => {
        toast.error(err.message);
      });
  }, [context.token]); // having dispatch in the dependency array breaks the sign out test for Login.test.tsx

  return null;
};

export default UserDataLoader;
