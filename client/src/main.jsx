import "./index.css";
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";



/* Seiten */
import Login           from "@/pages/login.jsx";
import Boxes           from "@/pages/boxes.jsx";
import BoxDetail       from "@/pages/boxdetail.jsx";
import BoxesManage     from "@/pages/boxesmanage.jsx";
import BoxHistory      from "@/pages/boxhistory.jsx";
import AdminDashboard  from "@/pages/admindashboard.jsx";
import UserManagement  from "@/pages/usermanagement.jsx";
import BackupRestore   from "@/pages/backuprestore.jsx";

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
