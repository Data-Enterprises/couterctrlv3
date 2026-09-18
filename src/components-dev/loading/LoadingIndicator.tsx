import LoadingIndicatorDev from "./LoadingIndicatorDev";

interface Props {
  message?: string;
  className?: string;
}

/**
 * The loading screen. Always the current one — the legacy spinner went with
 * the devMode (Preview/Live) switch.
 */
const LoadingIndicator = (props: Props) => <LoadingIndicatorDev {...props} />;

export default LoadingIndicator;
