import { useSelector } from "react-redux";
import type { RootState } from "../store";
import { LEGACY_API_URL } from "../hooks/useLegacyApi";

/**
 * The store as a legacy page expects to find it.
 *
 * Before the separation every slice sat at the root, so these pages ask for
 * `state.sales` and `state.upc` directly. Their slices now live under
 * `state.legacy`, and session state — who you are, which store and week you
 * are asking about — is still at the root and shared with the live app.
 *
 * `devMode` is the flag these pages used to choose between the old view and
 * the one that replaced it. It is gone from `appSlice`, and in this tree the
 * answer is always the old view.
 *
 * `url` and `token` are the legacy API's, not the ones the live app is pointed
 * at. These pages take both from `state.app` and hand them to their own api/
 * modules, so swapping them here pins every legacy call without touching five
 * hundred files. They travel as a pair: the legacy host issues its own token,
 * and a prod credential sent there just 401s.
 */
export type LegacyRootState = RootState["legacy"] &
  Pick<
    RootState,
    | "nav"
    | "user"
    | "search"
    | "stores"
    | "forgotPassword"
    | "ctxMenu"
    | "itemScan"
  > & { app: RootState["app"] & { devMode: boolean } };

const view = (state: RootState): LegacyRootState =>
  ({
    // Session first, the legacy tree second: where both have a key — `group`,
    // whose slice was rewritten during the separation — the legacy page gets
    // the shape it was written against.
    nav: state.nav,
    user: state.user,
    search: state.search,
    stores: state.stores,
    forgotPassword: state.forgotPassword,
    ctxMenu: state.ctxMenu,
    itemScan: state.itemScan,
    app: {
      ...state.app,
      devMode: false,
      url: LEGACY_API_URL,
      token: state.app.legacyToken,
    },
    ...state.legacy,
    // The old Store Groups page keeps its own form state here, but the list of
    // groups is loaded once at sign-in into the live slice. Without this the
    // legacy store picker would have nothing to offer.
    group: {
      ...state.legacy.group,
      groups: state.group.groups,
      selectedGroup: state.group.selectedGroup,
    },
  }) as LegacyRootState;

/**
 * `useAppSelector` for the legacy tree.
 *
 * Every vendored file imports this as `useAppSelector`, so `state.sales` in a
 * page that predates the separation resolves to `state.legacy.sales` without
 * the page being rewritten. Five hundred files would otherwise need their
 * selector bodies edited, and the ones that were missed would read `undefined`
 * at runtime rather than fail to compile.
 *
 * The view is rebuilt per call, which is why the equality function matters and
 * is passed straight through: what the store compares is what `select`
 * returns, not this object.
 */
export const useLegacySelector = <T>(
  select: (state: LegacyRootState) => T,
  equalityFn?: (a: T, b: T) => boolean,
): T => useSelector((state: RootState) => select(view(state)), equalityFn);
