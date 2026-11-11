// Hooks
import { useState, useEffect, useRef } from "react";
import { useToast } from "../toasts/hooks/useToast";
import { useNavCtx } from "./hooks";

// API
import { setUserPrefs } from "../../api/user";

// Utils
import { SAMPLE_RELEASES } from "../../content/releaseNotes";

// Interfaces
import type { JsonError } from "../../interfaces";

// Components
import SignInAsModal from "../../components-dev/SignInAsModal";
import ReleaseNotesPanel from "../../components-dev/releaseNotes/ReleaseNotesPanel";
import AvatarDropdown from "./components/AvatarDropdown";
import MobileBottomNav from "./mobile/MobileBottomNav";
import CategoryNavList from "./components/CategoryNavList";
import Logo from "./components/Logo";
import DevPill from "./components/DevPill";

/** The bar across the top of every page: logo, the category menus on desktop,
 *  the DEV MODE pill and the avatar menu, plus the phone's bottom tab bar. */
const TitleBar = () => {
  const toast = useToast();
  const { app, user, lastRoute, onNavy, currentPath, currentPage } =
    useNavCtx();

  const [openCategory, setOpenCategory] = useState<string | null>(null);
  const categoryCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleCategoryEnter = (name: string) => {
    if (categoryCloseTimer.current) clearTimeout(categoryCloseTimer.current);
    setOpenCategory(name);
  };

  const handleCategoryLeave = () => {
    categoryCloseTimer.current = setTimeout(() => setOpenCategory(null), 80);
  };
  const [signInAsOpen, setSignInAsOpen] = useState(false);
  const [releaseNotesOpen, setReleaseNotesOpen] = useState(false);

  // Persist last route whenever it changes
  useEffect(() => {
    if (!lastRoute) return;
    const prefs = { userid: user.userid, last_route: lastRoute };
    setUserPrefs(app.url, app.token, prefs).catch((err: JsonError) => {
      toast.error("Error setting user prefs: " + err.message);
    });
  }, [lastRoute]);

  return (
    <>
      {/* Title bar */}
      <div
        data-testid="title-bar"
        // White on prod, navy on dev, so which environment (and so which UI
        // tree) you are looking at is never mistaken. It eases on the switch.
        className={`h-12 w-full flex items-stretch select-none relative z-50 border-b transition-colors duration-300 ease-in-out ${
          onNavy
            ? "bg-brand_navy text-custom-white border-brand_navy"
            : "bg-custom-white text-content border-gray-200"
        }`}
      >
        <Logo onNavy={onNavy} />

        {/* Category nav — desktop only */}
        {app.isDesktop && (
          <CategoryNavList
            openCategory={openCategory}
            setOpenCategory={setOpenCategory}
            onCategoryEnter={handleCategoryEnter}
            onCategoryLeave={handleCategoryLeave}
          />
        )}

        <div className="flex-1" />

        <DevPill onNavy={onNavy} />

        {/* Avatar — always visible */}
        <AvatarDropdown
          setReleaseNotesOpen={setReleaseNotesOpen}
          setSignInAsOpen={setSignInAsOpen}
        />
      </div>

      {/* ── Mobile bottom nav ── */}
      {!app.isDesktop && (
        <MobileBottomNav
          openCategory={openCategory}
          setOpenCategory={setOpenCategory}
        />
      )}

      {releaseNotesOpen && (
        <ReleaseNotesPanel
          releases={SAMPLE_RELEASES}
          sample
          href={currentPath}
          pageName={currentPage?.name ?? null}
          onClose={() => setReleaseNotesOpen(false)}
        />
      )}
      {signInAsOpen && <SignInAsModal onClose={() => setSignInAsOpen(false)} />}
    </>
  );
};

export default TitleBar;
