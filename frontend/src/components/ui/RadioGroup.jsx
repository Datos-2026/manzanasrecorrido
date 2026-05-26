export default function RadioGroup({ name, options, value, onChange, columns = 2 }) {
  const colClass =
    columns === 1
      ? 'radio-grid--full'
      : columns >= 4
      ? 'radio-grid--quad'
      : '';
  return (
    <div className={`radio-grid ${colClass}`}>
      {options.map((opt) => {
        const active = value === opt.value;
        const disabled = !!opt.disabled;
        return (
          <label
            key={opt.value}
            className={`radio-card ${active ? 'radio-card--active' : ''} ${
              disabled ? 'radio-card--disabled' : ''
            }`}
            aria-disabled={disabled || undefined}
          >
            <input
              type="radio"
              name={name}
              value={opt.value}
              checked={active}
              disabled={disabled}
              onChange={() => !disabled && onChange(opt.value)}
            />
            {opt.label}
          </label>
        );
      })}
    </div>
  );
}
