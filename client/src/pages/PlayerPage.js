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

function GrandSlamSection() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const search = () => {
    if (!firstName.trim() || !lastName.trim()) {
      setError('Please enter both first and last name.'); return;
    }
    setLoading(true); setError(null); setResult(null);
    const params = `first_name=${encodeURIComponent(firstName.trim().toUpperCase())}&last_name=${encodeURIComponent(lastName.trim().toUpperCase())}`;
    fetch(`${SERVER}/players/grand-slam-titles?${params}`)
      .then(r => r.json())
      .then(data => {
        setLoading(false);
        if (!data || !data.name_first) {
          setError('Player not found. Check the spelling and try again.');
        } else {
          setResult(data);
        }
      })
      .catch(() => { setError('Could not reach the server.'); setLoading(false); });
  };

  const handleKey = e => { if (e.key === 'Enter') search(); };

  return (
    <Card>
      <SectionTitle>Grand Slam Titles</SectionTitle>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 16, alignItems: 'end', marginBottom: 20 }}>
        <Input label="First Name" placeholder="e.g. Roger" value={firstName} onChange={e => setFirstName(e.target.value)} onKeyDown={handleKey} />
        <Input label="Last Name" placeholder="e.g. Federer" value={lastName} onChange={e => setLastName(e.target.value)} onKeyDown={handleKey} />
        <SearchButton onClick={search} loading={loading} />
      </div>
      <ErrorBox message={error} />
      {result && result.name_first && (
        <div style={{
          marginTop: 20, padding: 28,
          background: theme.greenPale, borderRadius: 8,
          border: `1px solid ${theme.greenMid}`,
        }}>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 700, color: theme.green, marginBottom: 4 }}>
            {result.name_first} {result.name_last}
          </div>
          <div style={{ display: 'flex', gap: 40, marginTop: 16, flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontFamily: "'Crimson Pro', serif", fontSize: 11, letterSpacing: 2, color: theme.green, textTransform: 'uppercase' }}>Grand Slam Titles</div>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 52, fontWeight: 900, color: theme.purple, lineHeight: 1 }}>
                {result.total_grand_slam_titles}
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: "'Crimson Pro', serif", fontSize: 11, letterSpacing: 2, color: theme.green, textTransform: 'uppercase', marginBottom: 8 }}>Grand Slams Won At</div>
              <div style={{ fontFamily: "'Crimson Pro', serif", fontSize: 16, color: theme.textMid, lineHeight: 1.6 }}>
                {result.venues_won_at || '—'}
              </div>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}

function HeadToHeadPie({ rows, p1First, p1Last, p2First, p2Last }) {
  if (!rows || rows.length === 0) return null;

  const p1Name = `${p1First} ${p1Last}`;
  const p2Name = `${p2First} ${p2Last}`;
  const p1Wins = rows.filter(r => r.winner?.toUpperCase().includes(p1Last.trim().toUpperCase())).length;
  const p2Wins = rows.length - p1Wins;

  const data = {
    labels: [p1Name, p2Name],
    datasets: [{
      data: [p1Wins, p2Wins],
      backgroundColor: [theme.purple, theme.green],
      borderWidth: 0,
    }]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => ` ${ctx.label}: ${ctx.raw} wins (${((ctx.raw / rows.length) * 100).toFixed(1)}%)`
        }
      }
    }
  };

  return (
    <div style={{ marginTop: 28, display: 'flex', alignItems: 'center', gap: 40, flexWrap: 'wrap' }}>
      <div style={{ position: 'relative', width: 180, height: 180, flexShrink: 0 }}>
        <canvas
          role="img"
          aria-label={`Pie chart: ${p1Name} ${p1Wins} wins, ${p2Name} ${p2Wins} wins`}
          ref={el => {
            if (!el) return;
            if (el._chartInstance) el._chartInstance.destroy();
            el._chartInstance = new window.Chart(el.getContext('2d'), { type: 'pie', data, options });
          }}
        />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {[{ name: p1Name, wins: p1Wins, color: theme.purple }, { name: p2Name, wins: p2Wins, color: theme.green }].map(p => (
          <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 12, height: 12, borderRadius: 2, background: p.color, flexShrink: 0 }} />
            <div style={{ fontFamily: "'Crimson Pro', serif", fontSize: 15, color: theme.textMid }}>
              <span style={{ fontWeight: 700, color: theme.text }}>{p.name}</span>
              {' — '}{p.wins}W ({((p.wins / rows.length) * 100).toFixed(1)}%)
            </div>
          </div>
        ))}
        <div style={{ fontFamily: "'Crimson Pro', serif", fontSize: 13, color: theme.textLight, marginTop: 4 }}>
          {rows.length} matches total
        </div>
      </div>
    </div>
  );
}

function HeadToHeadSection() {
  useChartJs();
  const [p1First, setP1First] = useState('');
  const [p1Last, setP1Last] = useState('');
  const [p2First, setP2First] = useState('');
  const [p2Last, setP2Last] = useState('');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searched, setSearched] = useState(false);

  const search = () => {
    if (!p1First || !p1Last || !p2First || !p2Last) {
      setError('Please fill in all four name fields.'); return;
    }
    setLoading(true); setError(null);
    const params = `name_first_1=${encodeURIComponent(p1First.trim().toUpperCase())}&name_last_1=${encodeURIComponent(p1Last.trim().toUpperCase())}&name_first_2=${encodeURIComponent(p2First.trim().toUpperCase())}&name_last_2=${encodeURIComponent(p2Last.trim().toUpperCase())}`;
    fetch(`${SERVER}/head_to_head?${params}`)
      .then(r => r.json())
      .then(data => { setRows(data); setSearched(true); setLoading(false); })
      .catch(() => { setError('Could not reach the server.'); setLoading(false); });
  };

  const p1Wins = rows.filter(r => r.winner?.toUpperCase().includes(p1Last.trim().toUpperCase())).length;
  const p2Wins = rows.length - p1Wins;

  const columns = [
    { key: 'tourney_date', label: 'Date', nowrap: true, render: r => formatDate(r.tourney_date) },
    { key: 'tourney_name', label: 'Tournament' },
    { key: 'level', label: 'Level' },
    { key: 'surface', label: 'Surface' },
    { key: 'round', label: 'Round' },
    { key: 'winner', label: 'Winner', render: r => (
      <span style={{
        fontWeight: 600,
        color: r.winner?.toUpperCase().includes(p1Last.toUpperCase()) ? theme.purple : theme.green,
      }}>{r.winner}</span>
    )},
    { key: 'score', label: 'Score' },
  ];

  return (
    <Card style={{ marginTop: 24 }}>
      <SectionTitle>Head-to-Head</SectionTitle>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 16 }}>
        <div>
          <Label>Player 1 — First Name</Label>
          <input value={p1First} onChange={e => setP1First(e.target.value)} placeholder="e.g. Roger"
            style={{ width: '100%', padding: '10px 14px', border: `1px solid ${theme.border}`, borderRadius: 6, fontFamily: "'Crimson Pro', serif", fontSize: 15, boxSizing: 'border-box' }} />
        </div>
        <div>
          <Label>Player 1 — Last Name</Label>
          <input value={p1Last} onChange={e => setP1Last(e.target.value)} placeholder="e.g. Federer"
            style={{ width: '100%', padding: '10px 14px', border: `1px solid ${theme.border}`, borderRadius: 6, fontFamily: "'Crimson Pro', serif", fontSize: 15, boxSizing: 'border-box' }} />
        </div>
        <div>
          <Label>Player 2 — First Name</Label>
          <input value={p2First} onChange={e => setP2First(e.target.value)} placeholder="e.g. Rafael"
            style={{ width: '100%', padding: '10px 14px', border: `1px solid ${theme.border}`, borderRadius: 6, fontFamily: "'Crimson Pro', serif", fontSize: 15, boxSizing: 'border-box' }} />
        </div>
        <div>
          <Label>Player 2 — Last Name</Label>
          <input value={p2Last} onChange={e => setP2Last(e.target.value)} placeholder="e.g. Nadal"
            style={{ width: '100%', padding: '10px 14px', border: `1px solid ${theme.border}`, borderRadius: 6, fontFamily: "'Crimson Pro', serif", fontSize: 15, boxSizing: 'border-box' }} />
        </div>
      </div>
      <SearchButton onClick={search} loading={loading} />
      <ErrorBox message={error} />
      {searched && rows.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <div style={{
            display: 'flex', justifyContent: 'center', gap: 48, marginBottom: 24,
            padding: '20px', background: theme.purplePale, borderRadius: 8,
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 40, fontWeight: 900, color: theme.purple }}>{p1Wins}</div>
              <div style={{ fontFamily: "'Crimson Pro', serif", fontSize: 14, color: theme.textMid }}>{p1First} {p1Last}</div>
            </div>
            <div style={{ fontFamily: "'Crimson Pro', serif", fontSize: 20, color: theme.textLight, alignSelf: 'center' }}>vs</div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 40, fontWeight: 900, color: theme.green }}>{p2Wins}</div>
              <div style={{ fontFamily: "'Crimson Pro', serif", fontSize: 14, color: theme.textMid }}>{p2First} {p2Last}</div>
            </div>
          </div>
          <HeadToHeadPie rows={rows} p1First={p1First} p1Last={p1Last} p2First={p2First} p2Last={p2Last} />
          <ResultsTable columns={columns} rows={rows} />
        </div>
      )}
      {searched && rows.length === 0 && !error && (
        <div style={{ marginTop: 16, color: theme.textLight, fontFamily: "'Crimson Pro', serif", fontSize: 15 }}>No matches found between these players.</div>
      )}
    </Card>
  );
}

function TitlesByHandSection() {
  const [hand, setHand] = useState('R');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const search = () => {
    setLoading(true); setError(null); setResult(null);
    fetch(`${SERVER}/players/titles_by_hand?hand=${hand}`)
      .then(r => r.json())
      .then(data => { setResult(data); setLoading(false); })
      .catch(() => { setError('Could not reach the server.'); setLoading(false); });
  };

  const handLabel = { R: 'Right-Handed', L: 'Left-Handed', A: 'Ambidextrous' };

  return (
    <Card style={{ marginTop: 24 }}>
      <SectionTitle>Titles by Handedness</SectionTitle>
      <div style={{ display: 'flex', gap: 16, alignItems: 'end', flexWrap: 'wrap' }}>
        <div>
          <Label>Handedness</Label>
          <div style={{ display: 'flex', gap: 8 }}>
            {['R', 'L', 'A'].map(h => (
              <button key={h} onClick={() => setHand(h)} style={{
                padding: '10px 24px',
                background: hand === h ? theme.purple : theme.white,
                color: hand === h ? theme.white : theme.textMid,
                border: `1px solid ${hand === h ? theme.purple : theme.border}`,
                borderRadius: 6, fontFamily: "'Crimson Pro', serif",
                fontSize: 15, cursor: 'pointer', transition: 'all 0.15s',
              }}>{handLabel[h]}</button>
            ))}
          </div>
        </div>
        <SearchButton onClick={search} loading={loading} />
      </div>
      <ErrorBox message={error} />
      {result && (
        <div style={{
          marginTop: 20, padding: 24,
          background: theme.purplePale, borderRadius: 8,
          display: 'flex', gap: 40, flexWrap: 'wrap',
        }}>
          {[
            { label: 'Total Titles Won', value: result.titles_won?.toLocaleString() },
            { label: 'Number of Players', value: result.num_players?.toLocaleString() },
            { label: 'Titles Per Player', value: Number(result.titles_per_player).toFixed(2) },
          ].map(stat => (
            <div key={stat.label}>
              <div style={{ fontFamily: "'Crimson Pro', serif", fontSize: 11, letterSpacing: 2, color: theme.purple, textTransform: 'uppercase' }}>{stat.label}</div>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 36, fontWeight: 900, color: theme.purple }}>{stat.value ?? '—'}</div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

export default function PlayerPage() {
  return (
    <div style={{ background: theme.cream, minHeight: '100vh' }}>
      <PageHeader title="Player Hub" subtitle="Grand Slam records, head-to-head histories, and handedness stats" />
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 48px' }}>
        <GrandSlamSection />
        <HeadToHeadSection />
        <TitlesByHandSection />
      </div>
    </div>
  );
}
