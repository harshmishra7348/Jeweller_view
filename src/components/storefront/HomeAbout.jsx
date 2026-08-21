import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { content } from "../../api/services";
import { imageSrc } from "../../config";

/**
 * Home-page About teaser: a clean intro (heading + lead paragraph + link)
 * drawn from the first About section, with its image alongside if present.
 * Renders nothing when the admin hasn't added any About content yet.
 */
export default function HomeAbout() {
  const [sections, setSections] = useState(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const data = await content.about();
        if (alive) setSections(Array.isArray(data) ? data : []);
      } catch {
        if (alive) setSections([]);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  if (!sections || sections.length === 0) return null;

  const first = sections[0];
  const src = imageSrc(first.imageUrl);

  return (
    <section className="section section-alt">
      <div className="container home-about">
        <div className="home-about-text">
          <span className="eyebrow">Who we are</span>
          <h2>{first.mainHeading || "About us"}</h2>
          {first.description && <p>{first.description}</p>}
          <Link to="/about" className="btn btn-primary">Read our story →</Link>
        </div>
        <div className="home-about-media">
          {src ? (
            <img src={src} alt={first.mainHeading || "About us"} />
          ) : (
            <div className="about-media-placeholder">
              <div className="about-media-icon">💎</div>
              <div className="about-media-label">Jeweller story coming soon</div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
