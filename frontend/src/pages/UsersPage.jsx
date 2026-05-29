import { useEffect, useState } from 'react';
import { usersApi } from '../api/usersApi';
import { communesApi } from '../api/communesApi';
import { useAuth } from '../hooks/useAuth';
import { isAdmin, ROLE_LABELS } from '../utils/roles';
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
  role: 'recorredor',
  communeIds: [],
};

function getUserCommuneNames(u) {
  const list = u.communes?.length ? u.communes : u.commune ? [u.commune] : [];
  if (!list.length) return 'Sin comuna';
  if (list.length <= 2) return list.map((c) => c.name).join(', ');
  return `${list.length} comunas`;
}

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
      const [u, c] = await Promise.all([usersApi.list(), communesApi.list()]);
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

  const myCommuneIds = user?.communeIds || (user?.communeId ? [user.communeId] : []);

  const openCreate = () => {
    setForm({
      ...emptyForm,
      communeIds: isAdmin(user) ? [] : [...myCommuneIds],
    });
    setModal('create');
  };

  const openEdit = (u) => {
    const ids = u.communes?.length
      ? u.communes.map((c) => c.id)
      : u.communeId
      ? [u.communeId]
      : [];
    setForm({
      firstName: u.firstName,
      lastName: u.lastName,
      email: u.email,
      phone: u.phone || '',
      password: '',
      role: u.role,
      communeIds: ids,
    });
    setModal({ type: 'edit', id: u.id });
  };

  const toggleCommune = (id) => {
    setForm((f) => {
      const has = f.communeIds.includes(id);
      return {
        ...f,
        communeIds: has ? f.communeIds.filter((x) => x !== id) : [...f.communeIds, id],
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload = { ...form };
      if (!payload.phone) payload.phone = null;
      if (!payload.password) delete payload.password;
      if (payload.role === 'admin') {
        payload.communeIds = [];
      }
      // backend admite communeIds (array) y communeId (legado)
      payload.communeId = payload.communeIds[0] || null;
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

  const selectableCommunes = isAdmin(user)
    ? communes
    : communes.filter((c) => myCommuneIds.includes(c.id));

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
            <option value="recorredor">Recorredor</option>
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
                  meta={`${ROLE_LABELS[u.role]} · ${getUserCommuneNames(u)}`}
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
                  placeholder={modal === 'create' ? '' : 'Dejar vacío para no cambiar'}
                />
              </FormField>
              {isAdmin(user) && (
                <FormField label="Rol" id="role">
                  <select
                    id="role"
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value })}
                  >
                    <option value="recorredor">Recorredor</option>
                    <option value="coordinador">Coordinador</option>
                    <option value="admin">Administrador</option>
                  </select>
                </FormField>
              )}

              {form.role !== 'admin' && (
                <FormField label="Comunas asignadas">
                  <div className="commune-checklist">
                    {selectableCommunes.length === 0 && (
                      <p
                        style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)' }}
                      >
                        No hay comunas disponibles.
                      </p>
                    )}
                    {selectableCommunes.map((c) => {
                      const checked = form.communeIds.includes(c.id);
                      return (
                        <label
                          key={c.id}
                          className={`commune-checklist__item${
                            checked ? ' commune-checklist__item--active' : ''
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleCommune(c.id)}
                          />
                          <span>{c.name}</span>
                        </label>
                      );
                    })}
                  </div>
                  <p style={{ margin: '6px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>
                    Podés asignar más de una comuna por usuario.
                  </p>
                </FormField>
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
