import { Component, type ErrorInfo, type ReactNode } from "react";
import { logClientError } from "@/lib/errorLog";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

/**
 * Global error boundary — calm French error screen, no stack trace shown
 * to the user. Logs a truncated, scrubbed report via `logClientError`
 * (never tokens/emails/full URLs) and offers a "Réessayer" action.
 */
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: unknown, info: ErrorInfo) {
    logClientError(error, `ErrorBoundary: ${info.componentStack?.slice(0, 200) ?? ""}`);
  }

  handleRetry = () => {
    this.setState({ hasError: false });
    if (typeof window !== "undefined") {
      window.location.reload();
    }
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-6">
        <div className="max-w-sm text-center">
          <h1 className="text-xl font-black text-foreground">Un imprévu s'est produit</h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Quelque chose ne s'est pas passé comme prévu. Aucune donnée n'a été perdue — réessaie,
            si le problème persiste tu peux fermer puis rouvrir l'application.
          </p>
          <button
            onClick={this.handleRetry}
            className="mt-6 inline-flex h-12 items-center justify-center rounded-2xl bg-primary px-6 text-sm font-black text-primary-foreground active:scale-95"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }
}
