import React, { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import NavBar from "./components/NavBar.jsx";

/* Lazy-loaded Pages (alle relativen Pfade, da kein Vite-@-Alias configured) */
const Boxes          = lazy(() => import("./pages/boxes.jsx"));
const Login          = lazy(() => import("./pages/login.jsx"));
const BoxDetail      = lazy(() => import("./pages/boxdetail.jsx"));
const BoxHistory     = lazy(() => import("./pages/boxhistory.jsx"));
const BoxesManage    = lazy(() => import("./pages/boxesmanage.jsx"));
const AdminDashboard = lazy(() => import("./pages/admindashboard.jsx"));
const UserMgmt       = lazy(() => import("./pages/usermanagement.jsx"));
const BackupRestore  = lazy(() => import("./pages/backuprestore.jsx"));

export default function App() {
  return (
    <BrowserRouter>
      <NavBar />
      <Suspense fallback={<div className="p-6">Lade …</div>}>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<Login />} />
          <Route path="/"       element={<Boxes />} />
          <Route path="/boxes"  element={<Boxes />} />
          <Route path="/box/:id"        element={<BoxDetail />} />
          <Route path="/box/:id/history" element={<BoxHistory />} />

          {/* Admin */}
          <Route path="/boxmanage"      element={<BoxesManage />} />
          <Route path="/admin"          element={<AdminDashboard />} />
          <Route path="/usermanagement" element={<UserMgmt />} />
          <Route path="/backuprestore"  element={<BackupRestore />} />

          {/* Fallback */}
          <Route path="*" element={<Boxes />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
