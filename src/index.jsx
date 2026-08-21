import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import "./styles/theme.css";
import "./styles/storefront.css";
import "./styles/admin.css";

import { ToastProvider } from "./context/ToastContext";
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import { AdminAuthProvider } from "./context/AdminAuthContext";
import { applyTheme } from "./config";
import { registerLoaderCallbacks } from "./loader/loaderService";

import StoreLayout from "./components/storefront/StoreLayout";
import GlobalLoader from "./components/storefront/GlobalLoader";
import PageLoader from "./components/storefront/PageLoader";
import RequireAuth from "./components/RequireAuth";
import RequireAdmin from "./components/admin/RequireAdmin";

import Home from "./pages/Home";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Cart from "./pages/Cart";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Profile from "./pages/Profile";

import AdminLogin from "./pages/admin/AdminLogin";
import AdminLayout from "./pages/admin/AdminLayout";
import Dashboard from "./pages/admin/Dashboard";
import AdminProducts from "./pages/admin/AdminProducts";
import AdminPurchases from "./pages/admin/AdminPurchases";
import AdminSales from "./pages/admin/AdminSales";
import AdminEnquiries from "./pages/admin/AdminEnquiries";
import AdminHomeImages from "./pages/admin/AdminHomeImages";
import AdminAbout from "./pages/admin/AdminAbout";
import AdminContact from "./pages/admin/AdminContact";
import AdminHomeTheme from "./pages/admin/AdminHomeTheme";
import AdminTransport from "./pages/admin/AdminTransport";
import AdminProfile from "./pages/admin/AdminProfile";

import reportWebVitals from "./reportWebVitals";

applyTheme();

const root = ReactDOM.createRoot(document.getElementById("root"));

function App() {
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    registerLoaderCallbacks({
      start: () => setLoading(true),
      stop: () => setLoading(false),
    });
  }, []);

  return (
    <>
      <BrowserRouter>
        <PageLoader />
        {loading && <GlobalLoader />}
        <ToastProvider>
          <AuthProvider>
            <CartProvider>
              <AdminAuthProvider>
                <Routes>
                  {/* Public storefront */}
                  <Route element={<StoreLayout />}>
                    <Route path="/" element={<Home />} />
                    <Route path="/products" element={<Products />} />
                    <Route path="/product/:id" element={<ProductDetail />} />
                    <Route path="/about" element={<About />} />
                    <Route path="/contact" element={<Contact />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/cart" element={<RequireAuth><Cart /></RequireAuth>} />
                    <Route path="/profile" element={<RequireAuth><Profile /></RequireAuth>} />
                  </Route>

                  {/* Admin */}
                  <Route path="/admin/login" element={<AdminLogin />} />
                  <Route
                    path="/admin"
                    element={<RequireAdmin><AdminLayout /></RequireAdmin>}
                  >
                    <Route index element={<Dashboard />} />
                    <Route path="products" element={<AdminProducts />} />
                    <Route path="purchases" element={<AdminPurchases />} />
                    <Route path="sales" element={<AdminSales />} />
                    <Route path="enquiries" element={<AdminEnquiries />} />
                    <Route path="home-images" element={<AdminHomeImages />} />
                    <Route path="home-theme" element={<AdminHomeTheme />} />
                    <Route path="about" element={<AdminAbout />} />
                    <Route path="contact" element={<AdminContact />} />
                    <Route path="transport" element={<AdminTransport />} />
                    <Route path="profile" element={<AdminProfile />} />
                  </Route>

                  {/* Fallback */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </AdminAuthProvider>
            </CartProvider>
          </AuthProvider>
        </ToastProvider>
      </BrowserRouter>
    </>
  );
}

root.render(<React.StrictMode><App /></React.StrictMode>);

reportWebVitals();
