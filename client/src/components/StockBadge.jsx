const LABELS = {
  ok: 'Disponible',
  low: 'Stock bajo',
  out: 'Agotado',
};

export default function StockBadge({ status }) {
  return (
    <span className={`badge badge-${status}`}>
      <span className="dot" />
      {LABELS[status]}
    </span>
  );
}
