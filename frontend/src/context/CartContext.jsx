import { createContext, useContext, useState, useEffect } from "react";
import { authFetch, getAccessToken } from "../utils/auth";

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const BASEURL = import.meta.env.VITE_DJANGO_BASE_URL;
  const [cartItems, setCartItems] = useState([]);
  const [total, setTotal] = useState(0);

  // Fetch cart from backend
  const fetchCart = async () => {
    const token = getAccessToken();

    if (!token) {
      setCartItems([]);
      setTotal(0);
      return;
    }

    try {
      const res = await authFetch(`${BASEURL}/api/cart/`);

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        console.error("Cart error:", res.status, errorData);
        return;
      }

      const data = await res.json();
      setCartItems(data.items || []);
      setTotal(data.total || 0);
    } catch (error) {
      console.error("Error fetching cart:", error);
    }
  };

  useEffect(() => {
    fetchCart();
  }, []);

  // Add product to cart
  const addToCart = async (productId) => {
    try {
      const res = await authFetch(`${BASEURL}/api/cart/add/`, {
        method: "POST",
        body: JSON.stringify({ product_id: productId }),
      });

      if (!res.ok) {
        console.error("Add to cart failed:", res.status, await res.text());
        return;
      }

      await fetchCart();
    } catch (error) {
      console.error("Error adding to cart:", error);
    }
  };

  // Remove product from cart
  const removeFromCart = async (itemId) => {
    try {
      const res = await authFetch(`${BASEURL}/api/cart/remove/`, {
        method: "POST",
        body: JSON.stringify({ item_id: itemId }),
      });

      if (!res.ok) {
        console.error("Remove from cart failed:", res.status, await res.text());
        return;
      }

      await fetchCart();
    } catch (error) {
      console.error("Error removing from cart:", error);
    }
  };

  // Update quantity
  const updateQuantity = async (itemId, quantity) => {
    if (quantity < 1) {
      await removeFromCart(itemId);
      return;
    }

    try {
      const res = await authFetch(`${BASEURL}/api/cart/update/`, {
        method: "POST",
        body: JSON.stringify({ item_id: itemId, quantity }),
      });

      if (!res.ok) {
        console.error("Update quantity failed:", res.status, await res.text());
        return;
      }

      await fetchCart();
    } catch (error) {
      console.error("Error updating quantity:", error);
    }
  };

  const clearCart = () => {
    setCartItems([]);
    setTotal(0);
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        total,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        refreshCart: fetchCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
