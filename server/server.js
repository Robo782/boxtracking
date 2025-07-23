/**
 * Haupteinstiegspunkt Backend
 */
require('dotenv').config();
const path = require('path');
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const fileUpload = require('express-fileupload');              // ← aufgelöst!
const authRoutes = require('./routes/authRoutes');
const boxRoutes  = require('./routes/boxRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();

/* ─ middlewares ───────────────────────────────────────────── */
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(fileUpload());                                         // ← Datei-Uploads
app.use('/static', express.static(path.join(__dirname, 'static')));

/* ─ routen ─────────────────────────────────────────────────── */
app.use('/api/auth',  authRoutes);
app.use('/api/boxes', boxRoutes);
app.use('/api/admin', adminRoutes);

/* 404 */
app.use((_req, res) => res.status(404).json({ error: 'Not found' }));

/* ─ start ──────────────────────────────────────────────────── */
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`[INFO] Backend läuft auf Port ${PORT}`));
