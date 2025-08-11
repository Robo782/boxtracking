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
const BoxDbAdmin     = lazy(() => import("./pages/boxdbadmin.jsx")); // ⬅️ NEU

export default function App() {
  const [authed, setAuthed] = useState(getAuth().valid);

  useEffect(() => {
    const fn = () => setAuthed(getAuth().valid);
    window.addEventListener("storage", fn);
    return () => window.removeEventListener("storage", fn);
  }, []);

  return (
    <BrowserRouter>
      <Suspense fallback={<div className="p-6">lädt …</div>}>

        <Routes>
          {/* Public */}
          {!authed && (
            <>
              <Route path="/login" element={<Login />} />
              <Route path="*" element={<Navigate to="/login" replace />} />
            </>
          )}

          {/* Protected */}
          {authed && (
            <>
              <Route path="/*" element={<Layout />}>
                <Route index element={<Navigate to="/boxes" replace />} />
                <Route path="boxes" element={<Boxes />} />
                <Route path="boxes/:id" element={<BoxDetail />} />
                <Route path="boxes/:id/history" element={<BoxHistory />} />
                <Route path="boxnext/:id" element={<BoxNext />} />

                {/* Admin-Bereich wie gehabt */}
                <Route path="dashboard" element={<AdminDashboard />} />
                <Route path="boxesmanage" element={<BoxesManage />} />
                <Route path="usermanagement" element={<UserMgmt />} />
                <Route path="backuprestore" element={<BackupRestore />} />

                {/* ⬇️ NEU: direkter DB-Editor */}
                <Route path="admin/boxes" element={<BoxDbAdmin />} />
              </Route>

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/boxes" replace />} />
            </>
          )}
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

function Layout() {
  return (
    <>
      <NavBar />
      <div className="mt-4" />
    </>
  );
}
