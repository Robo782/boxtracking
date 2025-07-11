import "./index.css";
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";

/* Public-Seiten */
import Login       from "@/pages/login.jsx";
import Boxes       from "@/pages/boxes.jsx";
import BoxDetail   from "@/pages/boxdetail.jsx";
import BoxesManage from "@/pages/boxesmanage.jsx";
import BoxHistory  from "@/pages/boxhistory.jsx";

/* Admin-Seiten (neu) */
import AdminDashboard   from "@/pages/admindashboard.jsx";
import UserManagement   from "@/pages/usermanagement.jsx";
import BackupRestore    from "@/pages/backuprestore.jsx";

/* Layout */
import NavBar from "@/components/NavBar.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <NavBar />

      <Routes>
        {/* Public / User */}
        <Route path="/login" element={<Login />} />
        <Route path="/"       element={<Boxes />} />
        <Route path="/boxes"  element={<Boxes />} />
        <Route path="/box/:id"        element={<BoxDetail />} />
        <Route path="/box/:id/history" element={<BoxHistory />} />
        <Route path="/boxmanage"       element={<BoxesManage />} />

        {/* Admin */}
        <Route path="/admin"           element={<AdminDashboard />} />
        <Route path="/usermanagement"  element={<UserManagement />} />
        <Route path="/backuprestore"   element={<BackupRestore />} />

        {/* Fallback */}
        <Route path="*" element={<Login />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
