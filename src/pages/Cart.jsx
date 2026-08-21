import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { imageSrc } from "../config";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { enquiryCart } from "../api/services";
import { errorMessage } from "../api/http";

export default function Cart() {
  const { items, remove, setQuantity, clear } = useCart();
  const { customer } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const sendInquiry = async (e) => {
    e.preventDefault();
    if (items.length === 0) {
      toast.error("Your quote inquiry cart is empty.");
      return;
    }
    setBusy(true);
    try {
      // Reconcile server-side inquiry cart before submitting
      try {
        const serverCart = await enquiryCart.get();
        const existing = serverCart?.items || [];
        for (const it of existing) {
          await enquiryCart.remove(it.itemMSTId);
        }
      } catch {
        /* no existing cart yet */
      }
      for (const item of items) {
        await enquiryCart.add(item.id, Number(item.quantity) || 1);
      }
      await enquiryCart.submit(message.trim());
      clear();
      toast.success("Your quote inquiry has been sent to Royal Jewellers!");
      navigate("/", { replace: true });
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="empty-state">
        <div className="emoji">💎</div>
        <h3>Your Quote Inquiry Cart is Empty</h3>
        <p>Browse our collections and select “Inquire Quote” to request pricing &amp; custom specifications.</p>
        <Link to="/products" className="btn btn-primary">Explore Jewelry Collections</Link>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="section-head" style={{ marginTop: 28 }}>
        <h2>Jewelry Quote Inquiry Cart</h2>
        <p>Review your selected ornaments, then submit your inquiry for custom rates &amp; making charges.</p>
      </div>

      <div className="cart-layout">
        {/* Items */}
        <div>
          {items.map((item) => {
            const src = imageSrc(item.imageUrl);
            return (
              <div className="cart-item" key={item.id}>
                {src ? (
                  <img className="thumb" src={src} alt={item.itemName} />
                ) : (
                  <div className="thumb placeholder">👑</div>
                )}
                <div className="info">
                  <div className="row between">
                    <strong>{item.itemName}</strong>
                    <button className="btn btn-ghost btn-sm" onClick={() => remove(item.id)}>Remove</button>
                  </div>
                  <div className="muted" style={{ fontSize: "0.85rem", marginTop: 2 }}>
                    Est. Rate: ₹{Number(item.sellPrice ?? 0).toLocaleString("en-IN")} • {item.subUnit || item.unit || "22K Gold"}
                  </div>
                  <div className="row center" style={{ marginTop: 10, gap: 10 }}>
                    <span className="muted" style={{ fontSize: "0.85rem" }}>Quantity</span>
                    <div className="qty-control">
                      <button type="button" onClick={() => setQuantity(item.id, item.quantity - 1)}>−</button>
                      <input
                        value={item.quantity}
                        onChange={(e) => setQuantity(item.id, e.target.value)}
                        inputMode="numeric"
                      />
                      <button type="button" onClick={() => setQuantity(item.id, item.quantity + 1)}>+</button>
                    </div>
                    <span className="muted" style={{ fontSize: "0.85rem" }}>piece(s)</span>
                  </div>
                </div>
              </div>
            );
          })}
          <button className="btn btn-ghost btn-sm" onClick={clear}>Clear Cart</button>
        </div>

        {/* Form */}
        <form className="card cart-summary" onSubmit={sendInquiry}>
          <h3 style={{ marginTop: 0, fontFamily: "var(--font-display)" }}>Submit Quote Inquiry</h3>
          <p className="muted" style={{ fontSize: "0.85rem", marginTop: 0 }}>
            Our jewelry experts will review your request and contact you directly.
          </p>

          <div className="sending-as">
            <span className="muted">Client Account</span>
            <strong>{customer?.name || customer?.email}</strong>
            {customer?.email && customer?.name && (
              <span className="muted" style={{ fontSize: "0.82rem" }}>{customer.email}</span>
            )}
          </div>

          <div className="field">
            <label>Notes / Requirements <span className="muted">(optional)</span></label>
            <textarea
              className="textarea"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Specify custom weight requirements, ring size, gold purity preferences, or showroom appointment time..."
            />
          </div>
          <div className="row between" style={{ margin: "6px 0 14px" }}>
            <span className="muted">Ornaments in inquiry</span>
            <strong>{items.length}</strong>
          </div>
          <button className="btn btn-primary btn-block" disabled={busy}>
            {busy ? "Submitting Inquiry…" : "Submit Quote Inquiry"}
          </button>
        </form>
      </div>
    </div>
  );
}
