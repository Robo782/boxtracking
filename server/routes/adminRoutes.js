const router = require("express").Router();

const multer  = require("multer");
const upload  = multer({ dest: "/tmp" });

const { authenticate, requireAdmin } = require("../middleware/authMiddleware");

const admin   = require("../controllers/adminController");
const backup  = require("../controllers/backupController");

/* ───────────── Benutzerverwaltung ───────────── */
router.get ("/users", authenticate, requireAdmin, admin.getUsers);
router.post("/users", authenticate, requireAdmin, admin.createUser);

/* ───────────── Box-Funktionen ──────────────── */
router.post("/reset-data", authenticate, requireAdmin, admin.resetData);
router.post("/init-data",  authenticate, requireAdmin, admin.initData);

/* Abwärtskompatible Aliase */
router.post("/reset",      authenticate, requireAdmin, admin.resetData);
router.post("/seed-boxes", authenticate, requireAdmin, admin.initData);

router.patch("/boxes/:id", authenticate, requireAdmin, admin.updateBox);

/* ───────────── Backup / Restore ────────────── */
router.get ("/backup",  authenticate, requireAdmin, backup.backupDb);
router.post("/restore",
  authenticate,
  requireAdmin,
  upload.single("file"),
  backup.restoreDb);

module.exports = router;
