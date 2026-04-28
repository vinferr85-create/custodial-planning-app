import { C } from '../theme.js';

export function Card({ children, style = {} }) {
  return (
    <div style={{ background: C.slate, borderRadius: 10, padding: 16, border: '1px solid #ffffff12', ...style }}>
      {children}
    </div>
  );
}

export function Badge({ color, children }) {
  return (
    <span style={{ background: color + '22', color, border: `1px solid ${color}44`, padding: '2px 7px', borderRadius: 20, fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap' }}>
      {children}
    </span>
  );
}

export function Btn({ children, onClick, variant = 'pri', small, style = {}, disabled = false }) {
  const base = { border: 'none', borderRadius: 7, fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1, padding: small ? '5px 11px' : '9px 17px', fontSize: small ? 11 : 13, transition: 'all .12s', ...style };
  const vs = {
    pri:    { background: C.teal,       color: C.white },
    sec:    { background: '#ffffff18',  color: C.off,   border: '1px solid #ffffff22' },
    danger: { background: C.red + '33', color: C.red,   border: `1px solid ${C.red}44` },
    gold:   { background: C.gold,       color: C.navy },
  };
  return <button style={{ ...base, ...(vs[variant] || vs.pri) }} onClick={onClick} disabled={disabled}>{children}</button>;
}

export function Select({ label, value, onChange, options }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {label && <span style={{ fontSize: 10, fontWeight: 700, color: C.g2, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>}
      <select value={value} onChange={e => onChange(e.target.value)}
        style={{ background: '#ffffff0d', border: '1px solid #ffffff22', borderRadius: 7, padding: '7px 9px', color: C.off, fontSize: 12, outline: 'none' }}>
        {options.map(o => <option key={o} value={o} style={{ background: C.slate }}>{o}</option>)}
      </select>
    </label>
  );
}

export function Input({ label, value, onChange, type = 'text', placeholder = '', min }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {label && <span style={{ fontSize: 10, fontWeight: 700, color: C.g2, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>}
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} min={min}
        style={{ background: '#ffffff0d', border: '1px solid #ffffff22', borderRadius: 7, padding: '7px 9px', color: C.off, fontSize: 12, outline: 'none', width: '100%' }} />
    </label>
  );
}

export function PageHeader({ title, sub }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <h2 style={{ fontFamily: 'Georgia,serif', fontSize: 24, color: C.white, marginBottom: 3 }}>{title}</h2>
      {sub && <p style={{ color: C.g2, fontSize: 12 }}>{sub}</p>}
    </div>
  );
}

export function DataGrid({ cols, headers, rows, empty }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: cols.join(' ') }}>
      {headers.map(h => (
        <div key={h} style={{ padding: '6px 8px', fontSize: 10, fontWeight: 700, color: C.g2, textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #ffffff20' }}>{h}</div>
      ))}
      {!rows.length && (
        <div style={{ gridColumn: '1/-1', padding: 24, textAlign: 'center', color: C.g2, fontSize: 13 }}>{empty}</div>
      )}
      {rows.map((row, i) => row.map((cell, j) => (
        <div key={`${i}-${j}`} style={{ padding: '7px 8px', fontSize: 11, borderBottom: '1px solid #ffffff08', background: i % 2 === 0 ? '#ffffff05' : 'transparent', display: 'flex', alignItems: 'center' }}>
          {cell}
        </div>
      )))}
    </div>
  );
}

export function StatusBar({ state, message }) {
  const colors = { error: C.red, done: C.green, parsing: C.tealLt, mapping: C.tealLt };
  const icons  = { error: '✕ ', done: '✓ ', parsing: '⟳ ', mapping: '⟳ ' };
  return (
    <div style={{ padding: '9px 12px', borderRadius: 7, fontSize: 12, background: (colors[state] || C.teal) + '22', color: colors[state] || C.tealLt, border: `1px solid ${colors[state] || C.teal}44` }}>
      {icons[state] || ''}{message}
    </div>
  );
}
