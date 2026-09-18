import { useState } from 'react';
import type { Drone } from '../types';

interface Props { drone: Drone; onComplete: () => void; onFault: () => void }
type R = 'pass' | 'warn' | 'fail' | null;
interface Item { id: string; cat: string; label: string; desc: string; result: R }

const ITEMS: Item[] = [
  { id: 'a1', cat: 'Airframe',    label: 'Frame integrity',      desc: 'Check arms, body, and motor mounts for cracks or impact damage', result: null },
  { id: 'a2', cat: 'Airframe',    label: 'Propeller condition',  desc: 'Inspect all propellers for chips, cracks, or leading-edge wear', result: null },
  { id: 'p1', cat: 'Propulsion',  label: 'Motor temperature',    desc: 'All motors cool within normal range (< 60°C)', result: null },
  { id: 'p2', cat: 'Propulsion',  label: 'Motor rotation',       desc: 'All motors spin freely without binding or grinding', result: null },
  { id: 'e1', cat: 'Electronics', label: 'Battery pack',         desc: 'No swelling, deformation, heat damage, or smell', result: null },
  { id: 'e2', cat: 'Electronics', label: 'Camera and gimbal',    desc: 'Lens clear, gimbal axes move smoothly, no loose fasteners', result: null },
  { id: 'e3', cat: 'Electronics', label: 'Landing gear',         desc: 'All struts intact, no cracks, damping pads in good condition', result: null },
  { id: 'd1', cat: 'Data',        label: 'Flight data saved',    desc: 'Confirm telemetry logs and media saved correctly to storage', result: null },
];

const BTN: Record<string, { bg: string; border: string; color: string }> = {
  'pass-active':  { bg: 'var(--green-bg)',  border: 'var(--green-border)',  color: 'var(--green-text)' },
  'warn-active':  { bg: 'var(--amber-bg)',  border: 'var(--amber-border)',  color: 'var(--amber-text)' },
  'fail-active':  { bg: 'var(--red-bg)',    border: 'var(--red-border)',    color: 'var(--red-text)' },
  'inactive':     { bg: 'var(--surface)',   border: 'var(--border)',        color: 'var(--text-2)' },
};

export default function PostflightCheck({ drone, onComplete, onFault }: Props) {
  const [items, setItems] = useState<Item[]>(ITEMS);
  const [notes, setNotes] = useState('');

  const done    = items.filter(i => i.result !== null).length;
  const hasFail = items.some(i => i.result === 'fail');
  const allDone = done === items.length;
  const pct     = Math.round((done / items.length) * 100);

  function set(id: string, r: R) { setItems(prev => prev.map(i => i.id === id ? { ...i, result: r } : i)); }
  const cats = [...new Set(items.map(i => i.cat))];

  return (
    <div className="fade-in" style={{ flex: 1, overflowY: 'auto', padding: '32px 36px' }}>
      <div style={{ maxWidth: 700 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', margin: '0 0 6px' }}>Post-flight inspection</h1>
            <p style={{ fontSize: 14, color: 'var(--text-2)', margin: 0 }}>Physical inspection of <strong>{drone.id}</strong> — {drone.name}</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: allDone ? (hasFail ? 'var(--red)' : 'var(--green)') : 'var(--text)', lineHeight: 1 }}>{pct}%</div>
            <div style={{ fontSize: 13, color: 'var(--text-2)' }}>{done}/{items.length} completed</div>
          </div>
        </div>

        <div style={{ height: 6, background: 'var(--border)', borderRadius: 3, overflow: 'hidden', marginBottom: 24 }}>
          <div style={{ width: `${pct}%`, height: '100%', background: hasFail ? 'var(--red)' : 'var(--green)', borderRadius: 3, transition: 'width .3s' }} />
        </div>

        {cats.map(cat => (
          <div key={cat} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden', marginBottom: 12, boxShadow: 'var(--shadow)' }}>
            <div style={{ padding: '10px 20px', borderBottom: '1px solid var(--border)', background: 'var(--surface-2)', fontSize: 12, fontWeight: 600, color: 'var(--text-2)' }}>{cat}</div>
            {items.filter(i => i.cat === cat).map((item, idx, arr) => (
              <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 20px', borderBottom: idx < arr.length - 1 ? '1px solid var(--border)' : 'none' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)', marginBottom: 2 }}>{item.label}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-3)', lineHeight: 1.5 }}>{item.desc}</div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {(['pass', 'warn', 'fail'] as const).map(res => {
                    const active = item.result === res;
                    const k = active ? `${res}-active` : 'inactive';
                    return (
                      <button key={res} onClick={() => set(item.id, res)} style={{ padding: '5px 12px', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer', background: BTN[k].bg, border: `1px solid ${BTN[k].border}`, color: BTN[k].color, transition: 'all .1s' }}>
                        {{ pass: 'Pass', warn: 'Warn', fail: 'Fail' }[res]}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ))}

        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '16px', marginBottom: 20, boxShadow: 'var(--shadow)' }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', marginBottom: 8 }}>Inspection notes (optional)</div>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} placeholder="Describe any damage, wear, or observations…" style={{ width: '100%', padding: '10px 12px', fontSize: 13 }} />
        </div>

        {allDone && (
          <div style={{ padding: '14px', borderRadius: 10, marginBottom: 16, background: hasFail ? 'var(--red-bg)' : 'var(--green-bg)', border: `1px solid ${hasFail ? 'var(--red-border)' : 'var(--green-border)'}` }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: hasFail ? 'var(--red-text)' : 'var(--green-text)' }}>
              {hasFail ? 'Faults detected — drone must be flagged for maintenance.' : 'All items passed — mission can be completed.'}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: 12 }}>
          {hasFail && allDone ? (
            <button onClick={onFault} style={{ flex: 1, padding: '11px', borderRadius: 8, border: 'none', background: 'var(--red)', fontSize: 14, fontWeight: 600, color: '#fff', cursor: 'pointer' }}>Report fault and flag for maintenance</button>
          ) : (
            <button onClick={onComplete} disabled={!allDone} style={{ flex: 1, padding: '11px', borderRadius: 8, border: 'none', background: allDone ? 'var(--accent)' : 'var(--surface-2)', fontSize: 14, fontWeight: 600, color: allDone ? '#fff' : 'var(--text-3)', cursor: allDone ? 'pointer' : 'not-allowed' }}>
              {allDone ? 'Complete inspection' : `Complete all ${items.length} items to continue`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
