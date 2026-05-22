import { Outlet, useLocation } from 'react-router-dom';
import DesktopSidebar from './DesktopSidebar';
import BottomNav from './BottomNav';

export default function AppLayout() {
  const location = useLocation();
  const isFormPage = location.pathname === '/recorridos/nuevo';
  const hideNav = false;

  const mainClass = [
    'app-main',
    hideNav ? 'app-main--no-nav' : '',
    isFormPage ? 'app-main--form-footer' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className="app-shell">
      <DesktopSidebar />
      <main className={mainClass}>
        <Outlet />
      </main>
      {!hideNav && <BottomNav />}
    </div>
  );
}
