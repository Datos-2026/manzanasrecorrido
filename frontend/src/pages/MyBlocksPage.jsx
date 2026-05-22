import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { assignmentsApi } from '../api/assignmentsApi';
import { visitsApi } from '../api/visitsApi';
import { useFetch } from '../hooks/useFetch';
import { getMonday } from '../utils/dates';
import MobileHeader from '../components/layout/MobileHeader';
import PageContainer from '../components/ui/PageContainer';
import EntityCard from '../components/ui/EntityCard';
import StatusChip from '../components/ui/StatusChip';
import PrimaryButton from '../components/ui/PrimaryButton';
import LoadingState from '../components/ui/LoadingState';
import EmptyState from '../components/ui/EmptyState';
import ErrorState from '../components/ui/ErrorState';

export default function MyBlocksPage() {
  const [search, setSearch] = useState('');
  const weekStart = getMonday();

  const { data: blocks, loading, error } = useFetch(() => assignmentsApi.myBlocks(), []);
  const { data: visits } = useFetch(
    () => visitsApi.list({ dateFrom: weekStart }),
    [weekStart]
  );

  const visitByBlock = useMemo(() => {
    const map = {};
    (visits || []).forEach((v) => {
      if (!map[v.blockId]) map[v.blockId] = v;
    });
    return map;
  }, [visits]);

  const filtered = (blocks || []).filter(
    (b) =>
      !search ||
      b.code.toLowerCase().includes(search.toLowerCase()) ||
      (b.neighborhood || '').toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <>
        <MobileHeader title="Mis manzanas" subtitle="Recorridos de la semana" />
        <LoadingState />
      </>
    );
  }

  return (
    <>
      <MobileHeader title="Mis manzanas" subtitle="Recorridos de la semana" />
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
              const visit = visitByBlock[b.id];
              const visited = !!visit;
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
                      <StatusChip status={visited ? 'realizado' : 'pendiente'} />
                    </>
                  }
                  meta={
                    visited
                      ? `Recorrida el ${visit.visitDate}`
                      : `Asignada desde ${b.startDate} · Pendiente esta semana`
                  }
                  actions={
                    <Link
                      to={`/recorridos/nuevo?blockId=${b.id}`}
                      className="btn btn--primary btn--block btn--primary-lg"
                    >
                      {visited ? 'Cargar otro domicilio' : 'Iniciar recorrido'}
                    </Link>
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

