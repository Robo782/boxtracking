/* … bestehende imports … */
const express = require('express');
const fileUpload = require('express-fileupload');
const adminRoutes = require('./routes/adminRoutes');

/* App-Grundkonfiguration */
const app = express();
app.use(express.json());
app.use(fileUpload());

/* … andere Routen (auth, boxes, …) … */

app.use('/api/admin', adminRoutes);   //  <── neu / korrigiert

/* Globaler Error-Handler, 404 usw. */
/* … */

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`[INFO] Backend läuft auf Port ${PORT}`));
