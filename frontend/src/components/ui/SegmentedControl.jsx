export default function SegmentedControl({ options, value, onChange, variant = 'blue' }) {
  const activeClass = variant === 'yellow' ? 'segmented__btn--active-yellow' : 'segmented__btn--active';
  return (
    <div className="segmented" role="group">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          className={`segmented__btn ${value === opt.value ? activeClass : ''}`}
          onClick={() => onChange(opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

