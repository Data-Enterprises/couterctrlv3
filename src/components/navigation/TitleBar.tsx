import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation, NavLink } from "react-router";
import logo from "../../assets/dcr_counterctrl-favicon_32.png";
import { ChevronDownIcon } from "@heroicons/react/16/solid";
import { useAppSelector, useAppDispatch } from "../../hooks";
import { categories } from "./utils";
import { resetNav, setIsNavOpen, setLastRoute } from "../../features/navSlice";
import { resetAppSlice, toggleDevMode } from "../../features/appSlice";
import { resetUserSlice } from "../../features/userSlice";
import { resetSalesSlice } from "../../features/salesSlice";
import { resetSalesLegacySlice } from "../../features/salesLegacySlice";
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
import { resetOrdersState } from "../../features/ordersSlice";
import { setUserPrefs } from "../../api/user";
import { useToast } from "../toasts/hooks/useToast";
import type { JsonError } from "../../interfaces";

interface NavSheetProps {
  cat: { name: string; pages: any[] };
  visiblePages: any[];
  onClose: () => void;
  onNavigate: (href: string) => void;
  currentPath: string;
}

const NavSheet = ({
  cat,
  visiblePages,
  onClose,
  onNavigate,
  currentPath,
}: NavSheetProps) => {
  const sheetRef = useRef<HTMLDivElement>(null);
  const dragState = useRef<{ startY: number; currentY: number } | null>(null);

  const slideDown = () => {
    const el = sheetRef.current;
    if (!el) {
      onClose();
      return;
    }
    el.style.transition = "transform 0.25s ease";
    el.style.transform = "translateY(100%)";
    setTimeout(onClose, 220);
  };

  useEffect(() => {
    const el = sheetRef.current;
    if (!el) return;
    el.style.transform = "translateY(100%)";
    el.style.transition = "none";
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        el.style.transition = "transform 0.3s ease";
        el.style.transform = "translateY(0)";
      });
    });
  }, []);

  const onTouchStart = (e: React.TouchEvent) => {
    dragState.current = { startY: e.touches[0].clientY, currentY: 0 };
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (!dragState.current || !sheetRef.current) return;
    const delta = e.touches[0].clientY - dragState.current.startY;
    if (delta < 0) return;
    dragState.current.currentY = delta;
    sheetRef.current.style.transform = `translateY(${delta}px)`;
    sheetRef.current.style.transition = "none";
  };
  const onTouchEnd = () => {
    if (!dragState.current || !sheetRef.current) return;
    if (dragState.current.currentY > 80) {
      sheetRef.current.style.transition = "transform 0.25s ease";
      sheetRef.current.style.transform = "translateY(100%)";
      setTimeout(onClose, 220);
    } else {
      sheetRef.current.style.transition = "transform 0.2s ease";
      sheetRef.current.style.transform = "translateY(0)";
    }
    dragState.current = null;
  };

  return (
    <div className="fixed inset-0 z-50" style={{ top: 48, bottom: 56 }}>
      <div className="absolute inset-0 bg-black/25" onClick={slideDown} />
      <div
        ref={sheetRef}
        className="absolute bottom-0 left-0 right-0 bg-custom-white rounded-t-2xl"
        style={{ boxShadow: "0 -4px 24px rgba(0,0,0,0.12)" }}
      >
        <div
          className="flex justify-center pt-2.5 pb-1 flex-shrink-0 cursor-grab active:cursor-grabbing"
          style={{ touchAction: "none" }}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          <div className="w-9 h-1 bg-gray-200 rounded-full" />
        </div>
        <p className="text-[9px] font-semibold uppercase tracking-wider text-content/40 px-4 pb-1">
          {cat.name}
        </p>
        <div className="pb-2">
          {visiblePages.map((page) => {
            const isActive = currentPath === page.href;
            return (
              <NavLink
                key={page.href}
                to={page.href}
                onClick={() => {
                  slideDown();
                  setTimeout(() => onNavigate(page.href), 0);
                }}
                className={`flex items-center gap-3 px-4 py-3 transition-colors ${isActive ? "bg-gray-50" : "hover:bg-gray-50"}`}
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{
                    background: isActive ? "#1e2a4a" : "rgba(30,42,74,0.07)",
                  }}
                >
                  <page.icon
                    className="h-4 w-4"
                    style={{ color: isActive ? "#fff" : "#1e2a4a" }}
                  />
                </div>
                <span
                  className={`text-[13px] ${isActive ? "font-semibold text-[#1e2a4a]" : "font-medium text-content"}`}
                >
                  {page.name}
                </span>
              </NavLink>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const TitleBar = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const context = useAppSelector((state) => state.app);
  const user = useAppSelector((state) => state.user);
  const nav = useAppSelector((state) => state.nav);

  const [openCategory, setOpenCategory] = useState<string | null>(null);
  const categoryCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleCategoryEnter = (name: string) => {
    if (categoryCloseTimer.current) clearTimeout(categoryCloseTimer.current);
    setOpenCategory(name);
  };

  const handleCategoryLeave = () => {
    categoryCloseTimer.current = setTimeout(() => setOpenCategory(null), 80);
  };
  const [avatarOpen, setAvatarOpen] = useState(false);

  const currentPath = location.pathname.replace(/^\//, "");
  const activePage = categories
    .flatMap((c) => c.pages)
    .find((p) => p.href === currentPath);
  const activeCategory = categories.find((c) =>
    c.pages.some((p) => p.href === currentPath),
  );

  const canSee = (userLevels: string[]) =>
    userLevels.includes(user.userLevel.toString()) || userLevels.includes("*");

  const visibleCategories = categories.filter((cat) =>
    cat.pages.some((p) => canSee(p.userLevels)),
  );

  // Persist last route whenever it changes
  useEffect(() => {
    if (!nav.lastRoute) return;
    const prefs = { userid: user.userid, last_route: nav.lastRoute };
    setUserPrefs(context.url, context.token, prefs).catch((err: JsonError) => {
      toast.error("Error setting user prefs: " + err.message);
    });
  }, [nav.lastRoute]);

  const handleSignOut = () => {
    navigate("/");
    dispatch(resetGroupState());
    dispatch(resetUserSlice());
    dispatch(resetUsersSlice());
    dispatch(resetSalesSlice());
    dispatch(resetSalesLegacySlice());
    dispatch(resetStoreSlice());
    dispatch(resetUserSlice());
    dispatch(resetNav());
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
    dispatch(resetLedger());
    dispatch(resetOrdersState());
  };

  const handleMobileNavClick = (href: string) => {
    dispatch(setLastRoute(href));
    dispatch(setIsNavOpen(false));
    setOpenCategory(null);
  };

  const AvatarDropdown = () => (
    <div className="relative flex items-stretch">
      <button
        onClick={() => setAvatarOpen((o) => !o)}
        className={`flex items-center gap-2 px-3 hover:bg-custom-white/8 transition-colors h-full ${context.isDesktop ? "border-l border-white/10" : ""}`}
      >
        <div className="w-7 h-7 rounded-full bg-custom-white/15 flex items-center justify-center text-white text-[11px] font-semibold flex-shrink-0">
          {(user.firstName?.[0] ?? "").toUpperCase()}
          {(user.lastName?.[0] ?? "").toUpperCase()}
        </div>
        <ChevronDownIcon
          className={`h-3.5 w-3.5 text-white/50 transition-transform duration-200 ${avatarOpen ? "rotate-180" : ""}`}
        />
      </button>

      {avatarOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setAvatarOpen(false)}
          />
          <div
            className="absolute right-0 top-full mt-1 z-50 w-52 bg-custom-white border border-gray-200 rounded-md overflow-hidden"
            style={{ boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}
          >
            <div className="px-4 py-3 border-b border-gray-100">
              <div className="text-[13px] font-semibold text-content">
                {user.firstName} {user.lastName}
              </div>
              {user.email && (
                <div className="text-[11px] text-content/50 mt-0.5">
                  {user.email}
                </div>
              )}
            </div>
            <button
              data-testid="signout-btn"
              onClick={() => {
                setAvatarOpen(false);
                handleSignOut();
              }}
              className="w-full text-left px-4 py-2.5 text-[13px] font-medium text-red-600 hover:bg-red-50 transition-colors"
            >
              Sign out
            </button>
          </div>
        </>
      )}
    </div>
  );

  return (
    <>
      {/* Title bar */}
      <div
        data-testid="title-bar"
        className="h-12 w-full flex items-stretch bg-[#1e2a4a] text-white select-none relative z-50"
      >
        {/* Logo + page title */}
        <div
          className={`flex items-center gap-2.5 px-3 flex-shrink-0 min-w-[173px] ${context.isDesktop ? "border-r border-white/10" : ""}`}
        >
          <div className="w-8 h-8 bg-custom-white rounded-lg flex items-center justify-center flex-shrink-0">
            <img
              src={logo}
              alt="Logo"
              style={{ width: "28px", height: "28px" }}
            />
          </div>
          <div className="flex flex-col justify-center leading-none">
            <span className="text-[13px] font-medium text-white">
              {activePage?.name ?? "CounterCtrl"}
            </span>
            {activePage && (
              <span className="text-[9px] text-white/70 mt-0.5">
                CounterCtrl
              </span>
            )}
          </div>
        </div>

        {/* Category nav — desktop only */}
        {context.isDesktop && (
          <div className="flex items-stretch gap-0.5 px-2">
            {visibleCategories.map((cat) => {
              const isActive = activeCategory?.name === cat.name;
              const isOpen = openCategory === cat.name;
              const visiblePages = cat.pages.filter(
                (p) => canSee(p.userLevels) && p.isVisible,
              );
              return (
                <div
                  key={cat.name}
                  className="relative flex items-stretch"
                  onMouseEnter={() => handleCategoryEnter(cat.name)}
                  onMouseLeave={handleCategoryLeave}
                >
                  <button
                    className={`flex items-center gap-1.5 px-3 text-[12px] font-medium transition-colors rounded-md my-1.5 ${
                      isActive
                        ? "bg-custom-white/12 text-white"
                        : "text-white/55 hover:text-white hover:bg-custom-white/8"
                    }`}
                  >
                    <cat.icon className="h-3.5 w-3.5" />
                    {cat.name}
                    <ChevronDownIcon
                      className={`h-3 w-3 opacity-60 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                    />
                  </button>

                  <div
                    className={`absolute left-0 top-full z-50 transition-all duration-150 ${
                      isOpen
                        ? "opacity-100 translate-y-0 pointer-events-auto"
                        : "opacity-0 -translate-y-1 pointer-events-none"
                    }`}
                    style={{ minWidth: 170 }}
                  >
                    <div
                      className="mt-1 bg-custom-white border border-gray-200 rounded-md overflow-hidden"
                      style={{ boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
                    >
                      {visiblePages.map((page) => (
                        <NavLink
                          key={page.href}
                          to={page.href}
                          onClick={() => {
                            setOpenCategory(null);
                            dispatch(setLastRoute(page.href));
                            dispatch(setIsNavOpen(false));
                          }}
                          className={({ isActive }) =>
                            `flex items-center gap-2 px-3 py-2 text-[12px] transition-colors ${
                              isActive
                                ? "bg-gray-50 text-[#1e2a4a] font-medium"
                                : "text-content hover:bg-gray-50"
                            }`
                          }
                        >
                          <page.icon className="h-3.5 w-3.5 text-content/40 flex-shrink-0" />
                          {page.name}
                        </NavLink>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="flex-1" />

        {/* DEV/PROD toggle — programmer/admin only */}
        {user.role === 9 && (
          <div className="flex items-center px-3 border-r border-white/10">
            <button
              onClick={() => dispatch(toggleDevMode())}
              className="flex items-center gap-0 rounded-full overflow-hidden border border-white/20 text-[10px] font-bold select-none"
              title={context.devMode ? "Switch to LIVE" : "Switch to PREVIEW"}
            >
              <span
                className={`px-2.5 py-1 transition-colors ${!context.devMode ? "bg-custom-white text-[#1e2a4a]" : "text-white/40"}`}
              >
                LIVE
              </span>
              <span
                className={`px-2.5 py-1 transition-colors ${context.devMode ? "bg-emerald-500 text-white" : "text-white/40"}`}
              >
                PREVIEW
              </span>
            </button>
          </div>
        )}

        {/* Avatar — always visible */}
        <AvatarDropdown />
      </div>

      {/* ── Mobile bottom nav ── */}
      {!context.isDesktop && (
        <>
          {/* Bottom sheet — animated slide-up/down */}
          {openCategory &&
            (() => {
              const cat = visibleCategories.find(
                (c) => c.name === openCategory,
              );
              if (!cat) return null;
              const visiblePages = cat.pages.filter(
                (p) => canSee(p.userLevels) && p.mobile,
              );
              return (
                <NavSheet
                  key={cat.name}
                  cat={cat}
                  visiblePages={visiblePages}
                  onClose={() => setOpenCategory(null)}
                  onNavigate={handleMobileNavClick}
                  currentPath={currentPath}
                />
              );
            })()}

          {/* Bottom tab bar */}
          <div
            className="fixed left-0 right-0 bottom-0 z-50 bg-custom-white border-t border-gray-200 flex"
            style={{ height: 56 }}
          >
            {visibleCategories.map((cat) => {
              const isActive = activeCategory?.name === cat.name;
              const isOpen = openCategory === cat.name;
              return (
                <button
                  key={cat.name}
                  onClick={() => setOpenCategory(isOpen ? null : cat.name)}
                  className="flex-1 flex flex-col items-center justify-center gap-1 transition-colors"
                  style={{
                    color:
                      isActive || isOpen ? "#1e2a4a" : "rgba(30,42,74,0.35)",
                  }}
                >
                  <cat.icon className="h-5 w-5" />
                  <span className="text-[9px] font-medium">{cat.name}</span>
                </button>
              );
            })}
          </div>
        </>
      )}
    </>
  );
};

export default TitleBar;
