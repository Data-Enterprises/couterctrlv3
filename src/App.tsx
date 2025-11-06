import Login from "./pages/home/Login";
import { useAppSelector } from "./hooks";
import { Outlet } from "react-router";
import TitleBar from "./components/navigation/TitleBar";
import SideBar from "./components/navigation/SideBar";

const App = () => {
  const context = useAppSelector((state) => state.app);
  const nav = useAppSelector((state) => state.nav);

  return (
    <div className="main-app h-dvh w-dvw bg-bkg text-content no-scrollbar">
      {context.loggedIn ? (
        <div className="h-screen w-screen">
          <TitleBar />
          <SideBar />

          <div
            className={`ml-12 min-w-[calc(100vw-3rem)] max-w-[calc(100vw-3rem)] bg-bkg ${
              nav.isNavOpen ? "opacity-20 pointer-events-none" : "bg-content/5 opacity-100"
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
