import { Link } from 'react-router-dom';
import PageContainer from '../components/ui/PageContainer';
import PrimaryButton from '../components/ui/PrimaryButton';

export default function NotFoundPage() {
  return (
    <PageContainer>
      <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
        <h1 style={{ fontSize: '3rem', marginBottom: 8 }}>404</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: 24 }}>Página no encontrada</p>
        <Link to="/">
          <PrimaryButton>Ir al inicio</PrimaryButton>
        </Link>
      </div>
    </PageContainer>
  );
}
