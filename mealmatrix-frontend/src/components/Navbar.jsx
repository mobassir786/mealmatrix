import { Link, useLocation } from 'react-router-dom';
import { useCart } from '../context/CartContext';

export function Navbar() {
  return (
    <div className="navbar">
      <Link to="/" className="logo" style={{ textDecoration: 'none' }}>
        MealMatrix
      </Link>
      <Link to="/join-group" style={{ fontSize: 13, fontWeight: 600 }}>👥 Join Group</Link>
    </div>
  );
}

export function BottomNav() {
  const { items } = useCart();
  const count = items.reduce((sum, i) => sum + i.quantity, 0);
  const location = useLocation();

  const isActive = (path) => (path === '/' ? location.pathname === '/' : location.pathname.startsWith(path));

  return (
    <div className="bottom-nav">
      <Link to="/" className={isActive('/') ? 'active' : ''}>
        <span className="icon">🏠</span>
        Home
      </Link>
      <Link to="/join-group" className={isActive('/join-group') ? 'active' : ''}>
        <span className="icon">👥</span>
        Group
      </Link>
      <Link to="/cart" className={isActive('/cart') ? 'active' : ''}>
        <span className="icon">🛒</span>
        Cart {count > 0 && <span className="badge">{count}</span>}
      </Link>
      <Link to="/" className="">
        <span className="icon">👤</span>
        Profile
      </Link>
    </div>
  );
}
