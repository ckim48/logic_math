import { useEffect, useState } from 'react';
import Tex from '../Tex';
import { authErrorText, listProgress, logIn, logOut, signUp } from '../store';
import Icon from '../Icon';
import { PROBLEMS, problemIndex } from '../lib/problems';

export default function Account({ user }) {
  if (user === undefined) return <div className="loading">Loading…</div>;
  return user ? <Profile user={user} /> : <AuthForm />;
}

function AuthForm() {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await (mode === 'login' ? logIn : signUp)(email.trim(), password);
    } catch (err) {
      setError(authErrorText(err));
    }
    setBusy(false);
  };

  return (
    <section className="auth">
      <div className="card auth-card">
        <div className="seg full">
          <button type="button" className={mode === 'login' ? 'on' : ''} onClick={() => setMode('login')}>Log in</button>
          <button type="button" className={mode === 'signup' ? 'on' : ''} onClick={() => setMode('signup')}>Sign up</button>
        </div>
        <h1>{mode === 'login' ? 'Welcome back' : 'Create an account'}</h1>
        <p className="muted">Signed-in progress is saved to the cloud, so you can continue on any device.</p>
        <form onSubmit={submit}>
          <label>
            Email
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
          </label>
          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              minLength={mode === 'signup' ? 6 : undefined}
              required
            />
          </label>
          {mode === 'signup' && <p className="muted small">At least 6 characters.</p>}
          {error && <p className="auth-error">{error}</p>}
          <button className="primary full" type="submit" disabled={busy}>
            {busy ? 'Please wait…' : mode === 'login' ? 'Log in' : 'Create account'}
          </button>
        </form>
      </div>
      <div className="auth-side">
        <Tex block>{String.raw`\text{progress} : \text{User} \times \text{Puzzle} \to \text{Grid}`}</Tex>
        <p className="muted">Without an account, progress stays in this browser only.</p>
      </div>
    </section>
  );
}

const puzzleName = (id) => `Problem ${problemIndex(id) + 1} · ${PROBLEMS[problemIndex(id)].level}`;

function Profile({ user }) {
  const [items, setItems] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    listProgress(user.uid)
      // Only puzzles in the current problem set; older random puzzles are ignored.
      .then((list) => setItems(list.filter((it) => problemIndex(it.id) >= 0).sort((a, b) => problemIndex(a.id) - problemIndex(b.id))))
      .catch((e) => setError(e.message));
  }, [user.uid]);

  const solved = items?.filter((it) => it.solved).length || 0;
  const hints = items?.reduce((sum, it) => sum + (it.hints || 0), 0) || 0;

  return (
    <section className="section first">
      <div className="profile-head">
        <div>
          <p className="eyebrow">Account</p>
          <h1>{user.email}</h1>
        </div>
        <button onClick={logOut}>Log out</button>
      </div>

      <div className="stats">
        <div className="card stat"><span className="muted small">Problems started</span><strong>{items ? `${items.length} / ${PROBLEMS.length}` : '–'}</strong></div>
        <div className="card stat"><span className="muted small">Solved</span><strong>{items ? solved : '–'}</strong></div>
        <div className="card stat"><span className="muted small">Hints used</span><strong>{items ? hints : '–'}</strong></div>
      </div>

      <div className="card">
        <h2>Your problems</h2>
        {error && <p className="auth-error">{error}</p>}
        {!items && !error && <p className="muted">Loading…</p>}
        {items && !items.length && (
          <p className="muted">
            Nothing saved yet. <a href="#/solve/1">Start Problem 1 <Icon name="arrow-right" /></a>
          </p>
        )}
        {items && items.length > 0 && (
          <ul className="saved-list">
            {items.map((it) => (
              <li key={it.id}>
                <div>
                  <strong>{puzzleName(it.id)}</strong>
                  <span className="muted small">
                    {it.hints || 0} hints · {it.updatedAt ? new Date(it.updatedAt).toLocaleString() : ''}
                  </span>
                </div>
                <span className={`chip ${it.solved ? 'ok' : ''}`}>{it.solved ? 'Solved' : 'In progress'}</span>
                <a className="btn small" href={`#/solve/${problemIndex(it.id) + 1}`}>{it.solved ? 'Review' : 'Continue'}</a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
