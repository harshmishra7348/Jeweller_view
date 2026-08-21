import React from "react";
import ContactInfo from "../components/storefront/ContactInfo";
import PageHeader from "../components/storefront/PageHeader";

export default function Contact() {
  return (
    <>
      <PageHeader
        title="Showroom &amp; Contact"
        subtitle="Visit our showroom or reach out for custom ornament inquiries, gold rate details, and appointments."
        crumb="Showroom & Contact"
      />
      <div className="container section">
        <ContactInfo />
      </div>
    </>
  );
}
