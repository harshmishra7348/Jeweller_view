import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { adminProducts, adminSales, adminEnquiries } from "../../api/services";
import { errorMessage } from "../../api/http";
import Spinner from "../../components/common/Spinner";
import { useToast } from "../../context/ToastContext";

const LOW_STOCK_THRESHOLD = 10;

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    (async () => {
      try {
        const [products, sales, enquiries] = await Promise.all([
          adminProducts.list(),
          adminSales.list(),
          adminEnquiries.unresolved(),
        ]);
        const active = (products || []).filter((p) => p.active);
        setStats({
          activeProducts: active.length,
          lowStock: active.filter((p) => (p.quantity ?? 0) <= LOW_STOCK_THRESHOLD).length,
          totalSales: (sales || []).length,
          pendingInvoices: (sales || []).filter((s) => s.invoiceStatus === "PENDING").length,
          revenue: (sales || [])
            .filter((s) => s.invoiceStatus !== "CANCELLED")
            .reduce((sum, s) => sum + (s.amount || 0), 0),
          openEnquiries: (enquiries || []).length,
        });
      } catch (err) {
        toast.error(errorMessage(err));
      } finally {
        setLoading(false);
      }
    })();
  }, [toast]);

  if (loading) return <Spinner full />;
  if (!stats) return <div className="empty-state"><h3>Couldn't load dashboard</h3></div>;

  const tiles = [
    { ico: "💎", label: "Jewelry Items", val: stats.activeProducts, to: "/admin/products" },
    { ico: "⚠️", cls: "red", label: `Low stock (≤ ${LOW_STOCK_THRESHOLD})`, val: stats.lowStock, to: "/admin/products" },
    { ico: "🧾", label: "Total invoices", val: stats.totalSales, to: "/admin/sales" },
    { ico: "⏳", cls: "gold", label: "Pending invoices", val: stats.pendingInvoices, to: "/admin/sales" },
    { ico: "👑", cls: "gold", label: "Revenue (billed)", val: `₹${Number(stats.revenue).toLocaleString("en-IN")}`, to: "/admin/sales" },
    { ico: "💬", cls: "red", label: "Open inquiries", val: stats.openEnquiries, to: "/admin/enquiries" },
  ];

  return (
    <>
      <div className="stat-grid">
        {tiles.map((t) => (
          <Link to={t.to} key={t.label} className="stat-tile">
            <div className={`ico ${t.cls || ""}`}>{t.ico}</div>
            <div>
              <div className="val">{t.val}</div>
              <div className="lbl">{t.label}</div>
            </div>
          </Link>
        ))}
      </div>

      <div className="panel">
        <div className="panel-head"><h2 style={{ fontFamily: "var(--font-display)" }}>Jeweller Quick Actions</h2></div>
        <div className="panel-body row row-wrap">
          <Link to="/admin/products" className="btn btn-primary">+ Add Jewelry Item</Link>
          <Link to="/admin/purchases" className="btn btn-outline">+ Record Bullion/Stock Purchase</Link>
          <Link to="/admin/sales" className="btn btn-outline">+ Create Sale Invoice</Link>
          <Link to="/admin/enquiries" className="btn btn-outline">Review Customer Inquiries</Link>
          <Link to="/admin/home-images" className="btn btn-outline">🖼️ Hero Banners</Link>
          <Link to="/admin/about" className="btn btn-outline">📄 Heritage Story</Link>
          <Link to="/admin/contact" className="btn btn-outline">📇 Showroom Contact</Link>
        </div>
      </div>
    </>
  );
}
