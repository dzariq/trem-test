import { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallbackLabel?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class RouteErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    console.error(
      `[RouteErrorBoundary${this.props.fallbackLabel ? `:${this.props.fallbackLabel}` : ""}]`,
      error,
      info.componentStack,
    );
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null });
    if (typeof window !== "undefined") window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[60vh] flex items-center justify-center p-6">
          <div className="max-w-sm w-full rounded-xl border border-border bg-card p-5 text-center shadow-sm">
            <p className="text-sm font-semibold text-foreground">
              Something went wrong{this.props.fallbackLabel ? ` on ${this.props.fallbackLabel}` : ""}.
            </p>
            <p className="mt-1 text-xs text-muted-foreground break-words">
              {this.state.error?.message ?? "Unexpected error"}
            </p>
            <button
              type="button"
              onClick={this.handleReload}
              className="mt-4 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Reload
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default RouteErrorBoundary;