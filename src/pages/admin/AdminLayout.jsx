import React, { useState } from "react";
import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import { BRAND_NAME } from "../../config";
import { useAdminAuth } from "../../context/AdminAuthContext";

const NAV = [
  { to: "/admin", label: "Dashboard", ico: "📊", end: true },
  { to: "/admin/profile", label: "My Profile", ico: "👤" },
  { to: "/admin/products", label: "Jewelry Catalog", ico: "💎" },
  { to: "/admin/purchases", label: "Bullion Purchases", ico: "📥" },
  { to: "/admin/sales", label: "Sales & Invoices", ico: "🧾" },
  { to: "/admin/enquiries", label: "Quote Inquiries", ico: "💬" },
  { to: "/admin/transport", label: "Secure Transport", ico: "🚚" },
  { section: "Showroom Website CMS" },
  { to: "/admin/home-images", label: "Hero Banners", ico: "🖼️" },
  { to: "/admin/home-theme", label: "Theme Colors", ico: "🎨" },
  { to: "/admin/about", label: "Heritage Story", ico: "📄" },
  { to: "/admin/contact", label: "Showroom Contact", ico: "📇" },
];

const TITLES = {
  "/admin": "Dashboard",
  "/admin/profile": "My Profile",
  "/admin/products": "Jewelry Inventory",
  "/admin/purchases": "Bullion & Stock Purchases",
  "/admin/sales": "Sales & Tax Invoices",
  "/admin/enquiries": "Client Quote Inquiries",
  "/admin/transport": "Secure Transport Management",
  "/admin/home-images": "Hero Banner Showcase",
  "/admin/home-theme": "Showroom Theme Settings",
  "/admin/about": "Heritage Story Sections",
  "/admin/contact": "Showroom Contact Details",
};

export default function AdminLayout() {
  const { logout } = useAdminAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  const title = TITLES[location.pathname] || "Admin Console";

  const handleLogout = () => {
    logout();
    navigate("/admin/login", { replace: true });
  };

  return (
    <div className="admin-shell">
      <div className={`sidebar-backdrop ${open ? "show" : ""}`} onClick={() => setOpen(false)} />
      <aside className={`admin-sidebar ${open ? "open" : ""}`}>
        <div className="brand">
          <span className="brand-mark">💎</span>
          <span>
            {BRAND_NAME}
            <small>Jeweller Console</small>
          </span>
        </div>
        <nav className="admin-nav" onClick={() => setOpen(false)}>
          {NAV.map((n) =>
            n.section ? (
              <div className="admin-nav-section" key={n.section}>{n.section}</div>
            ) : (
              <NavLink key={n.to} to={n.to} end={n.end}>
                <span className="ico">{n.ico}</span>
                {n.label}
              </NavLink>
            )
          )}
        </nav>
        <div className="sidebar-foot">
          <div className="who">Jeweller Merchant Signed In</div>
          <button className="btn btn-outline btn-sm btn-block" onClick={handleLogout} style={{ color: "#fff", borderColor: "rgba(197, 160, 89, 0.4)" }}>
            Log out
          </button>
        </div>
      </aside>

      <div className="admin-main">
        <header className="admin-topbar">
          <button className="menu-btn" onClick={() => setOpen((o) => !o)}>☰</button>
          <h1>{title}</h1>
        </header>
        <div className="admin-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
