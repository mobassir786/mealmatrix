import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';

export default function Cart() {
  const { items, updateQuantity, itemsTotal } = useCart();
  const navigate = useNavigate();

  const deliveryFee = 30;
  const tax = Math.round(itemsTotal * 0.05);
  const grandTotal = itemsTotal + deliveryFee + tax;

  if (items.length === 0) {
    return (
      <div className="container">
        <h1>Your cart is empty</h1>
        <button className="btn" onClick={() => navigate('/')}>Browse restaurants</button>
      </div>
    );
  }

  return (
    <div className="container">
      <h1>Your Cart</h1>
      <div style={{ background: 'var(--surface)', borderRadius: 14, border: '1px solid var(--border)' }}>
        {items.map((item) => (
          <div className="menu-item" key={item.menuItem}>
            <div>
              <strong>{item.name}</strong>
              <p className="card-meta">₹{item.price} × {item.quantity}</p>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <button className="btn secondary" onClick={() => updateQuantity(item.menuItem, -1)}>−</button>
              <span>{item.quantity}</span>
              <button className="btn secondary" onClick={() => updateQuantity(item.menuItem, 1)}>+</button>
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 24, background: 'var(--surface)', padding: 20, borderRadius: 14, border: '1px solid var(--border)' }}>
        <div className="price-row"><span>Items total</span><span>₹{itemsTotal}</span></div>
        <div className="price-row"><span>Delivery fee</span><span>₹{deliveryFee}</span></div>
        <div className="price-row"><span>Tax</span><span>₹{tax}</span></div>
        <div className="price-row total"><span>Total</span><span>₹{grandTotal}</span></div>
      </div>

      <button className="btn" style={{ marginTop: 20, width: '100%', padding: '14px' }} onClick={() => navigate('/checkout')}>
        Proceed to Checkout
      </button>
    </div>
  );
}
