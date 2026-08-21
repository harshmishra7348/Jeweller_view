import React, { useCallback, useEffect, useState } from "react";
import { adminPurchases, adminProducts, downloadBlob } from "../../api/services";
import { errorMessage } from "../../api/http";
import Spinner from "../../components/common/Spinner";
import Modal from "../../components/common/Modal";
import { useToast } from "../../context/ToastContext";

const fmtDate = (s) => (s ? new Date(s).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "-");
const money = (n) => `₹${Number(n ?? 0).toLocaleString("en-IN")}`;

export default function AdminPurchases() {
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const toast = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminPurchases.list();
      setPurchases(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  const remove = async (p) => {
    if (!window.confirm(`Delete purchase ${p.purchaseNumber}?`)) return;
    try {
      await adminPurchases.remove(p.id);
      toast.success("Purchase deleted.");
      load();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  const exportExcel = async () => {
    try {
      const blob = await adminPurchases.exportExcel();
      downloadBlob(blob, "purchase-records.xlsx");
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  return (
    <>
      <div className="panel">
        <div className="panel-head">
          <h2 style={{ fontFamily: "var(--font-display)" }}>Bullion & Stock Purchases</h2>
          <span className="badge badge-muted">{purchases.length}</span>
          <div className="spacer" />
          <button className="btn btn-outline" onClick={exportExcel}>⭳ Export Excel</button>
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>+ Record Purchase</button>
        </div>

        {loading ? (
          <Spinner full />
        ) : purchases.length === 0 ? (
          <div className="empty-state"><h3>No purchases yet</h3><p>Record bullion or stock bought from a supplier/wholesaler to grow your jewelry inventory.</p></div>
        ) : (
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr><th>Purchase #</th><th>Supplier</th><th>GST No.</th><th>Date</th><th>Tax</th><th>Amount</th><th>Status</th><th></th></tr>
              </thead>
              <tbody>
                {purchases.map((p) => (
                  <tr key={p.id}>
                    <td><strong>{p.purchaseNumber}</strong></td>
                    <td>{p.supplierName}</td>
                    <td>{p.supplierGst || "-"}</td>
                    <td>{fmtDate(p.purchaseDate)}</td>
                    <td>{money(p.tax)}</td>
                    <td><strong>{money(p.amount)}</strong></td>
                    <td><StatusBadge status={p.purchaseStatus} /></td>
                    <td><button className="btn btn-danger btn-sm" onClick={() => remove(p)}>Delete</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showForm && (
        <PurchaseForm onClose={() => setShowForm(false)} onSaved={() => { setShowForm(false); load(); }} />
      )}
    </>
  );
}

function StatusBadge({ status }) {
  const map = { COMPLETED: "badge-success", PENDING: "badge-warning", CANCELLED: "badge-danger" };
  return <span className={`badge ${map[status] || "badge-muted"}`}>{status || "-"}</span>;
}

function PurchaseForm({ onClose, onSaved }) {
  const [products, setProducts] = useState([]);
  const [head, setHead] = useState({ supplierName: "", supplierGst: "", address: "", tax: "0" });
  const [lines, setLines] = useState([{ itemMSTId: "", quantity: "", costPrice: "" }]);
  const [busy, setBusy] = useState(false);
  const toast = useToast();

  useEffect(() => {
    (async () => {
      try {
        const data = await adminProducts.list();
        setProducts((data || []).filter((p) => p.active));
      } catch (err) {
        toast.error(errorMessage(err));
      }
    })();
  }, [toast]);

  const setLine = (i, key, val) => setLines((ls) => ls.map((l, idx) => (idx === i ? { ...l, [key]: val } : l)));
  const addLine = () => setLines((ls) => [...ls, { itemMSTId: "", quantity: "", costPrice: "" }]);
  const removeLine = (i) => setLines((ls) => (ls.length === 1 ? ls : ls.filter((_, idx) => idx !== i)));

  const lineProduct = (line) => products.find((p) => String(p.id) === String(line.itemMSTId));
  const onPickProduct = (i, id) => {
    const prod = products.find((p) => String(p.id) === String(id));
    setLines((ls) => ls.map((l, idx) => (idx === i ? { ...l, itemMSTId: id, costPrice: l.costPrice || (prod?.price ?? "") } : l)));
  };

  const subtotal = lines.reduce((s, l) => {
    const prod = lineProduct(l);
    const quantity = Number(l.quantity) || 0;
    const costPrice = Number(l.costPrice) || 0;
    const perUnitQuantity = prod?.subUnit ? Number(prod.perUnitQuantity) || 0 : 1;
    return s + quantity * perUnitQuantity * costPrice;
  }, 0);
  const taxRate = Number(head.tax) || 0;
  const taxAmount = (subtotal * taxRate) / 100;
  const grand = subtotal + taxAmount;

  const submit = async (e) => {
    e.preventDefault();
    const items = lines
      .filter((l) => l.itemMSTId && Number(l.quantity) > 0)
      .map((l) => ({ itemMSTId: Number(l.itemMSTId), quantity: Number(l.quantity), costPrice: Number(l.costPrice) }));
    if (!head.supplierName.trim()) { toast.error("Supplier name is required."); return; }
    if (!head.address.trim()) { toast.error("Supplier address is required."); return; }
    if (items.length === 0) { toast.error("Add at least one product line."); return; }
    setBusy(true);
    try {
      await adminPurchases.create({
        supplierName: head.supplierName.trim(),
        supplierGst: head.supplierGst.trim(),
        address: head.address.trim(),
        tax: taxRate,
        items,
      });
      toast.success("Purchase recorded — stock updated.");
      onSaved();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      title="Record Bullion / Stock Purchase"
      onClose={onClose}
      footer={
        <>
          <button className="btn btn-ghost" onClick={onClose} disabled={busy}>Cancel</button>
          <button className="btn btn-primary" form="purchase-form" disabled={busy}>{busy ? "Saving…" : "Save Purchase Record"}</button>
        </>
      }
    >
      <form id="purchase-form" onSubmit={submit}>
        <div className="form-grid">
          <div className="field">
            <label>Supplier / Wholesaler Name *</label>
            <input className="input" value={head.supplierName} onChange={(e) => setHead({ ...head, supplierName: e.target.value })} required placeholder="e.g. Mumbai Gold Merchants Pvt Ltd" />
          </div>
          <div className="field">
            <label>Supplier GSTIN</label>
            <input className="input" value={head.supplierGst} onChange={(e) => setHead({ ...head, supplierGst: e.target.value })} placeholder="24AAAAA0000A1Z5" />
          </div>
          <div className="field span-2">
            <label>Supplier Address *</label>
            <input className="input" required value={head.address} onChange={(e) => setHead({ ...head, address: e.target.value })} placeholder="Bullion market / warehouse address" />
          </div>
        </div>

        <label style={{ fontWeight: 600, fontSize: "0.85rem", display: "block", margin: "8px 0 10px" }}>Jewelry / Bullion Items Purchased</label>
        <div className="line-items">
          {lines.map((l, i) => (
            <div className="line-row" key={i}>
              <div className="field">
                <label>Jewelry Item / Ornament</label>
                <select className="select" value={l.itemMSTId} onChange={(e) => onPickProduct(i, e.target.value)}>
                  <option value="">Select ornament…</option>
                  {products.map((p) => <option key={p.id} value={p.id}>{p.itemName}</option>)}
                </select>
              </div>
              <div className="field">
                <label>Qty / Pieces</label>
                <input className="input" type="number" min="0" step="0.001" value={l.quantity} onChange={(e) => setLine(i, "quantity", e.target.value)} />
                {lineProduct(l)?.subUnit && Number(l.quantity) > 0 && (
                  <div className="hint" style={{ marginTop: 6, fontSize: "0.8rem" }}>
                    {Number(lineProduct(l).perUnitQuantity || 0).toLocaleString("en-IN")} × {Number(l.quantity).toLocaleString("en-IN")}
                  </div>
                )}
              </div>
              <div className="field">
                <label>Cost ₹/{lineProduct(l)?.subUnit ? lineProduct(l)?.subUnit : lineProduct(l)?.unit || "unit"}</label>
                <input className="input" type="number" min="0" step="0.01" value={l.costPrice} onChange={(e) => setLine(i, "costPrice", e.target.value)} />
              </div>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => removeLine(i)} title="Remove">🗑</button>
            </div>
          ))}
        </div>
        <button type="button" className="btn btn-outline btn-sm" style={{ marginTop: 12 }} onClick={addLine}>+ Add item</button>

        <div className="totals-box">
          <div className="line"><span>Subtotal</span><span>₹{subtotal.toLocaleString("en-IN")}</span></div>
          <div className="line">
            <span>Tax (%)
              <input className="input" style={{ width: 70, display: "inline-block", marginLeft: 8, padding: "4px 8px" }} type="number" min="0" step="0.01" value={head.tax} onChange={(e) => setHead({ ...head, tax: e.target.value })} />
            </span>
            <span>₹{taxAmount.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</span>
          </div>
          <div className="line grand"><span>Grand Total</span><span>₹{grand.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</span></div>
        </div>
      </form>
    </Modal>
  );
}
