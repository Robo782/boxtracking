export default function FilterBar({ query,setQuery, stat,setStat, type,setType })
{
  return (
    <div className="flex flex-wrap gap-2">
      <select value={stat} onChange={e=>setStat(e.target.value)} className="select select-bordered">
        <option value="all">Alle Status</option>
        <option value="free">frei</option>
        <option value="in-use">in Benutzung</option>
        <option value="defect">defekt</option>
      </select>

      <select value={type} onChange={e=>setType(e.target.value)} className="select select-bordered">
        <option value="all">Alle Typen</option>
        <option value="PU">PU</option>
        <option value="HT">HT</option>
        <option value="EU">EU</option>
      </select>

      <input value={query} onChange={e=>setQuery(e.target.value)}
             placeholder="PCC-ID / Device-Serial"
             className="input input-bordered flex-1 min-w-[10rem]" />
    </div>
  );
}
