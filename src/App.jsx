import React, { useState, useEffect } from 'react';
import { login, api } from './api';

const tabs = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'books', label: 'Libros' },
  { id: 'members', label: 'Miembros' },
  { id: 'loans', label: 'Préstamos' },
  { id: 'overdue', label: 'Vencidos' },
  { id: 'report', label: 'Reporte' },
];

export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem('token') || '');
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('change-me');
  const [authError, setAuthError] = useState('');
  const [active, setActive] = useState('dashboard');
  const [globalError, setGlobalError] = useState('');

  // books
  const [categories, setCategories] = useState([]);
  const [books, setBooks] = useState({ items: [], page: 1, size: 20, total: 0, q: '', categoryId: '' });
  const [booksLoading, setBooksLoading] = useState(false);

  // members
  const [members, setMembers] = useState({ items: [], page: 1, size: 20, total: 0, q: '' });
  const [membersLoading, setMembersLoading] = useState(false);

  // loans
  const [loans, setLoans] = useState({ items: [], page: 1, size: 20, total: 0, status: '', memberId: '', from: '', to: '' });
  const [loansLoading, setLoansLoading] = useState(false);

  // overdue
  const [overdue, setOverdue] = useState({ items: [], days: 0 });
  const [overdueLoading, setOverdueLoading] = useState(false);

  // report
  const [report, setReport] = useState({ from: new Date().toISOString().slice(0, 10).slice(0, 7) + '-01', to: new Date().toISOString().slice(0, 10), rows: [], loading: false });

  useEffect(() => {
    if (!token) return;
    localStorage.setItem('token', token);
    api(token, '/categories').then(setCategories).catch(e => setGlobalError(e.message));
  }, [token]);

  const doLogin = async (e) => {
    e.preventDefault();
    setAuthError('');
    try {
      const t = await login(username, password);
      setToken(t);
    } catch (err) {
      setAuthError(err.message);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken('');
    setBooks({ items: [], page: 1, size: 20, total: 0, q: '', categoryId: '' });
    setMembers({ items: [], page: 1, size: 20, total: 0, q: '' });
    setLoans({ items: [], page: 1, size: 20, total: 0, status: '', memberId: '', from: '', to: '' });
    setOverdue({ items: [], days: 0 });
  };

  const fetchBooks = async (page = books.page) => {
    setBooksLoading(true); setGlobalError('');
    try {
      const params = new URLSearchParams({ page, size: books.size });
      if (books.q) params.set('q', books.q);
      if (books.categoryId) params.set('category_id', books.categoryId);
      const d = await api(token, `/books?${params}`);
      setBooks(prev => ({ ...prev, ...d, page: d.page ?? page }));
    } catch (e) { setGlobalError(e.message); }
    setBooksLoading(false);
  };

  const fetchMembers = async (page = members.page) => {
    setMembersLoading(true); setGlobalError('');
    try {
      const params = new URLSearchParams({ page, size: members.size });
      if (members.q) params.set('q', members.q);
      const d = await api(token, `/members?${params}`);
      setMembers(prev => ({ ...prev, ...d, page: d.page ?? page }));
    } catch (e) { setGlobalError(e.message); }
    setMembersLoading(false);
  };

  const fetchLoans = async (page = loans.page) => {
    setLoansLoading(true); setGlobalError('');
    try {
      const params = new URLSearchParams({ page, size: loans.size });
      if (loans.status) params.set('status', loans.status);
      if (loans.memberId) params.set('member_id', loans.memberId);
      if (loans.from) params.set('from', loans.from);
      if (loans.to) params.set('to', loans.to);
      const d = await api(token, `/loans?${params}`);
      setLoans(prev => ({ ...prev, ...d, page: d.page ?? page }));
    } catch (e) { setGlobalError(e.message); }
    setLoansLoading(false);
  };

  const fetchOverdue = async () => {
    setOverdueLoading(true); setGlobalError('');
    try {
      const d = await api(token, '/loans/overdue');
      setOverdue({ items: d.items || [], days: d.items?.length || 0 });
    } catch (e) { setGlobalError(e.message); }
    setOverdueLoading(false);
  };

  const runReport = async () => {
    setReport(prev => ({ ...prev, loading: true }));
    setGlobalError('');
    try {
      const d = await api(token, `/reports/most-borrowed?from=${report.from}&to=${report.to}`);
      setReport(prev => ({ ...prev, rows: d.rows || [], loading: false }));
    } catch (e) { setGlobalError(e.message); setReport(prev => ({ ...prev, loading: false })); }
  };

  useEffect(() => {
    if (!token) return;
    if (active === 'books' && !books.items.length) fetchBooks(1);
    if (active === 'members' && !members.items.length) fetchMembers(1);
    if (active === 'loans' && !loans.items.length) fetchLoans(1);
    if (active === 'overdue') fetchOverdue();
    if (active === 'report' && !report.rows.length) runReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, token]);

  if (!token) {
    return (
      <div className="auth-shell">
        <form className="auth-card" onSubmit={doLogin}>
          <div className="brand">Manager Library</div>
          <h1>Iniciar sesión</h1>
          <p className="muted">Accede al panel de administración.</p>
          <label>Usuario
            <input value={username} onChange={e => setUsername(e.target.value)} autoComplete="username" />
          </label>
          <label>Contraseña
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} autoComplete="current-password" />
          </label>
          <button type="submit">Entrar</button>
          {authError && <div className="error">{authError}</div>}
        </form>
      </div>
    );
  }

  const pagination = (state, fetcher) => (
    <div className="pagination">
      <button onClick={() => fetcher(Math.max(1, state.page - 1))} disabled={state.page <= 1}>Anterior</button>
      <span>Página {state.page} · {state.total} total</span>
      <button onClick={() => fetcher(state.page + 1)} disabled={state.page * state.size >= state.total}>Siguiente</button>
    </div>
  );

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="brand">Manager Library</div>
        <nav>
          {tabs.map(t => (
            <button key={t.id} className={active === t.id ? 'nav-btn active' : 'nav-btn'} onClick={() => setActive(t.id)}>
              {t.label}
            </button>
          ))}
        </nav>
        <button className="logout" onClick={logout}>Cerrar sesión</button>
      </aside>

      <main className="content">
        <header className="topbar">
          <h1>{tabs.find(t => t.id === active)?.label}</h1>
        </header>

        {globalError && <div className="banner error">{globalError}</div>}

        {active === 'dashboard' && (
          <div className="cards">
            <div className="card"><div className="k">Libros</div><div className="v">{books.total || books.items.length}</div></div>
            <div className="card"><div className="k">Miembros</div><div className="v">{members.total || members.items.length}</div></div>
            <div className="card"><div className="k">Préstamos</div><div className="v">{loans.total || loans.items.length}</div></div>
            <div className="card"><div className="k">Vencidos</div><div className="v">{overdue.items.length}</div></div>
          </div>
        )}

        {active === 'books' && (
          <>
            <div className="toolbar">
              <input placeholder="Buscar título o autor" value={books.q} onChange={e => setBooks(p => ({ ...p, q: e.target.value }))} />
              <select value={books.categoryId} onChange={e => setBooks(p => ({ ...p, categoryId: e.target.value }))}>
                <option value="">Todas las categorías</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <button onClick={() => fetchBooks(1)}>Buscar</button>
            </div>
            {booksLoading ? <div className="spinner" /> : (
              <>
                <div className="grid">
                  {books.items.map(b => (
                    <article className="card" key={b.id}>
                      <h3>{b.title}</h3>
                      <p className="muted">{b.author}</p>
                      <div className="row"><span className="badge">{b.category?.name}</span>
                        <span className={b.available_copies > 0 ? 'badge ok' : 'badge warn'}>{b.available_copies} / {b.total_copies}</span>
                      </div>
                    </article>
                  ))}
                </div>
                {pagination(books, fetchBooks)}
              </>
            )}
          </>
        )}

        {active === 'members' && (
          <>
            <div className="toolbar">
              <input placeholder="Buscar miembro o documento" value={members.q} onChange={e => setMembers(p => ({ ...p, q: e.target.value }))} />
              <button onClick={() => fetchMembers(1)}>Buscar</button>
            </div>
            {membersLoading ? <div className="spinner" /> : (
              <>
                <div className="grid">
                  {members.items.map(m => (
                    <article className="card" key={m.id}>
                      <h3>{m.full_name}</h3>
                      <p className="muted">{m.document_number}</p>
                      <div className="row"><span className="badge">Préstamos activos {m.active_loans ?? 0}</span></div>
                    </article>
                  ))}
                </div>
                {pagination(members, fetchMembers)}
              </>
            )}
          </>
        )}

        {active === 'loans' && (
          <>
            <div className="toolbar">
              <select value={loans.status} onChange={e => setLoans(p => ({ ...p, status: e.target.value }))}>
                <option value="">Todos</option>
                <option value="open">Abiertos</option>
                <option value="overdue">Vencidos</option>
                <option value="closed">Cerrados</option>
              </select>
              <button onClick={() => fetchLoans(1)}>Filtrar</button>
            </div>
            {loansLoading ? <div className="spinner" /> : (
              <>
                {loans.items.map(l => (
                  <article className="card" key={l.id}>
                    <div className="row">
                      <h3>Préstamo {l.id.slice(0, 8)}…</h3>
                      <span className={`badge ${l.status}`}>{l.status}</span>
                    </div>
                    <p className="muted">{new Date(l.loaned_at).toLocaleString()}</p>
                    <ul className="items">
                      {(l.items || []).map(it => (
                        <li key={it.id}>{it.book_title} · vence {new Date(it.due_at).toLocaleDateString()} {it.returned_at ? '(devuelto)' : ''}</li>
                      ))}
                    </ul>
                  </article>
                ))}
                {pagination(loans, fetchLoans)}
              </>
            )}
          </>
        )}

        {active === 'overdue' && (
          <>
            <button onClick={fetchOverdue}>Actualizar</button>
            {overdueLoading ? <div className="spinner" /> : (
              <div className="grid">
                {overdue.items.map((o, i) => (
                  <article className="card" key={i}>
                    <h3>{o.book_title}</h3>
                    <p className="muted">{o.member_name}</p>
                    <div className="row"><span className="badge warn">{o.days_late} días tarde</span></div>
                    <p className="muted">Vence {new Date(o.due_at).toLocaleDateString()}</p>
                  </article>
                ))}
                {!overdue.items.length && <p className="muted">No hay vencidos.</p>}
              </div>
            )}
          </>
        )}

        {active === 'report' && (
          <>
            <div className="toolbar">
              <label>Desde <input type="date" value={report.from} onChange={e => setReport(p => ({ ...p, from: e.target.value }))} /></label>
              <label>Hasta <input type="date" value={report.to} onChange={e => setReport(p => ({ ...p, to: e.target.value }))} /></label>
              <button onClick={runReport}>Generar</button>
            </div>
            {report.loading ? <div className="spinner" /> : (
              <table>
                <thead><tr><th>Libro</th><th>Categoría</th><th>Veces</th></tr></thead>
                <tbody>
                  {report.rows.map((r, i) => (
                    <tr key={i}><td>{r.book_title}</td><td>{r.category_name}</td><td>{r.times_borrowed}</td></tr>
                  ))}
                  {!report.rows.length && <tr><td colSpan="3" className="muted">Sin datos en el rango.</td></tr>}
                </tbody>
              </table>
            )}
          </>
        )}
      </main>
    </div>
  );
}