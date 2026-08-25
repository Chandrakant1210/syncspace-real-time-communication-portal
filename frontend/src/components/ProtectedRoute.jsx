import { Navigate, Outlet, useLocation } from "react-router-dom";

import { getToken } from "../services/api";

/**
 * Route guards. The token lives in localStorage (see services/api.js), so it's
 * read on each render rather than held in state — every login/logout ends in a
 * navigation, which re-renders these anyway.
 */

/** Blocks app pages when there's no session; sends you to /login. */
function ProtectedRoute({ children }) {
  const location = useLocation();

  if (!getToken()) {
    // Remember where they were headed so login can send them back.
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return children ?? <Outlet />;
}

/** Keeps signed-in users out of /login and /register. */
export function PublicOnlyRoute({ children }) {
  if (getToken()) return <Navigate to="/dashboard" replace />;
  return children ?? <Outlet />;
}

/** "/" — dashboard when signed in, login when not. */
export function RootRedirect() {
  return <Navigate to={getToken() ? "/dashboard" : "/login"} replace />;
}

export default ProtectedRoute;
