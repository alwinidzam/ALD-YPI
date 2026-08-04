import React, { Component, ErrorInfo, ReactNode } from 'react';
import { LoggerService } from '../lib/LoggerService';
import { AlertOctagon, RefreshCw, Home, MessageSquareWarning } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    errorId: null
  };

  public static getDerivedStateFromError(error: Error): State {
    // Generate a random error ID
    const errorId = `ERR-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
    return { hasError: true, error, errorInfo: null, errorId };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    LoggerService.error('React Application Crashed', error, {
      componentStack: errorInfo.componentStack,
      errorId: this.state.errorId
    });
    
    // We update the state with errorInfo separately
    // @ts-ignore
    this.setState({ errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  private handleReportError = () => {
    // Future integration: open a modal or send report
    alert(`Please report Error ID: ${this.state.errorId} to support.`);
  };

  public render() {
    if (this.state.hasError) {
      // Check if we are in development mode to show error details
      // In Vite, process is not defined, we'll try/catch to avoid errors or just use import.meta.env inside a hook
      // Since it's a class component, we can use a basic check
      const isDev = typeof process !== 'undefined' && process.env && process.env.NODE_ENV !== 'production';
      // As Vite replaces import.meta.env.DEV, we can't easily use it in a class without a wrapper, so we'll just check if it's not production
      // Actually, we can check window.location.hostname === 'localhost' as a fallback
      const showDetails = isDev || (typeof window !== 'undefined' && window.location.hostname === 'localhost');

      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100">
            <div className="bg-red-50 p-6 flex flex-col items-center text-center border-b border-red-100">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <AlertOctagon className="w-8 h-8 text-red-600" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-2">Terjadi Kesalahan Sistem</h2>
              <p className="text-slate-600 text-sm">
                Mohon maaf, aplikasi mengalami kendala teknis dan tidak dapat melanjutkan proses.
              </p>
              <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 bg-red-100 text-red-700 text-xs font-mono rounded-md font-medium">
                <span>Error ID:</span>
                <span className="select-all">{this.state.errorId}</span>
              </div>
            </div>

            <div className="p-6 flex flex-col gap-3">
              <button
                onClick={this.handleReload}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl transition-colors"
              >
                <RefreshCw className="w-5 h-5" />
                <span>Muat Ulang Halaman</span>
              </button>
              
              <button
                onClick={this.handleGoHome}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-white hover:bg-slate-50 text-slate-700 font-medium rounded-xl border border-slate-200 transition-colors"
              >
                <Home className="w-5 h-5" />
                <span>Kembali ke Halaman Utama</span>
              </button>

              <button
                onClick={this.handleReportError}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-white hover:bg-slate-50 text-slate-600 font-medium rounded-xl border border-slate-200 transition-colors mt-2"
              >
                <MessageSquareWarning className="w-5 h-5" />
                <span>Laporkan Masalah Ini</span>
              </button>
            </div>

            {showDetails && this.state.error && (
              <div className="bg-slate-900 p-6 border-t border-slate-800">
                <h3 className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-500"></span>
                  Developer Details
                </h3>
                <div className="text-red-400 font-mono text-sm break-words mb-4 pb-4 border-b border-slate-800">
                  {this.state.error.toString()}
                </div>
                {this.state.errorInfo && (
                  <pre className="text-slate-400 font-mono text-xs overflow-auto max-h-48 whitespace-pre-wrap">
                    {this.state.errorInfo.componentStack}
                  </pre>
                )}
              </div>
            )}
          </div>
        </div>
      );
    }

    // @ts-ignore
    return this.props.children;
  }
}
