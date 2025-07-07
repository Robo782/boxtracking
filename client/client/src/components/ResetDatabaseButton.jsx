import axios from "axios";

export default function ResetDatabaseButton() {
  if (localStorage.getItem("role") !== "admin") return null;

  const handleClick = async () => {
    if (!window.confirm("Bist du sicher, dass du die Datenbank zurücksetzen willst?")) return;
    if (!window.confirm("⚠️ Alle Box-Werte gehen verloren! Trotzdem fortfahren?")) return;

    try {
      await axios.post("/api/admin/reset", {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      alert("Box-Werte wurden zurückgesetzt");
      window.location.reload();
    } catch {
      alert("Fehler beim Zurücksetzen");
    }
  };

  return (
    <button onClick={handleClick}
      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded">
      🔄 DB-Reset
    </button>
  );
}
