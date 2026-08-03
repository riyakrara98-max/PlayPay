'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from './button';
import { Card } from './card';

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-[300px] flex items-center justify-center p-6">
          <Card variant="elevated" className="max-w-md w-full p-6 text-center flex flex-col items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-[var(--danger)]/10 text-[var(--danger)] flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="flex flex-col gap-1">
              <h3 className="text-lg font-bold font-heading text-[var(--text-primary)]">
                Something went wrong
              </h3>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                An unexpected error occurred while rendering this component section.
              </p>
            </div>

            {this.state.error && (
              <pre className="w-full p-3 rounded-[var(--radius-md)] bg-[var(--bg)] text-[10px] font-mono text-[var(--danger)] text-left overflow-x-auto max-h-32 border border-[var(--border)]">
                {this.state.error.message}
              </pre>
            )}

            <Button
              variant="primary"
              size="sm"
              leftIcon={<RefreshCw className="w-4 h-4" />}
              onClick={this.handleRetry}
            >
              Try Again
            </Button>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
