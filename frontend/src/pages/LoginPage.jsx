import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { isRecorridor } from '../utils/roles';
import FormField from '../components/ui/FormField';
import PrimaryButton from '../components/ui/PrimaryButton';
import ErrorState from '../components/ui/ErrorState';

export default function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (user) {
    return <Navigate to={isRecorridor(user) ? '/mis-manzanas' : '/'} replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const logged = await login(email, password);
      navigate(isRecorridor(logged) ? '/mis-manzanas' : '/');
    } catch (err) {
      setError(err.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-page__header">
        <div className="login-page__logo" aria-hidden="true">
          BA
        </div>
        <h1 className="login-page__title">Territorio App</h1>
        <p className="login-page__subtitle">Gestión territorial por manzana</p>
      </div>

      <div className="login-page__card-wrap">
        <div className="login-card">
          <ErrorState message={error} />
          <form onSubmit={handleSubmit}>
            <FormField label="Email institucional" id="email">
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="nombre@buenosaires.gob.ar"
              />
            </FormField>
            <FormField label="Contraseña" id="password">
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </FormField>
            <PrimaryButton type="submit" large block disabled={loading}>
              {loading ? 'Ingresando...' : 'Ingresar'}
            </PrimaryButton>
          </form>
        </div>
        <p className="login-page__footer">Uso interno GCBA</p>
      </div>
    </div>
  );
}

