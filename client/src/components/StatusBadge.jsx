// client/src/components/StatusBadge.jsx
export default function StatusBadge({ status }) {
  const map = {
    Verfügbar: "success",
    Unterwegs: "accent",
    Rücklauf:  "warning",
    Geprüft:   "info",
  };
  return (
    <span className={`badge badge-sm badge-${map[status] ?? "neutral"}`}>
      {status}
    </span>
  );
}
