import { useSelector } from 'react-redux';
import { Link, Route, Routes } from 'react-router-dom';
import SocketTestPage from './pages/SocketTestPage';
import type { RootState } from './store';

// Placeholder root component. Replace Home with react-router-dom routes for
// the real screens (artist search, event board, chat, profiles...) as
// Jinad builds them - /socket-test is temporary, see SocketTestPage.tsx.
function Home() {
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);

  return (
    <main style={{ fontFamily: 'sans-serif', padding: '2rem' }}>
      <h1>GigSync</h1>
      <p>Frontend scaffold is running. Redux store is wired up.</p>
      <p>Authenticated: {String(isAuthenticated)}</p>
      <p>
        <Link to="/socket-test">Socket.IO test page →</Link>
      </p>
    </main>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/socket-test" element={<SocketTestPage />} />
    </Routes>
  );
}

export default App;
