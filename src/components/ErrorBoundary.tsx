import React, { Component, type ErrorInfo } from "react";
import error from "../assets/error.jpg";

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ hasError: true, error, errorInfo });
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="text-white w-screen h-screen flex flex-col p-8 justify-center items-center">
          <img
            className="absolute inset-0 -z-10 size-full object-cover object-top"
            src={error}
            alt="error"
          />
          <h1 className="font-medium text-2xl text-white">
            Something went wrong.
          </h1>
          <h2>Error</h2>
          <p>{this.state.error?.message}</p>
          <button
            data-testid="error-boundary-reset-button"
            onClick={() => {
              window.location.reload();
            }}
            className="border rounded-lg shadow-md py-2 px-8 hover:bg-custom-white/25 transition-all duration-500"
          >
            Reset
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
