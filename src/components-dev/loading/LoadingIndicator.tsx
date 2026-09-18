import LoadingIndicatorDev from "./LoadingIndicatorDev";

interface Props {
  message?: string;
  className?: string;
}

/**
 * Dev library: always the current loading screen. The prod library's
 * LoadingIndicator still switches to the legacy spinner when devMode is off,
 * for the pages that still have a legacy mode; the dev library carries no
 * legacy UI at all.
 */
const LoadingIndicator = (props: Props) => <LoadingIndicatorDev {...props} />;

export default LoadingIndicator;
