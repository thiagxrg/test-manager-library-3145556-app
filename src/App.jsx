import React, { useState, useEffect } from 'react';
import { login, api } from './api';

export default function App() {
  const [token, setToken] = useState(null);
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('change-me');
  const [tab, setTab] = useState('books');
  const [books, setBooks] = useState([]);
  const [members, setMembers] = useState([]);
  const [error, setError] = useState('');

  const doLogin = async (e) => {
    e.preventDefault();
    setError('');
    try { setToken(await login(username, password)); } catch (err) { setError(err.message); }
  };

  useEffect(() => {
    if (!token) return;
    api(token, '/books').then(d => setBooks(d.items || d)).catch(e => setError(e.message));
    api(token, '/members').then(d => setMembers(d.items || d)).catch(() => {});
  }, [token]);

  if (!token) {
    return (
      <div className="center">
        <form onSubmit={doLogin} className="card">
          <h1>Manager Library</h1>
          <input value={username} onChange={e => setUsername(e.target.value)} placeholder="usuario" />
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="contraseña" />
          <button type="submit">Entrar</button>
          {error && <p className="error">{error}</p>}
        </form>
      </div>
    );
  }

  return (
    <div>
      <header><h1>Manager Library</h1><button onClick={() => setToken(null)}>Salir</button></header>
      <nav>
        <button onClick={() => setTab('books')} className={tab === 'books' ? 'active' : ''}>Libros</button>
        <button onClick={() => setTab('members')} className={tab === 'members' ? 'active' : ''}>Miembros</button>
      </nav>
      {error && <p className="error">{error}</p>}
      {tab === 'books' && (
        <div className="grid">
          {books.map(b => (
            <article className="card" key={b.id}>
              <h2>{b.title}</h2>
              <p>{b.author}</p>
              <p>{b.category?.name} · disponibles {b.available_copies}/{b.total_copies}</p>
            </article>
          ))}
        </div>
      )}
      {tab === 'members' && (
        <div className="grid">
          {members.map(m => (
            <article className="card" key={m.id}>
              <h2>{m.full_name}</h2>
              <p>{m.document_number} · préstamos activos {m.active_loans ?? 0}</p>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}