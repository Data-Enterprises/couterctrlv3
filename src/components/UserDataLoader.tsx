import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../hooks";
// import { useToast } from "./toasts/hooks/useToast";

interface UserDataLoaderProps {
  token: string;
}

// This component is hidden and is strictly used for fetching user data on user login
const UserDataLoader = ({ token }: UserDataLoaderProps) => {
  // const toast = useToast();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.user);

  console.log("Hidden UserDataLoader rendered with token:", token, user);

  useEffect(() => {
    if (!token) return;

    // Use the token here to fetch all prefs and user data
    // upon receiving the token from the login/auth endpoint
    // then dispatch the values from the response objects to the related slices in the store
    // still waiting on these endpoints to be built out
  }, [token, dispatch]);

  return null;
};

export default UserDataLoader;
