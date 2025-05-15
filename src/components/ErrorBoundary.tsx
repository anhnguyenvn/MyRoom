import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error("Error caught by ErrorBoundary:", error, errorInfo);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div
          style={{
            padding: "2rem",
            backgroundColor: "#ffdddd",
            border: "1px solid #ff0000",
            borderRadius: "4px",
            margin: "1rem",
          }}
        >
          <h2>Something went wrong</h2>
          <p>An error occurred while rendering the room:</p>
          <pre
            style={{
              backgroundColor: "#fff",
              padding: "1rem",
              borderRadius: "4px",
              overflow: "auto",
            }}
          >
            {this.state.error?.toString()}
          </pre>
          <button
            onClick={() => this.setState({ hasError: false })}
            style={{ marginTop: "1rem" }}
          >
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
