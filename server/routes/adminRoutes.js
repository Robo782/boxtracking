const router = require("express").Router();
const admin  = require("../controllers/adminController");
const { authenticate, requireAdmin } = require("../middleware/authMiddleware");

/* Benutzer */
router.get ("/users",          authenticate, requireAdmin, admin.getUsers);
router.post("/users",          authenticate, requireAdmin, admin.createUser);

/* Box-Grundfunktionen */
router.post("/reset",          authenticate, requireAdmin, admin.resetDb);
router.post("/seed-boxes",     authenticate, requireAdmin, admin.seedBoxes);

/* NEU: Box aktualisieren */
router.patch("/boxes/:id",     authenticate, requireAdmin, admin.updateBox);

module.exports = router;
