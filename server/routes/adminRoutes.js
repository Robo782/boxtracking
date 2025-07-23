/**
 * Admin-Router – alle Endpunkte, die nur Admin-User aufrufen dürfen
 */
const express = require('express');
const adminController = require('../controllers/adminController');
const { requireAuth, requireAdmin } = require('../middleware/authMiddleware');

const router = express.Router();

/* Statistik zum aktuellen Datenbestand */
router.get(
  '/stats',
  requireAuth,
  requireAdmin,
  adminController.getStats
);

/* Alles löschen (Boxen + History) */
router.post(
  '/reset',
  requireAuth,
  requireAdmin,
  adminController.resetData
);

/* Datenbank-Dump herunterladen (ZIP) */
router.post(
  '/backup',
  requireAuth,
  requireAdmin,
  adminController.createBackup
);

/* Dump hochladen & wiederherstellen */
router.post(
  '/restore',
  requireAuth,
  requireAdmin,
  adminController.restoreBackup
);

module.exports = router;
