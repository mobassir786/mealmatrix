import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import { useCart } from '../context/CartContext';
import { getFoodImage } from '../utils/foodImage';

function MenuItemRow({ item, restaurantId, addItem }) {
  const [img, setImg] = useState(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    getFoodImage(item.name).then((url) => {
      if (alive) {
        if (url) setImg(url);
        else setFailed(true);
      }
    });
    return () => { alive = false; };
  }, [item.name]);

  return (
    <div className="menu-item">
      {img && !failed ? (
        <img className="menu-item-image" src={img} alt={item.name} onError={() => setFailed(true)} />
      ) : (
        <div className="menu-item-image" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>
          🍛
        </div>
      )}
      <div className="menu-item-info">
        <span className={`veg-dot filled ${!item.isVeg ? 'nonveg' : ''}`} />
        <strong>{item.name}</strong>
        <p className="card-meta" style={{ margin: '4px 0 0 17px' }}>{item.description}</p>
        <p style={{ margin: '4px 0 0 17px', fontWeight: 600 }}>₹{item.price}</p>
      </div>
      <button
        className="btn secondary"
        onClick={() => addItem({ menuItem: item._id, name: item.name, price: item.price }, restaurantId)}
      >
        Add +
      </button>
    </div>
  );
}

export default function RestaurantMenu() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [creatingGroup, setCreatingGroup] = useState(false);
  const { addItem } = useCart();

  useEffect(() => {
    api
      .get(`/restaurants/${id}`)
      .then((res) => setData(res.data.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [id]);

  async function startGroupOrder() {
    const hostName = window.prompt("What's your name? (shown to others in the group)");
    if (!hostName) return;
    setCreatingGroup(true);
    try {
      const res = await api.post('/group-orders', {
        hostName,
        restaurantId: id,
        deliveryLocation: { lat: 25.6, lng: 85.14 },
      });
      sessionStorage.setItem('mm_participant_name', hostName);
      navigate(`/group/${res.data.data.code}`);
    } catch (err) {
      alert('Could not start group order. Is the backend running?');
    } finally {
      setCreatingGroup(false);
    }
  }

  if (loading) return <div className="container"><div className="skeleton" style={{ height: 300 }} /></div>;
  if (!data) return <div className="container">Restaurant not found.</div>;

  const { restaurant, menu } = data;

  return (
    <div className="container">
      <h1>{restaurant.name}</h1>
      <p style={{ color: 'var(--text-muted)' }}>
        {(restaurant.cuisine || []).join(', ')} · ★ {restaurant.rating || 'New'} ·{' '}
        {restaurant.avgDeliveryTimeMins} min delivery
      </p>

      <button className="btn secondary" style={{ marginTop: 10 }} disabled={creatingGroup} onClick={startGroupOrder}>
        👥 {creatingGroup ? 'Starting...' : 'Start a Group Order'}
      </button>

      <div style={{ marginTop: 24, background: 'var(--surface)', borderRadius: 18, boxShadow: 'var(--shadow)' }}>
        {menu.length === 0 ? (
          <p style={{ padding: 20, color: 'var(--text-muted)' }}>No menu items yet.</p>
        ) : (
          menu.map((item) => (
            <MenuItemRow key={item._id} item={item} restaurantId={restaurant._id} addItem={addItem} />
          ))
        )}
      </div>
    </div>
  );
}
