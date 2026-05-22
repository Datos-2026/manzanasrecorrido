import { NavLink } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import {
  canManageUsers,
  canManageCommunes,
  canManageBlocks,
  canManageAssignments,
  canViewDashboard,
  isRecorridor,
} from '../utils/roles';

const linkClass = ({ isActive }) => (isActive ? 'nav-link active' : 'nav-link');

export default function Sidebar() {
  const { user } = useAuth();

  return (
    <aside className="sidebar">
      <nav>
        {canViewDashboard(user) && (
          <NavLink to="/" end className={linkClass}>
            Dashboard
          </NavLink>
        )}
        {isRecorridor(user) && (
          <>
            <NavLink to="/mis-manzanas" className={linkClass}>
              Mis manzanas
            </NavLink>
            <NavLink to="/recorridos/nuevo" className={linkClass}>
              Cargar recorrido
            </NavLink>
          </>
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
      </nav>
    </aside>
  );
}



