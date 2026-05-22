export default function PageContainer({ children, narrow = false }) {
  return (
    <div className={`page-container ${narrow ? 'page-container--narrow' : ''}`}>{children}</div>
  );
}

