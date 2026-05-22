export default function StatCard({ label, value, featured }) {
  return (
    <div className={`stat-card ${featured ? 'stat-card--featured' : ''}`}>
      <p className="stat-card__label">{label}</p>
      <p className="stat-card__value">{value}</p>
    </div>
  );
}

