import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
// components
import { Message } from 'components/message';

type Props = {
  children: ReactNode;
};

type State = {
  hasError: boolean;
};

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);

    if (!window.gaTarget) return;
    window.logErrorToGa(`${error}${errorInfo.componentStack}`, true);
  }

  public render() {
    const { children } = this.props;
    const { hasError } = this.state;

    if (hasError) {
      return <Message type="error" text={'Something went wrong.'} />;
    }

    return children;
  }
}
