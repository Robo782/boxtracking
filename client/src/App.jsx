import React, { Suspense, lazy, useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { getAuth } from "./utils/auth.js";

const NavBar         = lazy(() => import("./components/NavBar.jsx"));
const Boxes          = lazy(() => import("./pages/boxes.jsx"));
const Login          = lazy(() => import("./pages/login.jsx"));
const BoxDetail      = lazy(() => import("./pages/boxdetail.jsx"));
const BoxHistory     = lazy(() => import("./pages/boxhistory.jsx"));
const BoxesManage    = lazy(() => import("./pages/boxesmanage.jsx"));
const AdminDashboard = lazy(() => import("./pages/admindashboard.jsx"));
const UserMgmt       = lazy(() => import("./pages/usermanagement.jsx"));
const BackupRestore  = lazy(() => import("./pages/backuprestore.jsx"));
const BoxNext        = lazy(() => import("./pages/boxnext.jsx"));

export default function App() {
  /* ---------- zentrale Auth-Quelle ---------- */
  const [auth, setAuth] = useState(getAuth());

  /* reagiert auf:
     • authchange (eigenes Event aus Login / Logout)
     • storage-Events (anderer Tab)                        */
  useEffect(() => {
    const sync = () => setAuth(getAuth());
    window.addEventListener("authchange", sync);
    window.addEventListener("storage",     sync);
    return () => {
      window.removeEventListener("authchange", sync);
      window.removeEventListener("storage",     sync);
    };
  }, []);

  const { role, valid } = auth;
  const authed = valid && role;

  return (
    <BrowserRouter>
      {authed && <NavBar />}

      <Suspense fallback={<p className="p-4">Lade …</p>}>
        <Routes>
          {/* Root */}
          <Route
            path="/"
            element={<Navigate to={authed ? "/boxes" : "/login"} replace />}
          />

          {/* Login */}
          <Route
            path="/login"
            element={authed ? <Navigate to="/boxes" replace /> : <Login />}
          />

          {/* Geschützte Routen */}
          {authed && (
            <>
              <Route path="/boxes" element={<Boxes />} />
              <Route path="/boxes/:id" element={<BoxDetail />} />
              <Route path="/boxes/:id/history" element={<BoxHistory />} />
              <Route path="/boxes/:id/next"    element={<BoxNext />} />
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

          {/* Fallback */}
          <Route
            path="*"
            element={<Navigate to={authed ? "/boxes" : "/login"} replace />}
          />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
