import React, { useState } from "react";
import Modal from "../../components/common/Modal";
import { adminProducts } from "../../api/services";
import { errorMessage } from "../../api/http";
import { imageSrc } from "../../config";
import { useToast } from "../../context/ToastContext";

const EMPTY = {
  itemName: "",
  itemDescription: "",
  price: "",
  sellPrice: "",
  quantity: "",
  gst: "",
  unit: "",
  subUnit: "",
  perUnitQuantity: "",
};

/** Create / edit a product. `product` = null means create. */
export default function ProductForm({ product, onClose, onSaved }) {
  const isEdit = !!product;
  const [form, setForm] = useState(
    isEdit
      ? {
          itemName: product.itemName ?? "",
          itemDescription: product.itemDescription ?? "",
          price: product.price ?? "",
          sellPrice: product.sellPrice ?? "",
          quantity: product.quantity ?? "",
          gst: product.gst ?? "",
          unit: product.unit ?? "",
          subUnit: product.subUnit ?? "",
          perUnitQuantity: product.perUnitQuantity ?? "",
        }
      : EMPTY
  );
  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState(
    isEdit && product.imageUrl ? imageSrc(product.imageUrl) : null
  );
  const [busy, setBusy] = useState(false);
  const toast = useToast();

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

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
    const subUnit = form.subUnit.trim();
    const perUnitQuantity = form.perUnitQuantity.trim();

    if (subUnit && (!perUnitQuantity || Number(perUnitQuantity) <= 0)) {
      toast.error("Enter a valid per unit quantity when sub-unit is set.");
      return;
    }

    if (!subUnit && perUnitQuantity) {
      toast.error("Enter a sub unit before setting per unit quantity.");
      return;
    }

    setBusy(true);
    try {
      const payload = {
        ...(isEdit ? { id: product.id } : {}),
        itemName: form.itemName.trim(),
        itemDescription: form.itemDescription.trim(),
        price: Number(form.price),
        sellPrice: Number(form.sellPrice),
        quantity: Number(form.quantity),
        gst: Number(form.gst),
        unit: form.unit.trim(),
        subUnit,
        perUnitQuantity: subUnit ? Number(perUnitQuantity) : undefined,
      };
      if (isEdit) await adminProducts.update(payload, imageFile);
      else await adminProducts.create(payload, imageFile);
      toast.success(isEdit ? "Product updated." : "Product added.");
      onSaved();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      title={isEdit ? "Edit Jewelry Item" : "Add Jewelry Item"}
      onClose={onClose}
      footer={
        <>
          <button className="btn btn-ghost" onClick={onClose} disabled={busy}>Cancel</button>
          <button className="btn btn-primary" form="product-form" disabled={busy}>
            {busy ? "Saving…" : isEdit ? "Save changes" : "Add Jewelry Item"}
          </button>
        </>
      }
    >
      <form id="product-form" onSubmit={submit}>
        <div className="field">
          <label>Ornament photo</label>
          <div className="row center" style={{ gap: 16 }}>
            <div style={{ width: 84, height: 84, borderRadius: 12, overflow: "hidden", background: "var(--surface-2)", display: "grid", placeItems: "center", flexShrink: 0 }}>
              {preview ? <img src={preview} alt="preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ fontSize: "1.8rem" }}>👑</span>}
            </div>
            <input type="file" accept="image/*" onChange={onFile} />
          </div>
        </div>

        <div className="form-grid">
          <div className="field span-2">
            <label>Ornament Name *</label>
            <input className="input" name="itemName" required value={form.itemName} onChange={onChange} placeholder="e.g. 22K Gold Kundan Bridal Necklace" />
          </div>
          <div className="field span-2">
            <label>Description &amp; Specifications</label>
            <textarea className="textarea" name="itemDescription" value={form.itemDescription} onChange={onChange} placeholder="Details: Net weight in grams, hallmark code, stone detail, making notes" />
          </div>
          <div className="field">
            <label>Cost / Bullion Price (₹) *</label>
            <input className="input" type="number" step="0.01" min="0" name="price" required value={form.price} onChange={onChange} />
            <div className="hint">Cost price / raw metal valuation.</div>
          </div>
          <div className="field">
            <label>Estimated Sell Price (₹) *</label>
            <input className="input" type="number" step="0.01" min="0" name="sellPrice" required value={form.sellPrice} onChange={onChange} />
            <div className="hint">Showroom display price.</div>
          </div>
          <div className="field">
            <label>Stock Quantity *</label>
            <input className="input" type="number" step="0.001" min="0" name="quantity" required value={form.quantity} onChange={onChange} />
          </div>
          <div className="field">
            <label>Unit Type *</label>
            <input className="input" name="unit" required value={form.unit} onChange={onChange} placeholder="Gram, Piece, Set, Pair…" />
          </div>
          <div className="field">
            <label>Purity Tag / Grade (Sub unit)</label>
            <input className="input" name="subUnit" value={form.subUnit} onChange={onChange} placeholder="22K Gold, 24K, 18K Diamond, 925 Silver…" />
            <div className="hint">Purity grade tag displayed on item.</div>
          </div>
          <div className="field">
            <label>Weight Per Piece / Unit</label>
            <input className="input" type="number" step="0.001" min="0" name="perUnitQuantity" value={form.perUnitQuantity} onChange={onChange} placeholder="Weight in grams" />
            <div className="hint">Required if Purity Tag (sub unit) is provided.</div>
          </div>
          <div className="field">
            <label>GST (%) *</label>
            <input className="input" type="number" step="1" min="0" name="gst" required value={form.gst} onChange={onChange} placeholder="3" />
            <div className="hint">Standard 3% GST for jewelry.</div>
          </div>
        </div>
      </form>
    </Modal>
  );
}
