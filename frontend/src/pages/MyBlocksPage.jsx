import { useState } from 'react';
import { Link } from 'react-router-dom';
import { assignmentsApi } from '../api/assignmentsApi';
import { useFetch } from '../hooks/useFetch';
import MobileHeader from '../components/layout/MobileHeader';
import PageContainer from '../components/ui/PageContainer';
import EntityCard from '../components/ui/EntityCard';
import StatusChip from '../components/ui/StatusChip';
import LoadingState from '../components/ui/LoadingState';
import EmptyState from '../components/ui/EmptyState';
import ErrorState from '../components/ui/ErrorState';

export default function MyBlocksPage() {
  const [search, setSearch] = useState('');

  const { data: blocks, loading, error } = useFetch(() => assignmentsApi.myBlocks(), []);

  const filtered = (blocks || []).filter(
    (b) =>
      !search ||
      b.code.toLowerCase().includes(search.toLowerCase()) ||
      (b.neighborhood || '').toLowerCase().includes(search.toLowerCase())
  );

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
              const week = b.nextWeekNumber || 1;
              const status = completed
                ? 'realizado'
                : b.visitsCount > 0
                ? 'parcial'
                : 'pendiente';
              const buttonLabel = completed
                ? 'Recorrido completo'
                : b.visitsCount === 0
                ? 'Iniciar relevamiento'
                : `Cargar semana ${week}`;

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
                      <span className="context-pill context-pill--accent">
                        {completed ? 'Cerrada (5/5)' : `Próxima: semana ${week} de 5`}
                      </span>
                      {b.visitsCount > 0 && (
                        <span className="context-pill">
                          {b.visitsCount} relevamiento{b.visitsCount === 1 ? '' : 's'} cargado
                          {b.visitsCount === 1 ? '' : 's'}
                        </span>
                      )}
                      {b.lastVisitDate && (
                        <span className="context-pill">Último: {b.lastVisitDate}</span>
                      )}
                    </div>
                  }
                  actions={
                    completed ? (
                      <span
                        className="btn btn--ghost btn--block"
                        aria-disabled="true"
                        style={{ pointerEvents: 'none', opacity: 0.7 }}
                      >
                        {buttonLabel}
                      </span>
                    ) : (
                      <Link
                        to={`/recorridos/nuevo?blockId=${b.id}`}
                        className="btn btn--primary btn--block btn--primary-lg"
                      >
                        {buttonLabel}
                      </Link>
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
    </>
  );
}
