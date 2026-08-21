import React, { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useToast } from "../context/ToastContext";
import { errorMessage } from "../api/http";

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [busy, setBusy] = useState(false);
  const { login, isAuthenticated } = useAuth();
  const cart = useCart();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const pendingProduct = location.state?.pendingProduct || null;
  const from = location.state?.from || "/";

  // Already signed in? Don't show the login form — go where they were headed.
  if (isAuthenticated) return <Navigate to={pendingProduct ? "/cart" : from} replace />;

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await login(form.email.trim(), form.password);
      toast.success("Welcome back!");
      // If they came here from "Get in touch", drop the product into the cart.
      if (pendingProduct) {
        if (!cart.has(pendingProduct.id)) cart.add(pendingProduct);
        navigate("/cart", { replace: true });
      } else {
        navigate(from, { replace: true });
      }
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <h1>Client Portal Login</h1>
        <p className="sub">Sign in to submit custom jewelry quote inquiries and manage your account.</p>
        {pendingProduct && (
          <div className="badge badge-warning" style={{ marginBottom: 18 }}>
            Sign in to add “{pendingProduct.itemName}” to your inquiry
          </div>
        )}
        <form onSubmit={submit}>
          <div className="field">
            <label>Email</label>
            <input className="input" type="email" name="email" required value={form.email} onChange={onChange} placeholder="you@example.com" />
          </div>
          <div className="field">
            <label>Password</label>
            <input className="input" type="password" name="password" required value={form.password} onChange={onChange} placeholder="••••••••" />
          </div>
          <button className="btn btn-primary btn-block" disabled={busy}>
            {busy ? "Signing in…" : "Sign in"}
          </button>
        </form>
        <p className="auth-switch">
          New here?{" "}
          <Link to="/register" state={location.state}>Create an account</Link>
        </p>
      </div>
    </div>
  );
}
