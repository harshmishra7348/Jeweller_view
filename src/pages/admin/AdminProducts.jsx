import React, { useCallback, useEffect, useMemo, useState } from "react";
import { adminProducts } from "../../api/services";
import { errorMessage } from "../../api/http";
import { imageSrc } from "../../config";
import Spinner from "../../components/common/Spinner";
import Modal from "../../components/common/Modal";
import ProductForm from "./ProductForm";
import { useToast } from "../../context/ToastContext";

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const [editing, setEditing] = useState(undefined); // undefined=closed, null=create, obj=edit
  const [stockTarget, setStockTarget] = useState(null);
  const toast = useToast();

  // Debounce search query by 500ms
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query);
    }, 500);
    return () => clearTimeout(handler);
  }, [query]);

  const load = useCallback(async (searchKey = "", showSpinner = false) => {
    if (showSpinner) setLoading(true);
    try {
      const k = searchKey.trim();
      const data = k ? await adminProducts.search(k) : await adminProducts.list();
      setProducts(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      if (showSpinner) setLoading(false);
    }
  }, [toast]);

  // Load products whenever debounced query changes
  useEffect(() => {
    if (isFirstLoad) {
      load(debouncedQuery, true);
      setIsFirstLoad(false);
    } else {
      load(debouncedQuery, false);
    }
  }, [debouncedQuery, load, isFirstLoad]);

  const remove = async (p) => {
    if (!window.confirm(`Delete "${p.itemName}"? It will be hidden from the storefront.`)) return;
    try {
      await adminProducts.remove(p.id);
      toast.success("Product deleted.");
      load(debouncedQuery, false);
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  return (
    <>
      <div className="panel">
        <div className="panel-head">
          <h2 style={{ fontFamily: "var(--font-display)" }}>Jewelry Inventory</h2>
          <span className="badge badge-muted">{products.filter((p) => p.active).length} active</span>
          <div className="spacer" />
          <input
            className="input"
            style={{ maxWidth: 220 }}
            placeholder="Search ornaments…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
              }
            }}
          />
          <button className="btn btn-primary" style={{ marginLeft: 8 }} onClick={() => setEditing(null)}>+ Add Jewelry Item</button>
        </div>

        {loading ? (
          <Spinner full />
        ) : products.length === 0 ? (
          <div className="empty-state">
            <h3>{query.trim() ? "No matching ornaments found" : "No jewelry items found"}</h3>
            <p>{query.trim() ? "Try a different search query." : "Add your first ornament to get started."}</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th></th><th>Ornament Name</th><th>Sell ₹</th><th>Cost ₹</th><th>Stock</th><th>Unit</th><th>GST</th><th>Status</th><th></th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => {
                  const src = imageSrc(p.imageUrl);
                  const low = (p.quantity ?? 0) <= 10;
                  return (
                    <tr key={p.id}>
                      <td>{src ? <img className="thumb-cell" src={src} alt="" /> : <div className="thumb-cell placeholder">👑</div>}</td>
                      <td><strong>{p.itemName}</strong></td>
                      <td>₹{Number(p.sellPrice ?? 0).toLocaleString("en-IN")}</td>
                      <td>₹{Number(p.price ?? 0).toLocaleString("en-IN")}</td>
                      <td>
                        <span className={low ? "badge badge-warning" : ""}>{p.quantity}</span>
                      </td>
                      <td>{p.unit}</td>
                      <td>{p.gst}%</td>
                      <td>
                        {p.active ? <span className="badge badge-success">Active</span> : <span className="badge badge-muted">Deleted</span>}
                      </td>
                      <td>
                        <div className="actions">
                          <button className="btn btn-outline btn-sm" onClick={() => setStockTarget(p)}>Stock</button>
                          <button className="btn btn-outline btn-sm" onClick={() => setEditing(p)}>Edit</button>
                          {p.active && <button className="btn btn-danger btn-sm" onClick={() => remove(p)}>Delete</button>}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editing !== undefined && (
        <ProductForm
          product={editing}
          onClose={() => setEditing(undefined)}
          onSaved={() => { setEditing(undefined); load(debouncedQuery, false); }}
        />
      )}

      {stockTarget && (
        <StockModal
          product={stockTarget}
          onClose={() => setStockTarget(null)}
          onDone={() => { setStockTarget(null); load(debouncedQuery, false); }}
        />
      )}
    </>
  );
}

function StockModal({ product, onClose, onDone }) {
  const [delta, setDelta] = useState("");
  const [busy, setBusy] = useState(false);
  const toast = useToast();

  const apply = async (sign) => {
    const amount = Number(delta);
    if (!amount || amount <= 0) { toast.error("Enter a quantity greater than zero."); return; }
    setBusy(true);
    try {
      await adminProducts.adjustStock(product.id, sign * amount);
      toast.success("Stock updated.");
      onDone();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      narrow
      title={`Adjust stock — ${product.itemName}`}
      onClose={onClose}
      footer={<button className="btn btn-ghost" onClick={onClose} disabled={busy}>Close</button>}
    >
      <p className="muted" style={{ marginTop: 0 }}>Current stock: <strong>{product.quantity} {product.unit}</strong></p>
      <div className="field">
        <label>Quantity</label>
        <input className="input" type="number" min="0" step="0.001" value={delta} onChange={(e) => setDelta(e.target.value)} placeholder="e.g. 10" />
      </div>
      <div className="row">
        <button className="btn btn-primary grow" disabled={busy} onClick={() => apply(1)}>+ Add stock</button>
        <button className="btn btn-danger grow" disabled={busy} onClick={() => apply(-1)}>− Remove stock</button>
      </div>
    </Modal>
  );
}
