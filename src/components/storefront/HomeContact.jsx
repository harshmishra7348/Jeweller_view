import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { content } from "../../api/services";

export default function HomeContact() {
  const [info, setInfo] = useState({});

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const data = await content.contact();
        if (alive) setInfo(data || {});
      } catch {
        if (alive) setInfo({});
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const methods = [
    info.phone && { ico: "📞", label: "Showroom Call", value: info.phone, href: `tel:${info.phone}` },
    info.whatsapp && { ico: "💬", label: "WhatsApp Consultation", value: info.whatsapp, href: `https://wa.me/${String(info.whatsapp).replace(/[^\d]/g, "")}` },
    info.email && { ico: "✉️", label: "Inquiry Email", value: info.email, href: `mailto:${info.email}` },
  ].filter(Boolean);

  return (
    <section className="section">
      <div className="container">
        <div className={`home-contact ${methods.length ? "" : "no-methods"}`}>
          <div className="home-contact-intro">
            <span className="eyebrow light">Visit Our Showroom</span>
            <h2>Get a Custom Quote</h2>
            <p>Inquiring about custom ornament weight, making charges, or bridal consultations? Reach out directly or visit our showroom.</p>
            <Link to="/contact" className="btn home-contact-btn">Showroom Details &amp; Contact →</Link>
          </div>
          {methods.length > 0 && (
            <div className="home-contact-methods">
              {methods.map((m) => (
                <a key={m.label} href={m.href} target="_blank" rel="noreferrer" className="contact-method">
                  <span className="cm-ico">{m.ico}</span>
                  <span className="cm-text">
                    <span className="cm-label">{m.label}</span>
                    <span className="cm-value">{m.value}</span>
                  </span>
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
