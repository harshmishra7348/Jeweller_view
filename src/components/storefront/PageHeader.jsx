import React from "react";
import { Link } from "react-router-dom";

/**
 * Compact, tinted page banner for inner pages (Products, About, Contact,
 * Profile). Fills the top so pages don't look blank, without the oversized
 * hero block reserved for the home page.
 */
export default function PageHeader({ title, subtitle, crumb }) {
  return (
    <section className="page-banner">
      <div className="container">
        <nav className="crumb">
          <Link to="/">Home</Link>
          <span>/</span>
          <span className="crumb-current">{crumb || title}</span>
        </nav>
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
    </section>
  );
}
