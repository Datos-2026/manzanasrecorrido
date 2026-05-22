export default function FormField({ label, id, children, hint }) {
  return (
    <div className="form-field">
      {label && (
        <label htmlFor={id}>
          {label}
        </label>
      )}
      {children}
      {hint && <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>{hint}</p>}
    </div>
  );
}

