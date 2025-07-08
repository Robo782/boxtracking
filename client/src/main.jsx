import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";

/* Seiten */
import Login           from "./pages/Login";
import Boxes           from "./pages/Boxes";
import BoxDetail       from "./pages/BoxDetail";
import BoxHistory      from "./pages/BoxHistory";
import UserManagement  from "./pages/UserManagement";
import AdminDashboard  from "./pages/AdminDashboard";
import BoxesManage     from "./pages/BoxesManage";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        {/* Public / User */}
        <Route path="/"                 element={<Login />} />
        <Route path="/boxes"            element={<Boxes />} />
        <Route path="/box/:id"          element={<BoxDetail />} />
        <Route path="/box/:id/history"  element={<BoxHistory />} />

        {/* Admin */}
        <Route path="/admin"            element={<AdminDashboard />} />   
        <Route path="/admin/boxes-manage"  element={<BoxesManage />} /> 
        <Route path="/admin/users"      element={<UserManagement />} />
        <Route path="/admin/backup" element={<BackupRestore />} />

      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
