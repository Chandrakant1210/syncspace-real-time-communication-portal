import Navbar from "./Navbar";
import Sidebar from "./Sidebar";

// App shell: Navbar across the top, Sidebar on the left, page content on the right.
function Layout({ children, userName = "User", onLogout }) {
  return (
    <div className="flex h-screen flex-col bg-slate-50">
      <Navbar userName={userName} onLogout={onLogout} />

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
