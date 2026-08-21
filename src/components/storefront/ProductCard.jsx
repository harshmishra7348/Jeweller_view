import React from "react";
import { useNavigate } from "react-router-dom";
import { imageSrc } from "../../config";

export default function ProductCard({ product, onGetInTouch }) {
  const navigate = useNavigate();
  const src = imageSrc(product.imageUrl);
  const inStock = (product.quantity ?? 0) > 0;

  // Infer purity or category from subUnit or unit or description
  const purityLabel = product.subUnit || product.unit || "22K Gold";

  return (
    <article className="product-card">
      <div className="product-media" onClick={() => navigate(`/product/${product.id}`)} style={{ cursor: "pointer" }}>
        {src ? (
          <img src={src} alt={product.itemName} loading="lazy" />
        ) : (
          <div className="placeholder">👑</div>
        )}
        <span className="purity-tag">{purityLabel}</span>
        <span className={`stock-tag badge ${inStock ? "badge-success" : "badge-danger"}`} style={{ top: 10, right: 10, left: "auto" }}>
          {inStock ? "Ready in Stock" : "On Order"}
        </span>
      </div>
      <div className="product-body">
        <h3>{product.itemName}</h3>
        <p className="product-desc">{product.itemDescription || "Certified hallmarked fine jewelry."}</p>
        <div className="product-meta">
          <span className="price">
            ₹{Number(product.sellPrice ?? 0).toLocaleString("en-IN")}
            <small> est. price</small>
          </span>
          <p className="muted" style={{ margin: 0, fontSize: "0.83rem", display: "flex", gap: "6px", alignItems: "center" }}>
            <span>👑 BIS Hallmarked</span>
            <span>•</span>
            <span>GST +{product.gst ?? 3}%</span>
          </p>
        </div>
        <div className="product-actions">
          <button className="btn btn-outline btn-sm grow" onClick={() => navigate(`/product/${product.id}`)}>
            View Spec
          </button>
          <button className="btn btn-primary btn-sm grow" onClick={() => onGetInTouch(product)}>
            Inquire Quote
          </button>
        </div>
      </div>
    </article>
  );
}
