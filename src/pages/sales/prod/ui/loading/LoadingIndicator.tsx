import LoadingIndicatorDev from "./LoadingIndicatorDev";

interface Props {
  message?: string;
  className?: string;
}

/**
 * Sales has no legacy mode, so its loading screen is always the current one.
 * The app-wide LoadingIndicator still switches on devMode for the pages that
 * do; this is the Sales tree's own copy, and the legacy spinner and its
 * stylesheet went to trash/ with the branch.
 */
const LoadingIndicator = (props: Props) => <LoadingIndicatorDev {...props} />;

export default LoadingIndicator;
