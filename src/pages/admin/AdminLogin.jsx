import React, { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { BRAND_NAME } from "../../config";
import { useAdminAuth } from "../../context/AdminAuthContext";
import { useToast } from "../../context/ToastContext";
import { errorMessage } from "../../api/http";

export default function AdminLogin() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [busy, setBusy] = useState(false);
  const { login, isAuthenticated } = useAdminAuth();
  const toast = useToast();
  const navigate = useNavigate();

  // Already signed in as admin? Go straight to the dashboard.
  if (isAuthenticated) return <Navigate to="/admin" replace />;

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await login(form.email.trim(), form.password);
      toast.success("Signed in to the admin panel.");
      navigate("/admin", { replace: true });
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="admin-login-shell">
      <div className="admin-login-card">
        <div className="brand">
          <span className="brand-mark">💎</span>
          <span>
            {BRAND_NAME}
            <small>Jeweller Console</small>
          </span>
        </div>
        <p className="sub">Sign in with your Jeweller merchant credentials.</p>
        <form onSubmit={submit}>
          <div className="field">
            <label>Email</label>
            <input className="input" type="email" name="email" required value={form.email} onChange={onChange} placeholder="admin@example.com" />
          </div>
          <div className="field">
            <label>Password</label>
            <input className="input" type="password" name="password" required value={form.password} onChange={onChange} placeholder="••••••••" />
          </div>
          <button className="btn btn-primary btn-block" disabled={busy}>
            {busy ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
