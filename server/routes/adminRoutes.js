// server/routes/adminRoutes.js
const express = require("express");
const { requireAuth, requireAdmin } = require("../middleware/authMiddleware");
const admin = require("../controllers/adminController");

const router = express.Router();

/* Stats */
router.get("/stats", requireAuth, requireAdmin, admin.getStats);

/* Users CRUD */
router.get("/users", requireAuth, requireAdmin, admin.listUsers);
router.post("/users", requireAuth, requireAdmin, admin.createUser);
router.patch("/users/:id", requireAuth, requireAdmin, admin.updateUser);
router.patch("/users/:id/password", requireAuth, requireAdmin, admin.resetPassword);
router.delete("/users/:id", requireAuth, requireAdmin, admin.deleteUser);

module.exports = router;
