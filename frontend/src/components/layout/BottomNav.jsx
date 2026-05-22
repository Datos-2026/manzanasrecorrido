import { NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import {
  isRecorredor,
  isAdmin,
  canManageAssignments,
  canManageBlocks,
  canViewDashboard,
} from '../../utils/roles';
import { IconHome, IconMap, IconAdd, IconList, IconGrid, IconMore } from '../ui/Icons';

function NavItem({ to, end, label, icon: Icon }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `bottom-nav__item ${isActive ? 'bottom-nav__item--active' : ''}`
      }
    >
      <Icon />
      <span>{label}</span>
    </NavLink>
  );
}

export default function BottomNav() {
  const { user } = useAuth();

  if (isRecorredor(user)) {
    return (
      <nav className="bottom-nav" aria-label="Navegación principal">
        <NavItem to="/mis-manzanas" end label="Mis manzanas" icon={IconMap} />
        <NavItem to="/recorridos" label="Historial" icon={IconList} />
        <NavItem to="/mas" label="Más" icon={IconMore} />
      </nav>
    );
  }

  return (
    <nav className="bottom-nav" aria-label="Navegación principal">
      {canViewDashboard(user) && <NavItem to="/" end label="Inicio" icon={IconHome} />}
      <NavItem to="/recorridos" label="Recorridos" icon={IconList} />
      {canManageAssignments(user) && <NavItem to="/asignaciones" label="Asignar" icon={IconGrid} />}
      {canManageBlocks(user) && <NavItem to="/manzanas" label="Manzanas" icon={IconMap} />}
      <NavItem to="/mas" label="Más" icon={IconMore} />
    </nav>
  );
}
