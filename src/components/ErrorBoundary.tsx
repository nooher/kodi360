import { Component, type ReactNode, type ErrorInfo } from 'react';
import { captureError } from '../lib/error-tracking';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    captureError(error, { componentStack: info.componentStack });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-paper p-6">
          <div className="max-w-sm text-center">
            <div className="h-14 w-14 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
              !
            </div>
            <h1 className="text-xl font-bold text-tz-black mb-2">Hitilafu imetokea</h1>
            <p className="text-sm text-tz-black/60 mb-5 leading-relaxed">
              Data yako iko salama kwenye simu yako — jaribu kupakia upya ukurasa.
            </p>
            <p className="text-xs font-mono text-tz-black/40 bg-tz-black/5 rounded-lg px-3 py-2 mb-5 break-words">
              {this.state.error?.message}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="rounded-xl bg-tz-green px-6 py-2.5 text-sm font-semibold text-white hover:bg-tz-green-dark"
            >
              Pakia upya
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
