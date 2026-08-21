import { useEffect, useState } from "react";
import { storefront } from "../api/services";
import { errorMessage } from "../api/http";

/** Fetch active storefront products once. Shared by Home (featured) and Products (catalogue). */
export default function useProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const data = await storefront.listProducts();
        if (alive) setProducts(Array.isArray(data) ? data : []);
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

  return { products, loading, error };
}
