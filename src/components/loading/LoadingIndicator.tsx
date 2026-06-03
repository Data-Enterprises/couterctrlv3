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
    <div data-testid="loading-indicator" className={`loading-indicator text-[12px] ${className}`}>
      <span className="absolute mt-5 text-center w-full font-medium">{message}</span>
    </div>
  );
};

export default LoadingIndicator;
