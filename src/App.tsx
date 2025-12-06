import { useEffect } from "react";
import { useAppSelector } from "./hooks";
import { useNavigate } from "react-router";

// Components
import { Outlet } from "react-router";
import Login from "./pages/home/Login";
import SideBar from "./components/navigation/SideBar";
import TitleBar from "./components/navigation/TitleBar";
import UserDataLoader from "./components/UserDataLoader";
import SecurityQuestion from "./pages/home/SecurityQuestion";
import ResetPassword from "./pages/home/ResetPassword";

const App = () => {
  const context = useAppSelector((state) => state.app);
  const nav = useAppSelector((state) => state.nav);
  const navigate = useNavigate();

  useEffect(() => {
    navigate("/");
  }, []);

  const containerStyle = context.isDesktop
    ? "ml-12 min-w-[calc(100vw-3rem)] max-w-[calc(100vw-3rem)]"
    : "";

  return (
    <div data-testid="main-app" className="main-app h-dvh w-dvw bg-bkg text-content no-scrollbar">
      <UserDataLoader />
      {context.loggedIn ? (
        <div className="h-screen w-screen">
          <TitleBar />
          <SideBar />
          <div
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
