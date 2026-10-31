import { useEffect, useState } from 'react';
import { watchUser } from './store';
import Home from './pages/Home';
import Learn from './pages/Learn';
import Play from './pages/Play';
import Account from './pages/Account';

// Hash routes: #/  #/learn  #/solve/<puzzleId>  #/account  (#/play/… is an old alias)
function useRoute() {
  const [hash, setHash] = useState(window.location.hash);
  useEffect(() => {
    const onChange = () => setHash(window.location.hash);
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return hash.replace(/^#\/?/, '').split('/');
}

const NAV = [
  ['', 'Home'],
  ['learn', 'Learn'],
  ['solve', 'Solve'],
];

export default function App() {
  const [page, arg] = useRoute();
  const [user, setUser] = useState(undefined); // undefined until Firebase reports

  useEffect(() => watchUser(setUser), []);
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [page]);
  useEffect(() => {
    if (page === 'play') window.location.replace(`#/solve/${arg || ''}`);
  }, [page, arg]);

  let content;
  if (page === 'learn') content = <Learn />;
  else if (page === 'solve' || page === 'play') content = <Play id={arg} user={user} />;
  else if (page === 'account') content = <Account user={user} />;
  else content = <Home />;

  return (
    <>
      <header className="nav">
        <div className="nav-inner">
          <a href="#/" className="brand">
            <span className="brand-mark">∴</span>
            Logic Grid Lab
          </a>
          <nav className="nav-links">
            {NAV.map(([p, label]) => (
              <a key={p} href={`#/${p}`} className={page === p ? 'on' : ''}>{label}</a>
            ))}
          </nav>
          <a href="#/account" className={`nav-account ${page === 'account' ? 'on' : ''}`}>
            {user ? <><span className="dot" />{user.email}</> : 'Sign in'}
          </a>
        </div>
      </header>
      <main className={`page page-${page || 'home'}`}>{content}</main>
      <footer className="foot">
        <span>Logic Grid Lab</span>
        <span>Constraint satisfaction · Set theory · Boolean logic · Combinatorics</span>
      </footer>
    </>
  );
}
