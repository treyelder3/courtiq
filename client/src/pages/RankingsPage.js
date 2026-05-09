import { useState } from 'react';
import { theme, SERVER, formatDate } from '../theme';
import {
  PageHeader, Card, Label, Input, SearchButton,
  ErrorBox, ResultsTable, SectionTitle, CountryFlag
} from '../components/UI';
import { useEffect } from 'react';

function useChartJs() {
  useEffect(() => {
    if (window.Chart) return;
    const s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js';
    document.head.appendChild(s);
  }, []);
}

function RankingStreaksSection() {
  const [rankThreshold, setRankThreshold] = useState(10);
  const [topN, setTopN] = useState(10);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searched, setSearched] = useState(false);

  const search = () => {
    setLoading(true); setError(null);
    fetch(`${SERVER}/rankings/streaks?rank_threshold=${rankThreshold}&top_n=${topN}`)
      .then(r => r.json())
      .then(data => { setRows(data); setSearched(true); setLoading(false); })
      .catch(() => { setError('Could not reach the server.'); setLoading(false); });
  };

  const maxDays = rows.length > 0 ? Math.max(...rows.map(r => Number(r.streak_days))) : 1;

  const columns = [
    { key: 'player_name', label: 'Player' },
    { key: 'country', label: 'Country', render: r => <CountryFlag ioc={r.country} /> },
    { key: 'streak_start', label: 'Start', nowrap: true, render: r => formatDate(r.streak_start) },
    { key: 'streak_end', label: 'End', nowrap: true, render: r => formatDate(r.streak_end) },
    {
      key: 'streak_days', label: 'Duration', render: r => {
        const pct = (Number(r.streak_days) / maxDays) * 100;
        const hue = Math.round(120 * (pct / 100));
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 160 }}>
            <div style={{ flex: 1, height: 6, background: theme.creamDark, borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ width: `${pct}%`, height: '100%', background: `hsl(${hue}, 55%, 42%)`, borderRadius: 3, transition: 'width 0.6s ease' }} />
            </div>
            <span style={{ fontSize: 13, color: theme.textMid, minWidth: 50 }}>{Number(r.streak_days).toLocaleString()}d</span>
          </div>
        );
      }
    },
    { key: 'peak_rank_during_streak', label: 'Peak Rank', right: true, render: r => (
      <span style={{ fontWeight: 700, color: r.peak_rank_during_streak === 1 ? theme.gold : theme.text }}>#{r.peak_rank_during_streak}</span>
    )},
  ];

  return (
    <Card>
      <SectionTitle>Ranking Streaks</SectionTitle>
      <p style={{ fontFamily: "'Crimson Pro', serif", fontSize: 15, color: theme.textMid, margin: '0 0 20px' }}>
        Players who stayed within a ranking threshold for the longest consecutive period.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 16, alignItems: 'end', marginBottom: 16 }}>
        <div>
          <Label>Rank Threshold (top N)</Label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <input
              type="range" min={1} max={100} value={rankThreshold}
              onChange={e => setRankThreshold(Number(e.target.value))}
              style={{ flex: 1, accentColor: theme.green }}
            />
            <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 700, color: theme.green, minWidth: 36 }}>
              {rankThreshold}
            </span>
          </div>
        </div>
        <Input label="Top N Results" type="number" value={topN} onChange={e => setTopN(e.target.value)} />
        <SearchButton onClick={search} loading={loading} />
      </div>
      <ErrorBox message={error} />
      {searched && <ResultsTable columns={columns} rows={rows} />}
    </Card>
  );
}


function RankJumpsChart({ rows }) {
  if (!rows || rows.length === 0) return null;

  const sorted = [...rows].sort((a, b) => b.rank_improvement - a.rank_improvement);
  const labels = sorted.map(r => `${r.name_first[0]}. ${r.name_last}`);
  const values = sorted.map(r => r.rank_improvement);
  const colors = values.map(v => v >= 0 ? theme.purple : '#b85a2a');

  const data = {
    labels,
    datasets: [{
      data: values,
      backgroundColor: colors,
      borderRadius: 4,
    }]
  };

  const options = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => {
            const r = sorted[ctx.dataIndex];
            const sign = r.rank_improvement >= 0 ? '+' : '';
            return ` ${sign}${r.rank_improvement} spots  (${r.start_rank} → ${r.end_rank})`;
          }
        }
      }
    },
    scales: {
      x: {
        title: { display: true, text: 'Rank improvement', color: theme.textLight, font: { size: 12 } },
        ticks: { font: { size: 12 } },
        grid: { color: 'rgba(128,128,128,0.1)' },
      },
      y: {
        ticks: { font: { size: 13 } },
        grid: { display: false },
      }
    }
  };

  return (
    <div style={{ marginTop: 32 }}>
      <div style={{ fontFamily: "'Crimson Pro', serif", fontSize: 13, letterSpacing: 2, textTransform: 'uppercase', color: theme.textLight, marginBottom: 12 }}>
        Rank improvement by player
      </div>
      <div style={{ position: 'relative', width: '100%', height: sorted.length * 40 + 80 }}>
        <canvas
          id="rankJumpsChart"
          role="img"
          aria-label="Horizontal bar chart of player rank improvements"
          ref={el => {
            if (!el) return;
            if (el._chartInstance) el._chartInstance.destroy();
            el._chartInstance = new window.Chart(el.getContext('2d'), { type: 'bar', data, options });
          }}
        />
      </div>
    </div>
  );
}

function RankJumpsSection() {
  useChartJs();   // ← add this line
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [topN, setTopN] = useState(10);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searched, setSearched] = useState(false);

  const search = () => {
    if (!startDate || !endDate) { setError('Both start and end dates are required.'); return; }
    setLoading(true); setError(null);
    fetch(`${SERVER}/players/rank-jumps?start_date=${startDate}&end_date=${endDate}&top_n=${topN}`)
      .then(r => r.json())
      .then(data => { setRows(data); setSearched(true); setLoading(false); })
      .catch(() => { setError('Could not reach the server.'); setLoading(false); });
  };

  const columns = [
    { key: 'name', label: 'Player', render: r => `${r.name_first} ${r.name_last}` },
    { key: 'actual_start_date', label: 'Start Date', nowrap: true, render: r => formatDate(r.actual_start_date) },
    { key: 'actual_end_date', label: 'End Date', nowrap: true, render: r => formatDate(r.actual_end_date) },
    { key: 'start_rank', label: 'Start Rank', right: true },
    { key: 'end_rank', label: 'End Rank', right: true },
    { key: 'rank_improvement', label: 'Improvement', right: true, render: r => (
      <span style={{ fontWeight: 700, color: theme.green }}>▲ {r.rank_improvement}</span>
    )},
  ];

  return (
    <Card style={{ marginTop: 24 }}>
      <SectionTitle>Biggest Rank Jumps</SectionTitle>
      <p style={{ fontFamily: "'Crimson Pro', serif", fontSize: 15, color: theme.textMid, margin: '0 0 20px' }}>
        Players with the largest ranking improvement between two dates.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: 16, alignItems: 'end', marginBottom: 16 }}>
        <Input label="Start Date" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
        <Input label="End Date" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
        <Input label="Top N Results" type="number" value={topN} onChange={e => setTopN(e.target.value)} />
        <SearchButton onClick={search} loading={loading} />
      </div>
      <ErrorBox message={error} />
      {searched && <ResultsTable columns={columns} rows={rows} />}
      {searched && <RankJumpsChart rows={rows} />}
    </Card>
  );
}
function SurfaceHeatmap({ rows }) {
  if (!rows || rows.length === 0) return null;

  const surfaces = [...new Set(rows.map(r => r.surface))].filter(Boolean).sort();
  const surfaceColors = { Hard: '#7c3aed', Clay: '#b85a2a', Grass: '#059669', Carpet: '#6b5a8a' };

  // Build a map: playerName -> { surface -> win_pct }
  const players = [...new Set(rows.map(r => `${r.name_first} ${r.name_last}`))];
  const lookup = {};
  rows.forEach(r => {
    const name = `${r.name_first} ${r.name_last}`;
    if (!lookup[name]) lookup[name] = {};
    lookup[name][r.surface] = parseFloat((r.win_pct * 100).toFixed(1));
  });

  const cellSize = 72;
  const labelWidth = 130;
  const headerHeight = 40;
  const rowHeight = 48;

  return (
    <div style={{ marginTop: 32, overflowX: 'auto' }}>
      <div style={{ fontFamily: "'Crimson Pro', serif", fontSize: 13, letterSpacing: 2, textTransform: 'uppercase', color: '#666', marginBottom: 12 }}>
        Win % Heatmap — Players × Surface
      </div>
      <div style={{ display: 'inline-block', minWidth: labelWidth + surfaces.length * cellSize }}>
        {/* Header row */}
        <div style={{ display: 'flex' }}>
          <div style={{ width: labelWidth }} />
          {surfaces.map(s => (
            <div key={s} style={{
              width: cellSize, textAlign: 'center',
              fontFamily: "'Crimson Pro', serif", fontSize: 13, fontWeight: 700,
              color: surfaceColors[s] || '#333', height: headerHeight,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>{s}</div>
          ))}
        </div>
        {/* Data rows */}
        {players.map((player, i) => (
          <div key={player} style={{ display: 'flex', alignItems: 'center', background: i % 2 === 0 ? '#faf9f7' : '#fff' }}>
            <div style={{
              width: labelWidth, fontFamily: "'Crimson Pro', serif",
              fontSize: 14, color: '#333', paddingLeft: 4,
              height: rowHeight, display: 'flex', alignItems: 'center',
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>{player}</div>
            {surfaces.map(s => {
              const val = lookup[player]?.[s];
              const intensity = val != null ? val / 100 : 0;
              const bg = val != null
                ? `rgba(${s === 'Clay' ? '184,90,42' : s === 'Grass' ? '5,150,105' : s === 'Carpet' ? '107,90,138' : '124,58,237'}, ${0.15 + intensity * 0.75})`
                : '#f0f0f0';
              return (
                <div key={s} style={{
                  width: cellSize, height: rowHeight,
                  background: bg,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: "'Crimson Pro', serif",
                  fontSize: 14, fontWeight: val != null ? 600 : 400,
                  color: intensity > 0.6 ? '#fff' : '#333',
                  title: val != null ? `${player} on ${s}: ${val}%` : '—',
                }}>
                  {val != null ? `${val}%` : '—'}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

function SurfaceSpecialistsSection() {
  const [minMatches, setMinMatches] = useState(20);
  const [topN, setTopN] = useState(5);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searched, setSearched] = useState(false);
  const [activeSurface, setActiveSurface] = useState(null);

  const search = () => {
    setLoading(true); setError(null);
    fetch(`${SERVER}/surface_specialists?min_matches=${minMatches}&top_n=${topN}`)
      .then(r => r.json())
      .then(data => {
        setRows(data);
        setSearched(true);
        setLoading(false);
        const surfaces = [...new Set(data.map(r => r.surface))];
        if (surfaces.length > 0) setActiveSurface(surfaces[0]);
      })
      .catch(() => { setError('Could not reach the server.'); setLoading(false); });
  };

  const surfaces = [...new Set(rows.map(r => r.surface))].filter(Boolean);
  const surfaceColors = { Hard: theme.purple, Clay: '#b85a2a', Grass: theme.green, Carpet: '#6b5a8a' };
  const filtered = activeSurface ? rows.filter(r => r.surface === activeSurface) : rows;

  const columns = [
    { key: 'surface_rank', label: 'Rank', right: true },
    { key: 'name', label: 'Player', render: r => `${r.name_first} ${r.name_last}` },
    { key: 'wins', label: 'Wins', right: true },
    { key: 'losses', label: 'Losses', right: true },
    { key: 'matches_played', label: 'Matches', right: true },
    { key: 'win_pct', label: 'Win %', right: true, render: r => (
      <span style={{ fontWeight: 600, color: surfaceColors[r.surface] || theme.green }}>
        {(r.win_pct * 100).toFixed(1)}%
      </span>
    )},
  ];

  return (
    <Card style={{ marginTop: 24 }}>
      <SectionTitle>Surface Specialists</SectionTitle>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 16, alignItems: 'end', marginBottom: 16 }}>
        <Input label="Minimum Matches" type="number" value={minMatches} onChange={e => setMinMatches(e.target.value)} />
        <Input label="Top N per Surface" type="number" value={topN} onChange={e => setTopN(e.target.value)} />
        <SearchButton onClick={search} loading={loading} />
      </div>
      <ErrorBox message={error} />
      {searched && rows.length > 0 && (
        <>
          <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
            {surfaces.map(s => (
              <button key={s} onClick={() => setActiveSurface(s)} style={{
                padding: '8px 20px',
                background: activeSurface === s ? (surfaceColors[s] || theme.green) : theme.white,
                color: activeSurface === s ? theme.white : theme.textMid,
                border: `1px solid ${activeSurface === s ? (surfaceColors[s] || theme.green) : theme.border}`,
                borderRadius: 20,
                fontFamily: "'Crimson Pro', serif",
                fontSize: 14, cursor: 'pointer', transition: 'all 0.15s', fontWeight: activeSurface === s ? 600 : 400,
              }}>{s}</button>
            ))}
          </div>
          <ResultsTable columns={columns} rows={filtered} />
          <SurfaceHeatmap rows={rows} />
        </>
      )}
    </Card>
  );
}

export default function RankingsPage() {
  return (
    <div style={{ background: theme.cream, minHeight: '100vh' }}>
      <PageHeader title="Rankings & Stats" subtitle="Streaks, rank jumps, and surface dominance" />
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 48px' }}>
        <RankingStreaksSection />
        <RankJumpsSection />
        <SurfaceSpecialistsSection />
      </div>
    </div>
  );
}
