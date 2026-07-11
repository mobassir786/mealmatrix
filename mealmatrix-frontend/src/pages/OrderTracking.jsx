import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { io } from 'socket.io-client';
import api from '../api';

const STATUSES = ['placed', 'confirmed', 'preparing', 'out_for_delivery', 'delivered'];

export default function OrderTracking() {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [pinPos, setPinPos] = useState({ x: 5, y: 50 }); // percentage-based
  const socketRef = useRef(null);

  useEffect(() => {
    api.get(`/orders/${orderId}`).then((res) => setOrder(res.data.data)).catch(console.error);

    const socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000');
    socketRef.current = socket;

    socket.emit('join_order_room', orderId);

    socket.on('status_update', ({ status }) => {
      setOrder((prev) => (prev ? { ...prev, status } : prev));
    });

    socket.on('location_update', ({ lat, lng }) => {
      // Map lat/lng (-1..1 demo range) onto a percentage position along the road
      const x = ((lng + 1) / 2) * 90 + 5;
      const y = 50 + Math.sin(x / 12) * 15; // slight wave so it looks road-like
      setPinPos({ x, y });
    });

    return () => {
      socket.emit('leave_order_room', orderId);
      socket.disconnect();
    };
  }, [orderId]);

  if (!order) return <div className="container">Loading order...</div>;

  const currentIndex = STATUSES.indexOf(order.status);

  return (
    <div className="container">
      <h1>Tracking your order</h1>
      <p style={{ color: 'var(--text-muted)' }}>Order ID: {order._id}</p>

      <div className="status-stepper">
        {STATUSES.map((s, i) => (
          <div key={s} className={`step ${i === currentIndex ? 'active' : i < currentIndex ? 'done' : ''}`}>
            <div className="step-dot" />
            {s.replace(/_/g, ' ')}
          </div>
        ))}
      </div>

      <div className="tracking-map">
        <div className="tracking-road" />
        <div className="tracking-home" style={{ left: '4%', top: '50%', transform: 'translateY(-50%)' }}>🏪</div>
        <div className="tracking-dest" style={{ right: '4%', top: '50%', transform: 'translateY(-50%)' }}>🏠</div>
        <div className="tracking-pin" style={{ left: `${pinPos.x}%`, top: `${pinPos.y}%` }}>🛵</div>
      </div>

      <p style={{ marginTop: 16, color: 'var(--text-muted)', fontSize: 13 }}>
        This map updates live via WebSocket as the delivery partner's location changes.
        Trigger location ticks from <code>tracking-demo.html</code> using this same order ID to see the scooter move.
      </p>
    </div>
  );
}
