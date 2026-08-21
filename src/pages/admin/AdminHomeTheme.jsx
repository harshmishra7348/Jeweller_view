import React, { useEffect, useState } from "react";
import { adminHomeSettings } from "../../api/services";
import { errorMessage } from "../../api/http";
import Spinner from "../../components/common/Spinner";
import { useToast } from "../../context/ToastContext";

const COLOR_FIELDS = [
  { name: "heroBgColor", label: "Hero/Banner background" },
  { name: "headerBgColor", label: "Header background" },
  { name: "headerPrimaryFontColor", label: "Header primary text" },
  { name: "headerSecondaryFontColor", label: "Header secondary text" },
  { name: "headerSelectedItemColor", label: "Header selected item" },
  { name: "headerHoverItemColor", label: "Header hover item" },
  { name: "footerBgColor", label: "Footer background" },
  { name: "footerPrimaryFontColor", label: "Footer primary text" },
  { name: "footerSecondaryFontColor", label: "Footer secondary text" },
  { name: "footerSelectedItemColor", label: "Footer selected item" },
  { name: "footerHoverItemColor", label: "Footer hover item" },
];

export default function AdminHomeTheme() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const toast = useToast();

  useEffect(() => {
    (async () => {
      try {
        const data = await adminHomeSettings.get();
        setSettings(data || {});
      } catch (err) {
        toast.error(errorMessage(err));
      } finally {
        setLoading(false);
      }
    })();
  }, [toast]);

  const onChange = (e) => {
    const { name, value } = e.target;
    setSettings((prev) => ({ ...prev, [name]: value }));
  };

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await adminHomeSettings.save(settings);
      toast.success("Home theme settings saved.");
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
        <h2>Home theme settings</h2>
        <div className="spacer" />
      </div>
      <div className="panel-body">
        <p className="muted" style={{ marginTop: 0 }}>
          Update header, footer and page background colours for the storefront.
        </p>

        <form onSubmit={submit}>
          <div className="form-grid">
            {COLOR_FIELDS.map((field) => (
              <div className="field" key={field.name}>
                <label>{field.label}</label>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <input
                    className="input"
                    type="color"
                    name={field.name}
                    value={settings[field.name] || "#000000"}
                    onChange={onChange}
                    style={{ width: 72, height: 40, padding: 0, borderRadius: 6, border: "1px solid var(--surface-3)" }}
                  />
                  <input
                    className="input"
                    type="text"
                    name={field.name}
                    value={settings[field.name] || ""}
                    onChange={onChange}
                    style={{ flex: 1 }}
                  />
                </div>
              </div>
            ))}

            <div className="field span-2">
              <label>Page background</label>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <input
                  className="input"
                  type="color"
                  name="pageBgColor"
                  value={settings.pageBgColor || "#ffffff"}
                  onChange={onChange}
                  style={{ width: 72, height: 40, padding: 0, borderRadius: 6, border: "1px solid var(--surface-3)" }}
                />
                <input
                  className="input"
                  type="text"
                  name="pageBgColor"
                  value={settings.pageBgColor || ""}
                  onChange={onChange}
                  style={{ flex: 1 }}
                />
              </div>
            </div>
          </div>

          <button className="btn btn-primary" disabled={busy} style={{ marginTop: 8 }}>
            {busy ? "Saving…" : "Save theme settings"}
          </button>
        </form>
      </div>
    </div>
  );
}
