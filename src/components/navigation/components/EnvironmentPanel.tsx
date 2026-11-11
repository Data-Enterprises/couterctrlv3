// Hooks
import { useAppDispatch } from "../../../hooks";
import { useNavigate } from "react-router";
import { useNavCtx } from "../hooks";

// Redux
import { setApiEnv, setUiMode, SHOW_API_ENV_SWITCH } from "../../../features/appSlice";

// Utils
import { legacyEntryPath } from "../../../constants/legacyPages";

// Components
import { UsersIcon } from "@heroicons/react/24/outline";
import MenuToggle from "./MenuToggle";
import MenuItem from "./MenuItem";

interface EnvironmentPanelProps {
  onSignInAs: () => void;
  /** Nothing above it but the name, so it brings its own top rule. */
  first?: boolean;
}

/** The avatar menu's boxed Environment panel: View (level 9), Mode (7+) and
 *  Sign in as another user (level 9, dev API). Nothing shows below level 7. */
const EnvironmentPanel = ({ onSignInAs, first }: EnvironmentPanelProps) => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { app: context, user, pathname } = useNavCtx();

  const showView = SHOW_API_ENV_SWITCH && user.userLevel >= 9;
  const showMode = SHOW_API_ENV_SWITCH && user.userLevel >= 7;
  const showSignInAs = context.apiEnv === "dev" && user.userLevel === 9;
  if (!showView && !showMode && !showSignInAs) return null;

  return (
    <div className={`px-2.5 pb-2.5 ${first ? "border-t border-brand_line pt-2.5" : ""}`}>
      <div className="rounded-[10px] border border-brand_line bg-brand_navy/[0.04] px-3 pt-2.5 pb-1.5">
        <div className="flex items-center justify-between pb-0.5">
          <span className="text-[11px] font-semibold text-brand_slate">Environment</span>
          <span className="px-[7px] py-0.5 rounded-md bg-custom-white border border-brand_line text-[10px] font-semibold text-content">
            Level {user.userLevel}
          </span>
        </div>
        {/* View: Live or Legacy pages. Legacy is prod-only, so it settles Mode. */}
        {showView ? (
          <MenuToggle
            label="View"
            value={context.uiMode}
            options={[
              { id: "live", label: "Live" },
              { id: "legacy", label: "Legacy" },
            ]}
            onPick={(mode) => {
              dispatch(setUiMode(mode));
              if (mode !== "legacy") return;
              // A page Legacy doesn't have falls back to your last legacy page, or Sales.
              const to = legacyEntryPath(pathname, context.legacyLastRoute);
              if (to) navigate(to);
            }}
          />
        ) : null}
        {/* Mode: the dev or prod API. Doesn't close the menu, so you can see it took. */}
        {showMode ? (
          <MenuToggle
            label="Mode"
            value={context.apiEnv}
            options={[
              { id: "dev", label: "Dev" },
              { id: "prod", label: "Prod" },
            ]}
            onPick={(env) => dispatch(setApiEnv(env))}
            disabledReason={context.uiMode === "legacy" ? "Legacy pages always use the prod API" : undefined}
          />
        ) : null}
        {/* Checked again by the server. */}
        {showSignInAs ? (
          <div className="mt-0.5 -mx-1.5 border-t border-brand_line pt-0.5">
            <MenuItem icon={UsersIcon} label="Sign in as another user" opens inPanel onClick={onSignInAs} />
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default EnvironmentPanel;
