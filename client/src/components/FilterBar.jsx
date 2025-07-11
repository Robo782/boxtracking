// client/src/components/FilterBar.jsx
export default function FilterBar({
  status, setStatus,
  type,   setType,
  query,  setQuery
}) {
  return (
    <div className="flex flex-wrap gap-2 items-center">
      {/* Status-DropDown */}
      <select
        className="select select-sm select-bordered"
        value={status}
        onChange={e=>setStatus(e.target.value)}
      >
        <option value="all">Alle Status</option>
        <option value="Verfügbar">Verfügbar</option>
        <option value="Unterwegs">Unterwegs</option>
        <option value="Rücklauf">Rücklauf</option>
      </select>

      {/* Typ-DropDown */}
      <select
        className="select select-sm select-bordered"
        value={type}
        onChange={e=>setType(e.target.value)}
      >
        <option value="all">Alle Typen</option>
        <option value="PU-S">PU-S</option>
        <option value="PU-M">PU-M</option>
        <option value="PR-M">PR-M</option>
      </select>

      {/* Textsuche */}
      <label className="input input-sm input-bordered flex-1 max-w-xs">
        <input
          type="text"
          placeholder="PCC-ID / Device-Serial"
          className="grow"
          value={query}
          onChange={e=>setQuery(e.target.value.trim().toLowerCase())}
        />
      </label>
    </div>
  );
}
