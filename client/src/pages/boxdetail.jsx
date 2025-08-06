import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../utils/api";

export default function BoxDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [inspector, setInspector] = useState("");
  const [damaged, setDamaged] = useState(false);
  const [check1, setCheck1] = useState(false);
  const [check2, setCheck2] = useState(false);
  const [check3, setCheck3] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!inspector) {
      setError("Bitte Prüfer-Kürzel eingeben.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await api.patch(`/boxes/${id}/nextStatus`, {
        inspector,
        damaged,
        checklist1: check1,
        checklist2: check2,
        checklist3: check3,
      });

      navigate("/boxes");
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Fehler beim Speichern");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-6 bg-gray-800 text-white rounded shadow mt-10">
      <h2 className="text-2xl font-bold mb-4">Prüfung abschließen</h2>

      <div className="mb-4">
        <label className="block mb-1">Prüfer-Kürzel</label>
        <input
          type="text"
          className="w-full p-2 rounded bg-gray-700 text-white"
          value={inspector}
          onChange={(e) => setInspector(e.target.value)}
        />
      </div>

      <div className="mb-4 space-y-2">
        <label className="block font-semibold">Checkliste:</label>
        <label>
          <input type="checkbox" checked={check1} onChange={(e) => setCheck1(e.target.checked)} />
          <span className="ml-2">Reinigung durchgeführt</span>
        </label>
        <label>
          <input type="checkbox" checked={check2} onChange={(e) => setCheck2(e.target.checked)} />
          <span className="ml-2">Sichtkontrolle</span>
        </label>
        <label>
          <input type="checkbox" checked={check3} onChange={(e) => setCheck3(e.target.checked)} />
          <span className="ml-2">Funktionstest</span>
        </label>
      </div>

      <div className="mb-4">
        <label>
          <input
            type="checkbox"
            checked={damaged}
            onChange={(e) => setDamaged(e.target.checked)}
          />
          <span className="ml-2 text-red-400">Box ist beschädigt</span>
        </label>
      </div>

      {error && <div className="text-red-500 mb-2">{error}</div>}

      <div className="flex justify-end space-x-2">
        <button
          onClick={() => navigate("/boxes")}
          className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded"
        >
          Abbrechen
        </button>
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded"
        >
          {loading ? "Speichern..." : "Speichern"}
        </button>
      </div>
    </div>
  );
}
