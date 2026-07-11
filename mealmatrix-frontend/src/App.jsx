import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Navbar, BottomNav } from './components/Navbar';
import Home from './pages/Home';
import RestaurantMenu from './pages/RestaurantMenu';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import OrderTracking from './pages/OrderTracking';
import GroupOrder from './pages/GroupOrder';
import JoinGroup from './pages/JoinGroup';
import { CartProvider } from './context/CartContext';

export default function App() {
  return (
    <CartProvider>
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/restaurant/:id" element={<RestaurantMenu />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/track/:orderId" element={<OrderTracking />} />
          <Route path="/group/:code" element={<GroupOrder />} />
          <Route path="/join-group" element={<JoinGroup />} />
        </Routes>
        <BottomNav />
      </BrowserRouter>
    </CartProvider>
  );
}
