import { theme } from '../theme';

export function Nav({ page, setPage }) {
  const links = [
    { id: 'home', label: 'Home' },
    { id: 'player', label: 'Player Hub' },
    { id: 'tournament', label: 'Tournament Explorer' },
    { id: 'rankings', label: 'Rankings & Stats' },
  ];
  return (
    <nav style={{
      background: theme.green,
      borderBottom: `4px solid ${theme.purple}`,
      padding: '0 48px',
      display: 'flex',
      alignItems: 'center',
      gap: 0,
      position: 'sticky',
      top: 0,
      zIndex: 100,
      boxShadow: '0 2px 12px rgba(0,0,0,0.18)',
    }}>
      <div
        onClick={() => setPage('home')}
        style={{
          fontFamily: "'Playfair Display', serif",
          fontWeight: 900,
          fontSize: 20,
          color: theme.white,
          letterSpacing: 1,
          marginRight: 48,
          cursor: 'pointer',
          padding: '18px 0',
          whiteSpace: 'nowrap',
        }}
      >
        🎾 CourtIQ
      </div>
      {links.filter(l => l.id !== 'home').map(link => (
        <button
          key={link.id}
          onClick={() => setPage(link.id)}
          style={{
            background: 'none',
            border: 'none',
            borderBottom: page === link.id ? `3px solid ${theme.gold}` : '3px solid transparent',
            color: page === link.id ? theme.white : 'rgba(255,255,255,0.7)',
            fontFamily: "'Crimson Pro', serif",
            fontSize: 16,
            fontWeight: page === link.id ? 500 : 400,
            padding: '18px 20px 15px',
            cursor: 'pointer',
            letterSpacing: 0.5,
            transition: 'all 0.15s',
          }}
        >
          {link.label}
        </button>
      ))}
    </nav>
  );
}

export function PageHeader({ title, subtitle }) {
  return (
    <div style={{
      background: `linear-gradient(135deg, ${theme.green} 0%, ${theme.greenLight} 100%)`,
      padding: '48px 48px 40px',
      borderBottom: `3px solid ${theme.purple}`,
    }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div style={{
          fontFamily: "'Crimson Pro', serif",
          fontSize: 12,
          letterSpacing: 3,
          color: 'rgba(255,255,255,0.6)',
          textTransform: 'uppercase',
          marginBottom: 8,
        }}>
          CourtIQ
        </div>
        <h1 style={{
          fontFamily: "'Playfair Display', serif",
          fontWeight: 900,
          fontSize: 'clamp(32px, 5vw, 52px)',
          color: theme.white,
          margin: 0,
          lineHeight: 1.1,
          letterSpacing: 1,
        }}>{title}</h1>
        {subtitle && (
          <p style={{
            fontFamily: "'Crimson Pro', serif",
            fontSize: 18,
            color: 'rgba(255,255,255,0.75)',
            margin: '10px 0 0',
          }}>{subtitle}</p>
        )}
      </div>
    </div>
  );
}

export function Card({ children, style = {} }) {
  return (
    <div style={{
      background: theme.white,
      border: `1px solid ${theme.border}`,
      borderRadius: 8,
      padding: 28,
      boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
      ...style,
    }}>
      {children}
    </div>
  );
}

export function Label({ children }) {
  return (
    <div style={{
      fontFamily: "'Crimson Pro', serif",
      fontSize: 11,
      letterSpacing: 2,
      color: theme.green,
      textTransform: 'uppercase',
      fontWeight: 500,
      marginBottom: 8,
    }}>{children}</div>
  );
}

export function Input({ label, ...props }) {
  return (
    <div>
      {label && <Label>{label}</Label>}
      <input
        {...props}
        style={{
          width: '100%',
          padding: '10px 14px',
          border: `1px solid ${theme.border}`,
          borderRadius: 6,
          fontFamily: "'Crimson Pro', serif",
          fontSize: 15,
          color: theme.text,
          background: theme.white,
          outline: 'none',
          boxSizing: 'border-box',
          ...props.style,
        }}
      />
    </div>
  );
}

export function Select({ label, children, ...props }) {
  return (
    <div>
      {label && <Label>{label}</Label>}
      <select
        {...props}
        style={{
          width: '100%',
          padding: '10px 14px',
          border: `1px solid ${theme.border}`,
          borderRadius: 6,
          fontFamily: "'Crimson Pro', serif",
          fontSize: 15,
          color: theme.text,
          background: theme.white,
          outline: 'none',
          cursor: 'pointer',
          boxSizing: 'border-box',
          ...props.style,
        }}
      >
        {children}
      </select>
    </div>
  );
}

export function SearchButton({ onClick, loading, children = 'Search' }) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      style={{
        padding: '11px 36px',
        background: loading ? theme.border : theme.purple,
        color: loading ? theme.textLight : theme.white,
        border: 'none',
        borderRadius: 6,
        fontFamily: "'Playfair Display', serif",
        fontWeight: 600,
        fontSize: 15,
        letterSpacing: 1,
        cursor: loading ? 'not-allowed' : 'pointer',
        transition: 'all 0.15s',
        whiteSpace: 'nowrap',
      }}
    >
      {loading ? 'Loading…' : children}
    </button>
  );
}

export function ErrorBox({ message }) {
  if (!message) return null;
  return (
    <div style={{
      padding: '14px 20px',
      background: '#fff5f5',
      border: '1px solid #fca5a5',
      borderRadius: 6,
      color: '#b91c1c',
      fontFamily: "'Crimson Pro', serif",
      fontSize: 15,
      marginTop: 16,
    }}>
      ⚠ {message}
    </div>
  );
}

export function ResultsTable({ columns, rows, emptyMessage = 'No results found.' }) {
  if (!rows || rows.length === 0) {
    return (
      <div style={{
        padding: 48,
        textAlign: 'center',
        color: theme.textLight,
        fontFamily: "'Crimson Pro', serif",
        fontSize: 16,
        border: `1px solid ${theme.border}`,
        borderRadius: 8,
        background: theme.white,
      }}>
        {emptyMessage}
      </div>
    );
  }
  return (
    <div style={{ overflowX: 'auto', borderRadius: 8, border: `1px solid ${theme.border}` }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', background: theme.white }}>
        <thead>
          <tr style={{ background: theme.green }}>
            {columns.map((col, i) => (
              <th key={i} style={{
                padding: '12px 16px',
                textAlign: col.right ? 'right' : 'left',
                fontFamily: "'Crimson Pro', serif",
                fontSize: 11,
                letterSpacing: 2,
                color: 'rgba(255,255,255,0.9)',
                textTransform: 'uppercase',
                fontWeight: 500,
                whiteSpace: 'nowrap',
              }}>{col.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} style={{
              background: i % 2 === 0 ? theme.white : theme.cream,
              borderBottom: `1px solid ${theme.border}`,
            }}>
              {columns.map((col, j) => (
                <td key={j} style={{
                  padding: '12px 16px',
                  fontFamily: "'Crimson Pro', serif",
                  fontSize: 15,
                  color: theme.text,
                  textAlign: col.right ? 'right' : 'left',
                  whiteSpace: col.nowrap ? 'nowrap' : 'normal',
                }}>
                  {col.render ? col.render(row) : row[col.key] ?? '—'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function SectionTitle({ children }) {
  return (
    <h2 style={{
      fontFamily: "'Playfair Display', serif",
      fontWeight: 700,
      fontSize: 22,
      color: theme.green,
      margin: '0 0 20px',
      paddingBottom: 10,
      borderBottom: `2px solid ${theme.greenMid}`,
    }}>{children}</h2>
  );
}

export function CountryFlag({ ioc }) {
  const COUNTRY_MAP = {
    USA: 'us', ESP: 'es', SUI: 'ch', SRB: 'rs', GBR: 'gb',
    GER: 'de', FRA: 'fr', AUS: 'au', ARG: 'ar', CZE: 'cz',
    SWE: 'se', RUS: 'ru', CRO: 'hr', NED: 'nl', BEL: 'be',
    ITA: 'it', AUT: 'at', BRA: 'br', CAN: 'ca', JPN: 'jp',
    CHI: 'cl', COL: 'co', RSA: 'za', BUL: 'bg', POL: 'pl',
    ROU: 'ro', SVK: 'sk', DEN: 'dk', FIN: 'fi', NOR: 'no',
  };
  const code = COUNTRY_MAP[ioc] || ioc?.toLowerCase();
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <img
        src={`https://flagcdn.com/20x15/${code}.png`}
        alt={ioc}
        style={{ borderRadius: 2 }}
        onError={e => { e.target.style.display = 'none'; }}
      />
      <span style={{ fontSize: 13, color: theme.textMid }}>{ioc}</span>
    </span>
  );
}
