import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { getFoodImage } from '../utils/foodImage';

const CHIPS = ['All', 'North Indian', 'Chinese', 'Healthy', 'Biryani', 'Desserts'];

function RestaurantCard({ r, onClick }) {
  const [img, setImg] = useState(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    getFoodImage((r.cuisine || []).join(' ') || r.name).then((url) => {
      if (alive) {
        if (url) setImg(url);
        else setFailed(true);
      }
    });
    return () => { alive = false; };
  }, [r]);

  return (
    <div className="card" onClick={onClick}>
      {img && !failed ? (
        <img className="card-image" src={img} alt={r.name} onError={() => setFailed(true)} />
      ) : (
        <div className="card-image" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40 }}>
          🍽️
        </div>
      )}
      <div className="card-body">
        <p className="card-title">{r.name}</p>
        <p className="card-meta">{(r.cuisine || []).join(', ')}</p>
        <span className="rating-pill">★ {r.rating || 'New'} · {r.avgDeliveryTimeMins} min</span>
      </div>
    </div>
  );
}

export default function Home() {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeChip, setActiveChip] = useState('All');
  const navigate = useNavigate();

  async function fetchRestaurants(query = '') {
    setLoading(true);
    try {
      const res = await api.get('/restaurants', { params: query ? { search: query } : {} });
      setRestaurants(res.data.data);
    } catch (err) {
      console.error('Failed to load restaurants', err);
      setRestaurants([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchRestaurants();
  }, []);

  function handleSearch(e) {
    e.preventDefault();
    fetchRestaurants(search);
  }

  function handleChip(chip) {
    setActiveChip(chip);
    setSearch(chip === 'All' ? '' : chip);
    fetchRestaurants(chip === 'All' ? '' : chip);
  }

  return (
    <div className="container">
      <div className="hero">
        <h1>Hungry? We've got you 🍲</h1>
        <p>Order from the best restaurants near you, tracked live to your door.</p>
        <span className="emoji-decor">🛵</span>
      </div>

      <form className="search-bar" onSubmit={handleSearch}>
        <input
          placeholder="Search restaurants or cuisines..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button className="btn" type="submit">Search</button>
      </form>

      <div className="chip-row">
        {CHIPS.map((chip) => (
          <div
            key={chip}
            className={`chip ${activeChip === chip ? 'active' : ''}`}
            onClick={() => handleChip(chip)}
          >
            {chip}
          </div>
        ))}
      </div>

      {loading ? (
        <div className="grid">
          {[1, 2, 3, 4, 5, 6].map((i) => <div className="skeleton" key={i} />)}
        </div>
      ) : restaurants.length === 0 ? (
        <p style={{ color: 'var(--text-muted)' }}>
          No restaurants found. Make sure your backend is running and has seed data —
          run <code>node seed.js</code> in the backend folder.
        </p>
      ) : (
        <div className="grid">
          {restaurants.map((r) => (
            <RestaurantCard key={r._id} r={r} onClick={() => navigate(`/restaurant/${r._id}`)} />
          ))}
        </div>
      )}
    </div>
  );
}
