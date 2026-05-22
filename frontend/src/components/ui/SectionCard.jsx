export default function SectionCard({ label, title, action, children, noDivider }) {
  return (
    <section className="section-card">
      {(label || title || action) && (
        <div className={noDivider ? '' : 'section-card__header'}>
          <div>
            {label && <p className="section-card__label">{label}</p>}
            {title && <h2 className="section-card__title">{title}</h2>}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

