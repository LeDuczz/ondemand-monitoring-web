import { useState } from 'react';
import type { CheckItem } from '../types';

interface Props { checklist: CheckItem[]; onPass: () => void; onFail: () => void; onBack: () => void }

export default function PreflightChecklist({ checklist, onPass, onFail, onBack }: Props) {
  const [ran, setRan] = useState(false);
  const [running, setRunning] = useState(false);

  function runChecks() {
    setRunning(true);
    setTimeout(() => { setRunning(false); setRan(true); }, 1800);
  }

  const passed  = ran ? checklist.filter(c => c.status === 'PASS').length    : 0;
  const failed  = ran ? checklist.filter(c => c.status === 'FAIL').length    : 0;
  const warned  = ran ? checklist.filter(c => c.status === 'WARNING').length : 0;
  const allPass = ran && failed === 0;

  const statusColor  = { PASS: 'var(--green)', FAIL: 'var(--red)', WARNING: 'var(--amber)', PENDING: 'var(--text-3)' };
  const statusBg     = { PASS: 'var(--green-bg)', FAIL: 'var(--red-bg)', WARNING: 'var(--amber-bg)', PENDING: 'var(--surface-2)' };
  const statusBorder = { PASS: 'var(--green-border)', FAIL: 'var(--red-border)', WARNING: 'var(--amber-border)', PENDING: 'var(--border)' };
  const statusLabel  = { PASS: 'Passed', FAIL: 'Failed', WARNING: 'Warning', PENDING: 'Pending' };
  const statusIcon   = { PASS: '✓', FAIL: '✕', WARNING: '⚠', PENDING: '—' };

  return (
    <div className="fade-in" style={{ flex: 1, overflowY: 'auto', padding: '32px 36px' }}>
      <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: 'var(--text-2)', fontSize: 13, cursor: 'pointer', padding: 0, marginBottom: 20 }}>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M9 2L4 7l5 5"/></svg>
        Back
      </button>

      <div style={{ maxWidth: 640 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', margin: '0 0 6px' }}>Pre-flight check</h1>
            <p style={{ fontSize: 14, color: 'var(--text-2)', margin: 0 }}>Automated safety checks before flight authorisation.</p>
          </div>
          {ran && (
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: allPass ? 'var(--green)' : 'var(--red)', lineHeight: 1 }}>{passed}/{checklist.length}</div>
              <div style={{ fontSize: 13, color: 'var(--text-2)' }}>checks passed</div>
            </div>
          )}
        </div>

        {/* Progress bar */}
        {ran && (
          <div style={{ height: 6, background: 'var(--border)', borderRadius: 3, overflow: 'hidden', marginBottom: 24 }}>
            <div style={{ width: `${(passed / checklist.length) * 100}%`, height: '100%', background: allPass ? 'var(--green)' : 'var(--red)', borderRadius: 3, transition: 'width .5s' }} />
          </div>
        )}

        {/* Checklist items */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden', boxShadow: 'var(--shadow)', marginBottom: 20 }}>
          {checklist.map((item, i) => {
            const s = ran ? item.status : 'PENDING';
            return (
              <div key={item.id} style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 16, padding: '16px 20px', borderBottom: i < checklist.length - 1 ? '1px solid var(--border)' : 'none', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)', marginBottom: 4 }}>{item.label}</div>
                  {ran && (
                    <div style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.5 }}>{item.value}</div>
                  )}
                  {item.explanation && !ran && (
                    <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{item.explanation}</div>
                  )}
                </div>
                {ran && (
                  <div style={{ fontSize: 14, fontFamily: 'var(--font-data)', fontWeight: 600, color: item.status === 'FAIL' ? 'var(--red)' : item.status === 'WARNING' ? 'var(--amber)' : 'var(--text)', textAlign: 'right' }}>
                    {item.value}
                  </div>
                )}
                <div style={{ padding: '4px 10px', borderRadius: 6, background: statusBg[s], border: `1px solid ${statusBorder[s]}`, fontSize: 13, fontWeight: 500, color: statusColor[s], display: 'flex', alignItems: 'center', gap: 5, whiteSpace: 'nowrap' }}>
                  <span>{statusIcon[s]}</span>
                  {statusLabel[s]}
                </div>
              </div>
            );
          })}
        </div>

        {/* Result banner */}
        {ran && (
          <div style={{ padding: '14px 16px', borderRadius: 10, marginBottom: 20, background: allPass ? 'var(--green-bg)' : 'var(--red-bg)', border: `1px solid ${allPass ? 'var(--green-border)' : 'var(--red-border)'}` }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: allPass ? 'var(--green-text)' : 'var(--red-text)' }}>
              {allPass ? `All ${passed} checks passed — ready to proceed.`
                       : `${failed} check${failed > 1 ? 's' : ''} failed${warned > 0 ? `, ${warned} warning${warned > 1 ? 's' : ''}` : ''} — review the results below.`}
            </div>
          </div>
        )}

        {!ran && !running && (
          <button onClick={runChecks} style={{ width: '100%', padding: '11px', borderRadius: 8, border: 'none', background: 'var(--accent)', fontSize: 14, fontWeight: 600, color: '#fff', cursor: 'pointer' }}>Run pre-flight checks</button>
        )}
        {running && (
          <button disabled style={{ width: '100%', padding: '11px', borderRadius: 8, border: 'none', background: 'var(--surface-2)', fontSize: 14, fontWeight: 600, color: 'var(--text-3)', cursor: 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
            <div style={{ width: 14, height: 14, border: '2px solid var(--border-2)', borderTopColor: 'var(--accent)', borderRadius: '50%' }} className="spin" />
            Running checks…
          </button>
        )}
        {ran && allPass && (
          <button onClick={onPass} style={{ width: '100%', padding: '11px', borderRadius: 8, border: 'none', background: 'var(--accent)', fontSize: 14, fontWeight: 600, color: '#fff', cursor: 'pointer' }}>Continue to control handover</button>
        )}
        {ran && !allPass && (
          <button onClick={onFail} style={{ width: '100%', padding: '11px', borderRadius: 8, border: 'none', background: 'var(--red)', fontSize: 14, fontWeight: 600, color: '#fff', cursor: 'pointer' }}>View failure report</button>
        )}
      </div>
    </div>
  );
}
