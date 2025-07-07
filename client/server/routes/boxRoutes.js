const express = require("express");
const ctrl    = require("../controllers/boxController");
const search  = require("../controllers/searchController");

const router = express.Router();

/* ---------- 1. Suche MUSS ganz nach oben! ---------- */
router.get("/search", search.search);              // /api/boxes/search?q=

/* ---------- 2. Box-Aktionen ---------- */
router.get ("/",            ctrl.getAllBoxes);     // /api/boxes
router.get ("/:id/history", ctrl.getHistory);      // /api/boxes/:id/history
router.put("/:id/load",     ctrl.loadBox);         // /api/boxes/:id/load
router.put("/:id/return",   ctrl.returnBox);       // /api/boxes/:id/return
router.put("/:id/check",    ctrl.checkBox);        // /api/boxes/:id/check
router.get ("/:id",         ctrl.getBox);          // /api/boxes/:id  (muss zuletzt!)

module.exports = router;
