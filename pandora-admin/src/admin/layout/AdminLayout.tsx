import React from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "../components/Sidebar";
import { Topbar } from "../components/Topbar";

export function AdminLayout() {
  return (
    <div className="admin-shell">
      <Sidebar />
      <div className="admin-content">
        <Topbar />
        <main className="admin-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
