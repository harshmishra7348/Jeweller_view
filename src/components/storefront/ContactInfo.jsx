import React, { useEffect, useState } from "react";
import { content } from "../../api/services";
import { errorMessage } from "../../api/http";
import Spinner from "../common/Spinner";

/** Renders the shop's contact details + map. Used by the Contact page and Home. */
export default function ContactInfo() {
  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const data = await content.contact();
        if (alive) setInfo(data || {});
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
    return <div className="empty-state"><div className="emoji">⚠️</div><h3>Couldn't load contact details</h3><p>{error}</p></div>;
  }

  const fullAddress = [info.address, info.city, info.state, info.pincode].filter(Boolean).join(", ");
  const rows = [
    { ico: "📞", label: "Phone", value: info.phone, href: info.phone ? `tel:${info.phone}` : null },
    { ico: "📱", label: "Alternate phone", value: info.alternatePhone, href: info.alternatePhone ? `tel:${info.alternatePhone}` : null },
    { ico: "💬", label: "WhatsApp", value: info.whatsapp, href: info.whatsapp ? `https://wa.me/${info.whatsapp.replace(/[^\d]/g, "")}` : null },
    { ico: "✉️", label: "Email", value: info.email, href: info.email ? `mailto:${info.email}` : null },
    { ico: "📍", label: "Address", value: fullAddress },
    { ico: "🌐", label: "Website", value: info.website, href: info.website },
  ].filter((r) => r.value);
  const socials = [
    { ico: "📘", label: "Facebook", href: info.facebook },
    { ico: "📸", label: "Instagram", href: info.instagram },
  ].filter((s) => s.href);

  if (rows.length === 0) {
    return <div className="empty-state"><div className="emoji">📮</div><h3>Contact details coming soon</h3><p>We're updating our contact information. Please check back shortly.</p></div>;
  }

  return (
    <div className="contact-layout">
      <div className="contact-cards">
        {rows.map((r) => (
          <div className="contact-card card" key={r.label}>
            <div className="contact-ico">{r.ico}</div>
            <div>
              <div className="contact-label">{r.label}</div>
              {r.href ? (
                <a href={r.href} target="_blank" rel="noreferrer" className="contact-value">{r.value}</a>
              ) : (
                <div className="contact-value">{r.value}</div>
              )}
            </div>
          </div>
        ))}
        {socials.length > 0 && (
          <div className="contact-socials">
            {socials.map((s) => (
              <a key={s.label} href={s.href} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm">
                {s.ico} {s.label}
              </a>
            ))}
          </div>
        )}
      </div>

      {info.mapUrl && (
        <div className="contact-map card">
          <iframe title="Location map" src={info.mapUrl} loading="lazy" referrerPolicy="no-referrer-when-downgrade" allowFullScreen />
        </div>
      )}
    </div>
  );
}
