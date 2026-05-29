import { useEffect, useState } from 'react';
import { blocksApi } from '../api/blocksApi';
import { communesApi } from '../api/communesApi';
import { visitsApi } from '../api/visitsApi';
import { useAuth } from '../hooks/useAuth';
import { isAdmin } from '../utils/roles';
import { exportBlockToPdf } from '../utils/pdfExport';
import MobileHeader from '../components/layout/MobileHeader';
import PageContainer from '../components/ui/PageContainer';
import EntityCard from '../components/ui/EntityCard';
import StatusChip from '../components/ui/StatusChip';
import PrimaryButton from '../components/ui/PrimaryButton';
import SecondaryButton from '../components/ui/SecondaryButton';
import FormField from '../components/ui/FormField';
import LoadingState from '../components/ui/LoadingState';
import EmptyState from '../components/ui/EmptyState';
import ErrorState from '../components/ui/ErrorState';

const emptyForm = { code: '', communeId: '', label: '', neighborhood: '' };

export default function BlocksPage() {
  const { user } = useAuth();
  const [blocks, setBlocks] = useState([]);
  const [communes, setCommunes] = useState([]);
  const [search, setSearch] = useState('');
  const [communeFilter, setCommuneFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [exportingId, setExportingId] = useState(null);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const params = { active: 'true' };
      if (communeFilter) params.communeId = communeFilter;
      if (search) params.search = search;
      const [b, c] = await Promise.all([
        blocksApi.list(params),
        isAdmin(user) ? communesApi.list() : Promise.resolve([]),
      ]);
      setBlocks(b);
      setCommunes(c);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [communeFilter]);

  const openCreate = () => {
    setForm({ ...emptyForm, communeId: user.communeId || '' });
    setModal('create');
  };

  const openEdit = (b) => {
    setForm({
      code: b.code,
      communeId: b.communeId,
      label: b.label || '',
      neighborhood: b.neighborhood || '',
    });
    setModal({ type: 'edit', id: b.id });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        label: form.label || null,
        neighborhood: form.neighborhood || null,
      };
      if (modal === 'create') await blocksApi.create(payload);
      else await blocksApi.update(modal.id, payload);
      setModal(null);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async (id) => {
    if (!confirm('¿Desactivar esta manzana?')) return;
    try {
      await blocksApi.remove(id);
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleExportPdf = async (block) => {
    setExportingId(block.id);
    setError('');
    try {
      const visits = await visitsApi.list({ blockId: block.id });
      const detailed = await Promise.all(
        visits.map((v) => visitsApi.get(v.id).catch(() => v))
      );
      const completedWeeks = [
        ...new Set(detailed.map((v) => v.weekNumber).filter(Boolean)),
      ];
      const lastVisitDate = detailed
        .map((v) => v.visitDate)
        .filter(Boolean)
        .sort()
        .reverse()[0];
      exportBlockToPdf({
        block,
        visits: detailed,
        summary: { completedWeeks, lastVisitDate },
      });
    } catch (err) {
      setError('No se pudo exportar la manzana: ' + err.message);
    } finally {
      setExportingId(null);
    }
  };

  return (
    <>
      <MobileHeader title="Inventario de manzanas" />
      <PageContainer>
        <div className="page-header-row">
          <PrimaryButton onClick={openCreate}>+ Nueva</PrimaryButton>
        </div>

        <input
          type="search"
          className="search-input"
          placeholder="Buscar por código..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && load()}
        />

        {isAdmin(user) && (
          <select
            value={communeFilter}
            onChange={(e) => setCommuneFilter(e.target.value)}
            style={{ width: '100%', minHeight: 48, marginBottom: 16 }}
          >
            <option value="">Todas las comunas</option>
            {communes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        )}

        <div style={{ marginBottom: 16 }}>
        <SecondaryButton block onClick={load}>
          Buscar
        </SecondaryButton>
        </div>

        <ErrorState message={error} />
        {loading ? (
          <LoadingState />
        ) : (
          <div className="entity-list-mobile">
            {blocks.length ? (
              blocks.map((b) => (
                <EntityCard
                  key={b.id}
                  top={
                    <>
                      <div>
                        <p className="entity-card__code">{b.code}</p>
                        <p className="entity-card__meta">
                          {b.neighborhood || 'Sin barrio'} · {b.commune?.name}
                        </p>
                      </div>
                      <StatusChip status={b.isActive ? 'activo' : 'inactivo'} />
                    </>
                  }
                  meta={b.label || 'Sin etiqueta'}
                  actions={
                    <>
                      <SecondaryButton block onClick={() => openEdit(b)}>
                        Editar
                      </SecondaryButton>
                      <SecondaryButton
                        block
                        onClick={() => handleExportPdf(b)}
                        disabled={exportingId === b.id}
                      >
                        {exportingId === b.id ? 'Generando PDF...' : 'Exportar PDF'}
                      </SecondaryButton>
                      {b.isActive && (
                        <SecondaryButton block danger onClick={() => handleDeactivate(b.id)}>
                          Desactivar
                        </SecondaryButton>
                      )}
                    </>
                  }
                />
              ))
            ) : (
              <EmptyState />
            )}
          </div>
        )}
      </PageContainer>

      {modal && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
            <h2>{modal === 'create' ? 'Nueva manzana' : 'Editar manzana'}</h2>
            <form onSubmit={handleSubmit}>
              <FormField label="Código" id="code">
                <input
                  id="code"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
                  required
                />
              </FormField>
              {isAdmin(user) && (
                <FormField label="Comuna" id="commune">
                  <select
                    id="commune"
                    value={form.communeId}
                    onChange={(e) => setForm({ ...form, communeId: e.target.value })}
                    required
                  >
                    <option value="">Seleccionar...</option>
                    {communes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </FormField>
              )}
              <FormField label="Etiqueta" id="label">
                <input
                  id="label"
                  value={form.label}
                  onChange={(e) => setForm({ ...form, label: e.target.value })}
                />
              </FormField>
              <FormField label="Barrio" id="nb">
                <input
                  id="nb"
                  value={form.neighborhood}
                  onChange={(e) => setForm({ ...form, neighborhood: e.target.value })}
                />
              </FormField>
              <PrimaryButton type="submit" block disabled={saving}>
                Guardar
              </PrimaryButton>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

