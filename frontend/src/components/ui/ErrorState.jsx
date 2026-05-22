export default function ErrorState({ message }) {
  if (!message) return null;
  return <div className="state-box--error">{message}</div>;
}

