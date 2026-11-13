// Components
import LoadingIndicatorDev from "./LoadingIndicatorDev";

interface LoadingIndicatorProps {
  message?: string;
  className?: string;
}

/**
 * The loading screen. Always the current one — the legacy spinner went with
 * the devMode (Preview/Live) switch.
 */
const LoadingIndicator = (props: LoadingIndicatorProps) => <LoadingIndicatorDev {...props} />;

export default LoadingIndicator;
