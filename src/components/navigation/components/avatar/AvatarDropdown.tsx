// Hooks
import { useState } from "react";
import { useAppSelector, useAppDispatch } from "../../../../hooks";
import { useNavigate } from "react-router";

// Redux
import {
  openReportIssue,
  resetAppSlice,
  setApiEnv,
  setUiMode,
  SHOW_API_ENV_SWITCH,
} from "../../../../features/appSlice";

// Utils
import { impersonatedBy } from "@/utils/session";
import { legacyEntryPath } from "../../../../constants/legacyPages";

// Interfaces
import type { NavCategory } from "../../interfaces";

// Components
import { ChevronDownIcon } from "@heroicons/react/16/solid";

interface AvatarDropdownProps {
  setReleaseNotesOpen: (open: boolean) => void;
  setSignInAsOpen: (open: boolean) => void;
  activeCategory: NavCategory | undefined;
}

const AvatarDropdown = ({
  setReleaseNotesOpen,
  setSignInAsOpen,
  activeCategory,
}: AvatarDropdownProps) => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.user);
  const context = useAppSelector((state) => state.app);
  const [avatarOpen, setAvatarOpen] = useState(false);
  const onNavy = context.apiEnv === "dev";
  const realUser = impersonatedBy(context.token);
  const currentPath = location.pathname.replace(/^\//, "");

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
        {/* A translucent white disc is invisible on a white bar, so the
            initials sit on navy — the same navy that marks the active
            category. */}
        <div
          className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-semibold flex-shrink-0 transition-colors duration-300 ease-in-out ${
            // A navy disc on a navy bar disappears, so dev inverts it.
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
              {/* Said plainly, because nothing else on screen would: an
                  impersonated session looks exactly like theirs. The name
                  comes from the token's `imp` claim. */}
              {realUser && (
                <div className="text-[11px] font-medium text-amber-900 mt-1.5">
                  Signed in as them by {realUser}. Sign out to return.
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
            {/* Which backend this session talks to — and so which UI tree
                each page renders (prod or dev).

                Owner and up (7, 8, 9): support and programmers. A segmented
                control rather than a menu item, and the only row here that
                does NOT close the dropdown — switching environments is
                something you do and then verify, so the badge has to stay on
                screen to confirm it took. */}
            {/* Live / Legacy — the pages as published, or the ones the
                dev/prod separation replaced. Same audience as Mode (7, 8, 9):
                a client cannot reach Legacy at all.

                Above Mode because it decides for Mode: Legacy is prod-only,
                so turning it on settles the row below it.

                Level 9 only, narrower than Mode's 7+: these pages are kept
                for reference, not for support work, and every one of them has
                a live replacement that is the one to be looking at. */}
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
                      // The page you are on may not exist in Legacy — Vendors,
                      // say. Leaving the route alone would render its live
                      // version under the legacy frame, which is the one thing
                      // a legacy view must not do: look current. So it falls
                      // back to where you last were over there, and to Sales
                      // if that is nowhere yet.
                      const to = legacyEntryPath(
                        location.pathname,
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
            {/* Release Notes, as a window over the page you are on.

                Dev tree for now, and it moves to prod with the dev-to-prod
                migration like any other page; the real notes are written then.
                Until there are real ones it opens the sample set, so it is
                level 9 only: support in dev mode would read a sample as news.
                Dev's actual release notes are the weekly meeting doc. */}
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
            {/* File a ticket about the page you are on.

                Raises a flag rather than navigating: sending somebody to the
                help desk to describe a problem they are looking at asks them
                to leave the evidence behind. App draws the form over
                whatever page they are on.

                The flag is on the shared slice because this bar is prod-tree
                and the form is dev. It carries the page and its area, which
                the nav has already worked out for its own highlight. */}
            {context.apiEnv === "dev" ? (
              <button
                onClick={() => {
                  setAvatarOpen(false);
                  dispatch(
                    openReportIssue({
                      from: location.pathname,
                      page: activeCategory?.pages.find(
                        (p) => p.href === currentPath,
                      )?.name,
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
            {/* Sign in as someone. Level 9 only, which the server checks
                again from the database, and dev only, because the endpoint
                is on the dev API alone so far. Replaced the impersonate
                checkbox on the sign-in page. */}
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
