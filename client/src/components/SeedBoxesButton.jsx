import axios from "axios";

export default function SeedBoxesButton() {
  if (localStorage.getItem("role") !== "admin") return null;

  const seed = async () => {
    if (!window.confirm("Grundbestand (PU-S-01..20 & PU-M-01..40) wirklich anlegen?")) return;

    try {
      await axios.post("/api/admin/seed-boxes", {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      alert("Boxen wurden angelegt.");
      window.location.reload();
    } catch {
      alert("Fehler beim Anlegen der Boxen");
    }
  };

  return (
    <button onClick={seed}
      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded">
      ➕ Grundbestand anlegen
    </button>
  );
}
