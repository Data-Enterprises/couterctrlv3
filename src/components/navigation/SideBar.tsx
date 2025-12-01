import { useRef, useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router";
import { useAppSelector, useAppDispatch } from "../../hooks";
import { navigation, type Navigation } from "./utils";
import { useToast } from "../toasts/hooks/useToast";

import { setUserPrefs } from "../../api/user";

import { resetNav, setIsNavOpen, setLastRoute } from "../../features/navSlice";
import { handleSigningOut } from "../../features/appSlice";
import { resetUserSlice } from "../../features/userSlice";
import { resetSalesSlice } from "../../features/salesSlice";

import type { JsonError } from "../../interfaces";
import { Cog6ToothIcon } from "@heroicons/react/16/solid";
import SignOutIcon from "../../svgs/SignOutIcon";

const SideBar = () => {
  const toast = useToast();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const ref = useRef<HTMLDivElement>(null);
  const context = useAppSelector((state) => state.app);
  const user = useAppSelector((state) => state.user);
  const nav = useAppSelector((state) => state.nav);
  const [navItems, setNavItems] = useState<Navigation[]>(navigation);

  // make api call to set the user prefs when navigating to a new page
  useEffect(() => {
    if (nav.lastRoute) {
      const prefs = {
        userid: user.userid,
        last_route: nav.lastRoute,
      };
      setUserPrefs(context.url, context.token, prefs).catch(
        (err: JsonError) => {
          toast.error("Error setting user prefs:" + err.message);
        }
      );
    }
  }, [nav.lastRoute]);

  useEffect(() => {
    if (context.isMobile) {
      setNavItems(navigation.filter((item) => item.mobile));
    } else {
      setNavItems(navigation);
    }
  }, [context.isMobile, context.isTablet, context.isDesktop]);

  const handleiFrameClick = () => {
    dispatch(setIsNavOpen(false));
  };

  const handleNavClick = (item: Navigation) => {
    if (item.children.length && item.href === "#") {
      // Toggle the item's children => not implemented yet
    } else {
      // Otherwise, set last route for user prefs
      dispatch(setLastRoute(item.href));
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
    "data-[open=true]:w-[145px] md:data-[open=true]:w-[191px] data-[open=false]:w-0 md:data-[open=false]:w-12 transition-all duration-300 data-[open=true]:shadow-[0px_2px_4px_rgba(0,0,0,0.2)] data-[open=false]:shadow-[0px_3px_3px_rgba(0,0,0,0.2)]";

  // experimenting with this for mobile icon sizing
  const mobileIconStyle = () => {
    if (context.isDesktop) {
      return "h-7 w-7";
    } else {
      return !nav.isNavOpen
        ? "opacity-0 h-7 w-7 transition-all duration-200"
        : "opacity-100 h-7 w-7 transition-all duration-200";
    }
  };

  // const iconStyle = context.isDesktop
  //   ? "h-7 w-7"
  //   : !nav.isNavOpen
  //   ? "opacity-0 h-7 w-7 transition-all duration-200"
  //   : "opacity-100 h-7 w-7 transition-all duration-200";

  return (
    <div
      ref={ref}
      data-testid="side-bar"
      data-open={nav.isNavOpen}
      className={`bg-bkg absolute top-12 left-0 h-[calc(100vh-3rem)] flex flex-col justify-between border-t ${slidingStyle}`}
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
                <item.icon className={mobileIconStyle()} />
              </div>
              <div
                className={`font-medium text-sm ${
                  nav.isNavOpen
                    ? "w-full opacity-100"
                    : "w-0 opacity-0 pointer-events-none"
                } transition-all duration-200 text-nowrap`}
              >
                {item.name}
              </div>
            </div>
          </NavLink>
        ))}
      </div>

      {/* Settings and Sign Out */}
      <div className="select-none cursor-pointer">
        <div
          className="flex w-full items-center pl-2 py-2 gap-3 hover:bg-blue-200 transition-all duration-200"
          onClick={() => {
            navigate("settings");
          }}
        >
          <div className="flex-shrink-0 flex items-center justify-center">
            <Cog6ToothIcon className={mobileIconStyle()} />
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
            <SignOutIcon className={mobileIconStyle()} />
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
