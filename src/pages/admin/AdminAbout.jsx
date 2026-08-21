import React, { useCallback, useEffect, useState } from "react";
import { adminAbout } from "../../api/services";
import { errorMessage } from "../../api/http";
import { imageSrc } from "../../config";
import Spinner from "../../components/common/Spinner";
import Modal from "../../components/common/Modal";
import { useToast } from "../../context/ToastContext";

export default function AdminAbout() {
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(undefined);
  const toast = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminAbout.list();
      setSections(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  const remove = async (s) => {
    if (!window.confirm(`Delete "${s.mainHeading}"?`)) return;
    try {
      await adminAbout.remove(s.id);
      toast.success("Section deleted.");
      load();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  const active = sections.filter((s) => s.active);

  return (
    <>
      <div className="panel">
        <div className="panel-head">
          <h2>About Us sections</h2>
          <span className="badge badge-muted">{active.length}</span>
          <div className="spacer" />
          <button className="btn btn-primary" onClick={() => setEditing(null)}>+ Add section</button>
        </div>
        <div className="panel-body">
          <p className="muted" style={{ marginTop: 0 }}>
            Each section shows on the public About page (in display order). Add as many as you like.
          </p>
          {loading ? (
            <Spinner full />
          ) : active.length === 0 ? (
            <div className="empty-state"><h3>No About sections</h3><p>Add your first section to build the About page.</p></div>
          ) : (
            active.map((s) => (
              <div className="about-admin-card" key={s.id}>
                <div className="a-thumb">
                  {s.imageUrl ? <img src={imageSrc(s.imageUrl)} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 10 }} /> : <span style={{ fontSize: "1.6rem" }}>📄</span>}
                </div>
                <div>
                  {s.subHeading && <span className="about-eyebrow">{s.subHeading}</span>}
                  <h3 style={{ margin: "2px 0 6px" }}>{s.mainHeading}</h3>
                  <p className="muted" style={{ margin: 0, fontSize: "0.9rem", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{s.description}</p>
                  <span className="muted" style={{ fontSize: "0.78rem" }}>Order: {s.displayOrder ?? 0}</span>
                </div>
                <div className="actions">
                  <button className="btn btn-outline btn-sm" onClick={() => setEditing(s)}>Edit</button>
                  <button className="btn btn-danger btn-sm" onClick={() => remove(s)}>Delete</button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {editing !== undefined && (
        <AboutForm section={editing} onClose={() => setEditing(undefined)} onSaved={() => { setEditing(undefined); load(); }} />
      )}
    </>
  );
}

function AboutForm({ section, onClose, onSaved }) {
  const isEdit = !!section;
  const [form, setForm] = useState({
    mainHeading: section?.mainHeading || "",
    subHeading: section?.subHeading || "",
    description: section?.description || "",
    displayOrder: section?.displayOrder ?? "",
  });
  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState(isEdit && section.imageUrl ? imageSrc(section.imageUrl) : null);
  const [busy, setBusy] = useState(false);
  const toast = useToast();

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Please choose an image file."); return; }
    setImageFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.mainHeading.trim()) { toast.error("Main heading is required."); return; }
    if (!imageFile && (!isEdit || !section?.imageUrl)) { toast.error("Image is required."); return; }
    setBusy(true);
    try {
      const payload = { ...form, imageFile };
      if (isEdit) await adminAbout.update({ id: section.id, ...payload });
      else await adminAbout.create(payload);
      toast.success(isEdit ? "Section updated." : "Section added.");
      onSaved();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      title={isEdit ? "Edit About section" : "Add About section"}
      onClose={onClose}
      footer={
        <>
          <button className="btn btn-ghost" onClick={onClose} disabled={busy}>Cancel</button>
          <button className="btn btn-primary" form="about-form" disabled={busy}>{busy ? "Saving…" : "Save"}</button>
        </>
      }
    >
      <form id="about-form" onSubmit={submit}>
        <div className="field">
          <label>Image *</label>
          <div className="row center" style={{ gap: 16 }}>
            <div style={{ width: 120, height: 84, borderRadius: 10, overflow: "hidden", background: "var(--surface-2)", display: "grid", placeItems: "center", flexShrink: 0 }}>
              {preview ? <img src={preview} alt="preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ fontSize: "1.6rem" }}>📄</span>}
            </div>
            <input type="file" accept="image/*" onChange={onFile} required={!isEdit || !section?.imageUrl} />
          </div>
        </div>
        <div className="field">
          <label>Main heading *</label>
          <input className="input" name="mainHeading" required value={form.mainHeading} onChange={onChange} placeholder="e.g. Our Story" />
        </div>
        <div className="field">
          <label>Sub heading</label>
          <input className="input" name="subHeading" value={form.subHeading} onChange={onChange} placeholder="e.g. Since 2004" />
        </div>
        <div className="field">
          <label>Description</label>
          <textarea className="textarea" name="description" value={form.description} onChange={onChange} placeholder="Tell customers about this section…" style={{ minHeight: 120 }} />
        </div>
        <div className="field">
          <label>Display order</label>
          <input className="input" type="number" name="displayOrder" value={form.displayOrder} onChange={onChange} placeholder="0" />
          <div className="hint">Lower numbers appear first.</div>
        </div>
      </form>
    </Modal>
  );
}
