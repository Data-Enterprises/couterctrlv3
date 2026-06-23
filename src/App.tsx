import { useEffect } from "react";
import { useAppSelector } from "./hooks";
import { useNavigate } from "react-router";
import { useAppDispatch } from "./hooks";
import { useToast } from "./components/toasts/hooks/useToast";

// Components
import { Outlet } from "react-router";
import Login from "./pages/home/Login";
import SideBar from "./components/navigation/SideBar";
import TitleBar from "./components/navigation/TitleBar";
import UserDataLoader from "./components/UserDataLoader";
import SecurityQuestion from "./pages/home/SecurityQuestion";
import ResetPassword from "./pages/home/ResetPassword";
import { getUserStores } from "./api/user";
import type { JsonError, Store } from "./interfaces";
import { setAllAvailableStores } from "./features/storeSlice";
import {
  setAssignedStores,
  setRefreshStores,
  setUnassignedStores,
} from "./features/userSlice";

const App = () => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const context = useAppSelector((state) => state.app);
  const nav = useAppSelector((state) => state.nav);
  const user = useAppSelector((state) => state.user);
  const navigate = useNavigate();

  useEffect(() => {
    if (user.refreshStores) {
      getUserStores(context.url, context.token, user.userid)
        .then((resp) => {
          const j = resp.data;
          if (j.error === 0) {
            const all = (j.all_stores_for_user ?? []).filter(
              (s: Store) => s.store_number !== null && s.store_name !== null,
            );
            const assigned = j.assigned_stores
              .filter(
                (s: Store) => s.store_number !== null && s.store_name !== null,
              )
              .sort(
                (a: Store, b: Store) =>
                  parseInt(a.store_number) - parseInt(b.store_number),
              );
            const unassigned = j.unassigned_stores
              .filter(
                (s: Store) => s.store_number !== null && s.store_name !== null,
              )
              .sort(
                (a: Store, b: Store) =>
                  parseInt(a.store_number) - parseInt(b.store_number),
              );

            dispatch(setAllAvailableStores(all));
            dispatch(setAssignedStores(assigned));
            dispatch(setUnassignedStores(unassigned));
            dispatch(setRefreshStores(false));
          }
        })
        .catch((err: JsonError) => {
          toast.error("Error getting user stores: " + err.message);
        });
    }
  }, [user.refreshStores]);

  useEffect(() => {
    navigate("/");
  }, []);

  const containerStyle = context.isDesktop
    ? "ml-12 min-w-[calc(100vw-3rem)] max-w-[calc(100vw-3rem)]"
    : context.isMobile
      ? "h-full bg-bkg"
      // Tablet
      : "ml-12 min-w-[calc(100vw-3rem)] max-w-[calc(100vw-3rem)]";

  return (
    <div
      data-testid="main-app"
      className="main-app h-dvh w-dvw bg-bkg text-content no-scrollbar"
    >
      <UserDataLoader />
      {context.loggedIn ? (
        <div className="max-h-screen max-w-screen overflow-hidden">
          <TitleBar />
          <SideBar />
          <div
            data-testid="outlet-container"
            className={`${containerStyle} bg-bkg ${
              nav.isNavOpen
                ? "opacity-20 pointer-events-none"
                : "bg-content/5 opacity-100"
            } transition-all duration-300`}
          >
            {/* ResetPassword and SecurityQuestion are only modals that render when the user is prompted, otherwise they are hidden */}
            <ResetPassword />
            <SecurityQuestion />
            <Outlet />
          </div>
        </div>
      ) : (
        <Login />
      )}
    </div>
  );
};

export default App;
