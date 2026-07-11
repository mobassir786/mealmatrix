import { createContext, useContext, useState } from 'react';

// Simple React Context for cart state — no Redux needed for a project
// this size. Interview point: "I used Context + useState instead of Redux
// since the cart is the only global state; pulling in Redux would've been
// over-engineering for this scope."
const CartContext = createContext();

export function CartProvider({ children }) {
  const [items, setItems] = useState([]); // [{ menuItem, name, price, quantity }]
  const [restaurantId, setRestaurantId] = useState(null);

  function addItem(item, fromRestaurantId) {
    // Guard: prevent mixing items from two different restaurants in one cart
    if (restaurantId && restaurantId !== fromRestaurantId) {
      const confirmSwitch = window.confirm(
        'Your cart has items from another restaurant. Clear cart and add this instead?'
      );
      if (!confirmSwitch) return;
      setItems([]);
    }
    setRestaurantId(fromRestaurantId);

    setItems((prev) => {
      const existing = prev.find((i) => i.menuItem === item.menuItem);
      if (existing) {
        return prev.map((i) =>
          i.menuItem === item.menuItem ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  }

  function updateQuantity(menuItemId, delta) {
    setItems((prev) =>
      prev
        .map((i) => (i.menuItem === menuItemId ? { ...i, quantity: i.quantity + delta } : i))
        .filter((i) => i.quantity > 0)
    );
  }

  function clearCart() {
    setItems([]);
    setRestaurantId(null);
  }

  const itemsTotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  return (
    <CartContext.Provider
      value={{ items, restaurantId, addItem, updateQuantity, clearCart, itemsTotal }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
