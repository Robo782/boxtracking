const express = require("express");
const ctrl    = require("../controllers/boxController");
const router  = express.Router();

/* GET */
router.get("/",           ctrl.getAll);
router.get("/:id",        ctrl.getOne);
router.get("/:id/history",ctrl.history);

/* PUT – Statuswechsel */
router.put("/:id/load",   ctrl.load);
router.put("/:id/return", ctrl.returnBox);
router.put("/:id/check",  ctrl.check);
router.put("/:id/done",   ctrl.done);

module.exports = router;
