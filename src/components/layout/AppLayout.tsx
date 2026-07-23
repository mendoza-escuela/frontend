import { Outlet } from 'react-router-dom';

export function AppLayout() {
  return (
    <div className="min-h-screen bg-mendoza-background text-mendoza-text">
      <main>
        <Outlet />
      </main>
    </div>
  );
}
