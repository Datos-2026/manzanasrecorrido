import { useEffect, useState } from 'react';
import { dashboardApi } from '../api/dashboardApi';
import { communesApi } from '../api/communesApi';
import { useAuth } from '../hooks/useAuth';
import { getMonday } from '../utils/dates';
import { isAdmin } from '../utils/roles';
import { ROLE_LABELS } from '../utils/roles';
import MobileHeader from '../components/layout/MobileHeader';
import PageContainer from '../components/ui/PageContainer';
import StatCard from '../components/ui/StatCard';
import SectionCard from '../components/ui/SectionCard';
import EntityCard from '../components/ui/EntityCard';
import StatusChip from '../components/ui/StatusChip';
import LoadingState from '../components/ui/LoadingState';
import EmptyState from '../components/ui/EmptyState';
import ErrorState from '../components/ui/ErrorState';

export default function DashboardPage() {
  const { user } = useAuth();
  const [weekStart, setWeekStart] = useState(getMonday());
  const [communeId, setCommuneId] = useState('');
  const [communes, setCommunes] = useState([]);
  const [weekly, setWeekly] = useState(null);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isAdmin(user)) {
      communesApi.list().then(setCommunes).catch(() => {});
    }
  }, [user]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const params = { weekStart };
        if (communeId) params.communeId = communeId;
        const [w, s] = await Promise.all([
          dashboardApi.weekly(params),
          dashboardApi.summary(communeId ? { communeId } : {}),
        ]);
        setWeekly(w);
        setSummary(s);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [weekStart, communeId]);

  const subtitle = user?.commune?.name || (isAdmin(user) ? 'Todas las comunas' : ROLE_LABELS[user?.role]);

  if (loading) {
    return (
      <>
        <MobileHeader title="Cobertura semanal" subtitle={subtitle} />
        <LoadingState />
      </>
    );
  }

  return (
    <>
      <MobileHeader title="Cobertura semanal" subtitle={subtitle} />
      <PageContainer>
        <ErrorState message={error} />

        <div className="filter-bar">
          <input
            type="date"
            value={weekStart}
            onChange={(e) => setWeekStart(e.target.value)}
            aria-label="Semana desde"
          />
          {isAdmin(user) && (
            <select value={communeId} onChange={(e) => setCommuneId(e.target.value)}>
              <option value="">Todas las comunas</option>
              {communes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          )}
        </div>

        {weekly && (
          <p className="page-subtitle">
            Semana {weekly.weekStart} al {weekly.weekEnd}
          </p>
        )}

        <div className="stats-grid">
          <div className="stat-card stat-card--featured">
            <p className="stat-card__label">Cobertura semanal</p>
            <p className="stat-card__value">{weekly?.coveragePercentage ?? 0}%</p>
            <div className="progress-bar">
              <div
                className="progress-bar__fill"
                style={{ width: `${weekly?.coveragePercentage ?? 0}%` }}
              />
            </div>
          </div>
          <StatCard label="Asignadas" value={weekly?.assignedBlocks ?? 0} />
          <StatCard label="Recorridas" value={weekly?.visitedBlocks ?? 0} />
          <StatCard label="Pendientes" value={weekly?.pendingBlocks ?? 0} />
        </div>

        {summary && (
          <SectionCard label="Indicadores" title="Resumen del mes">
            <p style={{ margin: 0, fontSize: 14, color: 'var(--text-muted)' }}>
              Puntos críticos detectados: <strong>{summary.criticalPoints}</strong> · Recorridos del
              mes: <strong>{summary.visitsThisMonth}</strong>
            </p>
          </SectionCard>
        )}

        <h2 className="page-title" style={{ fontSize: '1.125rem' }}>
          Por recorridor
        </h2>
        <div className="entity-list-mobile">
          {weekly?.byUser?.length ? (
            weekly.byUser.map((u) => (
              <EntityCard
                key={u.userId}
                top={
                  <>
                    <div>
                      <p className="entity-card__code" style={{ fontSize: '1.1rem' }}>
                        {u.name}
                      </p>
                    </div>
                    <StatusChip
                      status={u.coveragePercentage >= 80 ? 'realizado' : u.coveragePercentage > 0 ? 'parcial' : 'pendiente'}
                      label={`${u.coveragePercentage}%`}
                    />
                  </>
                }
                meta={`${u.visitedBlocks} de ${u.assignedBlocks} manzanas · ${u.pendingBlocks} pendientes`}
              />
            ))
          ) : (
            <EmptyState message="Sin asignaciones en esta semana" />
          )}
        </div>

        <h2 className="page-title" style={{ fontSize: '1.125rem', marginTop: 24 }}>
          Por manzana
        </h2>
        <div className="entity-list-mobile">
          {weekly?.byBlock?.length ? (
            weekly.byBlock.map((b) => (
              <EntityCard
                key={b.blockId}
                top={
                  <>
                    <div>
                      <p className="entity-card__code">{b.code}</p>
                      <p className="entity-card__meta">{b.assignedTo}</p>
                    </div>
                    <StatusChip status={b.visited ? 'realizado' : 'pendiente'} />
                  </>
                }
                meta={
                  b.lastVisitDate
                    ? `Último recorrido: ${b.lastVisitDate}${b.hasCriticalPoint ? ' · Punto crítico' : ''}`
                    : 'Sin recorrido esta semana'
                }
              />
            ))
          ) : (
            <EmptyState />
          )}
        </div>

        <div className="data-table-wrap">
          <SectionCard title="Vista tabla — recorridores">
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-soft)' }}>
                  <th style={{ textAlign: 'left', padding: 8 }}>Recorridor</th>
                  <th>Asig.</th>
                  <th>Rec.</th>
                  <th>%</th>
                </tr>
              </thead>
              <tbody>
                {weekly?.byUser?.map((u) => (
                  <tr key={u.userId} style={{ borderBottom: '1px solid var(--border-soft)' }}>
                    <td style={{ padding: 8 }}>{u.name}</td>
                    <td style={{ textAlign: 'center' }}>{u.assignedBlocks}</td>
                    <td style={{ textAlign: 'center' }}>{u.visitedBlocks}</td>
                    <td style={{ textAlign: 'center' }}>{u.coveragePercentage}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </SectionCard>
        </div>
      </PageContainer>
    </>
  );
}

