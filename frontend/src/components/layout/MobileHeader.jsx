import { useNavigate } from 'react-router-dom';
import { IconBack } from '../ui/Icons';

export default function MobileHeader({ title, subtitle, backTo, action }) {
  const navigate = useNavigate();

  return (
    <header className="mobile-header">
      <div className="mobile-header__left">
        {backTo && (
          <button
            type="button"
            className="mobile-header__back"
            onClick={() => navigate(backTo)}
            aria-label="Volver"
          >
            <IconBack />
          </button>
        )}
        <div>
          <h1 className="mobile-header__title">{title}</h1>
          {subtitle && <p className="mobile-header__meta">{subtitle}</p>}
        </div>
      </div>
      {action}
    </header>
  );
}
