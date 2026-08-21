import React, { useEffect, useState } from "react";
import { adminContact } from "../../api/services";
import { errorMessage } from "../../api/http";
import Spinner from "../../components/common/Spinner";
import { useToast } from "../../context/ToastContext";

const FIELDS = [
  { name: "phone", label: "Phone", placeholder: "+91 …" },
  { name: "alternatePhone", label: "Alternate phone" },
  { name: "whatsapp", label: "WhatsApp number" },
  { name: "email", label: "Email", type: "email" },
  { name: "website", label: "Website" },
  { name: "address", label: "Address", span: true },
  { name: "city", label: "City" },
  { name: "state", label: "State" },
  { name: "pincode", label: "Pincode" },
  { name: "facebook", label: "Facebook URL", span: true },
  { name: "instagram", label: "Instagram URL", span: true },
  { name: "mapUrl", label: "Google Maps embed URL", span: true, hint: "Use the “Embed a map” src URL from Google Maps → Share." },
];

const EMPTY = FIELDS.reduce((o, f) => ({ ...o, [f.name]: "" }), {});

export default function AdminContact() {
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const toast = useToast();

  useEffect(() => {
    (async () => {
      try {
        const data = await adminContact.get();
        if (data) setForm({ ...EMPTY, ...data });
      } catch (err) {
        toast.error(errorMessage(err));
      } finally {
        setLoading(false);
      }
    })();
  }, [toast]);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const saved = await adminContact.save(form);
      if (saved) setForm({ ...EMPTY, ...saved });
      toast.success("Contact details saved.");
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <Spinner full />;

  return (
    <div className="panel">
      <div className="panel-head">
        <h2>Contact details</h2>
        <div className="spacer" />
      </div>
      <div className="panel-body">
        <p className="muted" style={{ marginTop: 0 }}>These details are shown on the public Contact page.</p>
        <form onSubmit={submit}>
          <div className="form-grid">
            {FIELDS.map((f) => (
              <div className={`field ${f.span ? "span-2" : ""}`} key={f.name}>
                <label>{f.label}</label>
                <input
                  className="input"
                  type={f.type || "text"}
                  name={f.name}
                  value={form[f.name] || ""}
                  onChange={onChange}
                  placeholder={f.placeholder || ""}
                />
                {f.hint && <div className="hint">{f.hint}</div>}
              </div>
            ))}
          </div>
          <button className="btn btn-primary" disabled={busy} style={{ marginTop: 8 }}>
            {busy ? "Saving…" : "Save contact details"}
          </button>
        </form>
      </div>
    </div>
  );
}
