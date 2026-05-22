export default function GpsChip({ coords, error, loading, onRefresh }) {
  if (loading) {
    return (
      <div className="gps-chip">
        <span>Obteniendo ubicación...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="gps-chip gps-chip--error">
        <span>{error}</span>
        <button type="button" onClick={onRefresh}>
          Reintentar
        </button>
      </div>
    );
  }

  if (coords) {
    return (
      <div className="gps-chip gps-chip--ok">
        <span>
          📍 Ubicación capturada{' '}
          <span className="gps-chip__coords">
            {coords.latitude.toFixed(5)}, {coords.longitude.toFixed(5)}
          </span>
          {coords.accuracy && (
            <small style={{ display: 'block', color: 'var(--text-muted)', marginTop: 2 }}>
              Precisión: ±{Math.round(coords.accuracy)} m
            </small>
          )}
        </span>
        <button type="button" onClick={onRefresh}>
          Actualizar
        </button>
      </div>
    );
  }

  return (
    <div className="gps-chip">
      <span>Sin ubicación</span>
      <button type="button" onClick={onRefresh}>
        Obtener ubicación
      </button>
    </div>
  );
}
