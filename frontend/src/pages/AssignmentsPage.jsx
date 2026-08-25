import { useEffect, useMemo, useState } from 'react';
import { assignmentsApi } from '../api/assignmentsApi';
import { usersApi } from '../api/usersApi';
import { communesApi } from '../api/communesApi';
import { loadManzanasCatalog, blockToFeature } from '../api/geoApi';
import { todayISO } from '../utils/dates';
import { useAuth } from '../hooks/useAuth';
import { isAdmin } from '../utils/roles';
import MobileHeader from '../components/layout/MobileHeader';
import PageContainer from '../components/ui/PageContainer';
import EntityCard from '../components/ui/EntityCard';
import StatusChip from '../components/ui/StatusChip';
import SectionCard from '../components/ui/SectionCard';
import FormField from '../components/ui/FormField';
import PrimaryButton from '../components/ui/PrimaryButton';
import SecondaryButton from '../components/ui/SecondaryButton';
import LoadingState from '../components/ui/LoadingState';
import EmptyState from '../components/ui/EmptyState';
import ErrorState from '../components/ui/ErrorState';
import BlockMap, { featureKey } from '../components/map/BlockMap';

export default function AssignmentsPage() {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [users, setUsers] = useState([]);
  const [communes, setCommunes] = useState([]);
  const [catalog, setCatalog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mapLoading, setMapLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedFeature, setSelectedFeature] = useState(null);
  const [form, setForm] = useState({
    userId: '',
    communeId: '',
    startDate: todayISO(),
  });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [a, u, c] = await Promise.all([
        assignmentsApi.list({ active: 'true' }),
        usersApi.list(),
        communesApi.list(),
      ]);
      setAssignments(a);
      setUsers(u.filter((x) => x.role === 'recorredor' && x.isActive));
      setCommunes(c);

      const myIds = user?.communeIds || (user?.communeId ? [user.communeId] : []);
      if (!isAdmin(user) && myIds.length && !form.communeId) {
        setForm((f) => ({ ...f, communeId: myIds[0] }));
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let cancelled = false;
    setMapLoading(true);
    loadManzanasCatalog()
      .then((geo) => {
        if (!cancelled) setCatalog(geo);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'No se pudo cargar el mapa');
      })
      .finally(() => {
        if (!cancelled) setMapLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const selectableCommunes = useMemo(() => {
    if (isAdmin(user)) return communes;
    const myIds = user?.communeIds || (user?.communeId ? [user.communeId] : []);
    return communes.filter((c) => myIds.includes(c.id));
  }, [communes, user]);

  const assignedFeatures = useMemo(
    () =>
      assignments
        .map((a) => blockToFeature(a.block))
        .filter(Boolean),
    [assignments]
  );

  const selectedKey = selectedFeature
    ? featureKey(selectedFeature) || selectedFeature.properties?.sm
    : null;

  const handleSelectFeature = (feature) => {
    setSelectedFeature(feature);
    setError('');
  };

  const handleAssign = async (e) => {
    e.preventDefault();
    if (!selectedFeature) {
      setError('Seleccioná una manzana en el mapa');
      return;
    }
    if (!form.userId) {
      setError('Seleccioná un recorredor');
      return;
    }
    if (!form.communeId) {
      setError('Seleccioná la comuna de la manzana');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const props = selectedFeature.properties || {};
      const code = props.sm || props.nombre || `MANZ-${props.id}`;
      await assignmentsApi.create({
        userId: form.userId,
        startDate: form.startDate,
        cadastral: {
          cadastralId: props.id,
          code: String(code),
          label: props.nombre || code,
          communeId: form.communeId,
          geometry: selectedFeature.geometry,
        },
      });
      setSelectedFeature(null);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async (id) => {
    if (!confirm('¿Desactivar esta asignación?')) return;
    try {
      await assignmentsApi.remove(id);
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <>
      <MobileHeader title="Asignaciones" subtitle="Seleccioná manzanas en el mapa" />
      <PageContainer>
        <ErrorState message={error} />

        <div className="assignments-layout">
          <div className="assignments-layout__map">
            <SectionCard label="Mapa" title="Manzanas catastrales CABA" noDivider>
              {mapLoading ? (
                <LoadingState text="Cargando mapa…" />
              ) : (
                <BlockMap
                  catalogGeoJson={catalog}
                  assignedFeatures={assignedFeatures}
                  selectedKey={selectedKey}
                  onSelectFeature={handleSelectFeature}
                  height={440}
                />
              )}
              <div className="map-legend">
                <span className="map-legend__item">
                  <span
                    className="map-legend__swatch"
                    style={{ background: 'rgba(0,122,167,0.25)' }}
                  />
                  Catálogo
                </span>
                <span className="map-legend__item">
                  <span
                    className="map-legend__swatch"
                    style={{ background: 'rgba(46,204,113,0.45)' }}
                  />
                  Ya asignada
                </span>
                <span className="map-legend__item">
                  <span
                    className="map-legend__swatch"
                    style={{ background: '#ffe07d' }}
                  />
                  Seleccionada
                </span>
              </div>
            </SectionCard>
          </div>

          <div className="assignments-layout__panel">
            <SectionCard title="Nueva asignación" noDivider>
              <form onSubmit={handleAssign}>
                <FormField label="Recorredor" id="user">
                  <select
                    id="user"
                    value={form.userId}
                    onChange={(e) => setForm({ ...form, userId: e.target.value })}
                    required
                  >
                    <option value="">Seleccionar...</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.firstName} {u.lastName}
                      </option>
                    ))}
                  </select>
                </FormField>

                <FormField label="Comuna de la manzana" id="commune">
                  <select
                    id="commune"
                    value={form.communeId}
                    onChange={(e) => setForm({ ...form, communeId: e.target.value })}
                    required
                  >
                    <option value="">Seleccionar...</option>
                    {selectableCommunes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </FormField>

                <FormField label="Fecha inicio" id="start">
                  <input
                    id="start"
                    type="date"
                    value={form.startDate}
                    onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                    required
                  />
                </FormField>

                {selectedFeature ? (
                  <div className="assignments-selected">
                    <strong>Manzana seleccionada:</strong>{' '}
                    {selectedFeature.properties?.sm ||
                      selectedFeature.properties?.nombre ||
                      `#${selectedFeature.properties?.id}`}
                    <div style={{ marginTop: 6 }}>
                      <SecondaryButton
                        type="button"
                        onClick={() => setSelectedFeature(null)}
                      >
                        Quitar selección
                      </SecondaryButton>
                    </div>
                  </div>
                ) : (
                  <p style={{ margin: '0 0 12px', fontSize: 13, color: 'var(--text-muted)' }}>
                    Hacé click en una manzana del mapa para seleccionarla.
                  </p>
                )}

                <PrimaryButton type="submit" block disabled={saving || !selectedFeature}>
                  {saving ? 'Asignando…' : 'Asignar manzana'}
                </PrimaryButton>
              </form>
            </SectionCard>

            <h2 className="page-title" style={{ fontSize: '1.1rem', marginTop: 8 }}>
              Asignaciones activas
            </h2>
            {loading ? (
              <LoadingState />
            ) : (
              <div className="entity-list-mobile">
                {assignments.length ? (
                  assignments.map((a) => (
                    <EntityCard
                      key={a.id}
                      top={
                        <>
                          <div>
                            <p className="entity-card__code">{a.block?.code}</p>
                            <p className="entity-card__meta">
                              {a.user?.firstName} {a.user?.lastName}
                            </p>
                          </div>
                          <StatusChip status="activo" />
                        </>
                      }
                      meta={`Desde ${a.startDate} · ${a.block?.commune?.name || ''}`}
                      actions={
                        <SecondaryButton block danger onClick={() => handleDeactivate(a.id)}>
                          Desactivar
                        </SecondaryButton>
                      }
                    />
                  ))
                ) : (
                  <EmptyState message="No hay asignaciones activas" />
                )}
              </div>
            )}
          </div>
        </div>
      </PageContainer>
    </>
  );
}
