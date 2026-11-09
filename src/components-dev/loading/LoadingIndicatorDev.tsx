// Utils
import "./loadingIndicator.css";

interface LoadingIndicatorDevProps {
  message?: string;
  className?: string;
}

/** Loading pill with a message (default "Loading...") and three animated
 *  dots. */
const LoadingIndicatorDev = ({ message = "Loading...", className = "" }: LoadingIndicatorDevProps) => {
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
