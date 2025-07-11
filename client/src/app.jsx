// client/src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login           from "@/pages/Login";
import Boxes           from "@/pages/Boxes";
import BoxDetail       from "@/pages/BoxDetail";
import BoxHistory      from "@/pages/BoxHistory";
import BoxesManage     from "@/pages/BoxesManage";
import AdminDashboard  from "@/pages/AdminDashboard";
import UserManagement  from "@/pages/UserManagement";
import BackupRestore   from "@/pages/BackupRestore";

const Protected = ({ allowed, children }) =>
  allowed ? children : <Navigate to="/login" replace />;

export default function App() {
  const role = localStorage.getItem("role");         // "admin" | "user" | null
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        {/* öffentlich nach Login */}
        <Route
          path="/boxes"
          element={<Protected allowed={!!role}><Boxes /></Protected>}
        />
        <Route
          path="/boxes/:id"
          element={<Protected allowed={!!role}><BoxDetail /></Protected>}
        />
        <Route
          path="/boxes/:id/history"
          element={<Protected allowed={!!role}><BoxHistory /></Protected>}
        />

        {/* reine Admin-Routen */}
        <Route
          path="/admin"
          element={<Protected allowed={role==="admin"}><AdminDashboard /></Protected>}
        />
        <Route
          path="/admin/boxes"
          element={<Protected allowed={role==="admin"}><BoxesManage /></Protected>}
        />
        <Route
          path="/admin/users"
          element={<Protected allowed={role==="admin"}><UserManagement /></Protected>}
        />
        <Route
          path="/admin/backup"
          element={<Protected allowed={role==="admin"}><BackupRestore /></Protected>}
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to={role ? "/boxes" : "/login"} replace />} />
      </Routes>
    </BrowserRouter>
  );
}
