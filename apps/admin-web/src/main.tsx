import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "./index.css";
import { getStoredToken } from "./lib/auth";
import { CompanyProvider } from "./context/CompanyContext";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import LogsPage from "./pages/LogsPage";
import LogDetailPage from "./pages/LogDetailPage";
import DivisionsPage from "./pages/DivisionsPage";
import DivisionDetailPage from "./pages/DivisionDetailPage";
import SettingsPage from "./pages/SettingsPage";

function RequireAuth({ children }: { children: React.ReactNode }) {
  const token = getStoredToken();
  if (!token) return <Navigate to="/login" replace />;
  return <CompanyProvider>{children}</CompanyProvider>;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/dashboard"
          element={
            <RequireAuth>
              <DashboardPage />
            </RequireAuth>
          }
        />
        <Route
          path="/logs"
          element={
            <RequireAuth>
              <LogsPage />
            </RequireAuth>
          }
        />
        <Route
          path="/logs/:id"
          element={
            <RequireAuth>
              <LogDetailPage />
            </RequireAuth>
          }
        />
        <Route
          path="/divisions"
          element={
            <RequireAuth>
              <DivisionsPage />
            </RequireAuth>
          }
        />
        <Route
          path="/divisions/:id"
          element={
            <RequireAuth>
              <DivisionDetailPage />
            </RequireAuth>
          }
        />
        <Route
          path="/settings"
          element={
            <RequireAuth>
              <SettingsPage />
            </RequireAuth>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
