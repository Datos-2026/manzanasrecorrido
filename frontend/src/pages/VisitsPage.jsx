import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { visitsApi } from '../api/visitsApi';
import { usersApi } from '../api/usersApi';
import { blocksApi } from '../api/blocksApi';
import { communesApi } from '../api/communesApi';
import { useAuth } from '../hooks/useAuth';
import { canManageAssignments } from '../utils/roles';
import { formatDate } from '../utils/dates';
import MobileHeader from '../components/layout/MobileHeader';
import PageContainer from '../components/ui/PageContainer';
import EntityCard from '../components/ui/EntityCard';
import StatusChip from '../components/ui/StatusChip';
import SecondaryButton from '../components/ui/SecondaryButton';
import LoadingState from '../components/ui/LoadingState';
import EmptyState from '../components/ui/EmptyState';
import ErrorState from '../components/ui/ErrorState';

export default function VisitsPage() {
  const { user } = useAuth();
  const [visits, setVisits] = useState([]);
  const [users, setUsers] = useState([]);
  const [blocks, setBlocks] = useState([]);
  const [communes, setCommunes] = useState([]);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    userId: '',
    blockId: '',
    communeId: '',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (filters.dateFrom) params.dateFrom = filters.dateFrom;
      if (filters.dateTo) params.dateTo = filters.dateTo;
      if (filters.userId) params.userId = filters.userId;
      if (filters.blockId) params.blockId = filters.blockId;
      if (filters.communeId) params.communeId = filters.communeId;

      const promises = [visitsApi.list(params)];
      if (canManageAssignments(user)) {
        promises.push(usersApi.list(), blocksApi.list({ active: 'true' }), communesApi.list());
      }
      const results = await Promise.all(promises);
      setVisits(results[0]);
      if (results[1]) {
        setUsers(results[1].filter((u) => u.role === 'recorredor'));
        setBlocks(results[2]);
        setCommunes(results[3]);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const hygieneSummary = (h) => {
    if (!h) return 'Sin observaciones';
    const items = [];
    if (h.criticalPoint) items.push('Punto crítico');
    if (h.bulkyWaste) items.push('Voluminosos');
    if (h.overflowingContainers) items.push('Contenedor desbordado');
    return items.length ? items.join(' · ') : 'Sin novedades';
  };

  return (
    <>
      <MobileHeader
        title="Historial de recorridos"
        action={
          user.role === 'recorredor' ? (
            <Link to="/recorridos/nuevo" className="btn btn--primary btn--sm">
              + Nuevo
            </Link>
          ) : null
        }
      />
      <PageContainer>
        <button
          type="button"
          className="filter-toggle"
          onClick={() => setFiltersOpen(!filtersOpen)}
        >
          Filtros {filtersOpen ? '▲' : '▼'}
        </button>

        {filtersOpen && (
          <div className="filter-bar">
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
              aria-label="Desde"
            />
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
              aria-label="Hasta"
            />
            {canManageAssignments(user) && (
              <>
                <select
                  value={filters.userId}
                  onChange={(e) => setFilters({ ...filters, userId: e.target.value })}
                >
                  <option value="">Todos los recorredores</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.firstName} {u.lastName}
                    </option>
                  ))}
                </select>
                <select
                  value={filters.blockId}
                  onChange={(e) => setFilters({ ...filters, blockId: e.target.value })}
                >
                  <option value="">Todas las manzanas</option>
                  {blocks.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.code}
                    </option>
                  ))}
                </select>
                {user.role === 'admin' && (
                  <select
                    value={filters.communeId}
                    onChange={(e) => setFilters({ ...filters, communeId: e.target.value })}
                  >
                    <option value="">Todas las comunas</option>
                    {communes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                )}
              </>
            )}
            <SecondaryButton block onClick={load}>
              Aplicar filtros
            </SecondaryButton>
          </div>
        )}

        <ErrorState message={error} />

        {loading ? (
          <LoadingState />
        ) : (
          <div className="entity-list-mobile">
            {visits.length ? (
              visits.map((v) => (
                <EntityCard
                  key={v.id}
                  top={
                    <>
                      <div>
                        <p className="entity-card__code">{v.block?.code}</p>
                        <p className="entity-card__meta">{formatDate(v.visitDate)}</p>
                      </div>
                      <StatusChip status={v.status} />
                    </>
                  }
                  meta={
                    <>
                      {canManageAssignments(user) && (
                        <span>
                          {v.user?.firstName} {v.user?.lastName}
                          <br />
                        </span>
                      )}
                      {hygieneSummary(v.hygieneObservation)}
                    </>
                  }
                  actions={
                    <Link to={`/recorridos/${v.id}`} className="btn btn--secondary btn--block">
                      Ver detalle
                    </Link>
                  }
                />
              ))
            ) : (
              <EmptyState message="No hay recorridos registrados" />
            )}
          </div>
        )}
      </PageContainer>
    </>
  );
}
