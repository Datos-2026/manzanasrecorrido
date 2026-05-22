export default function RadioGroup({ name, options, value, onChange, columns = 2 }) {
  return (
    <div className={`radio-grid ${columns === 1 ? 'radio-grid--full' : ''}`}>
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <label key={opt.value} className={`radio-card ${active ? 'radio-card--active' : ''}`}>
            <input
              type="radio"
              name={name}
              value={opt.value}
              checked={active}
              onChange={() => onChange(opt.value)}
            />
            {opt.label}
          </label>
        );
      })}
    </div>
  );
}
