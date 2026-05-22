import { useAuth } from '../hooks/useAuth';
import { ROLE_LABELS } from '../utils/roles';

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <header className="navbar">
      <div className="navbar-brand">Territorio App</div>
      <div className="navbar-user">
        <span>
          {user?.firstName} {user?.lastName}
          <small style={{ marginLeft: 8, color: 'var(--muted)' }}>
            ({ROLE_LABELS[user?.role]})
          </small>
        </span>
        <button type="button" className="btn btn-secondary btn-sm" onClick={logout}>
          Salir
        </button>
      </div>
    </header>
  );
}



