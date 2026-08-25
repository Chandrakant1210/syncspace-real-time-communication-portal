import { useEffect } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import socket from "./services/socket";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";

import ProtectedRoute, {
  PublicOnlyRoute,
  RootRedirect,
} from "./components/ProtectedRoute";

function App() {
  useEffect(() => {
    socket.on("connect", () => {
      console.log("Connected to Socket.IO:", socket.id);
    });

    return () => {
      socket.off("connect");
    };
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        {/* "/" sends you to the dashboard or to login, depending on the token. */}
        <Route path="/" element={<RootRedirect />} />

        {/* Auth — standalone pages, hidden once you're signed in. */}
        <Route
          path="/login"
          element={
            <PublicOnlyRoute>
              <Login />
            </PublicOnlyRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicOnlyRoute>
              <Register />
            </PublicOnlyRoute>
          }
        />

        {/* App pages — require a session. */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        {/* Backend health check (kept from the day-1 scaffold). */}
        <Route path="/home" element={<Home />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
