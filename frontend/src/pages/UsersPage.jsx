import { useEffect, useState } from 'react';
import { usersApi } from '../api/usersApi';
import { communesApi } from '../api/communesApi';
import { useAuth } from '../hooks/useAuth';
import { isAdmin } from '../utils/roles';
import { ROLE_LABELS } from '../utils/roles';
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

const emptyForm = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  password: '',
  role: 'recorridor',
  communeId: '',
};

export default function UsersPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [communes, setCommunes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [roleFilter, setRoleFilter] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [u, c] = await Promise.all([
        usersApi.list(),
        isAdmin(user) ? communesApi.list() : Promise.resolve([]),
      ]);
      setUsers(u);
      setCommunes(c);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = roleFilter ? users.filter((u) => u.role === roleFilter) : users;

  const openCreate = () => {
    setForm({ ...emptyForm, communeId: user.communeId || '' });
    setModal('create');
  };

  const openEdit = (u) => {
    setForm({
      firstName: u.firstName,
      lastName: u.lastName,
      email: u.email,
      phone: u.phone || '',
      password: '',
      role: u.role,
      communeId: u.communeId || '',
    });
    setModal({ type: 'edit', id: u.id });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload = { ...form };
      if (!payload.phone) payload.phone = null;
      if (!payload.password) delete payload.password;
      if (payload.role === 'admin') payload.communeId = null;
      if (modal === 'create') await usersApi.create(payload);
      else await usersApi.update(modal.id, payload);
      setModal(null);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async (id) => {
    if (!confirm('¿Desactivar este usuario?')) return;
    try {
      await usersApi.remove(id);
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <>
      <MobileHeader title="Usuarios" />
      <PageContainer>
        <div className="page-header-row">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            style={{ minHeight: 48, flex: 1 }}
          >
            <option value="">Todos los roles</option>
            <option value="recorridor">Recorridor</option>
            <option value="coordinador">Coordinador</option>
            {isAdmin(user) && <option value="admin">Admin</option>}
          </select>
          <PrimaryButton onClick={openCreate}>+ Nuevo</PrimaryButton>
        </div>

        <ErrorState message={error} />
        {loading ? (
          <LoadingState />
        ) : (
          <div className="entity-list-mobile">
            {filtered.length ? (
              filtered.map((u) => (
                <EntityCard
                  key={u.id}
                  top={
                    <>
                      <div>
                        <p className="entity-card__code" style={{ fontSize: '1.05rem' }}>
                          {u.firstName} {u.lastName}
                        </p>
                        <p className="entity-card__meta">{u.email}</p>
                      </div>
                      <StatusChip status={u.isActive ? 'activo' : 'inactivo'} />
                    </>
                  }
                  meta={`${ROLE_LABELS[u.role]} · ${u.commune?.name || 'Sin comuna'}`}
                  actions={
                    <>
                      <SecondaryButton block onClick={() => openEdit(u)}>
                        Editar
                      </SecondaryButton>
                      {u.isActive && (
                        <SecondaryButton block danger onClick={() => handleDeactivate(u.id)}>
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
            <h2>{modal === 'create' ? 'Nuevo usuario' : 'Editar usuario'}</h2>
            <form onSubmit={handleSubmit}>
              <FormField label="Nombre" id="fn">
                <input
                  id="fn"
                  value={form.firstName}
                  onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                  required
                />
              </FormField>
              <FormField label="Apellido" id="ln">
                <input
                  id="ln"
                  value={form.lastName}
                  onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                  required
                />
              </FormField>
              <FormField label="Email" id="em">
                <input
                  id="em"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                />
              </FormField>
              <FormField label="Contraseña" id="pw">
                <input
                  id="pw"
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required={modal === 'create'}
                />
              </FormField>
              {isAdmin(user) && (
                <>
                  <FormField label="Rol" id="role">
                    <select
                      id="role"
                      value={form.role}
                      onChange={(e) => setForm({ ...form, role: e.target.value })}
                    >
                      <option value="recorridor">Recorridor</option>
                      <option value="coordinador">Coordinador</option>
                      <option value="admin">Administrador</option>
                    </select>
                  </FormField>
                  {form.role !== 'admin' && (
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
                </>
              )}
              <PrimaryButton type="submit" block disabled={saving}>
                Guardar
              </PrimaryButton>
              <SecondaryButton type="button" block onClick={() => setModal(null)}>
                Cancelar
              </SecondaryButton>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

