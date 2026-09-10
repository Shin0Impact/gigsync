import { useSelector } from 'react-redux';
import type { RootState } from './store';

// Placeholder root component. Replace with react-router-dom routes once
// pages/ has real screens (artist search, event board, chat, profiles...).
function App() {
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);

  return (
    <main style={{ fontFamily: 'sans-serif', padding: '2rem' }}>
      <h1>GigSync</h1>
      <p>Frontend scaffold is running. Redux store is wired up.</p>
      <p>Authenticated: {String(isAuthenticated)}</p>
    </main>
  );
}

export default App;
