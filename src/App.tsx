import { Toaster } from 'sonner';
import { AppErrorBoundary } from './components/errors/AppErrorBoundary';
import { AppRouter } from './routes/AppRouter';
import { AuthProvider } from './hooks/AuthProvider';

function App() {
  return (
    <>
      <AppErrorBoundary>
        <AuthProvider>
          <AppRouter />
        </AuthProvider>
      </AppErrorBoundary>
      <Toaster
        closeButton
        duration={5000}
        richColors
        position="top-right"
        theme="light"
        visibleToasts={4}
      />
    </>
  );
}

export default App;
