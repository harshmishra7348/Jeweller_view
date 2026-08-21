import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BRAND_NAME, BRAND_SINCE, GST_NUMBER } from "../../config";
import { content } from "../../api/services";
import { useAuth } from "../../context/AuthContext";

const DEFAULT_BLURB =
  "Exquisite 22K/24K Gold, Fine Diamonds & Indian Heritage Bridal Jewelry. Certified BIS Hallmarked craftsmanship crafted for timeless moments.";

export default function Footer({ settings = {} }) {
  const { isAuthenticated, customer, logout } = useAuth();
  const navigate = useNavigate();
  const [blurb, setBlurb] = useState(DEFAULT_BLURB);
  const [contact, setContact] = useState(null);
  const footerBg = settings.footerBgColor;
  const footerPrimary = settings.footerPrimaryFontColor || settings.footerTextColor || "#ffffff";
  const gstNumber = GST_NUMBER || "";

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [about, info] = await Promise.all([
          content.about().catch(() => []),
          content.contact().catch(() => null),
        ]);
        if (!alive) return;
        const first = Array.isArray(about) ? about[0] : null;
        if (first?.description) setBlurb(first.description);
        setContact(info || null);
      } catch {
        /* keep defaults */
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const address = contact
    ? [contact.address, contact.city, contact.state, contact.pincode].filter(Boolean).join(", ")
    : "";
  const hasContact = contact && (contact.phone || contact.email || address);
  const footerBlurb = blurb.length > 110 ? blurb.slice(0, 110) : blurb;
  const showReadMore = blurb.length > 110;

  return (
    <footer className="footer" style={footerBg ? { background: footerBg, color: footerPrimary } : undefined}>
      <div className="container footer-inner">
        <div>
          <div className="brand" style={{ marginBottom: 12 }}>
            <span className="brand-mark">💎</span>
            <span>
              {BRAND_NAME}
              <small>Gold &amp; Diamond Fine Jewelry</small>
            </span>
          </div>
          <p style={{ maxWidth: 320, margin: 0, fontSize: "0.9rem", opacity: 0.85 }}>
            {footerBlurb}
            {showReadMore && (
              <Link to="/about" style={{ marginLeft: 4, color: "var(--gold-400)" }}>
                Read more
              </Link>
            )}
          </p>
        </div>

        <div>
          <h4>Collections</h4>
          <Link to="/">Home</Link>
          <Link to="/products">All Jewelry</Link>
          <Link to="/about">Our Heritage</Link>
          <Link to="/contact">Showroom &amp; Contact</Link>
        </div>

        <div>
          <h4>Client Portal</h4>
          {isAuthenticated ? (
            <>
              <span className="footer-user">Hi, {customer.name || customer.email.split("@")[0]}</span>
              <Link to="/profile">My Account</Link>
              <Link to="/cart">Inquiry Cart</Link>
              <button type="button" className="footer-linkbtn" onClick={handleLogout}>Logout</button>
            </>
          ) : (
            <>
              <Link to="/login">Client Login</Link>
              <Link to="/register">Register Account</Link>
              <Link to="/cart">Inquiry Cart</Link>
            </>
          )}
        </div>

        {hasContact && (
          <div>
            <h4>Showroom</h4>
            {contact.phone && <a href={`tel:${contact.phone}`}>📞 {contact.phone}</a>}
            {contact.email && <a href={`mailto:${contact.email}`}>✉️ {contact.email}</a>}
            {address && <span className="footer-addr">📍 {address}</span>}
          </div>
        )}
      </div>
      <div className="footer-bottom">
        © {new Date().getFullYear()} {BRAND_NAME} · GSTIN: {gstNumber}
        {BRAND_SINCE ? ` · Trusted since ${BRAND_SINCE}` : ""} · 100% BIS Hallmarked
      </div>
    </footer>
  );
}
