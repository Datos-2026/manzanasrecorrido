export default function SecondaryButton({
  children,
  type = 'button',
  block = false,
  sm = false,
  danger = false,
  disabled,
  onClick,
  className = '',
}) {
  const variant = danger ? 'btn--danger' : 'btn--secondary';
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`btn ${variant} ${sm ? 'btn--sm' : ''} ${block ? 'btn--block' : ''} ${className}`}
    >
      {children}
    </button>
  );
}

