import { Component, type ReactNode } from "react";
import { Button } from "@/components/ui/button";

interface ProviderCalendarViewBoundaryProps {
  viewKey: string;
  children: ReactNode;
}

interface ProviderCalendarViewBoundaryState {
  hasError: boolean;
}

export class ProviderCalendarViewBoundary extends Component<
  ProviderCalendarViewBoundaryProps,
  ProviderCalendarViewBoundaryState
> {
  state: ProviderCalendarViewBoundaryState = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.error("Provider calendar view failed to render", error);
  }

  componentDidUpdate(prevProps: ProviderCalendarViewBoundaryProps) {
    if (prevProps.viewKey !== this.props.viewKey && this.state.hasError) {
      // Reset the fallback when the user changes date or view.
      this.setState({ hasError: false });
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="rounded-2xl border border-border/60 bg-background/80 p-6 text-center">
          <h3 className="font-display text-lg font-semibold text-foreground">Calendar view unavailable</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            That view could not be rendered. Please switch views or move to another date to recover.
          </p>
          <Button
            className="mt-4 rounded-full gradient-gold text-primary-foreground font-semibold"
            onClick={() => this.setState({ hasError: false })}
          >
            Retry
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
