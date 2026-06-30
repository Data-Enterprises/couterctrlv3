import { useAppSelector } from "../../hooks";
import LoadingIndicatorDev from "./LoadingIndicatorDev";
import LoadingIndicatorLegacy from "./LoadingIndicatorLegacy";

interface Props {
  message?: string;
  className?: string;
}

const LoadingIndicator = (props: Props) => {
  const devMode = useAppSelector((s) => s.app.devMode);
  return devMode ? <LoadingIndicatorDev {...props} /> : <LoadingIndicatorLegacy {...props} />;
};

export default LoadingIndicator;
