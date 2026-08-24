import { useNavigate } from "react-router-dom";

import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import { auth, getStoredUser } from "../services/api";

// App shell: Navbar across the top, Sidebar on the left, page content on the right.
// Logout lives here so every page in the shell gets it for free; pass `onLogout`
// to override.
function Layout({ children, userName, onLogout }) {
  const navigate = useNavigate();
  const displayName = userName || getStoredUser()?.name || "User";

  function handleLogout() {
    auth.logout(); // clears the token and the cached user
    navigate("/login", { replace: true });
  }

  return (
    <div className="flex h-screen flex-col bg-slate-50">
      <Navbar userName={displayName} onLogout={onLogout || handleLogout} />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto bg-linear-to-b from-slate-50 via-white to-slate-50">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

export default Layout;
