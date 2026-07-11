import { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api';

// A simple "who are you" prompt stored in sessionStorage per tab, so
// multiple participants can be simulated by opening multiple browser tabs
// without building full authentication for this demo feature.
function useParticipantName() {
  const [name, setName] = useState(() => sessionStorage.getItem('mm_participant_name') || '');
  function saveName(n) {
    sessionStorage.setItem('mm_participant_name', n);
    setName(n);
  }
  return [name, saveName];
}

export default function GroupOrder() {
  const { code } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [name, setName] = useParticipantName();
  const [nameInput, setNameInput] = useState('');
  const [group, setGroup] = useState(null);
  const [menu, setMenu] = useState([]);
  const [error, setError] = useState('');

  const restaurantId = searchParams.get('restaurantId'); // only present when CREATING a new group

  async function refresh() {
    try {
      const res = await api.get(`/group-orders/${code}`);
      setGroup(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Group order not found');
    }
  }

  useEffect(() => {
    if (code) refresh();
    const interval = setInterval(() => code && refresh(), 4000); // simple polling for live-ish updates
    return () => clearInterval(interval);
  }, [code]);

  useEffect(() => {
    if (group?.restaurant?._id || group?.restaurant) {
      const rId = group.restaurant._id || group.restaurant;
      api.get(`/restaurants/${rId}`).then((res) => setMenu(res.data.data.menu));
    }
  }, [group]);

  async function handleJoin() {
    if (!nameInput.trim()) return;
    try {
      await api.post(`/group-orders/${code}/join`, { name: nameInput.trim() });
      setName(nameInput.trim());
      refresh();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not join');
    }
  }

  function myParticipant() {
    return group?.participants.find((p) => p.name === name);
  }

  async function addItem(item) {
    const me = myParticipant();
    const current = me ? [...me.items] : [];
    const existing = current.find((i) => i.menuItem === item._id);
    const updated = existing
      ? current.map((i) => (i.menuItem === item._id ? { ...i, quantity: i.quantity + 1 } : i))
      : [...current, { menuItem: item._id, name: item.name, price: item.price, quantity: 1 }];

    await api.patch(`/group-orders/${code}/items`, { name, items: updated });
    refresh();
  }

  async function markDone() {
    await api.patch(`/group-orders/${code}/lock`, { name });
    refresh();
  }

  async function finalize() {
    try {
      const res = await api.post(`/group-orders/${code}/finalize`);
      navigate(`/track/${res.data.data.order._id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not finalize');
    }
  }

  if (error) return <div className="container"><p style={{ color: 'var(--primary)' }}>{error}</p></div>;
  if (!group) return <div className="container">Loading group order...</div>;

  const me = myParticipant();
  const allLocked = group.participants.every((p) => p.isLocked);
  const isHost = name === group.hostName;

  return (
    <div className="container">
      <div className="hero">
        <h1>Group Order 👥</h1>
        <p>Share this code with friends: <strong style={{ fontSize: 20 }}>{group.code}</strong></p>
        <span className="emoji-decor">🍽️</span>
      </div>

      {!name ? (
        <div style={{ background: 'var(--surface)', padding: 20, borderRadius: 18, boxShadow: 'var(--shadow)' }}>
          <h3>What's your name?</h3>
          <div className="search-bar">
            <input
              placeholder="e.g. Priya"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
            />
            <button className="btn" onClick={handleJoin}>Join Group</button>
          </div>
        </div>
      ) : (
        <>
          <h3>Hi {name}! Add your items:</h3>
          <div style={{ background: 'var(--surface)', borderRadius: 18, boxShadow: 'var(--shadow)', marginBottom: 20 }}>
            {menu.map((item) => (
              <div className="menu-item" key={item._id}>
                <div className="menu-item-info">
                  <strong>{item.name}</strong>
                  <p style={{ margin: '4px 0 0' }}>₹{item.price}</p>
                </div>
                <button className="btn secondary" disabled={me?.isLocked} onClick={() => addItem(item)}>
                  Add +
                </button>
              </div>
            ))}
          </div>

          {!me?.isLocked ? (
            <button className="btn" style={{ width: '100%', padding: 14 }} onClick={markDone}>
              I'm done adding items ✅
            </button>
          ) : (
            <p style={{ color: 'var(--secondary)', fontWeight: 600 }}>You're locked in — waiting on others.</p>
          )}

          <h3 style={{ marginTop: 28 }}>Group summary</h3>
          <div style={{ background: 'var(--surface)', borderRadius: 18, boxShadow: 'var(--shadow)', padding: 16 }}>
            {group.participants.map((p) => (
              <div key={p.name} style={{ marginBottom: 14 }}>
                <strong>{p.name}</strong> {p.isLocked ? '✅' : '⏳ still adding...'}
                {p.items.map((i) => (
                  <div className="price-row" key={i.menuItem}>
                    <span>{i.name} × {i.quantity}</span>
                    <span>₹{i.price * i.quantity}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>

          {isHost && (
            <button
              className="btn"
              style={{ width: '100%', padding: 14, marginTop: 20 }}
              disabled={!allLocked}
              onClick={finalize}
            >
              {allLocked ? 'Finalize Group Order 🎉' : 'Waiting for everyone to finish...'}
            </button>
          )}
        </>
      )}
    </div>
  );
}
