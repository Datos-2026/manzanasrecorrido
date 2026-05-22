export default function EntityCard({ top, meta, children, actions }) {
  return (
    <article className="entity-card">
      <div className="entity-card__top">{top}</div>
      {meta && <p className="entity-card__meta">{meta}</p>}
      {children}
      {actions && <div className="entity-card__actions">{actions}</div>}
    </article>
  );
}

