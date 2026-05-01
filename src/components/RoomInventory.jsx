import { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { C, uid } from '../theme.js';
import { SPACE_TYPES } from '../data/cleaningMatrix.js';
import { FLOOR_TYPES, FLOOR_DEFAULT } from '../utils/fte.js';
import { matchSpaceType, aiMapSpaceTypes, parseExcelRow } from '../utils/spaceTypeMatcher.js';
import { Card, Btn, Badge, Input, Select, PageHeader, DataGrid, StatusBar } from './UI.jsx';

const UNIT_FIELDS = [
  { k: 'fixtures',   l: 'Fixtures / Toilets',  d: 1 },
  { k: 'bins',       l: 'Bins',                d: 1 },
  { k: 'dispensers', l: 'Dispensers',          d: 1 },
  { k: 'mirrors',    l: 'Mirrors',             d: 0 },
  { k: 'appliances', l: 'Appliances',          d: 0 },
  { k: 'microwaves', l: 'Microwaves',          d: 0 },
  { k: 'mats',       l: 'Mats',               d: 0 },
];

const EMPTY = {
  building: '', roomNumber: '', floor: '1', spaceType: SPACE_TYPES[0],
  floorType: FLOOR_DEFAULT, hardSplit: 50,
  sqft: '', fixtures: 1, bins: 1, dispensers: 1,
  mirrors: 0, appliances: 0, microwaves: 0, mats: 0,
  requiresCleaning: true, notes: '',
};

export default function RoomInventory({ rooms, setRooms, onAdd, onDelete, onBulkAdd, onToggleClean }) {
  const bldgOpts = ['All', ...new Set(rooms.map(r => r.building).filter(Boolean))];
  const [flt,  setFlt]  = useState('All');
  const [f,    setF]    = useState(EMPTY);
  const [us,   setUS]   = useState('idle');
  const [msg,  setMsg]  = useState('');
  const [prev, setPrev] = useState(null);
  const [drag, setDrag] = useState(false);
  const [cc,   setCC]   = useState(false);

  const upd    = k => v => setF(p => ({ ...p, [k]: v }));
  const shown  = flt === 'All' ? rooms : rooms.filter(r => r.building === flt);
  const LBL    = { fontSize: 9, fontWeight: 700, color: C.g2, textTransform: 'uppercase', letterSpacing: '0.05em', lineHeight: 1.3 };
  const IS     = { background: '#ffffff0d', border: '1px solid #ffffff22', borderRadius: 7, padding: '6px 8px', color: C.off, fontSize: 12, outline: 'none', width: '100%' };

  async function handleFile(file) {
    if (!file) return;
    const ext = file.name.split('.').pop().toLowerCase();
    if (!['xlsx', 'xls', 'csv'].includes(ext)) { setUS('error'); setMsg('Please upload .xlsx, .xls, or .csv'); return; }
    setUS('parsing'); setMsg(`Reading ${file.name}…`);
    try {
      const buf  = await file.arrayBuffer();
      const wb   = XLSX.read(buf, { type: 'array' });
      const ws   = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(ws, { defval: '' });
      if (!rows.length) { setUS('error'); setMsg('No data rows found.'); return; }
      setUS('mapping'); setMsg(`${rows.length} rows parsed. Matching space types…`);

      const parsed  = rows.map(parseExcelRow).filter(r => r.building || r.roomNumber);
      const needsAI = [];
      const mapped  = parsed.map(r => {
        const match = matchSpaceType(r.rawType);
        if (!match && r.rawType && !needsAI.includes(r.rawType)) needsAI.push(r.rawType);
        return { ...r, spaceType: match, fuzzy: !!match };
      });

      let aiMap = {};
      if (needsAI.length) { setMsg(`AI interpreting ${needsAI.length} unrecognised type(s)…`); aiMap = await aiMapSpaceTypes(needsAI); }

      const final = mapped.map(r => ({
        id: uid(), building: r.building || 'Unknown', roomNumber: r.roomNumber || '?',
        floor: r.floor || '1', spaceType: r.spaceType || aiMap[r.rawType] || null,
        floorType: r.floorType || FLOOR_DEFAULT, hardSplit: r.hardSplit || 50,
        sqft: r.sqft, fixtures: r.fixtures, bins: r.bins, dispensers: r.dispensers,
        mirrors: r.mirrors, appliances: r.appliances, microwaves: r.microwaves, mats: r.mats,
        requiresCleaning: true, notes: r.notes,
        _raw: r.rawType, _noMatch: !r.spaceType && !aiMap[r.rawType],
        _ai: !r.spaceType && !!aiMap[r.rawType], _fuzzy: r.fuzzy,
      }));

      const colNames = Object.keys(rows[0] || {});
      const nm = final.filter(r => r._noMatch).length;
      setPrev({ rows: final, colNames });
      setUS('review');
      setMsg(nm > 0 ? `${nm} room(s) need a space type — select from dropdown below.` : 'All types matched — review and import.');
    } catch (e) { setUS('error'); setMsg('Error reading file: ' + e.message); }
  }

  function commit() {
    const clean = prev.rows.map(({ _raw, _noMatch, _ai, _fuzzy, ...r }) => ({ ...r, spaceType: r.spaceType || SPACE_TYPES[0] }));
    onBulkAdd ? onBulkAdd(clean) : setRooms(p => [...p, ...clean]);
    setPrev(null); setUS('done'); setMsg(`✓ ${clean.length} rooms imported.`);
    setTimeout(() => setUS('idle'), 3000);
  }

  function addRoom() {
    if (!f.building || !f.roomNumber || !f.sqft) return;
    const vals = Object.fromEntries(UNIT_FIELDS.map(u => [u.k, +(f[u.k] ?? u.d)]));
    const room = { ...f, ...vals, id: uid(), sqft: +f.sqft };
    onAdd ? onAdd(room) : setRooms(p => [...p, room]);
    setF(p => ({ ...p, roomNumber: '', sqft: '', notes: '' }));
  }

  return (
    <div>
      <PageHeader title="Room Inventory" sub="Add rooms individually or upload a spreadsheet. Unit counts drive ISSA calculations." />

      {/* Manual add */}
      <Card style={{ marginBottom: 12 }}>
        <div style={{ ...LBL, marginBottom: 8, fontSize: 11, color: C.tealLt }}>➕ Add Room Manually</div>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 0.9fr 0.6fr 2fr', gap: 7, marginBottom: 7 }}>
          <Input label="Building"    value={f.building}    onChange={upd('building')}    placeholder="Anderson Hall" />
          <Input label="Room #"      value={f.roomNumber}  onChange={upd('roomNumber')}  placeholder="101" />
          <Input label="Floor"       value={f.floor}       onChange={upd('floor')}       placeholder="1" />
          <Select label="Space Type" value={f.spaceType}   onChange={upd('spaceType')}   options={SPACE_TYPES} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '0.8fr 0.9fr 0.6fr 1fr', gap: 7, marginBottom: 7 }}>
          <Input label="Sq Footage" value={f.sqft} onChange={upd('sqft')} type="number" placeholder="220" />
          <Select label="Floor Type" value={f.floorType} onChange={upd('floorType')} options={FLOOR_TYPES} />
          {f.floorType === 'Mixed' && (
            <label style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <span style={{ ...LBL }}>Hard Floor %</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <input type="range" min="0" max="100" step="5" value={f.hardSplit} onChange={e => upd('hardSplit')(+e.target.value)}
                  style={{ flex: 1, accentColor: C.teal }} />
                <span style={{ fontSize: 11, color: C.tealLt, fontWeight: 700, minWidth: 36 }}>{f.hardSplit}%</span>
              </div>
              <span style={{ fontSize: 9, color: C.g2 }}>{f.hardSplit}% hard · {100 - f.hardSplit}% carpet</span>
            </label>
          )}
          {f.floorType !== 'Mixed' && (
            <div style={{ padding: '8px 10px', background: '#ffffff08', borderRadius: 7, fontSize: 11, color: C.g2, display: 'flex', alignItems: 'center' }}>
              {f.floorType === 'Hard Floor' ? '🪣 Sweep/mop tasks applied · Carpet tasks excluded' : '🧹 Vacuum tasks applied · Sweep/mop tasks excluded'}
            </div>
          )}
        </div>
        <div style={{ marginBottom: 7 }}>
          <div style={{ background: '#ffffff08', borderRadius: 7, padding: '7px 10px' }}>
            <div style={{ ...LBL, marginBottom: 5 }}>Unit Counts — ISSA Calculations</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 5 }}>
              {UNIT_FIELDS.map(u => (
                <label key={u.k} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <span style={LBL}>{u.l}</span>
                  <input type="number" min="0" value={f[u.k]} onChange={e => upd(u.k)(e.target.value)} style={IS} />
                </label>
              ))}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div>
            <div style={{ ...LBL, marginBottom: 3 }}>Requires Cleaning</div>
            <div style={{ display: 'flex', gap: 5 }}>
              {['Yes', 'No'].map(v => (
                <Btn key={v} small variant={f.requiresCleaning === (v === 'Yes') ? 'gold' : 'sec'} onClick={() => setF(p => ({ ...p, requiresCleaning: v === 'Yes' }))}>{v}</Btn>
              ))}
            </div>
          </div>
          <div style={{ flex: 1 }}><Input label="Notes" value={f.notes} onChange={upd('notes')} placeholder="Optional" /></div>
          <Btn style={{ alignSelf: 'flex-end' }} onClick={addRoom}>+ Add Room</Btn>
        </div>
      </Card>

      {/* Upload */}
      <Card style={{ marginBottom: 12 }}>
        <div style={{ ...LBL, marginBottom: 5, fontSize: 11, color: C.tealLt }}>📂 Upload Spreadsheet</div>
        <div style={{ fontSize: 11, color: C.g2, marginBottom: 10, lineHeight: 1.6 }}>
          Upload <strong style={{ color: C.off }}>.xlsx, .xls, or .csv</strong>. Columns auto-detected.<br />
          Expected: <span style={{ color: C.tealLt }}>Building · Room # · Floor · Space Type · Sq Ft</span> (+ optional unit counts)<br />
          Space types matched by keyword; unknowns sent to AI.
        </div>

        {us !== 'review' && (
          <div onDragOver={e => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)}
            onDrop={e => { e.preventDefault(); setDrag(false); handleFile(e.dataTransfer.files[0]); }}
            style={{ border: `2px dashed ${drag ? C.tealLt : C.teal}`, borderRadius: 9, padding: 20, textAlign: 'center', cursor: 'pointer', background: drag ? '#0D737720' : 'transparent', marginBottom: 8 }}
            onClick={() => document.getElementById('xlUpload').click()}>
            <div style={{ fontSize: 28, marginBottom: 4 }}>📊</div>
            <div style={{ fontSize: 13, color: drag ? C.tealLt : C.off, fontWeight: 500 }}>Drop here or click to browse</div>
            <div style={{ fontSize: 11, color: C.g2, marginTop: 2 }}>Excel or CSV</div>
            <input id="xlUpload" type="file" accept=".xlsx,.xls,.csv" style={{ display: 'none' }} onChange={e => { handleFile(e.target.files[0]); e.target.value = ''; }} />
          </div>
        )}

        {us !== 'idle' && us !== 'review' && <StatusBar state={us} message={msg} />}

        {us === 'review' && prev && (
          <>
            <div style={{ padding: '9px 12px', borderRadius: 7, fontSize: 11, background: C.gold + '22', color: C.gold, border: `1px solid ${C.gold}44`, marginBottom: 8 }}>{msg}</div>
            <div style={{ maxHeight: 260, overflowY: 'auto', border: '1px solid #ffffff15', borderRadius: 7, marginBottom: 8 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 0.5fr 0.35fr 1.8fr 0.5fr 0.4fr 0.4fr 0.4fr 0.4fr 0.4fr 0.4fr 0.4fr', position: 'sticky', top: 0, zIndex: 1 }}>
                {['Building', 'Room', 'Flr', 'Space Type', 'Sqft', 'Fix', 'Bins', 'Disp', 'Mir', 'App', 'Micro', 'Match'].map(h => (
                  <div key={h} style={{ padding: '5px 7px', fontSize: 9, fontWeight: 700, color: C.g2, textTransform: 'uppercase', background: C.slate, borderBottom: '1px solid #ffffff20' }}>{h}</div>
                ))}
              </div>
              {prev.rows.map((r, i) => (
                <div key={r.id} style={{ display: 'grid', gridTemplateColumns: '1.3fr 0.5fr 0.35fr 1.8fr 0.5fr 0.4fr 0.4fr 0.4fr 0.4fr 0.4fr 0.4fr 0.4fr', background: i % 2 === 0 ? '#ffffff05' : 'transparent' }}>
                  <div style={{ padding: '6px 7px', fontSize: 11, color: C.off, borderBottom: '1px solid #ffffff08' }}>{r.building}</div>
                  <div style={{ padding: '6px 7px', fontSize: 11, color: C.g2, borderBottom: '1px solid #ffffff08' }}>{r.roomNumber}</div>
                  <div style={{ padding: '6px 7px', fontSize: 11, color: C.g2, borderBottom: '1px solid #ffffff08' }}>{r.floor}</div>
                  <div style={{ padding: '3px 5px', borderBottom: '1px solid #ffffff08' }}>
                    <select value={r.spaceType || ''} onChange={e => setPrev(p => ({ ...p, rows: p.rows.map(x => x.id === r.id ? { ...x, spaceType: e.target.value, _noMatch: false } : x) }))}
                      style={{ width: '100%', background: r._noMatch ? '#E53E3E22' : r._ai ? '#0D737733' : r._fuzzy ? '#E8A83822' : '#ffffff12', border: `1px solid ${r._noMatch ? C.red : r._ai ? C.teal : r._fuzzy ? C.gold : '#ffffff33'}`, borderRadius: 5, padding: '3px 5px', color: r._noMatch ? C.red : C.white, fontSize: 10, outline: 'none' }}>
                      {!r.spaceType && <option value="" style={{ background: C.slate }}>— select —</option>}
                      {SPACE_TYPES.map(st => <option key={st} value={st} style={{ background: C.slate }}>{st}</option>)}
                    </select>
                    {r._raw && <div style={{ fontSize: 9, color: C.g2, marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>"{r._raw}"</div>}
                  </div>
                  {[Math.round(r.sqft || 0), r.fixtures ?? 0, r.bins ?? 0, r.dispensers ?? 0, r.mirrors ?? 0, r.appliances ?? 0, r.microwaves ?? 0].map((v, j) => (
                    <div key={j} style={{ padding: '6px 7px', fontSize: 11, color: C.g2, borderBottom: '1px solid #ffffff08' }}>{v}</div>
                  ))}
                  <div style={{ padding: '6px 7px', borderBottom: '1px solid #ffffff08' }}>
                    {r._noMatch && <Badge color={C.red}>⚠</Badge>}
                    {r._ai     && <Badge color={C.teal}>AI</Badge>}
                    {r._fuzzy  && <Badge color={C.gold}>auto</Badge>}
                    {!r._noMatch && !r._ai && !r._fuzzy && <Badge color={C.g2}>✓</Badge>}
                  </div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 7, alignItems: 'center', flexWrap: 'wrap' }}>
              <Btn variant="gold" onClick={commit}>✓ Import {prev.rows.length} Rooms</Btn>
              <Btn variant="sec"  onClick={() => { setPrev(null); setUS('idle'); setMsg(''); }}>Cancel</Btn>
              <span style={{ fontSize: 10, color: C.g2 }}>
                <Badge color={C.red}>⚠</Badge> unset · <Badge color={C.teal}>AI</Badge> interpreted · <Badge color={C.gold}>auto</Badge> keyword
              </span>
            </div>
          </>
        )}
        {us === 'idle' && <div style={{ marginTop: 7, fontSize: 11, color: C.g2 }}>💡 Column names are flexible — "Bldg", "Room No.", "Sq Ft", "Space Type" etc. all work.</div>}
      </Card>

      {/* Filter row */}
      <div style={{ display: 'flex', gap: 5, alignItems: 'center', marginBottom: 8, flexWrap: 'wrap' }}>
        {bldgOpts.map(b => <Btn key={b} small variant={flt === b ? 'pri' : 'sec'} onClick={() => setFlt(b)}>{b.length > 14 ? b.split(' ')[0] : b}</Btn>)}
        <span style={{ marginLeft: 'auto', fontSize: 11, color: C.g2 }}>{shown.length} rooms</span>
        {rooms.length > 0 && !cc && <Btn small variant="danger" onClick={() => setCC(true)}>Clear All</Btn>}
        {cc && <>
          <span style={{ fontSize: 11, color: C.red, fontWeight: 600 }}>Clear {rooms.length} rooms?</span>
          <Btn small variant="danger" onClick={() => { setRooms([]); setCC(false); }}>Yes</Btn>
          <Btn small variant="sec"    onClick={() => setCC(false)}>No</Btn>
        </>}
      </div>

      {/* Room table */}
      <Card style={{ overflowX: 'auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 0.5fr 0.35fr 1.2fr 0.75fr 0.6fr 0.7fr 0.6fr 0.8fr 0.6fr 0.8fr 0.8fr 0.5fr 0.35fr', minWidth: 1200 }}>
          {['Building', 'Room', 'Flr', 'Space Type', 'Floor Type', 'Sq Ft', 'Fixtures', 'Bins', 'Dispensers', 'Mirrors', 'Appliances', 'Microwaves', 'Clean?', ''].map(h => (
            <div key={h} style={{ padding: '6px 7px', fontSize: 10, fontWeight: 700, color: C.g2, textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #ffffff20' }}>{h}</div>
          ))}
          {!shown.length && <div style={{ gridColumn: '1/-1', padding: 24, textAlign: 'center', color: C.g2, fontSize: 13 }}>No rooms yet. Add manually or upload a spreadsheet.</div>}
          {shown.map((r, i) => {
            const ft = r.floorType || FLOOR_DEFAULT;
            const ftColor = ft === 'Hard Floor' ? C.tealLt : ft === 'Carpet' ? C.gold : C.amber;
            const ftLabel = ft === 'Mixed' ? `Mixed ${r.hardSplit||50}/${100-(r.hardSplit||50)}` : ft;
            return [
              r.building, r.roomNumber, r.floor || '1',
              <span style={{ color: C.tealLt, fontSize: 10 }}>{r.spaceType}</span>,
              <Badge color={ftColor}>{ftLabel}</Badge>,
              Math.round(r.sqft || 0).toLocaleString(),
              r.fixtures ?? 0, r.bins ?? 0, r.dispensers ?? 0, r.mirrors ?? 0, r.appliances ?? 0, r.microwaves ?? 0,
              <span style={{ cursor: 'pointer' }} onClick={() => onToggleClean ? onToggleClean(r.id) : setRooms(p => p.map(x => x.id === r.id ? { ...x, requiresCleaning: !x.requiresCleaning } : x))}>
                <Badge color={r.requiresCleaning ? C.green : C.g2}>{r.requiresCleaning ? 'Yes' : 'No'}</Badge>
              </span>,
              <Btn small variant="danger" onClick={() => onDelete ? onDelete(r.id) : setRooms(p => p.filter(x => x.id !== r.id))}>✕</Btn>,
            ].map((cell, j) => (
              <div key={j} style={{ padding: '7px 7px', fontSize: 11, borderBottom: '1px solid #ffffff08', background: i % 2 === 0 ? '#ffffff05' : 'transparent', display: 'flex', alignItems: 'center' }}>{cell}</div>
            ));
          })}
        </div>
      </Card>
      <div style={{ marginTop: 6, fontSize: 10, color: C.g2 }}>
        <Badge color={C.tealLt}>Hard Floor</Badge> sweep/mop applied · <Badge color={C.gold}>Carpet</Badge> vacuum applied · <Badge color={C.amber}>Mixed</Badge> both applied proportionally · Click <strong>Clean?</strong> to toggle · <strong>✕</strong> to remove
      </div>
    </div>
  );
}
