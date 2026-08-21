import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { createPortal } from "react-dom";

const ToastContext = createContext(null);

let idSeq = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const remove = useCallback((id) => {
    setToasts((list) => list.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (message, type = "info", ttl = 3500) => {
      const id = ++idSeq;
      setToasts((list) => [...list, { id, message, type }]);
      if (ttl) setTimeout(() => remove(id), ttl);
    },
    [remove]
  );

  const toast = React.useMemo(
    () => ({
      success: (m) => push(m, "success"),
      error: (m) => push(m, "error", 5000),
      info: (m) => push(m, "info"),
    }),
    [push]
  );

  // Blur #root via a body class — toast stack is portalled outside #root so it stays sharp
  const hasError = toasts.some((t) => t.type === "error");
  useEffect(() => {
    if (hasError) {
      document.body.classList.add("has-error-toast");
    } else {
      document.body.classList.remove("has-error-toast");
    }
    return () => document.body.classList.remove("has-error-toast");
  }, [hasError]);

  return (
    <ToastContext.Provider value={toast}>
      {children}
      {/* Portal renders the toast stack into document.body — outside #root — so it is never blurred */}
      {createPortal(
        <div className="toast-stack" aria-live="polite">
          {toasts.map((t) => (
            <div key={t.id} className={`toast toast-${t.type}`} onClick={() => remove(t.id)}>
              <span className="toast-icon">{t.type === "error" ? "✕" : t.type === "success" ? "✓" : "ℹ"}</span>
              {t.message}
            </div>
          ))}
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within a ToastProvider");
  return ctx;
}
