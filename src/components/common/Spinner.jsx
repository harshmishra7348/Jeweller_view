import React from "react";

export default function Spinner({ full }) {
  if (full) {
    return (
      <div className="page-loading">
        <div className="spinner" />
      </div>
    );
  }
  return <div className="spinner" />;
}
