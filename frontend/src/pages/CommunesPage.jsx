import { useEffect, useState } from 'react';
import { communesApi } from '../api/communesApi';
import MobileHeader from '../components/layout/MobileHeader';
import PageContainer from '../components/ui/PageContainer';
import EntityCard from '../components/ui/EntityCard';
import PrimaryButton from '../components/ui/PrimaryButton';
import SecondaryButton from '../components/ui/SecondaryButton';
import FormField from '../components/ui/FormField';
import LoadingState from '../components/ui/LoadingState';
import EmptyState from '../components/ui/EmptyState';
import ErrorState from '../components/ui/ErrorState';

const emptyForm = { name: '', code: '', description: '' };

export default function CommunesPage() {
  const [communes, setCommunes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      setCommunes(await communesApi.list());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form, description: form.description || null };
      if (modal === 'create') await communesApi.create(payload);
      else await communesApi.update(modal.id, payload);
      setModal(null);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar esta comuna?')) return;
    try {
      await communesApi.remove(id);
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <>
      <MobileHeader title="Gestión de comunas" />
      <PageContainer>
        <div className="page-header-row">
          <PrimaryButton onClick={() => { setForm(emptyForm); setModal('create'); }}>
            + Nueva comuna
          </PrimaryButton>
        </div>

        <ErrorState message={error} />
        {loading ? (
          <LoadingState />
        ) : (
          <div className="entity-list-mobile">
            {communes.length ? (
              communes.map((c) => (
                <EntityCard
                  key={c.id}
                  top={
                    <>
                      <div>
                        <p className="entity-card__code">{c.code}</p>
                        <p className="entity-card__meta">{c.name}</p>
                      </div>
                    </>
                  }
                  meta={c.description || 'Sin descripción'}
                  actions={
                    <>
                      <SecondaryButton
                        block
                        onClick={() => {
                          setForm({
                            name: c.name,
                            code: c.code,
                            description: c.description || '',
                          });
                          setModal({ type: 'edit', id: c.id });
                        }}
                      >
                        Editar
                      </SecondaryButton>
                      <SecondaryButton block danger onClick={() => handleDelete(c.id)}>
                        Eliminar
                      </SecondaryButton>
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
            <h2>{modal === 'create' ? 'Nueva comuna' : 'Editar comuna'}</h2>
            <form onSubmit={handleSubmit}>
              <FormField label="Nombre" id="name">
                <input
                  id="name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </FormField>
              <FormField label="Código" id="code">
                <input
                  id="code"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
                  required
                />
              </FormField>
              <FormField label="Descripción" id="desc">
                <textarea
                  id="desc"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3}
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

