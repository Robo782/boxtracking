// server/routes/adminRoutes.js
const router = require("express").Router();

const multer = require("multer");
const upload = multer({ dest: "/tmp" });

/* eigene Middleware */
const { authenticate, requireAdmin } = require("../middleware/authMiddleware");

/* Controller */
const admin  = require("../controllers/adminController");
const backup = require("../controllers/backupController");

/* ───────────── Benutzerverwaltung ───────────── */
router.get ("/users", authenticate, requireAdmin, admin.getUsers);
router.post("/users", authenticate, requireAdmin, admin.createUser);

/* ───────────── Box-Funktionen ──────────────── */
/* Neue, klare Endpunkte */
router.post("/reset-data", authenticate, requireAdmin, admin.resetData);
router.post("/init-data",  authenticate, requireAdmin, admin.initData);

/* Abwärts­kompatible Alias (falls Front-End noch alt) */
router.post("/reset",      authenticate, requireAdmin, admin.resetData);
router.post("/seed-boxes", authenticate, requireAdmin, admin.initData);

/* Einzelne Box direkt bearbeiten */
router.patch("/boxes/:id", authenticate, requireAdmin, admin.updateBox);

/* ───────────── Backup / Restore ────────────── */
router.get ("/backup",  authenticate, requireAdmin, backup.backupDb);  // Download
router.post("/restore",
  authenticate,
  requireAdmin,
  upload.single("file"),
  backup.restoreDb);                                                   // Upload

module.exports = router;
