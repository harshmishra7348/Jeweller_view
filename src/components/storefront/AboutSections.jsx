import React, { useEffect, useState } from "react";
import { content } from "../../api/services";
import { errorMessage } from "../../api/http";
import { imageSrc } from "../../config";
import Spinner from "../common/Spinner";

/** Renders the admin-managed About Us sections. Used by the About page and Home. */
export default function AboutSections() {
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const data = await content.about();
        if (alive) setSections(Array.isArray(data) ? data : []);
      } catch (err) {
        if (alive) setError(errorMessage(err));
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  if (loading) return <Spinner full />;
  if (error) {
    return <div className="empty-state"><div className="emoji">⚠️</div><h3>Couldn't load About content</h3><p>{error}</p></div>;
  }
  if (sections.length === 0) {
    return <div className="empty-state"><div className="emoji">💎</div><h3>Heritage Story Coming Soon</h3><p>We're curating our legacy story. Please check back shortly.</p></div>;
  }

  return (
    <div className="about-list">
      {sections.map((s, i) => {
        const src = imageSrc(s.imageUrl);
        return (
          <article className={`about-block ${i % 2 ? "reverse" : ""}`} key={s.id}>
            <div className={`about-media ${src ? "" : "about-media-empty"}`}>
              {src ? (
                <img src={src} alt={s.mainHeading} />
              ) : (
                <div className="about-media-placeholder">
                  <span className="about-media-icon">👑</span>
                  <div>Heritage photo coming soon</div>
                </div>
              )}
            </div>
            <div className="about-copy">
              {s.subHeading && <span className="about-eyebrow">{s.subHeading}</span>}
              <h2>{s.mainHeading}</h2>
              {s.description && <p>{s.description}</p>}
            </div>
          </article>
        );
      })}
    </div>
  );
}
