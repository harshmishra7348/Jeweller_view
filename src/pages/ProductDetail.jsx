import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { storefront } from "../api/services";
import { errorMessage } from "../api/http";
import { imageSrc } from "../config";
import Spinner from "../components/common/Spinner";
import useGetInTouch from "../hooks/useGetInTouch";
import { useAuth } from "../context/AuthContext";

export default function ProductDetail() {
  const { id } = useParams();
  const { isAuthenticated } = useAuth();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const getInTouch = useGetInTouch();

  useEffect(() => {
    let alive = true;
    setLoading(true);
    (async () => {
      try {
        const data = await storefront.getProduct(id);
        if (alive) setProduct(data);
      } catch (err) {
        if (alive) setError(errorMessage(err));
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [id]);

  if (loading) return <div className="container"><Spinner full /></div>;
  if (error || !product) {
    return (
      <div className="empty-state">
        <div className="emoji">💎</div>
        <h3>Jewelry Item Not Found</h3>
        <p>{error || "This item may have been updated or removed from stock."}</p>
        <Link to="/products" className="btn btn-primary">Back to Collections</Link>
      </div>
    );
  }

  const src = product.imageUrl
    ? imageSrc(product.imageUrl)
    : product.imageContentType
    ? imageSrc(`/public/itemMST/image/${product.id}`)
    : null;
  const inStock = (product.quantity ?? 0) > 0;

  return (
    <div className="container">
      <Link to="/products" className="back-link">← Back to Jewelry Collections</Link>
      <div className="detail-wrap">
        <div className="detail-media">
          {src ? <img src={src} alt={product.itemName} /> : <div className="placeholder">👑</div>}
          <span className="purity-tag" style={{ top: 16, left: 16, fontSize: "0.85rem", padding: "4px 12px" }}>
            {product.subUnit || product.unit || "22K Gold"}
          </span>
        </div>
        <div className="detail-info">
          <span className={`badge ${inStock ? "badge-success" : "badge-danger"}`}>
            {inStock ? "Ready in Stock" : "On Order"}
          </span>
          <h1>{product.itemName}</h1>
          <div className="price">
            ₹{Number(product.sellPrice ?? 0).toLocaleString("en-IN")}
            <small className="muted" style={{ fontSize: "0.9rem" }}>
              / {product.subUnit ? product.subUnit : product.unit || "item"}
            </small>
          </div>
          <p className="muted" style={{ marginTop: 14 }}>
            {product.itemDescription || "Certified BIS Hallmarked fine jewelry piece, crafted with high precision."}
          </p>

          <ul className="detail-specs">
            <li><span>Authenticity</span><span>👑 100% BIS Hallmarked</span></li>
            <li><span>Category / Purity</span><span>{product.subUnit || product.unit || "22K Gold"}</span></li>
            {product.subUnit && (
              <li>
                <span>Unit Weight Specification</span>
                <span>{product.perUnitQuantity} {product.subUnit}</span>
              </li>
            )}
            <li><span>Availability Status</span><span>{inStock ? "Ready for Dispatch" : "Made to Order"}</span></li>
            <li><span>Estimated Price</span><span>₹{Number(product.sellPrice ?? 0).toLocaleString("en-IN")}</span></li>
            <li><span>GST Rate</span><span>+{product.gst ?? 3}% GST</span></li>
          </ul>

          <button className="btn btn-primary" style={{ padding: "12px 28px", fontSize: "1.05rem" }} onClick={() => getInTouch(product)}>
            Add to Quote Inquiry →
          </button>
          <p className="hint muted" style={{ marginTop: 10 }}>
            {isAuthenticated
              ? "Adds this ornament to your quote inquiry cart."
              : "Sign in to add this item to your quote inquiry cart."}
          </p>
        </div>
      </div>
    </div>
  );
}
