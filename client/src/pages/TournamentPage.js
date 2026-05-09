import { useState, useEffect } from 'react';
import { theme, SERVER, formatDate } from '../theme';
import {
  PageHeader, Card, Label, Input, SearchButton,
  ErrorBox, ResultsTable, SectionTitle
} from '../components/UI';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

function useChartJs() {
  useEffect(() => {
    if (window.Chart) return;
    const s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js';
    document.head.appendChild(s);
  }, []);
}

function TournamentSpecialistsChart({ data }) {
  if (!data || data.length === 0) return null;

  const chartData = data.map(d => ({
    name: `${d.name_first[0]}. ${d.name_last}`,
    win_pct: parseFloat((d.win_pct * 100).toFixed(1)),
    wins: d.wins,
    appearances: d.appearances,
  }));

  return (
    <div style={{ marginTop: 32 }}>
      <div style={{ fontFamily: "'Crimson Pro', serif", fontSize: 13, letterSpacing: 2, textTransform: 'uppercase', color: '#666', marginBottom: 12 }}>
        Win % by Player
      </div>
      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 60 }}>
          <XAxis
            dataKey="name"
            angle={-35}
            textAnchor="end"
            interval={0}
            tick={{ fontFamily: "'Crimson Pro', serif", fontSize: 13 }}
          />
          <YAxis
            unit="%"
            domain={[0, 100]}
            tick={{ fontFamily: "'Crimson Pro', serif", fontSize: 13 }}
          />
          <Tooltip
            formatter={(value, name, props) => [
              `${value}% (${props.payload.wins}W / ${props.payload.appearances} apps)`,
              'Win %'
            ]}
            contentStyle={{ fontFamily: "'Crimson Pro', serif" }}
          />
          <Bar dataKey="win_pct" radius={[4, 4, 0, 0]}>
            {chartData.map((_, i) => (
  <Cell key={i} fill={['#7c3aed', '#2563eb', '#059669', '#d97706', '#dc2626', '#db2777', '#0891b2', '#65a30d', '#9333ea', '#ea580c'][i % 10]} />
    ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
function TournamentSpecialistsSection() {
  const [tourneyName, setTourneyName] = useState('');
  const [minAppearances, setMinAppearances] = useState(10);
  const [topN, setTopN] = useState(10);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searched, setSearched] = useState(false);

  const search = () => {
    if (!tourneyName.trim()) { setError('Please enter a tournament name.'); return; }
    setLoading(true); setError(null);
    fetch(`${SERVER}/tournament_specialists?tourney_name=${encodeURIComponent(tourneyName)}&min_appearances=${minAppearances}&top_n=${topN}`)
      .then(r => r.json())
      .then(data => { setRows(data); setSearched(true); setLoading(false); })
      .catch(() => { setError('Could not reach the server.'); setLoading(false); });
  };

  const columns = [
    { key: 'tourney_rank', label: 'Rank', right: true },
    { key: 'name', label: 'Player', render: r => `${r.name_first} ${r.name_last}` },
    { key: 'wins', label: 'Wins', right: true },
    { key: 'appearances', label: 'Matches', right: true },
    { key: 'win_pct', label: 'Win %', right: true, render: r => `${(r.win_pct * 100).toFixed(1)}%` },
  ];

  return (
    <Card>
      <SectionTitle>Tournament Specialists</SectionTitle>
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: 16, alignItems: 'end', marginBottom: 16, flexWrap: 'wrap' }}>
        <Input label="Tournament Name" placeholder="e.g. Wimbledon" value={tourneyName} onChange={e => setTourneyName(e.target.value)} onKeyDown={e => e.key === 'Enter' && search()} />
        <Input label="Min Matches Played" type="number" value={minAppearances} onChange={e => setMinAppearances(e.target.value)} />
        <Input label="Top N" type="number" value={topN} onChange={e => setTopN(e.target.value)} />
        <SearchButton onClick={search} loading={loading} />
      </div>
      <ErrorBox message={error} />
      {searched && <ResultsTable columns={columns} rows={rows} />}
      {searched && <TournamentSpecialistsChart data={rows} />}
    </Card>
  );
}
function TournamentDifficultyChart({ rows }) {
  if (!rows || rows.length === 0) return null;

  const sorted = [...rows].sort((a, b) => new Date(a.tourney_date) - new Date(b.tourney_date));
  const labels = sorted.map(r => `${r.tourney_name} '${String(r.tourney_date).slice(2, 4)}`);
  const values = sorted.map(r => parseFloat(r.avg_opponent_rank));

  const data = {
    labels,
    datasets: [{
      data: values,
      backgroundColor: values.map(() => 'rgba(124, 58, 237, 0.7)'),
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
          title: (items) => sorted[items[0].dataIndex].tourney_name,
          label: (item) => [
            ` Champion: ${sorted[item.dataIndex].champion}`,
            ` Avg opponent rank: ${item.raw}`,
          ]
        }
      }
    },
    scales: {
      x: {
        title: { display: true, text: 'Avg opponent rank faced by champion (lower = harder path)', color: theme.textLight, font: { size: 12 } },
        ticks: { font: { size: 12 } },
        grid: { color: 'rgba(128,128,128,0.1)' },
      },
      y: {
        ticks: { font: { size: 12 } },
        grid: { display: false },
      }
    }
  };

  return (
    <div style={{ marginTop: 32 }}>
      <div style={{ fontFamily: "'Crimson Pro', serif", fontSize: 13, letterSpacing: 2, textTransform: 'uppercase', color: theme.textLight, marginBottom: 8 }}>
        Hardest championship paths — sorted by avg opponent rank
      </div>
      <div style={{ position: 'relative', width: '100%', height: sorted.length * 36 + 80 }}>
        <canvas
          role="img"
          aria-label="Horizontal bar chart of tournament difficulty ranked by average opponent rank"
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

function TournamentDifficultySection() {
  useChartJs();
  const [tourneyName, setTourneyName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searched, setSearched] = useState(false);

  const search = () => {
    setLoading(true); setError(null);
    const params = new URLSearchParams({ tourney_name: tourneyName });
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    fetch(`${SERVER}/tournaments/difficulty?${params}`)
      .then(r => r.json())
      .then(data => { setRows(data); setSearched(true); setLoading(false); })
      .catch(() => { setError('Could not reach the server.'); setLoading(false); });
  };

  const columns = [
    { key: 'tourney_name', label: 'Tournament' },
    { key: 'tourney_date', label: 'Date', nowrap: true, render: r => formatDate(r.tourney_date) },
    { key: 'champion', label: 'Champion' },
    { key: 'avg_opponent_rank', label: 'Avg Opponent Rank', right: true },
  ];

  return (
    <Card style={{ marginTop: 24 }}>
      <SectionTitle>Tournament Difficulty</SectionTitle>
      <p style={{ fontFamily: "'Crimson Pro', serif", fontSize: 15, color: theme.textMid, margin: '0 0 20px' }}>
        Average ranking of opponents faced by each tournament champion — lower means a harder path.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: 16, alignItems: 'end', marginBottom: 16 }}>
        <Input label="Tournament Name (optional)" placeholder="e.g. Wimbledon" value={tourneyName} onChange={e => setTourneyName(e.target.value)} />
        <Input label="Start Date" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
        <Input label="End Date" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
        <SearchButton onClick={search} loading={loading} />
      </div>
      <ErrorBox message={error} />
      {searched && <ResultsTable columns={columns} rows={rows} />}
      {searched && <TournamentDifficultyChart rows={rows} />}
    </Card>
  );
}

function UpsetsBubbleChart({ rows }) {
  if (!rows || rows.length === 0) return null;

  const data = {
    datasets: [{
      label: 'Upsets',
      data: rows.map(r => ({
        x: r.winner_rank,
        y: r.rank_difference,
        r: Math.max(5, Math.min(28, r.rank_difference / 30)),
        meta: r,
      })),
      backgroundColor: rows.map(r => {
        if (r.rank_difference <= -500) return 'rgba(220, 38, 38, 0.75)';
        if (r.rank_difference <= -250) return 'rgba(217, 119, 6, 0.75)';
        return 'rgba(124, 58, 237, 0.75)';
      }),
    }]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          title: () => '',
          label: (item) => {
            const r = item.raw.meta;
            return [
              ` ${r.winner} (${r.winner_rank}) def. ${r.loser} (${r.loser_rank})`,
              ` ${r.tourney_name} — ${r.round}`,
              ` Rank gap: +${r.rank_difference}`,
              ` Score: ${r.score}`,
            ];
          }
        }
      }
    },
    scales: {
      x: {
        title: { display: true, text: "Winner's rank (further right = bigger underdog)", color: theme.textLight, font: { size: 12 } },
        ticks: { font: { size: 12 } },
        grid: { color: 'rgba(128,128,128,0.1)' },
      },
      y: {
        title: { display: true, text: 'Rank gap (higher = more shocking)', color: theme.textLight, font: { size: 12 } },
        ticks: { font: { size: 12 } },
        grid: { color: 'rgba(128,128,128,0.1)' },
      }
    }
  };

  return (
    <div style={{ marginTop: 32 }}>
      <div style={{ fontFamily: "'Crimson Pro', serif", fontSize: 13, letterSpacing: 2, textTransform: 'uppercase', color: theme.textLight, marginBottom: 8 }}>
        Upset map — bubble size = rank gap
      </div>
      <div style={{ display: 'flex', gap: 20, marginBottom: 12, flexWrap: 'wrap' }}>
        {[
          { color: 'rgba(220,38,38,0.75)', label: 'Gap ≤ -500' },
          { color: 'rgba(217,119,6,0.75)', label: 'Gap -250 to -500' },
          { color: 'rgba(124,58,237,0.75)', label: 'Gap > -250' },
        ].map(l => (
          <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: l.color }} />
            <span style={{ fontFamily: "'Crimson Pro', serif", fontSize: 13, color: theme.textMid }}>{l.label}</span>
          </div>
        ))}
      </div>
      <div style={{ position: 'relative', width: '100%', height: 380 }}>
        <canvas
          role="img"
          aria-label="Bubble chart of tennis upsets by winner rank and rank gap"
          ref={el => {
            if (!el) return;
            if (el._chartInstance) el._chartInstance.destroy();
            el._chartInstance = new window.Chart(el.getContext('2d'), { type: 'bubble', data, options });
          }}
        />
      </div>
    </div>
  );
}

function UpsetsSection() {
  useChartJs();
  const [tournamentType, setTournamentType] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [minRankDiff, setMinRankDiff] = useState(50);
  const [topN, setTopN] = useState(10);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searched, setSearched] = useState(false);

  const search = () => {
    if (!tournamentType.trim() || !startDate || !endDate) {
      setError('Tournament name, start date, and end date are all required.'); return;
    }
    setLoading(true); setError(null);
    fetch(`${SERVER}/upsets?tournament_type=${encodeURIComponent(tournamentType)}&start_date=${startDate}&end_date=${endDate}&min_rank_diff=${minRankDiff}&top_n=${topN}`)
      .then(r => r.json())
      .then(data => { setRows(data); setSearched(true); setLoading(false); })
      .catch(() => { setError('Could not reach the server.'); setLoading(false); });
  };

  const columns = [
    { key: 'tourney_date', label: 'Date', nowrap: true, render: r => formatDate(r.tourney_date) },
    { key: 'tourney_name', label: 'Tournament' },
    { key: 'round', label: 'Round' },
    { key: 'winner', label: 'Winner (Underdog)' },
    { key: 'winner_rank', label: 'Winner Rank', right: true },
    { key: 'loser', label: 'Loser (Favourite)' },
    { key: 'loser_rank', label: 'Loser Rank', right: true },
    { key: 'rank_difference', label: 'Rank Gap', right: true, render: r => (
      <span style={{ fontWeight: 700, color: theme.purple }}>{r.rank_difference}</span>
    )},
    { key: 'score', label: 'Score' },
  ];

  return (
    <Card style={{ marginTop: 24 }}>
      <SectionTitle>Biggest Upsets</SectionTitle>
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr auto', gap: 16, alignItems: 'end', marginBottom: 16 }}>
        <Input label="Tournament" placeholder="e.g. Wimbledon" value={tournamentType} onChange={e => setTournamentType(e.target.value)} />
        <Input label="Start Date" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
        <Input label="End Date" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
        <Input label="Min Rank Gap" type="number" value={minRankDiff} onChange={e => setMinRankDiff(e.target.value)} />
        <Input label="Top N" type="number" value={topN} onChange={e => setTopN(e.target.value)} />
        <SearchButton onClick={search} loading={loading} />
      </div>
      <ErrorBox message={error} />
      {searched && <ResultsTable columns={columns} rows={rows} />}
      {searched && <UpsetsBubbleChart rows={rows} />}
    </Card>
  );
}

function TopHostsSection() {
  const [levels, setLevels] = useState('G,M');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [limit, setLimit] = useState(10);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searched, setSearched] = useState(false);

  const search = () => {
    if (!levels || !startDate || !endDate) { setError('All fields are required.'); return; }
    setLoading(true); setError(null);
    fetch(`${SERVER}/countries/top-tournament-hosts?levels=${encodeURIComponent(levels)}&start_date=${startDate}&end_date=${endDate}&limit=${limit}`)
      .then(r => r.json())
      .then(data => { setRows(data); setSearched(true); setLoading(false); })
      .catch(() => { setError('Could not reach the server.'); setLoading(false); });
  };

  const levelOptions = [
    { value: 'G', label: 'Grand Slams (G)' },
    { value: 'M', label: 'Masters 1000 (M)' },
    { value: 'A', label: 'ATP 500/250 (A)' },
    { value: 'G,M', label: 'Grand Slams + Masters' },
    { value: 'G,M,A', label: 'All Major Levels' },
  ];

  const columns = [
    { key: 'country', label: 'Country' },
    { key: 'num_tournament_editions', label: 'Editions Hosted', right: true },
    { key: 'num_venues', label: 'Venues', right: true },
    { key: 'total_matches', label: 'Total Matches', right: true },
  ];

  return (
    <Card style={{ marginTop: 24 }}>
      <SectionTitle>Top Tournament-Hosting Countries</SectionTitle>
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr auto', gap: 16, alignItems: 'end', marginBottom: 16 }}>
        <div>
          <Label>Tournament Level</Label>
          <select
            value={levels}
            onChange={e => setLevels(e.target.value)}
            style={{ width: '100%', padding: '10px 14px', border: `1px solid ${theme.border}`, borderRadius: 6, fontFamily: "'Crimson Pro', serif", fontSize: 15, background: theme.white, cursor: 'pointer', boxSizing: 'border-box' }}
          >
            {levelOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <Input label="Start Date" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
        <Input label="End Date" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
        <Input label="Limit" type="number" value={limit} onChange={e => setLimit(e.target.value)} />
        <SearchButton onClick={search} loading={loading} />
      </div>
      <ErrorBox message={error} />
      {searched && <ResultsTable columns={columns} rows={rows} />}
    </Card>
  );
}

export default function TournamentPage() {
  return (
    <div style={{ background: theme.cream, minHeight: '100vh' }}>
      <PageHeader title="Tournament Explorer" subtitle="Specialists, difficulty, upsets, and host nations" />
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 48px' }}>
        <TournamentSpecialistsSection />
        <TournamentDifficultySection />
        <UpsetsSection />
        <TopHostsSection />
      </div>
    </div>
  );
}
