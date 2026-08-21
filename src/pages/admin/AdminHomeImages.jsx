import React, { useCallback, useEffect, useState } from "react";
import { adminHomeImages } from "../../api/services";
import { errorMessage } from "../../api/http";
import { imageSrc } from "../../config";
import Spinner from "../../components/common/Spinner";
import Modal from "../../components/common/Modal";
import { useToast } from "../../context/ToastContext";

const MAX_ACTIVE = 5;

export default function AdminHomeImages() {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(undefined); // undefined=closed, null=create, obj=edit
  const toast = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminHomeImages.list();
      setImages(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  const activeCount = images.filter((i) => i.active).length;

  const remove = async (img) => {
    if (!window.confirm("Delete this banner image?")) return;
    try {
      await adminHomeImages.remove(img.id);
      toast.success("Image deleted.");
      load();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  return (
    <>
      <div className="panel">
        <div className="panel-head">
          <h2>Home banner images</h2>
          <span className={`badge ${activeCount >= MAX_ACTIVE ? "badge-warning" : "badge-muted"}`}>{activeCount} / {MAX_ACTIVE} active</span>
          <div className="spacer" />
          <button className="btn btn-primary" disabled={activeCount >= MAX_ACTIVE} onClick={() => setEditing(null)}>+ Add image</button>
        </div>
        <div className="panel-body">
          <p className="muted" style={{ marginTop: 0 }}>
            These images appear in the home page hero showcase (up to {MAX_ACTIVE}). Lower “order” shows first.
          </p>
          {loading ? (
            <Spinner full />
          ) : images.filter((i) => i.active).length === 0 ? (
            <div className="empty-state"><h3>No banner images</h3><p>Add up to {MAX_ACTIVE} images for the home page.</p></div>
          ) : (
            <div className="media-grid">
              {images.filter((i) => i.active).map((img) => (
                <div className="media-card" key={img.id}>
                  <div className="media-thumb">
                    {img.imageUrl ? <img src={imageSrc(img.imageUrl)} alt={img.title || ""} /> : <span className="placeholder">🖼️</span>}
                  </div>
                  <div className="media-info">
                    <h4>{img.title || "Untitled"}</h4>
                    <span className="muted" style={{ fontSize: "0.82rem" }}>Order: {img.displayOrder ?? 0}</span>
                  </div>
                  <div className="media-actions">
                    <button className="btn btn-outline btn-sm grow" onClick={() => setEditing(img)}>Edit</button>
                    <button className="btn btn-danger btn-sm" onClick={() => remove(img)}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {editing !== undefined && (
        <HomeImageForm
          image={editing}
          onClose={() => setEditing(undefined)}
          onSaved={() => { setEditing(undefined); load(); }}
        />
      )}
    </>
  );
}

function HomeImageForm({ image, onClose, onSaved }) {
  const isEdit = !!image;
  const [title, setTitle] = useState(image?.title || "");
  const [displayOrder, setDisplayOrder] = useState(image?.displayOrder ?? "");
  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState(isEdit && image.imageUrl ? imageSrc(image.imageUrl) : null);
  const [busy, setBusy] = useState(false);
  const toast = useToast();

  const onFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be 5 MB or smaller.");
      return;
    }
    setImageFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!isEdit && !imageFile) {
      toast.error("Please choose an image.");
      return;
    }
    setBusy(true);
    try {
      if (isEdit) await adminHomeImages.update({ id: image.id, title, displayOrder, imageFile });
      else await adminHomeImages.create({ title, displayOrder, imageFile });
      toast.success(isEdit ? "Image updated." : "Image added.");
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
      title={isEdit ? "Edit banner image" : "Add banner image"}
      onClose={onClose}
      footer={
        <>
          <button className="btn btn-ghost" onClick={onClose} disabled={busy}>Cancel</button>
          <button className="btn btn-primary" form="home-img-form" disabled={busy}>{busy ? "Saving…" : "Save"}</button>
        </>
      }
    >
      <form id="home-img-form" onSubmit={submit}>
        <div className="field">
          <label>Image {isEdit ? <span className="muted">(leave to keep current)</span> : "*"}</label>
          <div className="row center" style={{ gap: 16 }}>
            <div style={{ width: 120, height: 76, borderRadius: 10, overflow: "hidden", background: "var(--surface-2)", display: "grid", placeItems: "center", flexShrink: 0 }}>
              {preview ? <img src={preview} alt="preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ fontSize: "1.6rem" }}>🖼️</span>}
            </div>
            <input type="file" accept="image/*" onChange={onFile} />
          </div>
        </div>

        <div className="field">
          <label>Title / caption <span className="muted">(optional)</span></label>
          <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Shown over the image" />
        </div>

        <div className="field">
          <label>Display order</label>
          <input className="input" type="number" value={displayOrder} onChange={(e) => setDisplayOrder(e.target.value)} placeholder="0" />
          <div className="hint">Lower numbers appear first.</div>
        </div>
      </form>
    </Modal>
  );
}

