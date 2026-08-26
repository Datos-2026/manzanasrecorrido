import { useEffect, useMemo, useState } from 'react';
import { assignmentsApi } from '../api/assignmentsApi';
import { usersApi } from '../api/usersApi';
import { communesApi } from '../api/communesApi';
import { loadManzanasCatalog, loadBarriosCatalog, blockToFeature } from '../api/geoApi';
import { todayISO } from '../utils/dates';
import { useAuth } from '../hooks/useAuth';
import { isAdmin } from '../utils/roles';
import {
  buildBlockCode,
  communeNumberFromCode,
  filterFeaturesByPolygons,
} from '../utils/geoFilter';
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

function barrioCommuneNumber(feature) {
  const raw = feature?.properties?.COMUNA;
  if (raw == null) return null;
  return String(parseInt(String(raw), 10));
}

export default function AssignmentsPage() {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [users, setUsers] = useState([]);
  const [communes, setCommunes] = useState([]);
  const [barriosGeo, setBarriosGeo] = useState(null);
  const [fullCatalog, setFullCatalog] = useState(null);
  const [filteredCatalog, setFilteredCatalog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mapLoading, setMapLoading] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [error, setError] = useState('');
  const [selectedFeatures, setSelectedFeatures] = useState([]);
  const [filters, setFilters] = useState({
    communeId: '',
    barrio: '',
  });
  const [form, setForm] = useState({
    userId: '',
    startDate: todayISO(),
  });
  const [saving, setSaving] = useState(false);

  const selectableCommunes = useMemo(() => {
    if (isAdmin(user)) return communes;
    const myIds = user?.communeIds || (user?.communeId ? [user.communeId] : []);
    return communes.filter((c) => myIds.includes(c.id));
  }, [communes, user]);

  const selectedCommune = useMemo(
    () => selectableCommunes.find((c) => c.id === filters.communeId) || null,
    [selectableCommunes, filters.communeId]
  );

  const communeNumber = useMemo(
    () => communeNumberFromCode(selectedCommune?.code || selectedCommune?.name),
    [selectedCommune]
  );

  const barriosForCommune = useMemo(() => {
    if (!barriosGeo?.features || !communeNumber) return [];
    const names = barriosGeo.features
      .filter((f) => barrioCommuneNumber(f) === communeNumber)
      .map((f) => f.properties?.BARRIO)
      .filter(Boolean);
    return [...new Set(names)].sort((a, b) => a.localeCompare(b, 'es'));
  }, [barriosGeo, communeNumber]);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [a, u, c, barrios] = await Promise.all([
        assignmentsApi.list({ active: 'true' }),
        usersApi.list(),
        communesApi.list(),
        loadBarriosCatalog(),
      ]);
      setAssignments(a);
      setUsers(u.filter((x) => x.role === 'recorredor' && x.isActive));
      setCommunes(c);
      setBarriosGeo(barrios);

      const myIds = user?.communeIds || (user?.communeId ? [user.communeId] : []);
      if (!isAdmin(user) && myIds.length === 1 && !filters.communeId) {
        setFilters((f) => ({ ...f, communeId: myIds[0] }));
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

  const assignedFeatures = useMemo(
    () => assignments.map((a) => blockToFeature(a.block)).filter(Boolean),
    [assignments]
  );

  const assignedInScope = useMemo(() => {
    if (!filteredCatalog) return [];
    const codes = new Set(
      (filteredCatalog.features || []).map((f) =>
        buildBlockCode(communeNumber, f.properties || {})
      )
    );
    return assignedFeatures.filter(
      (f) => codes.has(f.properties?.code) || f.properties?.code?.startsWith(`${communeNumber} -`)
    );
  }, [assignedFeatures, filteredCatalog, communeNumber]);

  const selectedKeys = useMemo(
    () =>
      selectedFeatures
        .map((f) => featureKey(f) || f.properties?.sm)
        .filter((k) => k != null && k !== '')
        .map(String),
    [selectedFeatures]
  );

  const handleChangeCommune = (communeId) => {
    setFilters({ communeId, barrio: '' });
    setMapReady(false);
    setFilteredCatalog(null);
    setSelectedFeatures([]);
    setError('');
  };

  const handleChangeBarrio = (barrio) => {
    setFilters((f) => ({ ...f, barrio }));
    setMapReady(false);
    setFilteredCatalog(null);
    setSelectedFeatures([]);
    setError('');
  };

  const handleApplyFilters = async () => {
    if (!filters.communeId || !communeNumber) {
      setError('Seleccioná una comuna');
      return;
    }
    if (!filters.barrio) {
      setError('Seleccioná un barrio para acotar el mapa');
      return;
    }

    setMapLoading(true);
    setError('');
    setSelectedFeatures([]);
    try {
      const catalog = fullCatalog || (await loadManzanasCatalog());
      if (!fullCatalog) setFullCatalog(catalog);

      const barrioFeatures = (barriosGeo?.features || []).filter(
        (f) =>
          barrioCommuneNumber(f) === communeNumber &&
          f.properties?.BARRIO === filters.barrio
      );
      const polygons = barrioFeatures.map((f) => f.geometry).filter(Boolean);
      if (!polygons.length) {
        throw new Error('No se encontró geometría para ese barrio');
      }

      const features = filterFeaturesByPolygons(catalog.features || [], polygons);
      setFilteredCatalog({
        type: 'FeatureCollection',
        features,
      });
      setMapReady(true);
      if (!features.length) {
        setError('No hay manzanas catastrales dentro de ese barrio');
      }
    } catch (err) {
      setError(err.message || 'No se pudo filtrar el mapa');
      setMapReady(false);
      setFilteredCatalog(null);
    } finally {
      setMapLoading(false);
    }
  };

  const handleSelectFeature = (feature) => {
    const key = String(featureKey(feature) || feature.properties?.sm || '');
    if (!key) return;
    setSelectedFeatures((prev) => {
      const exists = prev.some(
        (f) => String(featureKey(f) || f.properties?.sm || '') === key
      );
      if (exists) {
        return prev.filter(
          (f) => String(featureKey(f) || f.properties?.sm || '') !== key
        );
      }
      return [...prev, feature];
    });
    setError('');
  };

  const removeSelectedFeature = (key) => {
    setSelectedFeatures((prev) =>
      prev.filter((f) => String(featureKey(f) || f.properties?.sm || '') !== String(key))
    );
  };

  const handleAssign = async (e) => {
    e.preventDefault();
    if (!selectedFeatures.length) {
      setError('Seleccioná al menos una manzana en el mapa');
      return;
    }
    if (!form.userId) {
      setError('Seleccioná un recorredor');
      return;
    }
    if (!filters.communeId) {
      setError('Seleccioná la comuna');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const results = await Promise.allSettled(
        selectedFeatures.map((feature) => {
          const props = feature.properties || {};
          const code = buildBlockCode(communeNumber, props);
          return assignmentsApi.create({
            userId: form.userId,
            startDate: form.startDate,
            cadastral: {
              cadastralId: props.id,
              code,
              label: props.nombre || code,
              neighborhood: filters.barrio || null,
              communeId: filters.communeId,
              geometry: feature.geometry,
            },
          });
        })
      );

      const failed = results.filter((r) => r.status === 'rejected');
      const ok = results.length - failed.length;
      setSelectedFeatures([]);
      await load();

      if (failed.length && ok === 0) {
        setError(failed[0].reason?.message || 'No se pudieron asignar las manzanas');
      } else if (failed.length) {
        setError(
          `Se asignaron ${ok} manzana${ok === 1 ? '' : 's'}. ${failed.length} no se pudieron asignar (quizá ya estaban asignadas a esa persona).`
        );
      }
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
      <MobileHeader title="Asignaciones" subtitle="Filtrá por comuna y barrio, luego asigná" />
      <PageContainer>
        <ErrorState message={error} />

        <SectionCard label="Paso 1" title="Criterios de búsqueda" noDivider>
          <div className="filter-bar">
            <FormField label="Comuna" id="filter-commune">
              <select
                id="filter-commune"
                value={filters.communeId}
                onChange={(e) => handleChangeCommune(e.target.value)}
                required
              >
                <option value="">Seleccionar comuna...</option>
                {selectableCommunes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Barrio" id="filter-barrio">
              <select
                id="filter-barrio"
                value={filters.barrio}
                onChange={(e) => handleChangeBarrio(e.target.value)}
                disabled={!filters.communeId}
                required
              >
                <option value="">
                  {filters.communeId ? 'Seleccionar barrio...' : 'Primero elegí comuna'}
                </option>
                {barriosForCommune.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </FormField>
          </div>
          <PrimaryButton
            type="button"
            block
            onClick={handleApplyFilters}
            disabled={!filters.communeId || !filters.barrio || mapLoading}
          >
            {mapLoading ? 'Cargando manzanas…' : 'Mostrar manzanas en el mapa'}
          </PrimaryButton>
          <p style={{ margin: '8px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>
            El código de cada manzana será:{' '}
            <strong>
              {communeNumber || 'Nº comuna'} - Nº manzana
            </strong>
          </p>
        </SectionCard>

        <div className="assignments-layout">
          <div className="assignments-layout__map">
            <SectionCard
              label="Paso 2"
              title={
                mapReady
                  ? `Manzanas · ${selectedCommune?.name || ''} · ${filters.barrio}`
                  : 'Mapa'
              }
              noDivider
            >
              {!mapReady && !mapLoading && (
                <EmptyState message="Elegí comuna y barrio, y tocá “Mostrar manzanas en el mapa”." />
              )}
              {mapLoading && <LoadingState text="Filtrando manzanas del barrio…" />}
              {mapReady && filteredCatalog && (
                <>
                  <p style={{ margin: '0 0 8px', fontSize: 13, color: 'var(--text-muted)' }}>
                    {filteredCatalog.features.length} manzana
                    {filteredCatalog.features.length === 1 ? '' : 's'} en el mapa. Hacé click
                    para seleccionar varias (otro click las quita).
                    {selectedFeatures.length > 0
                      ? ` · ${selectedFeatures.length} seleccionada${
                          selectedFeatures.length === 1 ? '' : 's'
                        }`
                      : ''}
                  </p>
                  <BlockMap
                    catalogGeoJson={filteredCatalog}
                    assignedFeatures={assignedInScope.length ? assignedInScope : assignedFeatures}
                    selectedKeys={selectedKeys}
                    onSelectFeature={handleSelectFeature}
                    height={440}
                  />
                  <div className="map-legend">
                    <span className="map-legend__item">
                      <span
                        className="map-legend__swatch"
                        style={{ background: 'rgba(0,122,167,0.25)' }}
                      />
                      Catálogo filtrado
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
                </>
              )}
            </SectionCard>
          </div>

          <div className="assignments-layout__panel">
            <SectionCard title="Paso 3 · Asignar a recorredor" noDivider>
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

                <FormField label="Fecha inicio" id="start">
                  <input
                    id="start"
                    type="date"
                    value={form.startDate}
                    onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                    required
                  />
                </FormField>

                {selectedFeatures.length ? (
                  <div className="assignments-selected">
                    <div>
                      <strong>
                        {selectedFeatures.length} manzana
                        {selectedFeatures.length === 1 ? '' : 's'} seleccionada
                        {selectedFeatures.length === 1 ? '' : 's'}
                      </strong>
                      {' · '}
                      {filters.barrio}
                    </div>
                    <ul
                      style={{
                        margin: '8px 0 0',
                        padding: 0,
                        listStyle: 'none',
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: 6,
                      }}
                    >
                      {selectedFeatures.map((feature) => {
                        const key = String(featureKey(feature) || feature.properties?.sm || '');
                        const code = buildBlockCode(communeNumber, feature.properties || {});
                        return (
                          <li key={key}>
                            <button
                              type="button"
                              onClick={() => removeSelectedFeature(key)}
                              title="Quitar de la selección"
                              style={{
                                border: '1px solid var(--border, #cfd8dc)',
                                background: '#fff8e1',
                                borderRadius: 999,
                                padding: '4px 10px',
                                fontSize: 12,
                                cursor: 'pointer',
                              }}
                            >
                              {code} ×
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                    <div style={{ marginTop: 8 }}>
                      <SecondaryButton
                        type="button"
                        onClick={() => setSelectedFeatures([])}
                      >
                        Limpiar selección
                      </SecondaryButton>
                    </div>
                  </div>
                ) : (
                  <p style={{ margin: '0 0 12px', fontSize: 13, color: 'var(--text-muted)' }}>
                    {mapReady
                      ? 'Hacé click en una o más manzanas del mapa. Podés asignar varias al mismo recorredor.'
                      : 'Primero mostrá el mapa con los filtros.'}
                  </p>
                )}

                <PrimaryButton
                  type="submit"
                  block
                  disabled={saving || !selectedFeatures.length || !mapReady}
                >
                  {saving
                    ? 'Asignando…'
                    : selectedFeatures.length > 1
                      ? `Asignar ${selectedFeatures.length} manzanas al recorredor`
                      : 'Asignar manzana al recorredor'}
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
                      meta={`Desde ${a.startDate} · ${a.block?.commune?.name || ''}${
                        a.block?.neighborhood ? ` · ${a.block.neighborhood}` : ''
                      }`}
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
