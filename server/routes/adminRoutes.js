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
router.post("/reset",      authenticate, requireAdmin, admin.resetDb);
router.post("/seed-boxes", authenticate, requireAdmin, admin.seedBoxes);
router.patch("/boxes/:id", authenticate, requireAdmin, admin.updateBox);

/* ───────────── Backup / Restore ────────────── */
router.get ("/backup",  authenticate, requireAdmin, backup.backupDb);               // Download DB
router.post("/restore",
  authenticate,
  requireAdmin,
  upload.single("file"),
  backup.restoreDb);                                                                 // Upload DB

module.exports = router;
