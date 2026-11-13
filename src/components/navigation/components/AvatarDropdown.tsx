// Hooks
import { useEffect, useState } from "react";
import { useAppDispatch } from "../../../hooks";
import { useNavigate } from "react-router";
import { useNavCtx } from "../hooks";
import { usePresence } from "./hooks";

// Redux
import { openReportIssue, resetAppSlice } from "../../../features/appSlice";

// Utils
import { impersonatedBy } from "../../../utils/session";
import { MENU_SHADOW } from "./utils";

// Components
import { ChevronDownIcon } from "@heroicons/react/16/solid";
import {
  ArrowRightStartOnRectangleIcon,
  DocumentTextIcon,
  FlagIcon,
} from "@heroicons/react/24/outline";
import MenuItem from "./MenuItem";
import EnvironmentPanel from "./EnvironmentPanel";

interface AvatarDropdownProps {
  setReleaseNotesOpen: (open: boolean) => void;
  setSignInAsOpen: (open: boolean) => void;
}

/** The initials button at the right of the title bar and its menu: who is
 *  signed in, Release notes and Report an issue, the Environment panel for
 *  level 7+, and Sign out. */
const AvatarDropdown = ({
  setReleaseNotesOpen,
  setSignInAsOpen,
}: AvatarDropdownProps) => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const {
    app: context,
    user,
    onNavy,
    pathname,
    activeCategory,
    currentPage,
  } = useNavCtx();
  const [avatarOpen, setAvatarOpen] = useState(false);
  const { mounted, shown } = usePresence(avatarOpen);

  // Escape closes it, as clicking anywhere else does.
  useEffect(() => {
    if (!avatarOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAvatarOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [avatarOpen]);
  /** Who is really behind this session, when it is someone else's. */
  const realUser = impersonatedBy(context.token);
  const initials = `${(user.firstName?.[0] ?? "").toUpperCase()}${(user.lastName?.[0] ?? "").toUpperCase()}`;

  // Release Notes: the sample set until real notes exist, so level 9 and dev only.
  const showReleaseNotes = context.apiEnv === "dev" && user.userLevel === 9;
  // Report an issue opens the form over this page, so the problem stays in view.
  const showReportIssue = context.apiEnv === "dev";
  const hasEveryday = showReleaseNotes || showReportIssue;

  // One action empties the store (the root reducer in store/index.ts); only
  // the username survives.
  const handleSignOut = () => {
    navigate("/");
    dispatch(resetAppSlice());
  };

  return (
    <div
      className={`relative flex items-center px-3 ${
        context.isDesktop
          ? onNavy
            ? "border-l border-custom-white/15"
            : "border-l border-gray-200"
          : ""
      }`}
    >
      <button
        type="button"
        aria-label="Account menu"
        aria-expanded={avatarOpen}
        onClick={() => setAvatarOpen((o) => !o)}
        className={`flex items-center gap-1.5 rounded-full py-1 pl-1 pr-1.5 transition-colors ${
          onNavy
            ? "bg-custom-white/[0.12] hover:bg-custom-white/20 text-custom-white"
            : "bg-brand_navy/[0.06] hover:bg-brand_navy/10 text-content"
        }`}
      >
        {/* Navy initials on the white bar, inverted on the navy one. */}
        <span
          className={`w-8 h-8 rounded-full grid place-items-center text-[12px] font-bold flex-shrink-0 transition-colors duration-300 ease-in-out ${
            onNavy
              ? "bg-custom-white text-brand_navy"
              : "bg-brand_navy text-custom-white"
          }`}
        >
          {initials}
        </span>
        <ChevronDownIcon
          className={`h-4 w-4 transition-transform duration-300 ${avatarOpen ? "rotate-180" : ""}`}
        />
      </button>

      {mounted && (
        <>
          {avatarOpen ? (
            <div
              className="fixed inset-0 z-40"
              onClick={() => setAvatarOpen(false)}
            />
          ) : null}
          {/* Grows from the avatar's corner; the duration matches MENU_ANIM_MS. */}
          <div
            role="menu"
            aria-label="Account"
            className={`absolute right-3 top-full mt-2 z-50 w-80 bg-custom-white border border-brand_line rounded-xl overflow-hidden origin-top-right transition-[opacity,transform] duration-[160ms] ease-out motion-reduce:transition-none ${
              shown
                ? "opacity-100 scale-100 translate-y-0"
                : "opacity-0 scale-95 -translate-y-1 pointer-events-none"
            }`}
            style={{ boxShadow: MENU_SHADOW }}
          >
            <div className="flex items-center gap-3 p-4">
              <span className="w-10 h-10 rounded-full grid place-items-center bg-brand_navy text-custom-white text-[14px] font-bold flex-shrink-0">
                {initials}
              </span>
              <div className="flex-1 min-w-0">
                <div className="text-[15px] font-semibold text-content">
                  {user.firstName} {user.lastName}
                </div>
                {user.email && (
                  <div className="text-[13px] text-brand_slate truncate">
                    {user.email}
                  </div>
                )}
                {/* An impersonated session looks like theirs, so say so. */}
                {realUser && (
                  <div className="text-[12px] font-medium text-severity_watch_text mt-1">
                    Signed in as them by {realUser}. Sign out to return.
                  </div>
                )}
              </div>
            </div>

            {hasEveryday ? (
              <div className="border-t border-brand_line p-1.5">
                {showReleaseNotes ? (
                  <MenuItem
                    icon={DocumentTextIcon}
                    label="Release notes"
                    opens
                    onClick={() => {
                      setAvatarOpen(false);
                      setReleaseNotesOpen(true);
                    }}
                  />
                ) : null}
                {showReportIssue ? (
                  <MenuItem
                    icon={FlagIcon}
                    label="Report an issue"
                    hint="Attaches this page"
                    onClick={() => {
                      setAvatarOpen(false);
                      dispatch(
                        openReportIssue({
                          from: pathname,
                          page: currentPage?.name,
                          area: activeCategory?.name,
                        }),
                      );
                    }}
                  />
                ) : null}
              </div>
            ) : null}

            <EnvironmentPanel
              first={!hasEveryday}
              onSignInAs={() => {
                setAvatarOpen(false);
                setSignInAsOpen(true);
              }}
            />

            <div className="border-t border-brand_line p-1.5">
              <MenuItem
                icon={ArrowRightStartOnRectangleIcon}
                label="Sign out"
                danger
                testId="signout-btn"
                onClick={() => {
                  setAvatarOpen(false);
                  handleSignOut();
                }}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AvatarDropdown;
