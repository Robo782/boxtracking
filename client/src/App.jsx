import React, { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import NavBar from "./components/NavBar.jsx";
import { getAuth } from "./utils/auth.js";

// lazy-geladene Seiten
const Boxes          = lazy(() => import("./pages/boxes.jsx"));
const Login          = lazy(() => import("./pages/login.jsx"));
const BoxDetail      = lazy(() => import("./pages/boxdetail.jsx"));
const BoxHistory     = lazy(() => import("./pages/boxhistory.jsx"));
const BoxesManage    = lazy(() => import("./pages/boxesmanage.jsx"));
const AdminDashboard = lazy(() => import("./pages/admindashboard.jsx"));
const UserMgmt       = lazy(() => import("./pages/usermanagement.jsx"));
const BackupRestore  = lazy(() => import("./pages/backuprestore.jsx"));

export default function App() {
  const { role, valid } = getAuth();
  const authed = valid && role;   // true = eingeloggt & Token gültig

  return (
    <BrowserRouter>
      <NavBar />

      <Suspense fallback={<p className="p-4">Lade …</p>}>
        <Routes>
          {/* ───────── Root-Pfad ───────── */}
          <Route
            path="/"
            element={<Navigate to={authed ? "/boxes" : "/login"} replace />}
          />

          {/* ───────── Login immer erreichbar ───────── */}
          <Route
            path="/login"
            element={authed ? <Navigate to="/boxes" replace /> : <Login />}
          />

          {/* ───────── Geschützte Routen ───────── */}
          {authed && (
            <>
              <Route path="/boxes" element={<Boxes />} />
              <Route path="/boxes/:id" element={<BoxDetail />} />
              <Route path="/boxes/:id/history" element={<BoxHistory />} />
              <Route path="/boxesmanage" element={<BoxesManage />} />

              {role === "admin" && (
                <>
                  <Route path="/dashboard"       element={<AdminDashboard />} />
                  <Route path="/usermanagement" element={<UserMgmt />} />
                  <Route path="/backuprestore"  element={<BackupRestore />} />
                </>
              )}
            </>
          )}

          {/* ───────── Fallback ───────── */}
          <Route
            path="*"
            element={<Navigate to={authed ? "/boxes" : "/login"} replace />}
          />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
