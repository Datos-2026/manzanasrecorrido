import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { ROLE_LABELS } from '../utils/roles';
import { canManageUsers, canManageCommunes, isRecorridor } from '../utils/roles';
import MobileHeader from '../components/layout/MobileHeader';
import PageContainer from '../components/ui/PageContainer';
import SectionCard from '../components/ui/SectionCard';
import { IconChevron } from '../components/ui/Icons';

export default function MorePage() {
  const { user, logout } = useAuth();

  return (
    <>
      <MobileHeader title="Más opciones" />
      <PageContainer>
        <SectionCard label="Sesión" title={`${user?.firstName} ${user?.lastName}`} noDivider>
          <p style={{ margin: '0 0 8px', color: 'var(--text-muted)', fontSize: 14 }}>
            {ROLE_LABELS[user?.role]}
            {user?.commune ? ` · ${user.commune.name}` : ''}
          </p>
          <p style={{ margin: 0, fontSize: 14 }}>{user?.email}</p>
        </SectionCard>

        <nav className="more-menu" aria-label="Menú adicional">
          {!isRecorridor(user) && canManageUsers(user) && (
            <Link to="/usuarios" className="more-menu__item">
              Gestión de usuarios
              <IconChevron />
            </Link>
          )}
          {canManageCommunes(user) && (
            <Link to="/comunas" className="more-menu__item">
              Gestión de comunas
              <IconChevron />
            </Link>
          )}
        </nav>

        <button type="button" className="more-menu__item more-menu__item--danger" onClick={logout}>
          Cerrar sesión
        </button>
      </PageContainer>
    </>
  );
}
