import { theme } from '../theme';
import { useState, useEffect } from 'react';

const cards = [
  {
    id: 'player',
    title: 'Player Hub',
    description: 'Grand Slam title counts, head-to-head match histories, and handedness breakdowns.',
    features: ['Grand Slam Titles', 'Head-to-Head', 'Titles by Hand'],
    color: theme.purple,
  },
  {
    id: 'tournament',
    title: 'Tournament Explorer',
    description: 'Discover tournament specialists, measure path difficulty, uncover shocking upsets, and rank host nations.',
    features: ['Tournament Specialists', 'Tournament Difficulty', 'Biggest Upsets', 'Top Host Countries'],
    color: theme.green,
  },
  {
    id: 'rankings',
    title: 'Rankings & Stats',
    description: 'Explore who dominated the rankings longest, who climbed the fastest, and who owns each surface.',
    features: ['Ranking Streaks', 'Rank Jumps', 'Surface Specialists'],
    color: theme.gold,
  },
];

const TENNIS_BASE = 'https://tennis-api-atp-wta-itf.p.rapidapi.com';
const TENNIS_HEADERS = {
  'X-RapidAPI-Key': 'c8486d6c6cmsh691bbaf439e46c2p15e37bjsnb45e848601e2',
  'X-RapidAPI-Host': 'tennis-api-atp-wta-itf.p.rapidapi.com',
  'Content-Type': 'application/json',
};
const today = new Date().toISOString().slice(0, 10);

function TodaysMatches() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${TENNIS_BASE}/tennis/v2/atp/fixtures/${today}?include=round,tournament&filter=PlayerGroup:singles&pageSize=8`, { headers: TENNIS_HEADERS })
      .then(r => r.json())
      .then(data => {
        const fixtures = Array.isArray(data) ? data : (data?.data || []);
        setMatches(fixtures.slice(0, 8));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{ fontFamily: "'Crimson Pro', serif", color: theme.textLight, padding: '20px 0' }}>
      Loading today's matches...
    </div>
  );

  return (
    <div style={{ background: theme.white, border: `1px solid ${theme.border}`, borderTop: `4px solid ${theme.green}`, borderRadius: 8, padding: 28 }}>
      <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, fontWeight: 700, color: theme.green, marginBottom: 20 }}>
        Today's Matches · {today}
      </div>
      {matches.length === 0 ? (
        <div style={{ fontFamily: "'Crimson Pro', serif", color: theme.textLight }}>No matches scheduled today.</div>
      ) : matches.map((m, i) => (
        <div key={m.id} style={{
          padding: '12px 0',
          borderBottom: i < matches.length - 1 ? `1px solid ${theme.border}` : 'none',
        }}>
          <div style={{ fontFamily: "'Crimson Pro', serif", fontSize: 11, letterSpacing: 2, color: theme.textLight, textTransform: 'uppercase', marginBottom: 6 }}>
            {m.tournament?.name || 'ATP Tour'} · {m.round?.name || ''}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontFamily: "'Crimson Pro', serif", fontSize: 15, color: theme.text, flex: 1 }}>
              {m.player1?.name}
              {m.seed1 ? <span style={{ fontSize: 12, color: theme.textLight }}> [{m.seed1}]</span> : null}
            </span>
            <span style={{ fontFamily: "'Crimson Pro', serif", fontSize: 13, color: theme.textLight }}>vs</span>
            <span style={{ fontFamily: "'Crimson Pro', serif", fontSize: 15, color: theme.text, flex: 1, textAlign: 'right' }}>
              {m.player2?.name}
              {m.seed2 ? <span style={{ fontSize: 12, color: theme.textLight }}> [{m.seed2}]</span> : null}
            </span>
          </div>
          {m.odd1 && m.odd2 && (
            <div style={{ fontFamily: "'Crimson Pro', serif", fontSize: 12, color: theme.textLight, marginTop: 4 }}>
              Odds: {m.odd1} / {m.odd2}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function TennisNews() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
  fetch('https://newsapi.org/v2/everything?q=ATP+tennis&sortBy=publishedAt&pageSize=12&language=en&apiKey=e9aa5398b0d543268462e646b3aef187')
    .then(r => r.json())
    .then(data => {
      const nonEnglishSources = ['dh.be', 'lavenir.net', 'lalibre.be', 'stern.de', 'rediff.com', 'marca.com', 'sport.de', 'eurosport.de', 'eurosport.fr'];
      const englishOnly = (data.articles || []).filter(a => {
        const domain = a.url ? new URL(a.url).hostname.replace('www.', '') : '';
        return !nonEnglishSources.some(s => domain.includes(s));
      }).slice(0, 6);
      setArticles(englishOnly);
      setLoading(false);
    })
    .catch(() => setLoading(false));
}, []);

  if (loading || !articles.length) return null;

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 48px 60px' }}>
      <div style={{
        fontFamily: "'Playfair Display', serif",
        fontSize: 13, letterSpacing: 3,
        color: theme.textLight, textTransform: 'uppercase',
        textAlign: 'center', marginBottom: 32,
      }}>
        Latest Tennis News
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
        {articles.map((a, i) => (
          <a key={i} href={a.url} target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
            <div
              style={{ background: theme.white, border: `1px solid ${theme.border}`, borderRadius: 8, overflow: 'hidden', cursor: 'pointer', transition: 'transform 0.15s, box-shadow 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.1)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
            >
              {a.urlToImage && (
                <img src={a.urlToImage} alt={a.title} style={{ width: '100%', height: 160, objectFit: 'cover', display: 'block' }} onError={e => e.target.style.display = 'none'} />
              )}
              <div style={{ padding: '16px 20px' }}>
                <div style={{ fontFamily: "'Crimson Pro', serif", fontSize: 11, letterSpacing: 2, color: theme.textLight, textTransform: 'uppercase', marginBottom: 6 }}>
                  {a.source?.name} · {new Date(a.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </div>
                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, fontWeight: 700, color: theme.text, lineHeight: 1.4 }}>
                  {a.title}
                </div>
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}

export default function HomePage({ setPage }) {
  return (
    <div style={{ background: theme.cream, minHeight: '100vh' }}>

      {/* Hero */}
      <div style={{ background: '#1a3d16', padding: '80px 48px 72px', textAlign: 'center' }}>
        <div style={{ fontFamily: "'Crimson Pro', serif", fontSize: 13, letterSpacing: 4, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: 16 }}>
          CourtIQ
        </div>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900, fontSize: 'clamp(40px, 7vw, 80px)', color: theme.white, margin: '0 0 16px', lineHeight: 1.05, letterSpacing: 2 }}>
          CourtIQ
        </h1>
        <p style={{ fontFamily: "'Crimson Pro', serif", fontSize: 20, color: 'rgba(255,255,255,0.7)', maxWidth: 560, margin: '0 auto 40px', lineHeight: 1.6 }}>
          Explore decades of ATP tour data — from Grand Slam glory to ranking streaks, upsets, and surface dominance.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          {cards.map(c => (
            <button key={c.id} onClick={() => setPage(c.id)} style={{
              padding: '12px 28px', background: 'rgba(255,255,255,0.12)',
              border: '1px solid rgba(255,255,255,0.25)', borderRadius: 6,
              color: theme.white, fontFamily: "'Playfair Display', serif",
              fontWeight: 600, fontSize: 15, cursor: 'pointer',
              transition: 'all 0.15s', letterSpacing: 0.5,
            }}>
              {c.emoji} {c.title}
            </button>
          ))}
        </div>
      </div>

      {/* Cards */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '60px 48px 40px' }}>
        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 13, letterSpacing: 3, color: theme.textLight, textTransform: 'uppercase', textAlign: 'center', marginBottom: 40 }}>
          Explore the Data
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 28 }}>
          {cards.map(c => (
            <div key={c.id} onClick={() => setPage(c.id)}
              style={{ background: theme.white, border: `1px solid ${theme.border}`, borderTop: `4px solid ${c.color}`, borderRadius: 8, padding: 32, cursor: 'pointer', transition: 'transform 0.15s, box-shadow 0.15s', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.12)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)'; }}
            >
              <div style={{ fontSize: 36, marginBottom: 12 }}>{c.emoji}</div>
              <h3 style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: 22, color: c.color, margin: '0 0 10px' }}>{c.title}</h3>
              <p style={{ fontFamily: "'Crimson Pro', serif", fontSize: 16, color: theme.textMid, margin: '0 0 20px', lineHeight: 1.6 }}>{c.description}</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {c.features.map(f => (
                  <span key={f} style={{ padding: '3px 10px', background: theme.cream, border: `1px solid ${theme.border}`, borderRadius: 20, fontFamily: "'Crimson Pro', serif", fontSize: 13, color: theme.textMid }}>{f}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Today's Matches */}
      <div style={{ maxWidth: 700, margin: '0 auto', padding: '0 48px 60px' }}>
        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 13, letterSpacing: 3, color: theme.textLight, textTransform: 'uppercase', textAlign: 'center', marginBottom: 32 }}>
          Live ATP
        </div>
        <TodaysMatches />
      </div>

      {/* News */}
      <TennisNews />

    </div>
  );
}