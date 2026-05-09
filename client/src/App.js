import { useState } from 'react';
import { Nav } from './components/UI';
import HomePage from './pages/HomePage';
import PlayerPage from './pages/PlayerPage';
import TournamentPage from './pages/TournamentPage';
import RankingsPage from './pages/RankingsPage';

export default function App() {
  const [page, setPage] = useState('home');

  const pages = {
    home: <HomePage setPage={setPage} />,
    player: <PlayerPage />,
    tournament: <TournamentPage />,
    rankings: <RankingsPage />,
  };

  return (
    <div style={{ minHeight: '100vh', fontFamily: "'Crimson Pro', serif" }}>
      <Nav page={page} setPage={setPage} />
      {pages[page] || pages.home}
    </div>
  );
}
