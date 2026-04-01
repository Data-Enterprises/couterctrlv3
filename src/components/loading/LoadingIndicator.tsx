import "./loadingIndicator.css";

interface Props {
  message?: string;
  className?: string;
}

const LoadingIndicator = ({
  message = "Loading...",
  className = "",
}: Props) => {
  return (
    <div data-testid="loading-indicator" className={`loading-indicator ${className}`}>
      <span className="absolute mt-6 text-center w-full text-sm font-medium">{message}</span>
    </div>
  );
};

export default LoadingIndicator;
