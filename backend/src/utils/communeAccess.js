/**
 * Helpers de control de acceso por comuna.
 * Un coordinador puede tener múltiples comunas asignadas.
 */

function getUserCommuneIds(user) {
  if (!user) return [];
  if (Array.isArray(user.communeIds) && user.communeIds.length) return user.communeIds;
  if (user.communeId) return [user.communeId];
  return [];
}

function isAllowedCommune(user, communeId) {
  if (!user) return false;
  if (user.role === 'admin') return true;
  return getUserCommuneIds(user).includes(communeId);
}

module.exports = {
  getUserCommuneIds,
  isAllowedCommune,
};
