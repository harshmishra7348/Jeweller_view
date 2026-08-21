import React from "react";

export default function GlobalLoader() {
  return (
    <div className="global-loader-overlay">
      <div className="loader-frame">
        <div className="jewel-shine">💎</div>
        <p style={{ color: "var(--gold-400)", fontFamily: "var(--font-display)", fontSize: "1.1rem", margin: 0, fontWeight: 600 }}>
          Loading Royal Jewellers…
        </p>
      </div>
    </div>
  );
}
