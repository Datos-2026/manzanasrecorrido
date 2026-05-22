const VARIANTS = {
  realizado: 'status-chip--realizado',
  parcial: 'status-chip--parcial',
  no_realizado: 'status-chip--no_realizado',
  pendiente: 'status-chip--pendiente',
  activo: 'status-chip--activo',
  inactivo: 'status-chip--inactivo',
};

const LABELS = {
  realizado: 'Realizado',
  parcial: 'Parcial',
  no_realizado: 'No realizado',
  pendiente: 'Pendiente',
  activo: 'Activo',
  inactivo: 'Inactivo',
};

export default function StatusChip({ status, label }) {
  const variant = VARIANTS[status] || 'status-chip--pendiente';
  const text = label || LABELS[status] || status;
  return <span className={`status-chip ${variant}`}>{text}</span>;
}

