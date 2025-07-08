import { useRef } from "react";
import axios       from "axios";

export default function BackupRestore() {
  const fileRef = useRef(null);
  const hdr = { Authorization: `Bearer ${localStorage.getItem("token")}` };

  /* Backup herunterladen */
  const downloadBackup = async () => {
    const res = await axios.get("/api/admin/backup", {
      headers: hdr,
      responseType: "blob"
    });
    const url  = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement("a");
    link.href  = url;
    link.setAttribute("download", "backup.sqlite");
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  /* Restore hochladen */
  const uploadBackup = async () => {
    const file = fileRef.current.files[0];
    if (!file) return alert("Bitte Datei auswählen");
    const fd = new FormData();
    fd.append("file", file);
    await axios.post("/api/admin/restore", fd, { headers: hdr });
    alert("Backup eingespielt – Service startet neu.");
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Datenbank-Backup / -Restore</h2>

      <button onClick={downloadBackup}>Backup herunterladen</button>

      <hr />
      <input type="file" ref={fileRef} accept=".sqlite" />
      <button onClick={uploadBackup}>Backup einspielen</button>
    </div>
  );
}
