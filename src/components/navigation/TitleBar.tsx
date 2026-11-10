// Hooks
import { useState, useEffect, useRef } from "react";
import { useAppSelector } from "../../hooks";
import { useLocation } from "react-router";
import { useToast } from "../toasts/hooks/useToast";

// API
import { setUserPrefs } from "../../api/user";

// Utils
import { SAMPLE_RELEASES } from "../../content/releaseNotes";
import { categoriesFor } from "./utils";
import { COMING_SOON_CATEGORY } from "../../utils/comingSoon";

// Interfaces
import type { JsonError } from "../../interfaces";

// Components
import SignInAsModal from "../../components-dev/SignInAsModal";
import ReleaseNotesModal from "../../components-dev/releaseNotes/ReleaseNotesModal";
import AvatarDropdown from "./components/avatar/AvatarDropdown";
import MobileBottomNav from "./components/mobile/MobileBottomNav";
import CategoryNavList from "./components/cats/CategoryNavList";
import Logo from "./components/Logo";
import DevPill from "./components/DevPill";

const TitleBar = () => {
  const location = useLocation();
  const toast = useToast();
  const context = useAppSelector((state) => state.app);
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
   */
  const canSee = (userLevels: string[], href?: string) =>
    userLevels.includes(user.userLevel.toString()) ||
    userLevels.includes("*") ||
    (href === "tickets" && Boolean(user.ticketTech?.is_active));

  // Coming Soon pages only exist on the dev API; on prod (what clients see)
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

  return (
    <>
      {/* Title bar */}
      <div
        data-testid="title-bar"
        // White on prod and navy on dev: the bar sits above a light page, and navy read as a
        className={`h-12 w-full flex items-stretch select-none relative z-50 border-b transition-colors duration-300 ease-in-out ${
          onNavy
            ? "bg-brand_navy text-custom-white border-brand_navy"
            : "bg-custom-white text-content border-gray-200"
        }`}
      >
        {/* Logo */}
        <Logo onNavy={onNavy} />

        {/* Category nav — desktop only */}
        {context.isDesktop && (
          <CategoryNavList
            openCategory={openCategory}
            setOpenCategory={setOpenCategory}
            visibleCategories={visibleCategories}
            canSee={canSee}
            activeCategory={activeCategory}
            handleCategoryEnter={handleCategoryEnter}
            handleCategoryLeave={handleCategoryLeave}
          />
        )}

        <div className="flex-1" />

        {/* Dev Pill: show up only in dev mode */}
        <DevPill onNavy={onNavy} />

        {/* Avatar — always visible */}
        <AvatarDropdown
          setReleaseNotesOpen={setReleaseNotesOpen}
          setSignInAsOpen={setSignInAsOpen}
          activeCategory={activeCategory}
        />
      </div>

      {/* ── Mobile bottom nav ── */}
      {!context.isDesktop && (
        <MobileBottomNav
          openCategory={openCategory}
          setOpenCategory={setOpenCategory}
          visibleCategories={visibleCategories}
          canSee={canSee}
          activeCategory={activeCategory}
        />
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
