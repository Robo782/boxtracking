const express = require('express');
const cors = require('cors');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// STATIC FILES
app.use(express.static(path.join(__dirname, 'static')));

// API ROUTES
// TODO: Add your real API routes here

// Fallback for React
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'static', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`[INFO] Backend running on ${PORT}`);
});
