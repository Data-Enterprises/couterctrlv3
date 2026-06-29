import { useState } from "react";
import { useNavigate, useLocation, NavLink } from "react-router";
import logo from "../../assets/dcr_counterctrl-favicon_32.png";
import { ChevronDownIcon } from "@heroicons/react/16/solid";
import { useAppSelector, useAppDispatch } from "../../hooks";
import { categories } from "./utils";
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
import { resetOrdersState } from "../../features/ordersSlice";

const TitleBar = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const context = useAppSelector((state) => state.app);
  const user = useAppSelector((state) => state.user);
  const nav = useAppSelector((state) => state.nav);

  const [openCategory, setOpenCategory] = useState<string | null>(null);
  const [avatarOpen, setAvatarOpen] = useState(false);

  const currentPath = location.pathname.replace(/^\//, "");
  const activePage = categories.flatMap((c) => c.pages).find((p) => p.href === currentPath);
  const activeCategory = categories.find((c) => c.pages.some((p) => p.href === currentPath));

  const canSee = (userLevels: string[]) =>
    userLevels.includes(user.userLevel.toString()) || userLevels.includes("*");

  const visibleCategories = categories.filter((cat) => cat.pages.some((p) => canSee(p.userLevels)));

  const handleSignOut = () => {
    navigate("/");
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
    dispatch(resetLedger());
    dispatch(resetOrdersState());
  };

  return (
    <div
      data-testid="title-bar"
      className="h-12 w-full flex items-stretch bg-[#1e2a4a] text-white select-none relative z-50"
    >
      {/* Logo + page title (Option E) */}
      <div className="flex items-center gap-2.5 px-3 border-r border-white/10 flex-shrink-0 min-w-[173px]">
        <img src={logo} alt="Logo" className="h-7 w-7" />
        <div className="flex flex-col justify-center leading-none">
          <span className="text-[13px] font-medium text-white">
            {activePage?.name ?? "CounterCtrl"}
          </span>
          {activePage && (
            <span className="text-[9px] text-white/55 mt-0.5">CounterCtrl</span>
          )}
        </div>
      </div>

      {/* Category nav — desktop only */}
      {context.isDesktop && (
        <div className="flex items-stretch gap-0.5 px-2">
          {visibleCategories.map((cat) => {
            const isActive = activeCategory?.name === cat.name;
            const isOpen = openCategory === cat.name;
            const visiblePages = cat.pages.filter((p) => canSee(p.userLevels));
            return (
              <div
                key={cat.name}
                className="relative flex items-stretch"
                onMouseEnter={() => setOpenCategory(cat.name)}
                onMouseLeave={() => setOpenCategory(null)}
              >
                <button
                  className={`flex items-center gap-1.5 px-3 text-[12px] font-medium transition-colors rounded-md my-1.5 ${
                    isActive
                      ? "bg-white/12 text-white"
                      : "text-white/55 hover:text-white hover:bg-white/8"
                  }`}
                >
                  <cat.icon className="h-3.5 w-3.5" />
                  {cat.name}
                  <ChevronDownIcon className={`h-3 w-3 opacity-60 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
                </button>

                <div
                  className={`absolute left-0 top-full z-50 pt-1 transition-all duration-150 ${
                    isOpen ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 -translate-y-1 pointer-events-none"
                  }`}
                  style={{ minWidth: 170 }}
                >
                <div className="bg-white border border-gray-200 rounded-md overflow-hidden" style={{ boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}>
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

      {/* Mobile toggle — keep sidebar working on mobile */}
      {!context.isDesktop && (
        <button
          className="flex items-center px-3 text-white/70 hover:text-white transition-colors"
          onClick={() => dispatch(setIsNavOpen(!nav.isNavOpen))}
        >
          <span className="text-[12px] font-medium">Menu</span>
        </button>
      )}

      <div className="flex-1" />

      {/* Avatar + sign out dropdown */}
      {context.isDesktop && (
        <div className="relative flex items-stretch">
          <button
            onClick={() => setAvatarOpen((o) => !o)}
            className="flex items-center gap-2 px-4 border-l border-white/10 hover:bg-white/8 transition-colors"
          >
            <div className="w-7 h-7 rounded-full bg-white/15 flex items-center justify-center text-white text-[11px] font-semibold flex-shrink-0">
              {(user.firstName?.[0] ?? "").toUpperCase()}{(user.lastName?.[0] ?? "").toUpperCase()}
            </div>
            <ChevronDownIcon className={`h-3.5 w-3.5 text-white/50 transition-transform duration-200 ${avatarOpen ? "rotate-180" : ""}`} />
          </button>

          {avatarOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setAvatarOpen(false)} />
              <div
                className="absolute right-0 top-full mt-1 z-50 w-52 bg-white border border-gray-200 rounded-md overflow-hidden"
                style={{ boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}
              >
                <div className="px-4 py-3 border-b border-gray-100">
                  <div className="text-[13px] font-semibold text-content">{user.firstName} {user.lastName}</div>
                  {user.email && <div className="text-[11px] text-content/50 mt-0.5">{user.email}</div>}
                </div>
                <button
                  data-testid="signout-btn"
                  onClick={() => { setAvatarOpen(false); handleSignOut(); }}
                  className="w-full text-left px-4 py-2.5 text-[13px] font-medium text-red-600 hover:bg-red-50 transition-colors"
                >
                  Sign out
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default TitleBar;
