import { useState, useEffect, useRef } from "react";
import { useLocation, NavLink } from "react-router";
import logo from "../../assets/portal/logo.webp";
// The same logo with its navy recoloured to custom-white
import logoReversed from "../../assets/portal/logo-reversed.webp";
import { ChevronDownIcon } from "@heroicons/react/16/solid";
import { useAppSelector, useAppDispatch } from "../../hooks";
import { categoriesFor } from "./utils";
import { COMING_SOON_CATEGORY } from "../../utils/comingSoon";
import { setIsNavOpen, setLastRoute } from "../../features/navSlice";

import { setUserPrefs } from "../../api/user";
import { useToast } from "../toasts/hooks/useToast";
import type { JsonError } from "../../interfaces";
import SignInAsModal from "../../components-dev/SignInAsModal";
import ReleaseNotesModal from "../../components-dev/releaseNotes/ReleaseNotesModal";
import { SAMPLE_RELEASES } from "../../content/releaseNotes";
import AvatarDropdown from "./components/avatar/AvatarDropdown";

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
      <div className="absolute inset-0 backdrop-blur-sm" onClick={slideDown} />
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
                    background: isActive
                      ? "rgb(var(--color-brand-navy))"
                      : "rgb(var(--color-brand-navy) / 0.07)",
                  }}
                >
                  <page.icon
                    className="h-4 w-4"
                    style={{
                      color: isActive ? "#fff" : "rgb(var(--color-brand-navy))",
                    }}
                  />
                </div>
                <span
                  className={`text-[13px] ${isActive ? "font-semibold text-brand_navy" : "font-medium text-content"}`}
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
  // const navigate = useNavigate();
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
  // const [avatarOpen, setAvatarOpen] = useState(false);
  const [signInAsOpen, setSignInAsOpen] = useState(false);
  const [releaseNotesOpen, setReleaseNotesOpen] = useState(false);
  /** Who is really behind this session, when it is someone else's. */
  // const realUser = impersonatedBy(context.token);

  const currentPath = location.pathname.replace(/^\//, "");
  const categories = categoriesFor(context.apiEnv);
  const activeCategory = categories.find((c) =>
    c.pages.some((p) => p.href === currentPath),
  );

  /**
   * Whether a page shows in the nav.
   *
   * Level, with one exception. Tickets gates on being ON THE DESK rather than
   * on a level — the server computes `canViewAll` from the ticket_techs row,
   * so a support person at any level can work the queue. The nav knew nothing
   * about that, which made the page unreachable for exactly the techs the
   * membership model exists to serve: no entry, and the route only findable
   * by typing it.
   *
   * It does not grant anything. Every call the page makes is still answered
   * against the row server-side; this only stops the door being invisible.
   */
  const onTheDesk = Boolean(user.ticketTech?.is_active);

  const canSee = (userLevels: string[], href?: string) =>
    userLevels.includes(user.userLevel.toString()) ||
    userLevels.includes("*") ||
    (href === "tickets" && onTheDesk);

  // Coming Soon pages only exist on the dev API; on prod (what clients see)
  // the category is not offered at all.
  const visibleCategories = categories.filter(
    (cat) =>
      (cat.name !== COMING_SOON_CATEGORY || context.apiEnv === "dev") &&
      cat.pages.some((p) => canSee(p.userLevels, p.href)),
  );

  // Persist last route whenever it changes
  useEffect(() => {
    if (!nav.lastRoute) return;
    const prefs = { userid: user.userid, last_route: nav.lastRoute };
    setUserPrefs(context.url, context.token, prefs).catch((err: JsonError) => {
      toast.error("Error setting user prefs: " + err.message);
    });
  }, [nav.lastRoute]);

  const handleMobileNavClick = (href: string) => {
    dispatch(setLastRoute(href));
    dispatch(setIsNavOpen(false));
    setOpenCategory(null);
  };

  return (
    <>
      {/* Title bar */}
      <div
        data-testid="title-bar"
        // White on prod: the bar sits above a light page, and navy read as a
        // second, heavier header stacked on the content. On the dev API it is
        // navy on purpose — the one thing that must never be mistaken is which
        // environment, and so which UI tree, you are looking at.
        // The switch recolours the whole bar, so it eases rather than snaps.
        className={`h-12 w-full flex items-stretch select-none relative z-50 border-b transition-colors duration-300 ease-in-out ${
          onNavy
            ? "bg-brand_navy text-custom-white border-brand_navy"
            : "bg-custom-white text-content border-gray-200"
        }`}
      >
        {/* Logo */}
        <div className="flex min-w-0 flex-none items-center overflow-hidden px-2">
          {/* Both logos are always rendered and cross-fade with the bar */}
          <div className="relative h-8 max-w-full">
            <img
              src={logo}
              alt="CounterCtrl Cloud"
              className={`h-8 w-auto max-w-full object-contain transition-opacity duration-300 ease-in-out ${onNavy ? "opacity-0" : "opacity-100"}`}
            />
            <img
              src={logoReversed}
              alt=""
              aria-hidden
              className={`absolute inset-0 h-8 w-auto max-w-full object-contain transition-opacity duration-300 ease-in-out ${onNavy ? "opacity-100" : "opacity-0"}`}
            />
          </div>
        </div>

        {/* Category nav — desktop only */}
        {context.isDesktop && (
          <div className="flex items-stretch gap-0.5 px-2">
            {visibleCategories.map((cat) => {
              const isActive = activeCategory?.name === cat.name;
              const isOpen = openCategory === cat.name;
              const visiblePages = cat.pages.filter(
                (p) => canSee(p.userLevels, p.href) && p.isVisible,
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
                          ? "bg-brand_navy/8 text-brand_navy font-semibold"
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
                                ? "bg-gray-50 text-brand_navy font-medium"
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

        {/* DEV pill: says in words what the navy bar says in colour — this
            session is on the dev API, so every page is showing its dev tree
            and Coming Soon is open. Always rendered and eased in and out
            with the bar (max-width + opacity), so flipping the switch slides
            it rather than popping it. */}
        <div
          aria-hidden={!onNavy}
          className={`flex items-center overflow-hidden transition-all duration-300 ease-in-out ${
            onNavy ? "max-w-[120px] opacity-100 pr-3" : "max-w-0 opacity-0 pr-0"
          }`}
        >
          <span
            title="Dev mode: this session is on the dev API"
            className="px-3 py-1.5 rounded-full bg-custom-white text-brand_navy text-[11px] font-bold tracking-wide leading-none whitespace-nowrap select-none"
          >
            DEV MODE
          </span>
        </div>

        {/* Avatar — always visible */}
        <AvatarDropdown
          setReleaseNotesOpen={setReleaseNotesOpen}
          setSignInAsOpen={setSignInAsOpen}
          activeCategory={activeCategory}
        />
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
              // No href passed, so no desk exception: Tickets is
              // `mobile: false` and this list drops it either way.
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
                      isActive || isOpen
                        ? "rgb(var(--color-brand-navy))"
                        : "rgb(var(--color-brand-navy) / 0.35)",
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

      {releaseNotesOpen && (
        <ReleaseNotesModal
          releases={SAMPLE_RELEASES}
          sample
          href={currentPath}
          pageName={
            activeCategory?.pages.find((p) => p.href === currentPath)?.name ??
            null
          }
          onClose={() => setReleaseNotesOpen(false)}
        />
      )}
      {signInAsOpen && <SignInAsModal onClose={() => setSignInAsOpen(false)} />}
    </>
  );
};

export default TitleBar;
