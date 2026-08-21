import React from "react";
import AboutSections from "../components/storefront/AboutSections";
import PageHeader from "../components/storefront/PageHeader";
import { BRAND_NAME } from "../config";

export default function About() {
  return (
    <>
      <PageHeader
        title={`About ${BRAND_NAME}`}
        subtitle="Our heritage, our certified hallmark guarantee, and the craftsmanship behind every piece."
        crumb="Heritage & Story"
      />
      <div className="container section">
        <AboutSections />
      </div>
    </>
  );
}
