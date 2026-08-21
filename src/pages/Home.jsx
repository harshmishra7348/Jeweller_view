import React from "react";
import { Link } from "react-router-dom";
import ProductCard from "../components/storefront/ProductCard";
import HomeBanner from "../components/storefront/HomeBanner";
import HomeAbout from "../components/storefront/HomeAbout";
import HomeContact from "../components/storefront/HomeContact";
import Spinner from "../components/common/Spinner";
import useGetInTouch from "../hooks/useGetInTouch";
import useProducts from "../hooks/useProducts";

const FEATURED_COUNT = 8;

export default function Home() {
  const { products, loading, error } = useProducts();
  const getInTouch = useGetInTouch();
  const featured = products.slice(0, FEATURED_COUNT);

  return (
    <>
      <HomeBanner />
      <section className="section" id="catalogue">
        <div className="container">
          <div className="section-head with-cta">
            <div>
              <span className="eyebrow">Jewelry Collections</span>
              <h2>Featured Ornament Showcase</h2>
              <p>Handcrafted 22K/24K Gold, Fine Diamonds &amp; Solitaires available for immediate order.</p>
            </div>
            <Link to="/products" className="btn btn-outline">View All Collections →</Link>
          </div>

          {loading ? (
            <Spinner full />
          ) : error ? (
            <div className="empty-state">
              <div className="emoji">⚠️</div>
              <h3>Couldn't load jewelry catalog</h3>
              <p>{error}</p>
            </div>
          ) : featured.length === 0 ? (
            <div className="empty-state">
              <div className="emoji">💎</div>
              <h3>No jewelry items found</h3>
              <p>Our artisans are updating the new showcase. Please check back soon.</p>
            </div>
          ) : (
            <>
              <div className="product-grid">
                {featured.map((p) => (
                  <ProductCard key={p.id} product={p} onGetInTouch={getInTouch} />
                ))}
              </div>
              {products.length > FEATURED_COUNT && (
                <div className="section-foot">
                  <Link to="/products" className="btn btn-primary">Browse All {products.length} Jewelry Items →</Link>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      <HomeAbout />
      <HomeContact />
    </>
  );
}
