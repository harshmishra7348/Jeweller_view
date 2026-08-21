import React, { useCallback, useEffect, useState } from "react";
import { adminSales, downloadBlob } from "../../api/services";
import { errorMessage } from "../../api/http";
import Spinner from "../../components/common/Spinner";
import SaleForm from "./SaleForm";
import { useToast } from "../../context/ToastContext";
import { AdminEmailPopUp } from "./AdminEmailPopUp";

const fmtDate = (s) => (s ? new Date(s).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "-");
const money = (n) => `₹${Number(n ?? 0).toLocaleString("en-IN")}`;
const STATUSES = ["PENDING", "COMPLETED", "REMAINING", "CANCELLED"];

export default function AdminSales() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const toast = useToast();
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [isFirstLoad, setIsFirstLoad] = useState(true);

  // Debounce search query by 1s (1000ms)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const load = useCallback(async (query = "", showSpinner = false) => {
    if (showSpinner) setLoading(true);
    try {
      const q = query.trim();
      const data = q ? await adminSales.search(q) : await adminSales.list();
      setInvoices(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      if (showSpinner) setLoading(false);
    }
  }, [toast]);

  // Load invoices whenever debounced query changes
  useEffect(() => {
    if (isFirstLoad) {
      load(debouncedQuery, true);
      setIsFirstLoad(false);
    } else {
      load(debouncedQuery, false);
    }
  }, [debouncedQuery, load, isFirstLoad]);

  const changeStatus = async (inv, status) => {
    try {
      await adminSales.updateStatus(inv.id, status);
      toast.success("Status updated.");
      load(debouncedQuery, false);
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  const resend = async (inv) => {
    setBusyId(inv.id);
    try {
      await adminSales.resendMail(inv.id);
      toast.success(`Invoice emailed to ${inv.userMST?.email || "customer"}.`);
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  const download = async (inv) => {
    setBusyId(inv.id);
    try {
      const blob = await adminSales.downloadPdf(inv.id);
      downloadBlob(blob, `invoice-${inv.invoiceNumber || inv.id}.pdf`);
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  const exportExcel = async () => {
    try {
      const blob = await adminSales.exportExcel();
      downloadBlob(blob, "sales-records.xlsx");
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  return (
    <>
      <div className="panel">
        <div className="panel-head">
          <h2 style={{ fontFamily: "var(--font-display)" }}>Sales & Tax Invoices</h2>
          <span className="badge badge-muted">{invoices.length}</span>
          <div className="spacer" />
          <input
            className="input"
            style={{ maxWidth: 220, marginRight: 8 }}
            placeholder="Search invoices…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
              }
            }}
          />
          <button className="btn btn-outline" style={{ marginRight: 8 }} onClick={exportExcel}>⭳ Export Excel</button>
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>+ Create Sale Invoice</button>
        </div>

        {loading ? (
          <Spinner full />
        ) : invoices.length === 0 ? (
          <div className="empty-state">
            <h3>{searchQuery.trim() ? "No matching invoices found" : "No sales invoices yet"}</h3>
            <p>{searchQuery.trim() ? "Try adjusting your search term." : "Create a jewelry sale invoice to bill a client and email them the PDF."}</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr><th>Invoice #</th><th>Customer</th><th>Date</th><th>Tax</th><th>Amount</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr key={inv.id}>
                    <td><strong>{inv.invoiceNumber}</strong></td>
                    <td>
                      {inv.customerName || "-"}
                      <div className="muted" style={{ fontSize: "0.78rem" }}>{inv.userMST?.email}</div>
                    </td>
                    <td>{fmtDate(inv.invoiceDate)}</td>
                    <td>{money(inv.tax)}</td>
                    <td><strong>{money(inv.amount)}</strong></td>
                    <td>
                      <select
                        className="select"
                        style={{ padding: "6px 10px", width: "auto" }}
                        value={inv.invoiceStatus || ""}
                        onChange={(e) => changeStatus(inv, e.target.value)}
                      >
                        {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                    <td>
                      <div className="actions">
                        <button className="btn btn-outline btn-sm" disabled={busyId === inv.id} onClick={() => download(inv)}>PDF</button>
                        <button className="btn btn-primary btn-sm" onClick={() => setSelectedInvoice(inv)}>Email</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showForm && (
        <SaleForm onClose={() => setShowForm(false)} onSaved={() => { setShowForm(false); load(debouncedQuery, false); }} />
      )}
      {selectedInvoice && (
        <AdminEmailPopUp
          invoice={selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
          onSuccess={() => setSelectedInvoice(null)}
        />
      )}
    </>
  );
}
