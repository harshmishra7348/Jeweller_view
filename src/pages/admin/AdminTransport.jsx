import React, { useCallback, useEffect, useState } from "react";
import { adminTransport } from "../../api/services";
import { errorMessage } from "../../api/http";
import Spinner from "../../components/common/Spinner";
import Modal from "../../components/common/Modal";
import { useToast } from "../../context/ToastContext";

export default function AdminTransport() {
  const [transports, setTransports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(undefined);
  const [search, setSearch] = useState("");
  const toast = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminTransport.list();
      setTransports(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  const remove = async (transport) => {
    if (!window.confirm(`Delete "${transport.transportName}"?`)) return;
    try {
      await adminTransport.remove(transport.id);
      toast.success("Transport deleted.");
      load();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  const filtered = transports.filter((t) =>
    t.transportName.toLowerCase().includes(search.toLowerCase()) ||
    (t.transportGst || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <div className="panel">
        <div className="panel-head">
          <h2>Transport Management</h2>
          <input
            className="input"
            type="text"
            placeholder="🔍 Search by name or GST…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: 280, borderRadius: 8 }}
          />
          <div className="spacer" />
          <button className="btn btn-primary" onClick={() => setEditing(null)}>
            <span style={{ marginRight: 6 }}>➕</span> Add transport
          </button>
        </div>
        <div className="panel-body">
          {loading ? (
            <Spinner full />
          ) : filtered.length === 0 ? (
            <div className="empty-state">
              <h3>🚚 No transports yet</h3>
              <p>Add your first transport company to get started.</p>
              <button className="btn btn-primary" onClick={() => setEditing(null)} style={{ marginTop: 12 }}>
                Add transport
              </button>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
              {filtered.map((transport) => (
                <div
                  key={transport.id}
                  style={{
                    background: "var(--surface-1)",
                    border: "1px solid var(--surface-3)",
                    borderRadius: 12,
                    padding: 20,
                    transition: "all 0.2s",
                    cursor: "pointer",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "var(--primary)";
                    e.currentTarget.style.boxShadow = "0 2px 8px rgba(18, 133, 90, 0.1)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "var(--surface-3)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 12 }}>
                    <div style={{ fontSize: "1.8rem" }}>🚚</div>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 600 }}>
                        {transport.transportName}
                      </h3>
                      {transport.transportGst && (
                        <div style={{ fontSize: "0.8rem", color: "var(--text-2)", marginTop: 4 }}>
                          GST: <strong>{transport.transportGst}</strong>
                        </div>
                      )}
                      {transport.email && (
                        <div style={{ fontSize: "0.8rem", color: "var(--text-2)", marginTop: 4 }}>
                          Email: <strong>{transport.email}</strong>
                        </div>
                      )}
                    </div>
                  </div>

                  {transport.transportContact && (
                    <div style={{ marginBottom: 10, paddingBottom: 10, borderBottom: "1px solid var(--surface-2)" }}>
                      <span style={{ fontSize: "0.75rem", color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                        Contact
                      </span>
                      <div style={{ fontSize: "0.95rem", color: "var(--text)", marginTop: 4, fontWeight: 500 }}>
                        {transport.transportContact}
                      </div>
                    </div>
                  )}

                  {transport.transportAddress && (
                    <div style={{ marginBottom: 12 }}>
                      <span style={{ fontSize: "0.75rem", color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                        Address
                      </span>
                      <div style={{ fontSize: "0.85rem", color: "var(--text-2)", marginTop: 4, lineHeight: 1.4 }}>
                        {transport.transportAddress}
                      </div>
                    </div>
                  )}

                  <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => setEditing(transport)}
                      style={{ flex: 1 }}
                    >
                      ✏️ Edit
                    </button>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => remove(transport)}
                      style={{ flex: 1 }}
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {editing !== undefined && (
        <TransportForm
          transport={editing}
          onClose={() => setEditing(undefined)}
          onSaved={() => { setEditing(undefined); load(); }}
        />
      )}
    </>
  );
}

function TransportForm({ transport, onClose, onSaved }) {
  const isEdit = !!transport;
  const [transportName, setTransportName] = useState(transport?.transportName || "");
  const [transportGst, setTransportGst] = useState(transport?.transportGst || "");
  const [transportContact, setTransportContact] = useState(transport?.transportContact || "");
  const [transportAddress, setTransportAddress] = useState(transport?.transportAddress || "");
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  const [transportEmail, setTransportEmail] = useState(transport?.transportEmail || "");

  const submit = async (e) => {
    e.preventDefault();
    if (!transportName.trim()) {
      toast.error("Transport name is required.");
      return;
    }
    setBusy(true);
    try {
      const payload = { transportName, transportGst, transportContact, transportAddress, transportEmail };
      if (isEdit) {
        await adminTransport.update({ id: transport.id, ...payload });
        toast.success("Transport updated.");
      } else {
        await adminTransport.create(payload);
        toast.success("Transport added.");
      }
      onSaved();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      narrow
      title={isEdit ? "✏️ Edit transport" : "🚚 Add transport"}
      onClose={onClose}
      footer={
        <>
          <button className="btn btn-ghost" onClick={onClose} disabled={busy}>Cancel</button>
          <button className="btn btn-primary" form="transport-form" disabled={busy}>{busy ? "Saving…" : "Save"}</button>
        </>
      }
    >
      <form id="transport-form" onSubmit={submit}>
        <div className="field">
          <label>Transport name <span style={{ color: "var(--primary)" }}>*</span></label>
          <input
            className="input"
            value={transportName}
            onChange={(e) => setTransportName(e.target.value)}
            placeholder="e.g., ABC Transport Company"
            autoFocus
          />
        </div>

        <div className="field">
          <label>GST number <span className="muted">(optional)</span></label>
          <input
            className="input"
            value={transportGst}
            onChange={(e) => setTransportGst(e.target.value)}
            placeholder="e.g., 24AEXPS5555K1Z0"
          />
        </div>
        <div className="field">
          <label>Email <span className="muted">(optional)</span></label>
          <input
            className="input"
            value={transportEmail}
            onChange={(e) => setTransportEmail(e.target.value)}
            placeholder="e.g., transport@example.com"
          />
        </div>

        <div className="field">
          <label>Contact <span className="muted">(optional)</span></label>
          <input
            className="input"
            value={transportContact}
            onChange={(e) => setTransportContact(e.target.value)}
            placeholder="e.g., 9876543210"
          />
        </div>

        <div className="field">
          <label>Address <span className="muted">(optional)</span></label>
          <textarea
            className="input"
            value={transportAddress}
            onChange={(e) => setTransportAddress(e.target.value)}
            placeholder="e.g., 123 Transport Street, Rajkot"
            rows={3}
            style={{ resize: "vertical" }}
          />
        </div>
      </form>
    </Modal>
  );
}

