import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useToast } from "../context/ToastContext";

/**
 * Shared "Get in touch" behaviour used by the product grid and detail page.
 *  - Not logged in -> send them to /login, remembering the product to add.
 *  - Logged in     -> add to the inquiry cart and navigate there.
 */
export default function useGetInTouch() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const cart = useCart();
  const toast = useToast();

  return (product) => {
    if (!isAuthenticated) {
      navigate("/login", { state: { from: "/cart", pendingProduct: product } });
      return;
    }
    if (cart.has(product.id)) {
      toast.info(`${product.itemName} is already in your inquiry cart.`);
    } else {
      cart.add(product);
      toast.success(`${product.itemName} added to your inquiry cart.`);
    }
    navigate("/cart");
  };
}
