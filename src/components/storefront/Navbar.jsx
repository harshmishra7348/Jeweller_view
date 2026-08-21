import React, { useState } from "react";
import { NavLink, Link, useNavigate } from "react-router-dom";
import { BRAND_NAME } from "../../config";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";

// -------------------------------------------------------------------
// TODO: Live metal rates via Yahoo Finance (no API key needed).
// Disabled for now — Yahoo Finance blocks direct browser fetch (CORS).
// Uncomment the line below once a CORS-safe proxy or alternate API is set up.
// import { useMetalRates } from "../../hooks/useMetalRates";
// -------------------------------------------------------------------

export default function Navbar({ settings = {} }) {
  const { isAuthenticated, customer, logout } = useAuth();
  const { count } = useCart();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  // const { rates, updatedAt } = useMetalRates(); // TODO: re-enable live rates

  const close = () => setOpen(false);

  const handleLogout = () => {
    logout();
    close();
    navigate("/");
  };

  return (
    <>
      {/* <div className="gold-rate-bar">
        <div className="container gold-rate-inner">
          <div className="row center gap-16">
            <span className="rate-item">
              <span className="rate-label">24K Gold:</span>
              <span className="rate-val">₹7,480/g</span>
              <span className="rate-change rate-up">▲ 0.4%</span>
            </span>
            <span className="rate-item">
              <span className="rate-label">22K Gold:</span>
              <span className="rate-val">₹6,860/g</span>
              <span className="rate-change rate-up">▲ 0.4%</span>
            </span>
            <span className="rate-item">
              <span className="rate-label">925 Silver:</span>
              <span className="rate-val">₹88/g</span>
            </span>
          </div>
          <div className="hallmark-badge-sm">
            <span>👑 100% BIS Hallmarked Jewelry</span>
          </div>
        </div>
      </div> */}

      <header className="navbar">
        <div className="navbar-inner">
          <Link to="/" className="brand" onClick={close}>
            <div className="brand-mark">💎</div>
            <span>
              {BRAND_NAME}
              <small>Gold &amp; Diamond Fine Jewelry</small>
            </span>
          </Link>

          <button className="nav-toggle" onClick={() => setOpen((o) => !o)} aria-label="Menu">
            ☰
          </button>

          <nav className={`nav-links ${open ? "open" : ""}`}>
            <NavLink to="/" end className="nav-link" onClick={close}>Home</NavLink>
            <NavLink to="/products" className="nav-link" onClick={close}>Collections</NavLink>
            <NavLink to="/about" className="nav-link" onClick={close}>Heritage</NavLink>
            <NavLink to="/contact" className="nav-link" onClick={close}>Showroom &amp; Contact</NavLink>
            <NavLink to="/cart" className="nav-link cart-link" onClick={close}>
              Inquiry Cart
              {count > 0 && <span className="cart-badge">{count}</span>}
            </NavLink>
            {isAuthenticated ? (
              <>
                <NavLink to="/profile" className="nav-link" onClick={close}>
                  Hi, {customer.name || customer.email.split("@")[0]}
                </NavLink>
                <button className="btn btn-outline btn-sm" onClick={handleLogout}>Logout</button>
              </>
            ) : (
              <Link to="/login" className="btn btn-primary btn-sm" onClick={close}>Client Login</Link>
            )}
          </nav>
        </div>
      </header>
    </>
  );
}

