import { Toaster } from 'sonner';
import { AppRouter } from './routes/AppRouter';

export function App() {
  return (
    <>
      <AppRouter />
      <Toaster richColors position="top-right" />
    </>
  );
}

export default App;
