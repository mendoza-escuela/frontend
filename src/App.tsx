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
      <Toaster richColors position="top-right" />
    </>
  );
}

export default App;
