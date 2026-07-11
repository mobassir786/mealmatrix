import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import api from '../api';

// Generates a unique key once per checkout attempt. If the user double-clicks
// "Place Order" or the request is retried, the SAME key is sent both times —
// this is what the backend uses to prevent creating duplicate orders.
function generateIdempotencyKey() {
  return `order_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

export default function Checkout() {
  const { items, restaurantId, itemsTotal, clearCart } = useCart();
  const [placing, setPlacing] = useState(false);
  const [idempotencyKey] = useState(generateIdempotencyKey()); // stable for this checkout session
  const navigate = useNavigate();

  async function placeOrder() {
    if (placing) return; // extra client-side guard against double submit
    setPlacing(true);
    try {
      const res = await api.post('/orders', {
        customerId: '000000000000000000000001', // fixed demo customer created by seed.js
        restaurantId,
        items,
        idempotencyKey,
        deliveryLocation: { lat: 25.6, lng: 85.14 }, // demo coordinates (Patna)
      });

      const order = res.data.data;
      clearCart();
      navigate(`/track/${order._id}`);
    } catch (err) {
      console.error(err);
      alert('Failed to place order. Is the backend running?');
    } finally {
      setPlacing(false);
    }
  }

  return (
    <div className="container">
      <h1>Checkout</h1>
      <div style={{ background: 'var(--surface)', padding: 20, borderRadius: 14, border: '1px solid var(--border)' }}>
        <h3>Order Summary</h3>
        {items.map((item) => (
          <div className="price-row" key={item.menuItem}>
            <span>{item.name} × {item.quantity}</span>
            <span>₹{item.price * item.quantity}</span>
          </div>
        ))}
        <div className="price-row total"><span>Items total</span><span>₹{itemsTotal}</span></div>
      </div>

      <div style={{ marginTop: 20, color: 'var(--text-muted)', fontSize: 14 }}>
        Payment: <strong style={{ color: 'var(--text)' }}>Mock Stripe (demo mode)</strong> — no real card needed for testing.
      </div>

      <button className="btn" style={{ marginTop: 20, width: '100%', padding: '14px' }} disabled={placing} onClick={placeOrder}>
        {placing ? 'Placing order...' : 'Place Order'}
      </button>
    </div>
  );
}
