import { useEffect } from "react";
import { useAppSelector } from "./hooks";
import { useNavigate } from "react-router";

// Components
import { Outlet } from "react-router";
import Login from "./pages/home/Login";
import SideBar from "./components/navigation/SideBar";
import TitleBar from "./components/navigation/TitleBar";

const App = () => {
  const context = useAppSelector((state) => state.app);
  const nav = useAppSelector((state) => state.nav);
  const navigate = useNavigate();

  useEffect(() => {
    // Resetting the route to home on app load/browser refresh
    if (window.location.pathname !== "/") {
      navigate("/");
    }
  }, []);

  return (
    <div className="main-app h-dvh w-dvw bg-bkg text-content no-scrollbar">
      {context.loggedIn ? (
        <div className="h-screen w-screen">
          <TitleBar />
          <SideBar />

          <div
            className={`ml-12 min-w-[calc(100vw-3rem)] max-w-[calc(100vw-3rem)] bg-bkg ${
              nav.isNavOpen
                ? "opacity-20 pointer-events-none"
                : "bg-content/5 opacity-100"
            } transition-all duration-300`}
          >
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
