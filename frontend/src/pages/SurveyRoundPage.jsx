import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { surveyRoundsApi } from '../api/surveyRoundsApi';
import MobileHeader from '../components/layout/MobileHeader';
import PageContainer from '../components/ui/PageContainer';
import SectionCard from '../components/ui/SectionCard';
import EntityCard from '../components/ui/EntityCard';
import PrimaryButton from '../components/ui/PrimaryButton';
import SecondaryButton from '../components/ui/SecondaryButton';
import StatusChip from '../components/ui/StatusChip';
import LoadingState from '../components/ui/LoadingState';
import EmptyState from '../components/ui/EmptyState';
import ErrorState from '../components/ui/ErrorState';

function formatDateTime(value) {
  if (!value) return '';
  try {
    return new Date(value).toLocaleString('es-AR', {
      dateStyle: 'short',
      timeStyle: 'short',
    });
  } catch {
    return value;
  }
}

export default function SurveyRoundPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [round, setRound] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [confirmClose, setConfirmClose] = useState(false);
  const [closing, setClosing] = useState(false);

  const load = () => {
    setLoading(true);
    surveyRoundsApi
      .get(id)
      .then((data) => setRound(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [id]);

  const handleClose = async () => {
    setClosing(true);
    setError('');
    try {
      await surveyRoundsApi.close(id);
      navigate('/mis-manzanas');
    } catch (err) {
      setError(err.message);
    } finally {
      setClosing(false);
      setConfirmClose(false);
    }
  };

  if (loading) {
    return (
      <>
        <MobileHeader title="Relevamiento" backTo="/mis-manzanas" />
        <LoadingState />
      </>
    );
  }

  if (!round) {
    return (
      <>
        <MobileHeader title="Relevamiento" backTo="/mis-manzanas" />
        <PageContainer>
          <ErrorState message={error || 'No se encontró el relevamiento.'} />
        </PageContainer>
      </>
    );
  }

  const visits = round.visits || [];
  const isActive = round.isActive;

  return (
    <>
      <MobileHeader
        title={`Semana ${round.weekNumber} — ${round.block?.code || ''}`}
        backTo="/mis-manzanas"
        subtitle={
          isActive ? 'Relevamiento en curso' : 'Relevamiento cerrado'
        }
      />
      <PageContainer narrow>
        <ErrorState message={error} />

        <SectionCard
          label={round.block?.code}
          title={`Semana ${round.weekNumber} de 5`}
          noDivider
        >
          <p style={{ margin: '0 0 8px', fontSize: 14, color: 'var(--text-muted)' }}>
            {round.block?.neighborhood || 'Sin barrio'}
            {round.block?.commune?.name ? ` · ${round.block.commune.name}` : ''}
            {round.block?.label ? ` · ${round.block.label}` : ''}
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            <span className="context-pill context-pill--accent">
              {round.weekNumber === 1 ? 'Primer relevamiento' : 'Relevamiento de seguimiento'}
            </span>
            <span className="context-pill">Iniciado: {formatDateTime(round.startedAt)}</span>
            {!isActive && (
              <span className="context-pill">Cerrado: {formatDateTime(round.finishedAt)}</span>
            )}
            <span className="context-pill">
              {visits.length} domicilio{visits.length === 1 ? '' : 's'}
            </span>
          </div>
        </SectionCard>

        {isActive && (
          <div style={{ marginTop: 12 }}>
            <Link
              to={`/recorridos/nuevo?roundId=${round.id}`}
              className="btn btn--primary btn--block btn--primary-lg"
            >
              + Agregar domicilio
            </Link>
          </div>
        )}

        <SectionCard
          title={`Domicilios cargados (${visits.length})`}
          noDivider
        >
          {visits.length === 0 ? (
            <EmptyState message="Todavía no cargaste ningún domicilio en este relevamiento." />
          ) : (
            <div className="entity-list-mobile">
              {visits.map((v) => (
                <EntityCard
                  key={v.id}
                  top={
                    <>
                      <div>
                        <p className="entity-card__code">
                          {v.street || 'Sin calle'} {v.streetNumber || ''}
                        </p>
                        <p className="entity-card__meta">
                          {v.doorbell ? `Timbre ${v.doorbell} · ` : ''}
                          {formatDateTime(v.createdAt)}
                        </p>
                      </div>
                      <StatusChip status={v.status} />
                    </>
                  }
                  actions={
                    <Link
                      to={`/recorridos/${v.id}`}
                      className="btn btn--ghost btn--block"
                    >
                      Ver detalle
                    </Link>
                  }
                />
              ))}
            </div>
          )}
        </SectionCard>

        {isActive && (
          <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {!confirmClose ? (
              <SecondaryButton block onClick={() => setConfirmClose(true)}>
                Cerrar relevamiento
              </SecondaryButton>
            ) : (
              <SectionCard
                label="Confirmación"
                title="¿Cerrar este relevamiento?"
                noDivider
              >
                <p style={{ margin: '0 0 12px', fontSize: 14, color: 'var(--text-muted)' }}>
                  No vas a poder agregar más domicilios a la semana {round.weekNumber} de la
                  manzana {round.block?.code}. Esta acción no se puede deshacer.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <PrimaryButton block large disabled={closing} onClick={handleClose}>
                    {closing ? 'Cerrando...' : 'Sí, cerrar relevamiento'}
                  </PrimaryButton>
                  <SecondaryButton
                    block
                    disabled={closing}
                    onClick={() => setConfirmClose(false)}
                  >
                    Cancelar
                  </SecondaryButton>
                </div>
              </SectionCard>
            )}
          </div>
        )}
      </PageContainer>
    </>
  );
}
