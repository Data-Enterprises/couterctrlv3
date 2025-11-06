import Login from "./pages/home/Login";
import { useAppSelector } from "./hooks";
import { Outlet } from "react-router";
import TitleBar from "./components/navigation/TitleBar";
import SideBar from "./components/navigation/SideBar";

const App = () => {
  const context = useAppSelector((state) => state.app);

  return (
    <div className="main-app h-dvh w-dvw bg-bkg text-content">
      {context.loggedIn ? (
        <div className="h-screen w-screen">
          <TitleBar />
          <SideBar />

          <div className="ml-12 w-[calc(100vw-3rem)] max-w-[calc(100vw-3rem)] bg-bkg">
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
