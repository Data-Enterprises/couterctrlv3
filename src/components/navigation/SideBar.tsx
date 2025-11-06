import { navigation, type Navigation } from "./utils";
import { useAppSelector, useAppDispatch } from "../../hooks";
import { NavLink } from "react-router";
import { useRef } from "react";
import { setIsNavOpen } from "../../features/navSlice";

const SideBar = () => {
  const ref = useRef<HTMLDivElement>(null);
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.user);
  const nav = useAppSelector((state) => state.nav);

  const handleiFrameClick = () => {
    dispatch(setIsNavOpen(false));
  };

  const slidingStyle =
    "data-[open=true]:w-48 data-[open=false]:w-12 transition-all duration-300 data-[open=true]:shadow-[0px_9px_10px_rgba(0,0,0,0.2)] data-[open=false]:shadow-[0px_3px_3px_rgba(0,0,0,0.2)]";
  return (
    <div
      ref={ref}
      data-testid="sidebar"
      data-open={nav.isNavOpen}
      className={`absolute top-12 left-0 h-[calc(100vh-3rem)] flex flex-col justify-between ${slidingStyle}`}
      style={{ zIndex: 1000 }}
    >
      {/* using this to close the nav when clicking outside if it is open. User events are disabled in the Outlet when nav is open */}
      {nav.isNavOpen && (
        <div
          onClick={handleiFrameClick}
          className="fixed inset-0 z-40 bg-opacity-0"
          style={{ cursor: "default" }}
        />
      )}
      {/* NavLinks */}
      <div>
        {navigation.map((item: Navigation) => (
          <NavLink
            to={item.href}
            key={item.name}
            className={`${
              item.userTypes.includes(user.role.toString()) ||
              item.userTypes.includes("*")
                ? "flex"
                : "hidden"
            } hover:bg-blue-200 transition-all duration-200`}
          >
            <div className="flex items-center pl-2.5 py-2 gap-2 ">
              <item.icon className="h-7 w-7" />
              <span className="font-medium text-sm">{item.name}</span>
            </div>
          </NavLink>
        ))}
      </div>

      {/* Sign out and Settings */}
      <div>Links</div>
    </div>
  );
};

export default SideBar;
