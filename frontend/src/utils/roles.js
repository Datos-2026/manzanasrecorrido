export const ROLES = {
  ADMIN: 'admin',
  COORDINADOR: 'coordinador',
  RECORREDOR: 'recorredor',
};

export function isAdmin(user) {
  return user?.role === ROLES.ADMIN;
}

export function isCoordinador(user) {
  return user?.role === ROLES.COORDINADOR;
}

export function isRecorredor(user) {
  return user?.role === ROLES.RECORREDOR;
}

export function canManageUsers(user) {
  return isAdmin(user) || isCoordinador(user);
}

export function canManageCommunes(user) {
  return isAdmin(user);
}

export function canManageBlocks(user) {
  return isAdmin(user) || isCoordinador(user);
}

export function canManageAssignments(user) {
  return isAdmin(user) || isCoordinador(user);
}

export function canViewDashboard(user) {
  return isAdmin(user) || isCoordinador(user);
}

export const ROLE_LABELS = {
  admin: 'Administrador',
  coordinador: 'Coordinador',
  recorredor: 'Recorredor',
};
