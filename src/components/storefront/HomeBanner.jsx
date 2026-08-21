import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { content } from "../../api/services";
import { imageSrc, BRAND_SINCE, isDarkColor } from "../../config";
import { useAuth } from "../../context/AuthContext";

export default function HomeBanner() {
  const [images, setImages] = useState([]);
  const [heroSettings, setHeroSettings] = useState({});
  const [active, setActive] = useState(0);
  const timer = useRef(null);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const data = await content.homeImages();
        if (alive) setImages((Array.isArray(data) ? data : []).slice(0, 5));
      } catch {
        /* optional */
      }
      try {
        const settings = await content.homeSettings();
        if (alive) setHeroSettings(settings || {});
      } catch {
        /* optional */
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (images.length <= 1) return undefined;
    timer.current = setInterval(() => setActive((i) => (i + 1) % images.length), 4500);
    return () => clearInterval(timer.current);
  }, [images.length]);

  const hasImages = images.length > 0;
  const heroBg = heroSettings.heroBgColor;
  const heroText = heroSettings.heroTextColor;
  const heroAccent = heroSettings.heroAccentColor;
  const onDark = isDarkColor(heroBg);
  const heroCopyStyle = heroText ? { color: heroText } : undefined;

  return (
    <section
      className={`hero ${onDark ? "hero-on-dark" : ""}`}
      style={heroBg ? { background: heroBg } : undefined}
    >
      <div className={`container hero-inner ${hasImages ? "" : "solo"}`}>
        <div className="hero-copy" style={heroCopyStyle}>
          <span className="eyebrow" style={{ color: "var(--gold-400)" }}>
            Royal Heritage Jewelry{BRAND_SINCE ? ` · Established ${BRAND_SINCE}` : ""}
          </span>
          <h1 style={heroText ? { color: heroText } : undefined}>
            Timeless Elegance,<br />
            <span className="hl">Pure 22K Gold &amp; Diamonds</span>
          </h1>
          <p>
            Explore handcrafted bridal sets, solitaires, Kundan masterpieces, and certified hallmarked jewelry. Request customized design quotes directly.
          </p>
          <div className="hero-actions hero-actions-grid">
            <button
              className="btn btn-primary btn-lg hero-search-btn"
              onClick={() => navigate("/products#search")}
            >
              🔍 Search Products
            </button>
            <Link to="/products" className="btn btn-outline btn-lg">Explore Catalog</Link>
            {isAuthenticated ? (
              <Link to="/cart" className="btn btn-outline btn-lg">View Quote Cart</Link>
            ) : (
              <Link to="/register" className="btn btn-outline btn-lg">Register Account</Link>
            )}
          </div>
          <div className="hero-trust">
            <span><span className="tick">👑</span> 100% BIS Hallmarked</span>
            <span><span className="tick">💎</span> Certified Diamonds</span>
            <span><span className="tick">✨</span> Custom Weight Quotes</span>
          </div>
        </div>

        {hasImages && (
          <div className="hero-media">
            <div className="hero-frame">
              {images.map((img, i) => (
                <img key={img.id} src={imageSrc(img.imageUrl)} alt={img.title || ""} className={i === active ? "on" : ""} />
              ))}
              {images.length > 1 && (
                <div className="hero-dots">
                  {images.map((img, i) => (
                    <button key={img.id} className={i === active ? "on" : ""} onClick={() => setActive(i)} aria-label={`Show image ${i + 1}`} />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
