import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import "./index.css";
import { getStoredToken } from "./lib/auth";
import LoginPage from "./pages/LoginPage";
import RefrigerantLogPage from "./pages/RefrigerantLogPage";
import MyLogsPage from "./pages/MyLogsPage";

function RequireAuth({ children }: { children: React.ReactNode }) {
  const token = getStoredToken();
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/refrigerant-log"
          element={
            <RequireAuth>
              <RefrigerantLogPage />
            </RequireAuth>
          }
        />
        <Route
          path="/my-logs"
          element={
            <RequireAuth>
              <MyLogsPage />
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