import { useRef, useState, useEffect } from "react";
import { NavLink } from "react-router";
import { useAppSelector, useAppDispatch } from "../../hooks";
import { resetNav, setIsNavOpen } from "../../features/navSlice";
import { navigation, type Navigation } from "./utils";
import SignOutIcon from "../../svgs/SignOutIcon";
import { Cog6ToothIcon } from "@heroicons/react/16/solid";
import { handleSigningOut } from "../../features/appSlice";
import { resetUserSlice } from "../../features/userSlice";
import { useNavigate } from "react-router";
import { resetSalesSlice } from "../../features/salesSlice";

const SideBar = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const ref = useRef<HTMLDivElement>(null);
  const context = useAppSelector((state) => state.app);
  const user = useAppSelector((state) => state.user);
  const nav = useAppSelector((state) => state.nav);
  const [navItems, setNavItems] = useState<Navigation[]>(navigation);

  useEffect(() => {
    if (context.isMobile) {
      // On mobile, show only mobile nav items
      setNavItems(navigation.filter((item) => item.mobile));
    } else {
      // On desktop/tablet, show all nav items
      setNavItems(navigation);
    }
  }, [context.isMobile, context.isTablet, context.isDesktop]);

  const handleiFrameClick = () => {
    dispatch(setIsNavOpen(false));
  };

  const handleNavClick = (item: Navigation) => {
    // console.log('Nav Item Clicked', item);
    if (item.children.length && item.href === "#") {
      // Toggle the item's children => not implemented yet
    }

    // Otherwise, navigation is handled by NavLink and we then toggle nav off if it is open
    if (nav.isNavOpen) {
      dispatch(setIsNavOpen(false));
    }
  };

  const handleSignOut = () => {
    dispatch(handleSigningOut());
    dispatch(resetUserSlice());
    dispatch(resetNav());
    dispatch(resetSalesSlice());
    navigate("/");
  };

  const slidingStyle =
    "data-[open=true]:w-48 data-[open=false]:w-12 transition-all duration-300 data-[open=true]:shadow-[0px_9px_10px_rgba(0,0,0,0.2)] data-[open=false]:shadow-[0px_3px_3px_rgba(0,0,0,0.2)]";
  return (
    <div
      ref={ref}
      data-testid="side-bar"
      data-open={nav.isNavOpen}
      className={`bg-bkg absolute top-12 left-0 h-[calc(100vh-3rem)] flex flex-col justify-between ${slidingStyle}`}
      style={{ zIndex: 1000 }}
    >
      {/* using this to close the nav when clicking outside if it is open. User events are disabled in the Outlet when nav is open */}
      {nav.isNavOpen && (
        <div
          id="fixed-frame"
          onClick={handleiFrameClick}
          className="fixed inset-0 z-40 top-12 left-48 transition-all duration-300"
          style={{ cursor: "default" }}
        />
      )}

      {/* NavLinks => working, but will need modifications when nav children are introduced */}
      <div>
        {navItems.map((item: Navigation) => (
          <NavLink
            to={item.href}
            key={item.name}
            draggable={false}
            className={({ isActive }) =>
              `${
                item.userTypes.includes(user.role.toString()) ||
                item.userTypes.includes("*")
                  ? "flex"
                  : "hidden"
              } ${isActive ? "bg-panel_active/75 text-custom-white" : ""}`
            }
            onClick={() => handleNavClick(item)}
          >
            <div className="flex w-full items-center pl-2 py-2 gap-3 hover:bg-blue-200 transition-all duration-200">
              <div className="flex-shrink-0 flex items-center justify-center">
                <item.icon className="h-7 w-7" />
              </div>
              <div
                className={`font-medium text-sm ${
                  nav.isNavOpen
                    ? "w-full opacity-100"
                    : "w-0 opacity-0 pointer-events-none"
                } transition-all duration-200`}
              >
                {item.name}
              </div>
            </div>
          </NavLink>
        ))}
      </div>

      {/* Settings and Sign Out */}
      <div className="select-none cursor-pointer">
        <div className="flex w-full items-center pl-2 py-2 gap-3 hover:bg-blue-200 transition-all duration-200">
          <div className="flex-shrink-0 flex items-center justify-center">
            <Cog6ToothIcon className="h-7 w-7" />
          </div>
          <div
            className={`font-medium text-sm ${
              nav.isNavOpen
                ? "w-full opacity-100"
                : "w-0 opacity-0 pointer-events-none"
            } transition-all duration-200 text-nowrap`}
          >
            Settings
          </div>
        </div>
        <div
          data-testid="signout-btn"
          className="flex w-full items-center pl-2 py-2 gap-3 hover:bg-blue-200 transition-all duration-200"
          onClick={handleSignOut}
        >
          <div className="flex-shrink-0 flex items-center justify-center">
            <SignOutIcon className="h-7 w-7" />
          </div>
          <div
            className={`font-medium text-sm ${
              nav.isNavOpen
                ? "w-full opacity-100"
                : "w-0 opacity-0 pointer-events-none"
            } transition-all duration-200 text-nowrap`}
          >
            Sign Out
          </div>
        </div>
      </div>
    </div>
  );
};

export default SideBar;
