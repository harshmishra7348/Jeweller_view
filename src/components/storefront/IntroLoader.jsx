import React from "react";
import { BRAND_NAME } from "../../config";

export default function IntroLoader() {
  return (
    <div className="intro-loader">
      <div className="intro-loader-inner" style={{ textCenter: "center", display: "grid", placeItems: "center", gap: 16 }}>
        <div className="jewel-shine" style={{ width: 72, height: 72, fontSize: "2.5rem" }}>💎</div>
        <div className="loader-caption" style={{ textAlign: "center" }}>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "2.2rem", margin: 0, color: "var(--gold-400)" }}>
            Welcome to {BRAND_NAME}
          </h1>
          <p style={{ color: "rgba(255,255,255,0.8)", marginTop: 8 }}>
            Crafting certified Gold &amp; Fine Diamond collections for you...
          </p>
        </div>
      </div>
    </div>
  );
}
