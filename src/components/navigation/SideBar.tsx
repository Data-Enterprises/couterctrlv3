import { useRef, useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router";
import { useAppSelector, useAppDispatch } from "../../hooks";
import { navigation, type Navigation } from "./utils";
import { useToast } from "../toasts/hooks/useToast";
import type { JsonError } from "../../interfaces";
import { setUserPrefs } from "../../api/user";

// Reducers for navigation and slice resetters for logout
import { resetNav, setIsNavOpen, setLastRoute } from "../../features/navSlice";
import { resetAppSlice } from "../../features/appSlice";
import { resetUserSlice } from "../../features/userSlice";
import { resetSalesSlice } from "../../features/salesSlice";
import { resetStoreSlice } from "../../features/storeSlice";
import { resetGroupState } from "../../features/groupSlice";
import { resetUsersSlice } from "../../features/usersSlice";
import { resetUpcState } from "../../features/upcSlice";
import { resetSearchSlice } from "../../features/searchSlice";
import { resetForgotPasswordSlice } from "../../features/forgotPasswordSlice";
import { resetCashierSlice } from "../../features/lossPreventionSlice";
import { resetLookupSlice } from "../../features/itemLookupSlice";
import { resetQsSlice } from "../../features/qsSlice";
import { resetForecastSlice } from "../../features/forecastSlice";
import { resetUpcsSlice } from "../../features/upcUploadSlice";
import { resetReceiverSlice } from "../../features/receiversSlice";
import { resetCouponsSlice } from "../../features/couponSlice";
import { resetLedger } from "../../features/salesLedgerSlice";

import { Cog6ToothIcon } from "@heroicons/react/16/solid";
import SignOutIcon from "../../svgs/SignOutIcon";
import { resetOrdersState } from "../../features/ordersSlice";

const SideBar = () => {
  const toast = useToast();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const ref = useRef<HTMLDivElement>(null);
  const context = useAppSelector((state) => state.app);
  const user = useAppSelector((state) => state.user);
  const nav = useAppSelector((state) => state.nav);
  const [navItems, setNavItems] = useState<Navigation[]>(navigation);
  const [bottomNav, setBottomNav] = useState<{
    settings: boolean;
    signout: boolean;
  }>({ settings: false, signout: false });
  const [tooltip, setTooltip] = useState<{ label: string; x: number; y: number } | null>(null);

  // make api call to set the user prefs when navigating to a new page
  useEffect(() => {
    const prefs = {
      userid: user.userid,
      last_route: nav.lastRoute,
    };
    setUserPrefs(context.url, context.token, prefs).catch((err: JsonError) => {
      toast.error("Error setting user prefs:" + err.message);
    });
  }, [nav.lastRoute]);

  useEffect(() => {
    if (context.isMobile) {
      const filteredNav = navigation.filter((item) => item.mobile);
      setNavItems(filteredNav);
      const found = filteredNav.find((item) => item.href === nav.lastRoute);
      if (!found) {
        // if the last route isn't in the mobile nav, default to dashboard or settings if dashboard isn't available
        // Just take them to the home page
        navigate("/sales");
      }
    } else {
      setNavItems(navigation);
    }
  }, [context.isMobile, context.isTablet, context.isDesktop]);

  const handleiFrameClick = () => {
    dispatch(setIsNavOpen(false));
  };

  const handleNavClick = (item: Navigation) => {
    // if (item.children.length && item.href === "#") {
    //   // Toggle the item's children => not implemented yet
    // } else {
    //   // Otherwise, set last route for user prefs
    // }
    dispatch(setLastRoute(item.href));
    dispatch(setIsNavOpen(false));
  };

  const handleSignOut = () => {
    navigate("/");
    // Then handle state resets
    dispatch(resetGroupState());
    dispatch(resetUserSlice());
    dispatch(resetUsersSlice());
    dispatch(resetSalesSlice());
    dispatch(resetStoreSlice());
    dispatch(resetUserSlice());
    dispatch(resetNav());
    dispatch(resetSalesSlice());
    dispatch(resetUpcState());
    dispatch(resetAppSlice());
    dispatch(resetSearchSlice());
    dispatch(resetForecastSlice());
    dispatch(resetUpcsSlice());
    dispatch(resetReceiverSlice());
    dispatch(resetCouponsSlice());
    dispatch(resetQsSlice());
    dispatch(resetLookupSlice());
    dispatch(resetCashierSlice());
    dispatch(resetForgotPasswordSlice());
    dispatch(resetOrdersState());
    dispatch(resetLedger());
  };

  const handleHover = (itemName: string, isHovering: boolean, idx: number) => {
    const item = navItems.find((navItem) => navItem.name === itemName);
    if (item) {
      item.isHovering = isHovering;
      setNavItems([...navItems]);

      // Find the mouse position to adjust the tooltip if needed in the future
      const mousePosition = { x: 0, y: 0 };
      document.addEventListener(
        "mousemove",
        (e) => {
          mousePosition.x = e.clientX;
          mousePosition.y = e.clientY;
        },
        { once: true },
      );
      const tooltip = document.getElementById(`tooltip-${idx}`);
      tooltip!.style.left = `${mousePosition.x}px`;
      tooltip!.style.top = `${mousePosition.y}px`;
    }
  };

  const slidingStyle =
    "data-[open=true]:w-[130px] md:data-[open=true]:w-[200px] data-[open=false]:w-0 md:data-[open=false]:w-12 transition-all duration-300 data-[open=true]:shadow-[0px_2px_4px_rgba(0,0,0,0.2)] data-[open=false]:shadow-[0px_3px_3px_rgba(0,0,0,0.2)]";

  // experimenting with this for mobile icon sizing
  const mobileIconStyle = () => {
    if (context.isDesktop || context.isTablet) {
      return "h-7 w-7";
    } else {
      return !nav.isNavOpen
        ? "opacity-0 h-6 w-6 transition-all duration-200 ml-0"
        : "opacity-100 h-6 w-6 transition-all duration-200 ml-1";
    }
  };

  const styleObj = () => {
    if (nav.isNavOpen) {
      return { zIndex: 1000 };
    }
    return {};
  };

  const handleBottomNavHover = (
    navItem: "settings" | "signout",
    isHovering: boolean,
    idx: number,
  ) => {
    setBottomNav((prev) => ({ ...prev, [navItem]: isHovering }));

    // Find the mouse position to adjust the tooltip if needed in the future
    const mousePosition = { x: 0, y: 0 };
    document.addEventListener(
      "mousemove",
      (e) => {
        mousePosition.x = e.clientX;
        mousePosition.y = e.clientY;
      },
      { once: true },
    );
    const tooltip = document.getElementById(`tooltip-${idx}`);
    tooltip!.style.left = `${mousePosition.x}px`;
    tooltip!.style.top = `${mousePosition.y}px`;
  };

  return (
    <>
    <div
      ref={ref}
      data-testid="side-bar"
      data-open={nav.isNavOpen}
      className={`bg-bkg absolute text-sm top-12 left-0 min-h-[calc(100vh-3rem)] max-h-[calc(100vh-3rem)] flex flex-col justify-between border-t 
        ${slidingStyle} ${context.isMobile && !nav.isNavOpen ? "pointer-events-none" : ""}`}
      style={styleObj()}
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
        {navItems.map((item: Navigation, idx) => (
          <NavLink
            data-testid={`nav-${item.href}`}
            to={item.href}
            key={item.name}
            draggable={false}
            className={({ isActive }) =>
              `${
                item.userLevels.includes(user.userLevel.toString()) ||
                item.userLevels.includes("*")
                  ? "flex"
                  : "hidden"
              } relative group`
            }
            style={({ isActive }) => ({
              background: isActive ? "#1e2a4a" : undefined,
              color: isActive ? "#fff" : undefined,
            })}
            onClick={() => handleNavClick(item)}
            onMouseMove={(e) => { if (!nav.isNavOpen && !context.isMobile) setTooltip({ label: item.name, x: e.clientX, y: e.clientY }); }}
            onMouseLeave={() => setTooltip(null)}
          >
            <div className="flex w-full items-center md:pl-2 py-2 gap-1 md:gap-2 transition-all duration-100 hover:bg-[rgba(30,42,74,0.5)] hover:text-white">
              <div className="flex-shrink-0 flex items-center justify-center">
                <item.icon className={mobileIconStyle()} />
              </div>
              <div
                className={`font-medium text-[11.5px] md:text-sm ${
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
        {/* <div
          data-testid="nav-settings"
          className={`${
            context.isDesktop || context.isTablet ? "" : "hidden"
          } group flex w-full items-center pl-2 py-2 gap-3 hover:bg-[rgba(30,42,74,0.5)] hover:text-white transition-all duration-200 relative`}
          onClick={() => {
            navigate("settings");
          }}
          onMouseMove={(e) => { if (!nav.isNavOpen) setTooltip({ label: "Settings", x: e.clientX, y: e.clientY }); }}
          onMouseLeave={() => setTooltip(null)}
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
        </div> */}
        {/* <div
          data-testid="signout-btn"
          className="group flex w-full items-center pl-0.5 md:pl-2 py-2 gap-1 md:gap-2 hover:bg-[rgba(30,42,74,0.5)] hover:text-white transition-all duration-200 relative"
          onClick={handleSignOut}
          onMouseMove={(e) => { if (!nav.isNavOpen) setTooltip({ label: "Sign Out", x: e.clientX, y: e.clientY }); }}
          onMouseLeave={() => setTooltip(null)}
        >
          <div className="flex-shrink-0 flex items-center justify-center">
            <SignOutIcon className={mobileIconStyle()} />
          </div>
          <div
            className={`font-medium text-[11.5px] md:text-sm ${
              nav.isNavOpen
                ? "w-full opacity-100"
                : "w-0 opacity-0 pointer-events-none"
            } transition-all duration-200 text-nowrap`}
          >
            Sign Out
          </div>
        </div> */}
      </div>
    </div>

    {/* Global cursor-following tooltip */}
    {tooltip && (
      <div
        className="fixed text-nowrap text-[11px] font-medium text-white rounded-md px-2.5 py-1.5 pointer-events-none"
        style={{
          zIndex: 99999,
          background: "#1e2a4a",
          left: tooltip.x + 14,
          top: tooltip.y + 14,
          boxShadow: "0 2px 8px rgba(0,0,0,0.18)",
        }}
      >
        {tooltip.label}
      </div>
    )}
    </>
  );
};

export default SideBar;
