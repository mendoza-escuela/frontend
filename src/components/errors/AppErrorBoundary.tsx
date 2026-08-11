import { Component, type ReactNode } from 'react';
import { ErrorPage } from '../ui/ErrorPage';

type AppErrorBoundaryState = {
  hasError: boolean;
};

/**
 * Última defensa para errores de render por fuera del data router. La interfaz
 * nunca refleja el mensaje ni el stack capturados.
 */
export class AppErrorBoundary extends Component<
  { children: ReactNode },
  AppErrorBoundaryState
> {
  state: AppErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): AppErrorBoundaryState {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <ErrorPage
          message="Ocurrió un error inesperado. Intentá nuevamente más tarde o contactá a soporte si continúa."
          showBackButton={false}
          statusCode={500}
          title="No pudimos completar la solicitud"
        />
      );
    }

    return this.props.children;
  }
}
