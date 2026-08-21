import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { STORAGE } from "../config";
import { auth as authApi } from "../api/services";

/**
 * Customer authentication for the storefront. Login is the gate before a
 * customer may add products to the inquiry cart. The enquiry endpoint itself
 * is public, so this token is used purely to know "is a customer signed in"
 * and to pre-fill their contact details on the cart's enquiry form.
 */

const AuthContext = createContext(null);

function readCustomer() {
  try {
    const raw = localStorage.getItem(STORAGE.customer);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [customer, setCustomer] = useState(readCustomer);

  useEffect(() => {
    if (customer) {
      localStorage.setItem(STORAGE.customer, JSON.stringify(customer));
    } else {
      localStorage.removeItem(STORAGE.customer);
    }
  }, [customer]);

  const login = async (email, password) => {
    const token = await authApi.login(email, password);
    // Login only returns a JWT; keep the email we know and merge any cached profile.
    const prev = readCustomer();
    setCustomer({
      token,
      email,
      name: prev && prev.email === email ? prev.name : "",
      phone: prev && prev.email === email ? prev.phone : "",
    });
  };

  const register = async (form) => {
    // form: { name, companyName, phone, email, address, password }
    await authApi.register({
      name: form.name,
      companyName: form.companyName || "",
      address: form.address || "",
      phoneNumber: form.phone,
      email: form.email,
      password: form.password,
      merchant: false,
    });
    // Auto sign-in after a successful registration.
    const token = await authApi.login(form.email, form.password);
    setCustomer({
      token,
      email: form.email,
      name: form.name,
      phone: form.phone,
      companyName: form.companyName || "",
    });
  };

  const logout = () => setCustomer(null);

  // Merge fresh profile fields (e.g. after the customer edits their profile) so
  // the navbar greeting and cart pre-fill stay in sync.
  const updateCustomer = (partial) =>
    setCustomer((c) => (c ? { ...c, ...partial } : c));

  const value = useMemo(
    () => ({ customer, isAuthenticated: !!customer, login, register, logout, updateCustomer }),
    [customer]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
