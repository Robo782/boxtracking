const db = require("../db");

const MAX_CYCLES = 50;

function isValidDeviceSerial(serial) {
  return /^[A-Z0-9]{4}-\d{2}$/i.test(serial);
}

function isValidPccId(pcc) {
  return /^pcc\s\d{5}\s[a-zA-Z]{2,3}$/.test(pcc);
}

module.exports = {
  // available → departed
  advanceFromAvailable: (req, res) => {
    const { id } = req.params;
    const { device_serial, pcc_id } = req.body;

    if (!device_serial || !pcc_id) {
      return res.status(400).send("device_serial & pcc_id erforderlich");
    }

    if (!isValidDeviceSerial(device_serial)) {
      return res.status(400).send("Ungültiges Geräte-Serial-Format");
    }

    if (!isValidPccId(pcc_id)) {
      return res.status(400).send("Ungültiges PCC-ID-Format");
    }

    const b = db.prepare("SELECT * FROM boxes WHERE id = ?").get(id);
    if (!b || b.status !== "available") {
      return res.status(400).send("Box nicht verfügbar");
    }

    const newCycles = b.cycles + 1;
    const newStatus = "departed";

    db.prepare(`
      UPDATE boxes SET
        status = ?, cycles = ?, device_serial = ?, pcc_id = ?
      WHERE id = ?
    `).run(newStatus, newCycles, device_serial, pcc_id, id);

    res.json({ status: newStatus });
  },

  // departed → returned
  advanceFromDeparted: (req, res) => {
    const { id } = req.params;

    const b = db.prepare("SELECT * FROM boxes WHERE id = ?").get(id);
    if (!b || b.status !== "departed") {
      return res.status(400).send("Box ist nicht unterwegs");
    }

    db.prepare("UPDATE boxes SET status = 'returned' WHERE id = ?").run(id);
    res.json({ status: "returned" });
  },

  // returned → available / damaged / maintenance
  completeInspection: (req, res) => {
    const { id } = req.params;
    const { checked_by, damaged, checklist1, checklist2, checklist3 } = req.body;

    if (!checked_by) {
      return res.status(400).send("Prüferkürzel erforderlich");
    }

    const b = db.prepare("SELECT * FROM boxes WHERE id = ?").get(id);
    if (!b || b.status !== "returned") {
      return res.status(400).send("Box nicht im Status 'returned'");
    }

    if (damaged) {
      db.prepare(`
        UPDATE boxes SET
          status = 'damaged', checked_by = ?
        WHERE id = ?
      `).run(checked_by, id);
      return res.json({ status: "damaged" });
    }

    const nextStatus = b.cycles >= MAX_CYCLES ? "maintenance" : "available";

    db.prepare(`
      UPDATE boxes SET
        status = ?, checked_by = ?
      WHERE id = ?
    `).run(nextStatus, checked_by, id);

    res.json({ status: nextStatus });
  },

  // maintenance → available (Reset)
  finishMaintenance: (req, res) => {
    const { id } = req.params;

    const b = db.prepare("SELECT * FROM boxes WHERE id = ?").get(id);
    if (!b || b.status !== "maintenance") {
      return res.status(400).send("Box nicht in Wartung");
    }

    db.prepare(`
      UPDATE boxes SET
        status = 'available',
        cycles = 0
      WHERE id = ?
    `).run(id);

    res.json({ status: "available" });
  }
};
