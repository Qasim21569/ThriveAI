'use client';

import React, { useState, useEffect, ReactNode, Component, ErrorInfo } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

// Proper React Error Boundary implementation
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_: Error): ErrorBoundaryState {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // You can log the error to an error reporting service
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render(): React.ReactNode {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return this.props.fallback || (
        <div className="p-4 bg-gray-800/50 rounded-lg text-gray-400">
          Component unavailable
        </div>
      );
    }

    return this.props.children;
  }
}

interface SafeComponentProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export const SafeComponent = ({ 
  children, 
  fallback = <div className="p-4 bg-gray-800/50 rounded-lg text-gray-400">Component unavailable</div> 
}: SafeComponentProps) => {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  if (!mounted) {
    return null;
  }
  
  return (
    <ErrorBoundary fallback={fallback}>
      {children}
    </ErrorBoundary>
  );
};

export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode
) {
  return function SafeWrappedComponent(props: P) {
    return (
      <SafeComponent fallback={fallback}>
        <Component {...props} />
      </SafeComponent>
    );
  };
} 