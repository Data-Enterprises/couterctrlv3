import "./loadingIndicatorLegacy.css";

interface Props {
  message?: string;
  className?: string;
}

const LoadingIndicatorLegacy = ({
  message = "Loading...",
  className = "",
}: Props) => {
  return (
    <div data-testid="loading-indicator" className={`loading-indicator-legacy ${className}`}>
      <span className="absolute mt-5 text-center text-[13px] w-full font-medium">{message}</span>
    </div>
  );
};

export default LoadingIndicatorLegacy;
