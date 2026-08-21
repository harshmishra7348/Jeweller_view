import React, { useCallback, useEffect, useMemo, useState } from "react";
import { adminEnquiries } from "../../api/services";
import { errorMessage } from "../../api/http";
import Spinner from "../../components/common/Spinner";
import { useToast } from "../../context/ToastContext";

const fmtDate = (s) => (s ? new Date(s).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "-");

export default function AdminEnquiries() {
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("open"); // open | all
  const toast = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminEnquiries.list();
      setEnquiries(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  const resolve = async (en) => {
    try {
      await adminEnquiries.resolve(en.id);
      toast.success("Marked as handled.");
      load();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  // Backend statuses: SUBMITTED (open) | RESOLVED (handled). Carts are excluded server-side.
  const shown = useMemo(
    () => (filter === "open" ? enquiries.filter((e) => e.status !== "RESOLVED") : enquiries),
    [enquiries, filter]
  );
  const openCount = enquiries.filter((e) => e.status !== "RESOLVED").length;

  return (
    <div className="panel">
      <div className="panel-head">
        <h2 style={{ fontFamily: "var(--font-display)" }}>Quote Inquiries</h2>
        <span className="badge badge-warning">{openCount} open</span>
        <div className="spacer" />
        <div className="row" style={{ gap: 6 }}>
          <button className={`btn btn-sm ${filter === "open" ? "btn-primary" : "btn-outline"}`} onClick={() => setFilter("open")}>Open</button>
          <button className={`btn btn-sm ${filter === "all" ? "btn-primary" : "btn-outline"}`} onClick={() => setFilter("all")}>All</button>
        </div>
      </div>

      {loading ? (
        <Spinner full />
      ) : shown.length === 0 ? (
        <div className="empty-state"><h3>{filter === "open" ? "No open inquiries" : "No inquiries yet"}</h3><p>Quote inquiry carts submitted from the showroom website land here.</p></div>
      ) : (
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr><th>Submitted</th><th>Client</th><th>Contact</th><th>Ornaments Requested</th><th>Notes / Message</th><th>Status</th><th></th></tr>
            </thead>
            <tbody>
              {shown.map((en) => {
                const resolved = en.status === "RESOLVED";
                const lines = en.items || [];
                return (
                  <tr key={en.id}>
                    <td>{fmtDate(en.submittedAt)}</td>
                    <td><strong>{en.customerName || "-"}</strong></td>
                    <td>
                      <a href={`mailto:${en.customerEmail}`} style={{ color: "var(--primary-dark)" }}>{en.customerEmail}</a>
                      <div className="muted" style={{ fontSize: "0.78rem" }}>{en.customerPhone}</div>
                    </td>
                    <td style={{ whiteSpace: "normal", maxWidth: 260 }}>
                      {lines.length === 0 ? (
                        <span className="muted">General</span>
                      ) : (
                        <ul className="enq-items">
                          {lines.map((li) => (
                            <li key={li.id}>{li.itemName} <span className="muted">× {li.quantity}</span></li>
                          ))}
                        </ul>
                      )}
                    </td>
                    <td style={{ whiteSpace: "normal", maxWidth: 240 }}>{en.message || "-"}</td>
                    <td>{resolved ? <span className="badge badge-success">Handled</span> : <span className="badge badge-warning">Open</span>}</td>
                    <td>{!resolved && <button className="btn btn-outline btn-sm" onClick={() => resolve(en)}>Mark handled</button>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
