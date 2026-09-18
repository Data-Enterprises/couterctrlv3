import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation, NavLink } from "react-router";
import logo from "../../assets/portal/logo.webp";
// The same logo with its navy recoloured to custom-white and the fill inside
// the letter counters removed — the full-colour one vanishes on a navy bar.
import logoReversed from "../../assets/portal/logo-reversed.webp";
import { ChevronDownIcon } from "@heroicons/react/16/solid";
import { useAppSelector, useAppDispatch } from "../../hooks";
import { categories } from "./utils";
import { resetNav, setIsNavOpen, setLastRoute } from "../../features/navSlice";
import {
  resetAppSlice,
  setApiEnv,
  toggleDevMode,
  SHOW_API_ENV_SWITCH,
  SHOW_ENV_TOGGLE,
} from "../../features/appSlice";
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
import { resetOrdersState } from "../../features/ordersSlice";
import { resetCashierState } from "../../features/cashiersSlice";
import { resetSalesPerf } from "../../features/salesPerfSlice";
import { resetItemPerf } from "../../features/itemPerfSlice";
import { resetEventPerf } from "../../features/eventPerfSlice";
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
  /** On the dev API the bar turns navy, so which environment — and so which
   *  UI tree — you are in is never a question. Prod keeps the white bar. */
  const onNavy = context.apiEnv === "dev";
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
    // The mobile Performance screens and the Cashiers explorer hold a whole
    // search's rows and where you were in them — the next person to sign in
    // on this device must not land there.
    dispatch(resetCashierState());
    dispatch(resetSalesPerf());
    dispatch(resetItemPerf());
    dispatch(resetEventPerf());
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
        className={`flex items-center gap-2 px-3 transition-colors h-full ${
          onNavy ? "hover:bg-custom-white/10" : "hover:bg-bkg"
        } ${
          context.isDesktop
            ? onNavy
              ? "border-l border-custom-white/15"
              : "border-l border-gray-200"
            : ""
        }`}
      >
        {/* A translucent white disc is invisible on a white bar, so the
            initials sit on navy — the same navy that marks the active
            category. */}
        <div
          className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-semibold flex-shrink-0 ${
            // A navy disc on a navy bar disappears, so dev inverts it.
            onNavy ? "bg-custom-white text-[#1e2a4a]" : "bg-[#1e2a4a] text-custom-white"
          }`}
        >
          {(user.firstName?.[0] ?? "").toUpperCase()}
          {(user.lastName?.[0] ?? "").toUpperCase()}
        </div>
        <ChevronDownIcon
          className={`h-3.5 w-3.5 transition-transform duration-200 ${onNavy ? "text-custom-white/85" : "text-content/85"} ${avatarOpen ? "rotate-180" : ""}`}
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
            {/* Client Help Desk — parked 2026-08-19, not deleted. The
                /tickets route and its page are untouched, so restoring this is
                uncommenting the block.
            {user.userLevel === 9 && (
              <button
                onClick={() => {
                  setAvatarOpen(false);
                  navigate("/tickets");
                }}
                className="w-full text-left px-4 py-2.5 text-[13px] font-medium text-content hover:bg-gray-50 transition-colors border-b border-gray-100"
              >
                Client Help Desk
              </button>
            )}
            */}
            {/* Which backend this session talks to. Deliberately NOT wired
                to `devMode`, which picks the dev-vs-legacy UI — see appSlice.

                Owner and up (7, 8, 9): support and programmers. A segmented
                control rather than a menu item, and the only row here that
                does NOT close the dropdown — switching environments is
                something you do and then verify, so the badge has to stay on
                screen to confirm it took. */}
            {SHOW_API_ENV_SWITCH && user.userLevel >= 7 ? (
              <div className="px-4 py-2.5 border-b border-gray-100 flex items-center gap-2">
                <span className="text-[13px] font-medium text-content flex-1">
                  API
                </span>
                <div className="flex items-center rounded-full overflow-hidden border border-gray-200 text-[10px] font-bold select-none flex-shrink-0">
                  <button
                    onClick={() => dispatch(setApiEnv("dev"))}
                    title="Point this session at the dev API"
                    className={`px-2.5 py-1 transition-colors ${
                      context.apiEnv === "dev"
                        ? "bg-emerald-500 text-custom-white"
                        : "text-content/85 hover:bg-gray-50"
                    }`}
                  >
                    DEV
                  </button>
                  <button
                    onClick={() => dispatch(setApiEnv("prod"))}
                    title="Point this session at the prod API"
                    className={`px-2.5 py-1 transition-colors ${
                      context.apiEnv === "prod"
                        ? "bg-red-600 text-custom-white"
                        : "text-content/85 hover:bg-gray-50"
                    }`}
                  >
                    PROD
                  </button>
                </div>
              </div>
            ) : null}
            {/* Which interface this session shows — the new UI or the legacy
                one. Separate from the API row above: that picks the backend,
                this picks the front end.

                It lives here because the only other control for it is in
                `TitleBarLegacy`, which by definition only renders once you are
                already in Live — so without this row Preview was a one-way
                door and there was no way back to the old pages.

                Programmers only (level 9), a tighter gate than the legacy
                control's `role === 9 || userLevel >= 2`: sending a client back
                to the old interface is not something support or QA should be
                one stray click away from.

                Like the API row, it does not close the dropdown: you flip it
                and confirm the badge moved. */}
            {SHOW_ENV_TOGGLE && user.userLevel === 9 ? (
              <div className="px-4 py-2.5 border-b border-gray-100 flex items-center gap-2">
                <span className="text-[13px] font-medium text-content flex-1">
                  Interface
                </span>
                <div className="flex items-center rounded-full overflow-hidden border border-gray-200 text-[10px] font-bold select-none flex-shrink-0">
                  <button
                    onClick={() => {
                      if (!context.devMode) dispatch(toggleDevMode());
                    }}
                    title="Show the new interface"
                    className={`px-2.5 py-1 transition-colors ${
                      context.devMode
                        ? "bg-[#1e2a4a] text-custom-white"
                        : "text-content/85 hover:bg-gray-50"
                    }`}
                  >
                    PREVIEW
                  </button>
                  <button
                    onClick={() => {
                      if (context.devMode) dispatch(toggleDevMode());
                    }}
                    title="Show the legacy interface"
                    className={`px-2.5 py-1 transition-colors ${
                      !context.devMode
                        ? "bg-amber-500 text-custom-white"
                        : "text-content/85 hover:bg-gray-50"
                    }`}
                  >
                    LIVE
                  </button>
                </div>
              </div>
            ) : null}
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
        // White on prod: the bar sits above a light page, and navy read as a
        // second, heavier header stacked on the content. On the dev API it is
        // navy on purpose — the one thing that must never be mistaken is which
        // environment, and so which UI tree, you are looking at.
        className={`h-12 w-full flex items-stretch select-none relative z-50 border-b ${
          onNavy
            ? "bg-[#1e2a4a] text-custom-white border-[#1e2a4a]"
            : "bg-custom-white text-content border-gray-200"
        }`}
      >
        {/* Logo.
         *
         * Bounded by HEIGHT, with the width following the aspect ratio. It used
         * to be bounded by nothing: the wrapper was `flex-shrink-0` around a
         * `flex-1` box, so its base size was the image's own intrinsic width
         * and it could never give any of it back. On a wide viewport there was
         * room to spare; on a 390px phone the bar overflowed and carried the
         * avatar — and with it the only way to log out — off the right edge.
         *
         * `max-w-full` did not save it, because "full" resolved to a container
         * that had already grown to fit the image.
         */}
        <div className="flex min-w-0 flex-none items-center overflow-hidden px-2">
          <img
            src={onNavy ? logoReversed : logo}
            alt="CounterCtrl Cloud"
            className="h-8 w-auto max-w-full object-contain"
          />
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
                    // Navy now carries the ACTIVE category rather than the
                    // whole bar — the same job it does on the mobile tab bar.
                    className={`flex items-center gap-1.5 px-3 text-[12px] transition-colors rounded-md my-1.5 ${
                      onNavy
                        ? isActive
                          ? "bg-custom-white/15 text-custom-white font-semibold"
                          : "text-custom-white/85 font-medium hover:text-custom-white hover:bg-custom-white/10"
                        : isActive
                          ? "bg-[#1e2a4a]/8 text-[#1e2a4a] font-semibold"
                          : "text-content/85 font-medium hover:text-content hover:bg-bkg"
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
