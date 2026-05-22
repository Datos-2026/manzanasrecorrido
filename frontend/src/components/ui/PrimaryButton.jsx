export default function PrimaryButton({
  children,
  type = 'button',
  large = false,
  block = false,
  disabled,
  onClick,
  className = '',
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`btn btn--primary ${large ? 'btn--primary-lg' : ''} ${block ? 'btn--block' : ''} ${className}`}
    >
      {children}
    </button>
  );
}

