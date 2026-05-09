export const theme = {
  green: '#2d5a27',
  greenLight: '#3d7a35',
  greenPale: '#e8f0e6',
  greenMid: '#c8ddc4',
  purple: '#4a1a6b',
  purpleLight: '#6b2d8b',
  purplePale: '#ede6f5',
  white: '#ffffff',
  cream: '#f8f6f0',
  creamDark: '#ede9df',
  text: '#1a1a1a',
  textMid: '#4a4a4a',
  textLight: '#7a7a7a',
  border: '#d4cfc4',
  gold: '#b8973a',
};

export const SERVER = 'http://localhost:8080';

export const COUNTRY_MAP = {
  USA: 'us', ESP: 'es', SUI: 'ch', SRB: 'rs', GBR: 'gb',
  GER: 'de', FRA: 'fr', AUS: 'au', ARG: 'ar', CZE: 'cz',
  SWE: 'se', RUS: 'ru', CRO: 'hr', NED: 'nl', BEL: 'be',
  ITA: 'it', AUT: 'at', BRA: 'br', CAN: 'ca', JPN: 'jp',
  CHI: 'cl', COL: 'co', RSA: 'za', BUL: 'bg', POL: 'pl',
  ROU: 'ro', SVK: 'sk', DEN: 'dk', FIN: 'fi', NOR: 'no',
};

export function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}
