import React, { useEffect, useMemo, useState } from "react";
import Modal from "../../components/common/Modal";
import { adminProducts, adminCustomers, adminSales, adminTransport } from "../../api/services";
import { errorMessage } from "../../api/http";
import { useToast } from "../../context/ToastContext";

/**
 * Create a sale (invoice). Picks a customer, adds product lines (qty + unit
 * price), sets GST/tax and transport. On save the backend decrements stock, stores the
 * invoice, and emails the PDF to the customer.
 */
export default function SaleForm({ onClose, onSaved }) {
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [transports, setTransports] = useState([]);
  const [head, setHead] = useState({ userMSTId: "", transportMSTId: "", address: "", GSTNumber: "", tax: "0", labour: "0", discount: "0" });
  const [lines, setLines] = useState([{ id: "", quantity: "", price: "" }]);
  const [busy, setBusy] = useState(false);
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const toast = useToast();

  const loadCustomers = async () => {
    try {
      var data = await adminCustomers.list();
      data = data.filter((c)=>c.admin===false);
      // data = (data || []).filter((c) => !c.admin);
      setCustomers(Array.isArray(data) ? data : []);
      return data;
    } catch (err) {
      toast.error(errorMessage(err));
      return [];
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const prods = await adminProducts.list();
        setProducts((prods || []).filter((p) => p.active && (p.quantity ?? 0) > 0));
      } catch (err) {
        toast.error(errorMessage(err));
      }
      try {
        const trans = await adminTransport.list();
        setTransports((trans || []).filter((t) => t.active !== false));
      } catch (err) {
        // Transport loading optional
      }
      loadCustomers();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedCustomer = useMemo(
    () => customers.find((c) => String(c.id) === String(head.userMSTId)),
    [customers, head.userMSTId]
  );

  // Default the billing address to the customer's stored address.
  useEffect(() => {
    if (selectedCustomer && !head.address) {
      setHead((h) => ({ ...h, address: selectedCustomer.address || "" }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [head.userMSTId]);

  const setLine = (i, key, val) => setLines((ls) => ls.map((l, idx) => (idx === i ? { ...l, [key]: val } : l)));
  const addLine = () => setLines((ls) => [...ls, { id: "", quantity: "", price: "" }]);
  const removeLine = (i) => setLines((ls) => (ls.length === 1 ? ls : ls.filter((_, idx) => idx !== i)));

  const onPickProduct = (i, id) => {
    const prod = products.find((p) => String(p.id) === String(id));
    setLines((ls) => ls.map((l, idx) => (idx === i ? { ...l, id, price: l.price || (prod?.sellPrice ?? "") } : l)));
  };

  const stockFor = (id) => products.find((p) => String(p.id) === String(id))?.quantity ?? 0;
  const lineProduct = (line) => products.find((p) => String(p.id) === String(line.id));

  const subtotal = lines.reduce((s, l) => {
    const prod = lineProduct(l);
    const quantity = Number(l.quantity) || 0;
    const price = Number(l.price) || 0;
    const perUnitQuantity = prod?.subUnit ? Number(prod.perUnitQuantity) || 0 : 1;
    const lineTotal = quantity * perUnitQuantity * price;
    return s + lineTotal;
  }, 0);

  const taxStats = lines.reduce(
    (acc, l) => {
      const prod = lineProduct(l);
      const quantity = Number(l.quantity) || 0;
      const price = Number(l.price) || 0;
      const perUnitQuantity = prod?.subUnit ? Number(prod.perUnitQuantity) || 0 : 1;
      const lineTotal = quantity * perUnitQuantity * price;
      if (prod && quantity > 0) {
        const gst = Number(prod.gst) || 0;
        acc.totalAmount += lineTotal;
        acc.totalTaxAmount += lineTotal * gst;
        acc.count += 1;
        acc.simpleGST += gst;
      }
      return acc;
    },
    { totalAmount: 0, totalTaxAmount: 0, count: 0, simpleGST: 0 }
  );

  const taxRate = taxStats.count > 0
    ? taxStats.totalAmount > 0
      ? taxStats.totalTaxAmount / taxStats.totalAmount
      : taxStats.simpleGST / taxStats.count
    : 0;
  const taxAmount = (subtotal * taxRate) / 100;
  const labour = Number(head.labour) || 0;
  const discount = Number(head.discount) || 0;
  const grand = subtotal + taxAmount + labour - discount;

  const submit = async (e) => {
    e.preventDefault();
    if (!head.userMSTId) { toast.error("Please select a customer."); return; }
    if (!head.transportMSTId) { toast.error("Please select a transport."); return; }
    const itemMSTS = lines
      .filter((l) => l.id && Number(l.quantity) > 0)
      .map((l) => ({ id: Number(l.id), quantity: Number(l.quantity), price: Number(l.price) }));
    if (itemMSTS.length === 0) { toast.error("Add at least one product line."); return; }
    // Client-side stock guard (backend also validates).
    for (const l of itemMSTS) {
      if (l.quantity > stockFor(l.id)) {
        const name = products.find((p) => p.id === l.id)?.itemName;
        toast.error(`Only ${stockFor(l.id)} of "${name}" in stock.`);
        return;
      }
    }
    setBusy(true);
    try {
      const payload = {
        itemMSTS,
        userMSTId: Number(head.userMSTId),
        transportMSTId: Number(head.transportMSTId),
        address: (head.address || "").trim(),
        gstNumber: (head.GSTNumber || "").trim(),
        tax: taxRate,
        labour: Number(head.labour) || 0,
        discount: Number(head.discount) || 0,
      };
      await adminSales.create(payload);
      toast.success("Invoice created and emailed to the customer.");
      onSaved();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Modal
        title="Create Jewelry Sale / Invoice"
        onClose={onClose}
        footer={
          <>
            <button className="btn btn-ghost" onClick={onClose} disabled={busy}>Cancel</button>
            <button className="btn btn-primary" form="sale-form" disabled={busy}>{busy ? "Creating…" : "Create & Email Invoice"}</button>
          </>
        }
      >
        <form id="sale-form" onSubmit={submit}>
          <div className="form-grid">
            <div className="field">
              <label>Customer *</label>
              <div className="row" style={{ gap: 8 }}>
                <select className="select grow" value={head.userMSTId} onChange={(e) => setHead({ ...head, userMSTId: e.target.value, address: "" })} required>
                  <option value="">Select customer…</option>
                  {customers.map((c) => <option key={c.id} value={c.id}>{c.name || c.email} — {c.phoneNumber}</option>)}
                </select>
                <button type="button" className="btn btn-outline btn-sm" onClick={() => setShowAddCustomer(true)}>+ New</button>
              </div>
            </div>
            <div className="field">
              <label>Transport / Courier *</label>
              <select className="select" value={head.transportMSTId} onChange={(e) => setHead({ ...head, transportMSTId: e.target.value })} required>
                <option value="">Select transport partner…</option>
                {transports.map((t) => <option key={t.id} value={t.id}>{t.transportName}</option>)}
              </select>
            </div>
            <div className="field">
              <label>Customer GSTIN</label>
              <input className="input" value={head.GSTNumber} onChange={(e) => setHead({ ...head, GSTNumber: e.target.value.toUpperCase() })} placeholder="24AAAAA0000A1Z5" />
            </div>
            <div className="field">
              <label>Making / Labour Charges (₹) <span className="muted">(optional)</span></label>
              <input className="input" type="number" min="0" step="0.01" value={head.labour} onChange={(e) => setHead({ ...head, labour: e.target.value })} placeholder="₹ 0.00" />
            </div>
            <div className="field">
              <label>Discount (₹) <span className="muted">(optional)</span></label>
              <input className="input" type="number" min="0" step="0.01" value={head.discount} onChange={(e) => setHead({ ...head, discount: e.target.value })} placeholder="₹ 0.00" />
            </div>
            <div className="field span-2">
              <label>Billing / Delivery Address</label>
              <input className="input" value={head.address} onChange={(e) => setHead({ ...head, address: e.target.value })} placeholder="Showroom / customer billing address" />
            </div>
          </div>

          <label style={{ fontWeight: 600, fontSize: "0.85rem", display: "block", margin: "8px 0 10px" }}>Ornaments / Items Sold</label>
          <div className="line-items">
            {lines.map((l, i) => (
              <div className="line-row" key={i}>
                <div className="field">
                  <label>Jewelry Item</label>
                  <select className="select" value={l.id} onChange={(e) => onPickProduct(i, e.target.value)}>
                    <option value="">Select ornament…</option>
                    {products.map((p) => <option key={p.id} value={p.id}>{p.itemName} (stock {p.quantity})</option>)}
                  </select>
                </div>
                <div className="field">
                  <label>Qty / Pieces</label>
                  <input className="input" type="number" min="0" step="0" value={l.quantity} onChange={(e) => setLine(i, "quantity", e.target.value)} />
                  {lineProduct(l)?.subUnit && Number(l.quantity) > 0 && (
                    <div className="hint" style={{ marginTop: 6, fontSize: "0.8rem" }}>
                      {lineProduct(l).perUnitQuantity} × {Number(l.quantity).toLocaleString("en-IN")}
                    </div>
                  )}
                </div>
                <div className="field">
                  <label>
                    Rate ₹/{lineProduct(l)?.subUnit ? lineProduct(l)?.subUnit : lineProduct(l)?.unit || "item"}
                  </label>
                  <input className="input" type="number" min="0" step="0.01" value={l.price} onChange={(e) => setLine(i, "price", e.target.value)} />
                </div>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => removeLine(i)} title="Remove">🗑</button>
              </div>
            ))}
          </div>
          <button type="button" className="btn btn-outline btn-sm" style={{ marginTop: 12 }} onClick={addLine}>+ Add Item Line</button>

          <div className="totals-box">
            <div className="line"><span>Subtotal</span><span>₹{subtotal.toLocaleString("en-IN")}</span></div>
            <div className="line">
              <span>Tax / GST (%)</span>
              <span>
                <input
                  className="input"
                  style={{ width: 70, display: "inline-block", marginLeft: 8, padding: "4px 8px" }}
                  type="number"
                  min="0"
                  step="0.01"
                  value={taxRate.toFixed(2)}
                  readOnly
                />
              </span>
              <span>₹{taxAmount.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</span>
            </div>
            {labour > 0 && <div className="line"><span>Making / Labour</span><span>₹{labour.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</span></div>}
            {discount > 0 && <div className="line"><span>Discount</span><span>-₹{discount.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</span></div>}
            <div className="line grand"><span>Grand Total</span><span>₹{grand.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</span></div>
          </div>
          <p className="hint muted">The tax invoice PDF is emailed to the customer automatically on save.</p>
        </form>
      </Modal>

      {showAddCustomer && (
        <AddCustomer
          onClose={() => setShowAddCustomer(false)}
          onCreated={async (created) => {
            const list = await loadCustomers();
            const match = (list || []).find((c) => c.email === created.email);
            if (match) setHead((h) => ({ ...h, userMSTId: String(match.id) }));
            setShowAddCustomer(false);
          }}
        />
      )}
    </>
  );
}

function AddCustomer({ onClose, onCreated }) {
  const [form, setForm] = useState({ name: "", companyName: "", email: "", phoneNumber: "", address: "", password: "" });
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    if (!form.address.trim()) { toast.error("Address is required."); return; }
    if (form.password.length < 8) { toast.error("Password must be at least 8 characters."); return; }
    setBusy(true);
    try {
      await adminCustomers.create({ ...form, merchant: false });
      toast.success("Customer added.");
      onCreated(form);
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      narrow
      title="New customer"
      onClose={onClose}
      footer={
        <>
          <button className="btn btn-ghost" onClick={onClose} disabled={busy}>Cancel</button>
          <button className="btn btn-primary" form="add-cust-form" disabled={busy}>{busy ? "Saving…" : "Add customer"}</button>
        </>
      }
    >
      <form id="add-cust-form" onSubmit={submit}>
        <div className="field"><label>Name</label><input className="input" name="name" value={form.name} onChange={onChange} /></div>
        <div className="field"><label>Company / organization</label><input className="input" name="companyName" value={form.companyName} onChange={onChange} placeholder="Company or organization name" /></div>
        <div className="field"><label>Email *</label><input className="input" type="email" name="email" required value={form.email} onChange={onChange} /></div>
        <div className="field"><label>Phone *</label><input className="input" name="phoneNumber" required value={form.phoneNumber} onChange={onChange} /></div>
        <div className="field"><label>Address *</label><input className="input" name="address" required value={form.address} onChange={onChange} /></div>
        <div className="field"><label>Password *</label><input className="input" type="password" name="password" required value={form.password} onChange={onChange} placeholder="Min 8 characters" /><div className="hint">Required by the backend for the account login.</div></div>
      </form>
    </Modal>
  );
}
