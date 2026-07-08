import { Outlet } from 'react-router-dom';

export function AppLayout() {
  return (
    <div className="min-h-screen bg-[#F5F7FA] text-[#1F2937]">
      <main>
        <Outlet />
      </main>
    </div>
  );
}
