import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Unhandled React Application Error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/dashboard';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 antialiased font-sans">
          <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-xl border border-slate-200 text-center space-y-5">
            <div className="w-16 h-16 rounded-2xl bg-amber-100 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto shadow-xs">
              <AlertTriangle className="w-8 h-8" />
            </div>
            
            <div className="space-y-2">
              <h1 className="text-xl font-bold text-slate-900">Something went wrong</h1>
              <p className="text-xs text-slate-600 leading-relaxed">
                The editor or component encountered an unexpected error while rendering.
              </p>
            </div>

            {this.state.error && (
              <div className="p-3 bg-slate-100 rounded-xl text-left overflow-auto max-h-32 text-[11px] font-mono text-slate-700 border border-slate-200">
                {this.state.error.message || String(this.state.error)}
              </div>
            )}

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => window.location.reload()}
                className="flex-1 py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Reload Page
              </button>
              <button
                onClick={this.handleReset}
                className="flex-1 py-2.5 px-4 rounded-xl bg-[#1d4ed8] hover:bg-[#1e40af] text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-md transition-colors"
              >
                <Home className="w-4 h-4" />
                Dashboard Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
