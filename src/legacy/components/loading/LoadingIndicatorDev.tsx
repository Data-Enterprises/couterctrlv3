import "./loadingIndicator.css";

interface Props {
  message?: string;
  className?: string;
}

const LoadingIndicatorDev = ({ message = "Loading...", className = "" }: Props) => {
  return (
    <div data-testid="loading-indicator" className={`loading-indicator ${className}`}>
      <div className="loading-pill">
        <span className="loading-pill-text">{message}</span>
        <div className="loading-dots">
          <div className="loading-dot" />
          <div className="loading-dot" />
          <div className="loading-dot" />
        </div>
      </div>
    </div>
  );
};

export default LoadingIndicatorDev;
