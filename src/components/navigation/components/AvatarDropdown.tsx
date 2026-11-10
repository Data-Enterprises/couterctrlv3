// Hooks
import { useState } from "react";
import { useAppDispatch } from "../../../hooks";
import { useNavigate } from "react-router";
import { useNavCtx } from "../hooks";

// Redux
import {
  openReportIssue,
  resetAppSlice,
  setApiEnv,
  setUiMode,
  SHOW_API_ENV_SWITCH,
} from "../../../features/appSlice";

// Utils
import { impersonatedBy } from "../../../utils/session";
import { legacyEntryPath } from "../../../constants/legacyPages";

// Components
import { ChevronDownIcon } from "@heroicons/react/16/solid";

interface AvatarDropdownProps {
  setReleaseNotesOpen: (open: boolean) => void;
  setSignInAsOpen: (open: boolean) => void;
}

/** The initials button at the right of the title bar and its menu: who is
 *  signed in, the View and Mode switches, the dev tools, and Sign out. */
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
  /** Who is really behind this session, when it is someone else's. */
  const realUser = impersonatedBy(context.token);

  // One action empties the store (the root reducer in store/index.ts); only
  // the username survives.
  const handleSignOut = () => {
    navigate("/");
    dispatch(resetAppSlice());
  };

  return (
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
        {/* Navy initials on the white bar, inverted on the navy one. */}
        <div
          className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-semibold flex-shrink-0 transition-colors duration-300 ease-in-out ${
            onNavy
              ? "bg-custom-white text-brand_navy"
              : "bg-brand_navy text-custom-white"
          }`}
        >
          {(user.firstName?.[0] ?? "").toUpperCase()}
          {(user.lastName?.[0] ?? "").toUpperCase()}
        </div>
        <ChevronDownIcon
          className={`h-3.5 w-3.5 transition-[transform,color] duration-300 ${onNavy ? "text-custom-white/85" : "text-content/85"} ${avatarOpen ? "rotate-180" : ""}`}
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
              {/* An impersonated session looks like theirs, so say so. */}
              {realUser && (
                <div className="text-[11px] font-medium text-amber-900 mt-1.5">
                  Signed in as them by {realUser}. Sign out to return.
                </div>
              )}
            </div>
            {/* View: Live or Legacy pages. Level 9; Legacy is prod-only, so it settles Mode. */}
            {SHOW_API_ENV_SWITCH && user.userLevel >= 9 ? (
              <div className="px-4 py-2.5 border-b border-gray-100 flex items-center gap-2">
                <span className="text-[13px] font-medium text-content flex-1">
                  View
                </span>
                <div className="flex items-center rounded-full overflow-hidden border border-gray-200 text-[10px] font-bold select-none flex-shrink-0">
                  <button
                    onClick={() => dispatch(setUiMode("live"))}
                    title="Live: the app as published"
                    className={`px-2.5 py-1 transition-colors ${
                      context.uiMode === "live"
                        ? "bg-brand_navy text-custom-white"
                        : "text-content/85 hover:bg-gray-50"
                    }`}
                  >
                    LIVE
                  </button>
                  <button
                    onClick={() => {
                      dispatch(setUiMode("legacy"));
                      // A page Legacy doesn't have falls back to your last legacy page, or Sales.
                      const to = legacyEntryPath(
                        pathname,
                        context.legacyLastRoute,
                      );
                      if (to) navigate(to);
                    }}
                    title="Legacy: the old pages, on the legacy API"
                    className={`px-2.5 py-1 transition-colors ${
                      context.uiMode === "legacy"
                        ? "bg-amber-500 text-custom-white"
                        : "text-content/85 hover:bg-gray-50"
                    }`}
                  >
                    LEGACY
                  </button>
                </div>
              </div>
            ) : null}
            {/* Release Notes: the sample set until real notes exist, so level 9 and dev only. */}
            {context.apiEnv === "dev" && user.userLevel === 9 ? (
              <button
                onClick={() => {
                  setAvatarOpen(false);
                  setReleaseNotesOpen(true);
                }}
                className="w-full text-left px-4 py-2.5 text-[13px] font-medium text-content hover:bg-gray-50 transition-colors border-b border-gray-100 flex items-center gap-2"
              >
                <span className="flex-1">Release Notes</span>
                <span className="text-[11px] text-content/95">sample</span>
              </button>
            ) : null}
            {/* Report an issue opens the form over this page, so the problem stays in view. */}
            {context.apiEnv === "dev" ? (
              <button
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
                className="w-full text-left px-4 py-2.5 text-[13px] font-medium text-content hover:bg-gray-50 transition-colors border-b border-gray-100 flex items-center gap-2"
              >
                <span className="flex-1">Report an issue</span>
                <span className="text-[11px] text-content/85">
                  from this page
                </span>
              </button>
            ) : null}
            {/* Sign in as someone: level 9 (checked again by the server), dev API only. */}
            {context.apiEnv === "dev" && user.userLevel === 9 ? (
              <button
                onClick={() => {
                  setAvatarOpen(false);
                  setSignInAsOpen(true);
                }}
                className="w-full text-left px-4 py-2.5 text-[13px] font-medium text-content hover:bg-gray-50 transition-colors border-b border-gray-100 flex items-center gap-2"
              >
                <span className="flex-1">Sign in as...</span>
                <span className="text-[11px] text-content/85">level 9</span>
              </button>
            ) : null}
            {/* Mode: dev or prod API, 7+. Doesn't close the menu, so you can see it took. */}
            {SHOW_API_ENV_SWITCH && user.userLevel >= 7 ? (
              <div
                className={`px-4 py-2.5 border-b border-gray-100 flex items-center gap-2 ${
                  context.uiMode === "legacy" ? "opacity-40" : ""
                }`}
                title={
                  context.uiMode === "legacy"
                    ? "Legacy pages always use the prod API"
                    : undefined
                }
              >
                <span className="text-[13px] font-medium text-content flex-1">
                  Mode
                </span>
                <div
                  className={`flex items-center rounded-full overflow-hidden border border-gray-200 text-[10px] font-bold select-none flex-shrink-0 ${
                    context.uiMode === "legacy" ? "pointer-events-none" : ""
                  }`}
                >
                  <button
                    onClick={() => dispatch(setApiEnv("dev"))}
                    title="Dev mode: the dev API, the dev version of every page, and Coming Soon"
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
                    title="Prod mode: the prod API and the pages clients see"
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
};

export default AvatarDropdown;
