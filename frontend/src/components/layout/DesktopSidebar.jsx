import { NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { ROLE_LABELS } from '../../utils/roles';
import {
  canManageUsers,
  canManageCommunes,
  canManageBlocks,
  canManageAssignments,
  canViewDashboard,
  isRecorredor,
} from '../../utils/roles';
const linkClass = ({ isActive }) =>
  `desktop-sidebar__link ${isActive ? 'desktop-sidebar__link--active' : ''}`;

export default function DesktopSidebar() {
  const { user, logout } = useAuth();

  return (
    <aside className="desktop-sidebar">
      <div className="desktop-sidebar__brand">
        <h1>Territorio App</h1>
        <p>Gestión territorial GCBA</p>
      </div>
      <div className="desktop-sidebar__user">
        <strong>
          {user?.firstName} {user?.lastName}
        </strong>
        <br />
        <span style={{ opacity: 0.8 }}>{ROLE_LABELS[user?.role]}</span>
        {user?.commune && (
          <>
            <br />
            <span style={{ opacity: 0.7, fontSize: 13 }}>{user.commune.name}</span>
          </>
        )}
      </div>
      <nav className="desktop-sidebar__nav">
        {isRecorredor(user) ? (
          <>
            <NavLink to="/mis-manzanas" className={linkClass}>
              Mis manzanas
            </NavLink>
            <NavLink to="/recorridos" className={linkClass}>
              Historial
            </NavLink>
          </>
        ) : (
          <>
            {canViewDashboard(user) && (
              <NavLink to="/" end className={linkClass}>
                Dashboard
              </NavLink>
            )}
            <NavLink to="/recorridos" className={linkClass}>
              Recorridos
            </NavLink>
            {canManageAssignments(user) && (
              <NavLink to="/asignaciones" className={linkClass}>
                Asignaciones
              </NavLink>
            )}
            {canManageBlocks(user) && (
              <NavLink to="/manzanas" className={linkClass}>
                Manzanas
              </NavLink>
            )}
            {canManageUsers(user) && (
              <NavLink to="/usuarios" className={linkClass}>
                Usuarios
              </NavLink>
            )}
            {canManageCommunes(user) && (
              <NavLink to="/comunas" className={linkClass}>
                Comunas
              </NavLink>
            )}
          </>
        )}
      </nav>
      <div className="desktop-sidebar__footer">
        <button
          type="button"
          className="btn btn--secondary btn--block"
          style={{ color: '#fff', borderColor: 'rgba(255,255,255,0.5)' }}
          onClick={logout}
        >
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}

