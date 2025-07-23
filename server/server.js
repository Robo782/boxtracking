/**
 * Haupteinstiegspunkt Backend
 */
require("dotenv").config();
const path        = require("path");
const express     = require("express");
const morgan      = require("morgan");
const cors        = require("cors");
const fileUpload  = require("express-fileupload");

const authRoutes  = require("./routes/authRoutes");
const boxRoutes   = require("./routes/boxRoutes");
const adminRoutes = require("./routes/adminRoutes");

const app = express();

/* ─ middlewares ───────────────────────────────────────────── */
app.use(cors());
app.use(morgan("dev"));
app.use(express.json());
app.use(fileUpload());                    // Datei-Uploads

// **Static Files** – ohne Präfix, damit /, /favicon.ico, /assets/* usw. funktionieren
app.use(express.static(path.join(__dirname, "static")));

/* ─ API-Routen ────────────────────────────────────────────── */
app.use("/api/auth",  authRoutes);
app.use("/api/boxes", boxRoutes);
app.use("/api/admin", adminRoutes);

/* ─ SPA-Fallback ────────────────────────────────────────────
   Für alle nicht-API-Pfad­anfragen wird das Frontend zurückgegeben.
   So funktionieren Hard-Refreshes und Direktaufrufe beliebiger Routen. */
app.get("*", (_req, res) =>
  res.sendFile(path.join(__dirname, "static", "index.html"))
);

/* ─ Start ─────────────────────────────────────────────────── */
const PORT = process.env.PORT || 10000;
app.listen(PORT, () =>
  console.log(`[INFO] Backend läuft auf Port ${PORT}`)
);
