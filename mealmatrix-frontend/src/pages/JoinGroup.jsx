import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function JoinGroup() {
  const [code, setCode] = useState('');
  const navigate = useNavigate();

  function handleJoin(e) {
    e.preventDefault();
    if (!code.trim()) return;
    navigate(`/group/${code.trim().toUpperCase()}`);
  }

  return (
    <div className="container">
      <div className="hero">
        <h1>Join a Group Order 👥</h1>
        <p>Got a code from a friend? Enter it below to join their order.</p>
        <span className="emoji-decor">🔑</span>
      </div>

      <form className="search-bar" onSubmit={handleJoin}>
        <input
          placeholder="Enter 6-character code, e.g. AB3XZ9"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          maxLength={6}
          style={{ textTransform: 'uppercase', letterSpacing: 2, fontWeight: 700 }}
        />
        <button className="btn" type="submit">Join</button>
      </form>
    </div>
  );
}
