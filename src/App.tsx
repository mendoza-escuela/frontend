import { Toaster } from 'sonner';
import { AppRouter } from './routes/AppRouter';
import { AuthProvider } from './hooks/AuthProvider';

export function App() {
  return (
    <>
      <AuthProvider>
        <AppRouter />
      </AuthProvider>
      <Toaster richColors position="top-right" />
    </>
  );
}

export default App;
