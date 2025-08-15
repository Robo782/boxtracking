// client/src/App.jsx
import React, { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { getAuth } from "./utils/auth";

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
const BoxDbAdmin     = lazy(() => import("./pages/boxdbadmin.jsx"));
// 🆕 neu:
const BoxInspection  = lazy(() => import("./pages/boxinspection.jsx"));

function RequireAuth() {
  const { token } = getAuth();
  return token ? <Outlet /> : <Navigate to="/login" replace />;
}

function RequireAdmin() {
  const { token, role } = getAuth();
  return token && role === "admin" ? <Outlet /> : <Navigate to="/boxes" replace />;
}

function Layout() {
  return (
    <>
      <NavBar />
      <main className="mt-4">
        <Outlet />
      </main>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<div className="p-4 text-slate-300">Laden…</div>}>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route element={<RequireAuth />}>
            <Route element={<Layout />}>
              {/* Für alle (user + admin) */}
              <Route path="/" element={<Navigate to="/boxes" replace />} />
              <Route path="/boxes" element={<Boxes />} />
              <Route path="/boxes/:id" element={<BoxDetail />} />
              <Route path="/boxes/:id/history" element={<BoxHistory />} />
              <Route path="/boxnext" element={<BoxNext />} />
              {/* 🆕 neu: Prüfprotokollseite */}
              <Route path="/boxes/:id/inspection" element={<BoxInspection />} />

              {/* Nur Admin */}
              <Route element={<RequireAdmin />}>
                <Route path="/dashboard" element={<AdminDashboard />} />
                <Route path="/boxesmanage" element={<BoxesManage />} />
                <Route path="/usermanagement" element={<UserMgmt />} />
                <Route path="/backuprestore" element={<BackupRestore />} />
                <Route path="/admin/boxes" element={<BoxDbAdmin />} />
              </Route>
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/boxes" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
