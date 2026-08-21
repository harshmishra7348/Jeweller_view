import React, { useEffect, useRef, useState } from "react";
import { useSearchParams, useLocation } from "react-router-dom";
import ProductCard from "../components/storefront/ProductCard";
import PageHeader from "../components/storefront/PageHeader";
import Spinner from "../components/common/Spinner";
import useGetInTouch from "../hooks/useGetInTouch";
import useProducts from "../hooks/useProducts";
import { storefront } from "../api/services";
import { errorMessage } from "../api/http";
import { useToast } from "../context/ToastContext";

export default function Products() {
  const [searchParams] = useSearchParams();
  const { products: initialProducts, loading: initialLoading, error: initialError } = useProducts();
  const [query, setQuery] = useState(() => searchParams.get("q") || "");
  const [debouncedQuery, setDebouncedQuery] = useState(() => searchParams.get("q") || "");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const searchRef = useRef(null);
  const getInTouch = useGetInTouch();
  const toast = useToast();

  const location = useLocation();

  // Auto-focus search bar when coming from hero search button (#search) or with ?q= param
  useEffect(() => {
    if ((searchParams.get("q") || location.hash === "#search") && searchRef.current) {
      searchRef.current.focus();
    }
  }, []);  // eslint-disable-line react-hooks/exhaustive-deps

  // Debounce search query by 500ms
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query);
    }, 500);
    return () => clearTimeout(handler);
  }, [query]);

  // Fetch search results from backend API
  useEffect(() => {
    const q = debouncedQuery.trim();
    if (!q) {
      setSearchResults([]);
      setSearchError(null);
      setSearching(false);
      return;
    }

    let alive = true;
    (async () => {
      setSearching(true);
      setSearchError(null);
      try {
        const data = await storefront.searchProducts(q);
        if (alive) {
          setSearchResults(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        if (alive) {
          setSearchError(errorMessage(err));
          toast.error(errorMessage(err));
        }
      } finally {
        if (alive) {
          setSearching(false);
        }
      }
    })();

    return () => {
      alive = false;
    };
  }, [debouncedQuery, toast]);

  const displayedProducts = query.trim() ? searchResults : initialProducts;
  const error = query.trim() ? searchError : initialError;
  const loading = query.trim() ? (searching && searchResults.length === 0) : initialLoading;

  return (
    <>
      <PageHeader
        title="Fine Jewelry Collections"
        subtitle="Explore certified 22K/24K Gold, Fine Diamonds, Solitaires &amp; Silverware. Request a custom quote."
        crumb="Collections"
      />
      <div className="container section">
        <div className="search-bar">
          <div className="search-bar-inner">
            <span className="search-icon">🔍</span>
            <input
              ref={searchRef}
              placeholder="Search necklaces, bangles, rings, 22K gold, diamonds…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") e.preventDefault(); }}
            />
            {query && (
              <button
                className="search-btn"
                type="button"
                onClick={() => setQuery("")}
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <Spinner full />
        ) : error ? (
          <div className="empty-state">
            <div className="emoji">⚠️</div>
            <h3>Couldn't load jewelry catalog</h3>
            <p>{error}</p>
          </div>
        ) : displayedProducts.length === 0 ? (
          <div className="empty-state">
            <div className="emoji">💎</div>
            <h3>No jewelry items found</h3>
            <p>{query ? "Try a different search query." : "Please check back soon."}</p>
          </div>
        ) : (
          <div className="product-grid">
            {displayedProducts.map((p) => (
              <ProductCard key={p.id} product={p} onGetInTouch={getInTouch} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
