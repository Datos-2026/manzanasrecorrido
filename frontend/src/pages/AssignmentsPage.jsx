import { useEffect, useState } from 'react';
import { assignmentsApi } from '../api/assignmentsApi';
import { usersApi } from '../api/usersApi';
import { blocksApi } from '../api/blocksApi';
import { todayISO } from '../utils/dates';
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

export default function AssignmentsPage() {
  const [assignments, setAssignments] = useState([]);
  const [users, setUsers] = useState([]);
  const [blocks, setBlocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState({ userId: '', blockId: '', startDate: todayISO() });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [a, u, b] = await Promise.all([
        assignmentsApi.list({ active: 'true' }),
        usersApi.list(),
        blocksApi.list({ active: 'true' }),
      ]);
      setAssignments(a);
      setUsers(u.filter((x) => x.role === 'recorridor' && x.isActive));
      setBlocks(b);
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
      await assignmentsApi.create(form);
      setFormOpen(false);
      setForm({ userId: '', blockId: '', startDate: todayISO() });
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
      <MobileHeader title="Asignaciones" />
      <PageContainer>
        <button type="button" className="filter-toggle" onClick={() => setFormOpen(!formOpen)}>
          {formOpen ? 'Ocultar formulario' : '+ Nueva asignación'}
        </button>

        {formOpen && (
          <SectionCard title="Asignar manzana" noDivider>
            <form onSubmit={handleSubmit}>
              <FormField label="Recorridor" id="user">
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
              <FormField label="Manzana" id="block">
                <select
                  id="block"
                  value={form.blockId}
                  onChange={(e) => setForm({ ...form, blockId: e.target.value })}
                  required
                >
                  <option value="">Seleccionar...</option>
                  {blocks.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.code} — {b.neighborhood || 'sin barrio'}
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
              <PrimaryButton type="submit" block disabled={saving}>
                Asignar
              </PrimaryButton>
            </form>
          </SectionCard>
        )}

        <ErrorState message={error} />
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
                  meta={`Desde ${a.startDate} · ${a.block?.commune?.name || a.block?.neighborhood || ''}`}
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
      </PageContainer>
    </>
  );
}

