import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Trash2 } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught Error in SAGARA Application:", error, errorInfo);
    this.setState({ error, errorInfo });
  }

  private handleResetCache = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
      window.location.reload();
    } catch (e) {
      window.location.reload();
    }
  };

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6 font-sans text-slate-800">
          <div className="bg-white rounded-3xl shadow-xl border border-slate-200 p-8 max-w-lg w-full text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-red-500 via-amber-500 to-blue-500"></div>
            
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-red-100">
              <AlertTriangle size={32} />
            </div>

            <h1 className="text-xl font-bold text-slate-800 mb-2">Terjadi Kesalahan Aplikasi</h1>
            <p className="text-sm text-slate-500 mb-6">
              Aplikasi mengalami kendala saat memuat komponen. Anda dapat memuat ulang atau membersihkan penyimpanan lokal browser.
            </p>

            {this.state.error && (
              <div className="bg-slate-100 p-3 rounded-xl text-left text-xs text-red-600 font-mono overflow-auto max-h-32 mb-6 border border-slate-200">
                {this.state.error.toString()}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={this.handleReload}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl text-sm flex items-center justify-center gap-2 transition-all shadow-md"
              >
                <RefreshCw size={16} />
                Muat Ulang
              </button>
              
              <button
                onClick={this.handleResetCache}
                className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold py-3 px-4 rounded-xl text-sm flex items-center justify-center gap-2 transition-all"
              >
                <Trash2 size={16} />
                Reset Cache
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
