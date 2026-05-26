import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { assignmentsApi } from '../api/assignmentsApi';
import { surveyRoundsApi } from '../api/surveyRoundsApi';
import { useFetch } from '../hooks/useFetch';
import MobileHeader from '../components/layout/MobileHeader';
import PageContainer from '../components/ui/PageContainer';
import EntityCard from '../components/ui/EntityCard';
import StatusChip from '../components/ui/StatusChip';
import PrimaryButton from '../components/ui/PrimaryButton';
import SecondaryButton from '../components/ui/SecondaryButton';
import SectionCard from '../components/ui/SectionCard';
import RadioGroup from '../components/ui/RadioGroup';
import LoadingState from '../components/ui/LoadingState';
import EmptyState from '../components/ui/EmptyState';
import ErrorState from '../components/ui/ErrorState';

export default function MyBlocksPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [startingFor, setStartingFor] = useState(null);
  const [selectedWeek, setSelectedWeek] = useState(null);
  const [actionError, setActionError] = useState('');
  const [busy, setBusy] = useState(false);

  const { data: blocks, loading, error } = useFetch(
    () => assignmentsApi.myBlocks(),
    [reloadKey]
  );

  const reload = () => setReloadKey((k) => k + 1);

  const filtered = (blocks || []).filter(
    (b) =>
      !search ||
      b.code.toLowerCase().includes(search.toLowerCase()) ||
      (b.neighborhood || '').toLowerCase().includes(search.toLowerCase())
  );

  const openStartModal = (block) => {
    setActionError('');
    const weeks = [1, 2, 3, 4, 5].filter((w) => !block.completedWeeks?.includes(w));
    const suggested = block.nextWeekNumber && weeks.includes(block.nextWeekNumber)
      ? block.nextWeekNumber
      : weeks[0] || 1;
    setSelectedWeek(suggested);
    setStartingFor(block);
  };

  const handleConfirmStart = async () => {
    if (!startingFor || !selectedWeek) return;
    setBusy(true);
    setActionError('');
    try {
      const round = await surveyRoundsApi.start({
        blockId: startingFor.id,
        weekNumber: selectedWeek,
      });
      setStartingFor(null);
      navigate(`/relevamientos/${round.id}`);
    } catch (err) {
      setActionError(err.message);
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <>
        <MobileHeader title="Mis manzanas" subtitle="Relevamientos por semana" />
        <LoadingState />
      </>
    );
  }

  return (
    <>
      <MobileHeader title="Mis manzanas" subtitle="Relevamientos por semana" />
      <PageContainer>
        <ErrorState message={error} />
        <input
          type="search"
          className="search-input"
          placeholder="Buscar por código o barrio..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Buscar manzana"
        />

        <div className="entity-list-mobile">
          {filtered.length ? (
            filtered.map((b) => {
              const completed = b.completed;
              const active = b.activeRound;
              const status = active
                ? 'parcial'
                : completed
                ? 'realizado'
                : b.visitsCount > 0
                ? 'parcial'
                : 'pendiente';

              return (
                <EntityCard
                  key={b.id}
                  top={
                    <>
                      <div>
                        <p className="entity-card__code">{b.code}</p>
                        <p className="entity-card__meta">
                          {b.neighborhood || 'Sin barrio'}
                          {b.label ? ` · ${b.label}` : ''}
                        </p>
                      </div>
                      <StatusChip status={status} />
                    </>
                  }
                  meta={
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {active ? (
                        <span className="context-pill context-pill--accent">
                          Relevamiento abierto — semana {active.weekNumber}
                        </span>
                      ) : completed ? (
                        <span className="context-pill context-pill--accent">Cerrada (5/5)</span>
                      ) : (
                        <span className="context-pill context-pill--accent">
                          Próxima sugerida: semana {b.nextWeekNumber || 1}
                        </span>
                      )}
                      {b.completedWeeks?.length > 0 && (
                        <span className="context-pill">
                          Semanas cerradas: {b.completedWeeks.join(', ')}
                        </span>
                      )}
                      {b.visitsCount > 0 && (
                        <span className="context-pill">
                          {b.visitsCount} domicilio{b.visitsCount === 1 ? '' : 's'}
                        </span>
                      )}
                    </div>
                  }
                  actions={
                    active ? (
                      <button
                        type="button"
                        className="btn btn--primary btn--block btn--primary-lg"
                        onClick={() => navigate(`/relevamientos/${active.id}`)}
                      >
                        Reanudar relevamiento
                      </button>
                    ) : completed ? (
                      <span
                        className="btn btn--ghost btn--block"
                        aria-disabled="true"
                        style={{ pointerEvents: 'none', opacity: 0.7 }}
                      >
                        Recorrido completo
                      </span>
                    ) : (
                      <button
                        type="button"
                        className="btn btn--primary btn--block btn--primary-lg"
                        onClick={() => openStartModal(b)}
                      >
                        Iniciar relevamiento
                      </button>
                    )
                  }
                />
              );
            })
          ) : (
            <EmptyState message="No tenés manzanas asignadas" />
          )}
        </div>
      </PageContainer>

      {startingFor && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.55)',
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            zIndex: 100,
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setStartingFor(null);
          }}
        >
          <div
            style={{
              background: 'var(--bg-surface, #fff)',
              width: '100%',
              maxWidth: 520,
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,
              padding: 16,
              maxHeight: '90vh',
              overflow: 'auto',
            }}
          >
            <SectionCard
              label={startingFor.code}
              title="¿Qué semana es este relevamiento?"
              noDivider
            >
              <p style={{ margin: '0 0 12px', color: 'var(--text-muted)', fontSize: 14 }}>
                Cada manzana tiene 5 semanas de relevamiento. Elegí cuál vas a hacer ahora.
              </p>
              <ErrorState message={actionError} />
              <RadioGroup
                name="weekChoice"
                columns={5}
                value={String(selectedWeek)}
                onChange={(v) => setSelectedWeek(Number(v))}
                options={[1, 2, 3, 4, 5].map((w) => ({
                  value: String(w),
                  label: `Semana ${w}`,
                  disabled: startingFor.completedWeeks?.includes(w),
                }))}
              />
              {startingFor.completedWeeks?.length > 0 && (
                <p
                  style={{ margin: '12px 0 0', fontSize: 12, color: 'var(--text-muted)' }}
                >
                  Las semanas {startingFor.completedWeeks.join(', ')} ya están cerradas.
                </p>
              )}

              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                  marginTop: 16,
                }}
              >
                <PrimaryButton block large onClick={handleConfirmStart} disabled={busy}>
                  {busy
                    ? 'Iniciando...'
                    : `Iniciar relevamiento — Semana ${selectedWeek || ''}`}
                </PrimaryButton>
                <SecondaryButton block onClick={() => setStartingFor(null)} disabled={busy}>
                  Cancelar
                </SecondaryButton>
              </div>
            </SectionCard>
          </div>
        </div>
      )}
    </>
  );
}
