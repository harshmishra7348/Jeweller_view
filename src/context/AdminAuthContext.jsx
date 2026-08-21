import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { STORAGE } from "../config";
import { auth as authApi } from "../api/services";

/** Admin authentication. Stores the JWT that authorises the admin API calls. */

const AdminAuthContext = createContext(null);

export function AdminAuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(STORAGE.adminToken));

  useEffect(() => {
    if (token) localStorage.setItem(STORAGE.adminToken, token);
    else localStorage.removeItem(STORAGE.adminToken);
  }, [token]);

  const login = async (email, password) => {
    const jwt = await authApi.login(email, password);
    setToken(jwt);
    return jwt;
  };

  const logout = () => setToken(null);

  const value = useMemo(
    () => ({ token, isAuthenticated: !!token, login, logout }),
    [token]
  );

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error("useAdminAuth must be used within an AdminAuthProvider");
  return ctx;
}
