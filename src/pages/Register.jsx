import React, { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useToast } from "../context/ToastContext";
import { errorMessage } from "../api/http";

export default function Register() {
  const [form, setForm] = useState({
    name: "",
    companyName: "",
    phone: "",
    email: "",
    address: "",
    password: "",
    confirm: "",
  });
  const [busy, setBusy] = useState(false);
  const { register, isAuthenticated } = useAuth();
  const cart = useCart();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const pendingProduct = location.state?.pendingProduct || null;

  // Already signed in? Skip the registration form.
  if (isAuthenticated) return <Navigate to={pendingProduct ? "/cart" : "/"} replace />;

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    if (form.password.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }
    if (!form.address.trim()) {
      toast.error("Address is required.");
      return;
    }
    if (form.password !== form.confirm) {
      toast.error("Passwords do not match.");
      return;
    }
    setBusy(true);
    try {
      await register(form);
      toast.success("Account created — you're signed in!");
      if (pendingProduct) {
        if (!cart.has(pendingProduct.id)) cart.add(pendingProduct);
        navigate("/cart", { replace: true });
      } else {
        navigate("/", { replace: true });
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
        <h1>Register Client Account</h1>
        <p className="sub">Create an account to request custom jewelry quotes &amp; manage showroom orders.</p>
        <form onSubmit={submit}>
          <div className="field">
            <label>Full name</label>
            <input className="input" name="name" required value={form.name} onChange={onChange} placeholder="Your name" />
          </div>
          <div className="field">
            <label>Company / organization <span className="muted">(optional)</span></label>
            <input className="input" name="companyName" value={form.companyName} onChange={onChange} placeholder="Company or organization name" />
          </div>
          <div className="field">
            <label>Phone number</label>
            <input className="input" name="phone" required value={form.phone} onChange={onChange} placeholder="+91 …" />
          </div>
          <div className="field">
            <label>Email</label>
            <input className="input" type="email" name="email" required value={form.email} onChange={onChange} placeholder="you@example.com" />
          </div>
          <div className="field">
            <label>Address</label>
            <input className="input" name="address" required value={form.address} onChange={onChange} placeholder="Shipping / billing address" />
          </div>
          <div className="field">
            <label>Password</label>
            <input className="input" type="password" name="password" required value={form.password} onChange={onChange} placeholder="At least 8 characters" />
          </div>
          <div className="field">
            <label>Confirm password</label>
            <input className="input" type="password" name="confirm" required value={form.confirm} onChange={onChange} placeholder="Re-enter password" />
          </div>
          <button className="btn btn-primary btn-block" disabled={busy}>
            {busy ? "Creating account…" : "Create account"}
          </button>
        </form>
        <p className="auth-switch">
          Already have an account?{" "}
          <Link to="/login" state={location.state}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}
