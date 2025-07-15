import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";        // ← Tailwind & DaisyUI kommen hier rein
import App from "./app.jsx";          // ← exakt dieser Dateiname!

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
