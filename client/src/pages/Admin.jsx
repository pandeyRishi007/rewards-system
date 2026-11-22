import { useEffect, useState } from 'react';
import { api, rupees } from '../api.js';
import { useAuth } from '../context.jsx';

const FIELDS = [
  ['earnPer100Rupees', 'Points earned per ₹100 spent', '0.1'],
  ['redeemValuePaise', 'Value of 1 point (paise)', '1'],
  ['minRedeem', 'Minimum points per redemption', '1'],
  ['maxPercent', 'Max % of cart payable with points', '1'],
];

export default function Admin() {
  const { token } = useAuth();
  const [tab, setTab] = useState('orders');
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [settings, setSettings] = useState(null);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  const call = (path, opts) => api('/admin' + path, { token, ...opts });
  const load = () => Promise.all([call('/orders'), call('/users'), call('/settings')])
    .then(([o, u, s]) => { setOrders(o); setUsers(u); setSettings(s); })
    .catch((e) => setErr(e.message));
  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function run(fn, ok) {
    setErr(''); setMsg('');
    try { await fn(); setMsg(ok); await load(); } catch (e) { setErr([e.message, ...(e.details || [])].join(' — ')); }
  }

  const saveSettings = (e) => {
    e.preventDefault();
    const body = Object.fromEntries(FIELDS.map(([k]) => [k, Number(settings[k])]));
    run(() => call('/settings', { method: 'PUT', body }), 'Settings saved.');
  };

  return (
    <>
      <h1>Admin</h1>
      <div className="tabs">
        {['orders', 'users', 'settings'].map((t) => <button key={t} className={`tab ${tab === t ? 'on' : ''}`} onClick={() => setTab(t)}>{t}</button>)}
      </div>
      {msg && <p className="good">{msg}</p>}
      {err && <p className="error">{err}</p>}

      {tab === 'orders' && orders.map((o) => (
        <div className="card" key={o._id}>
          <div className="row">
            <strong className="grow">#{o._id.slice(-6)} · {o.user?.name} <span className="muted small">{o.user?.email}</span></strong>
            <span className={`badge ${o.status}`}>{o.status}</span>
          </div>
          <p className="small">{o.items.map((i) => `${i.name} × ${i.qty}`).join(', ')}</p>
          <p className="small">Paid {rupees(o.totalPaise)}{o.pointsRedeemed > 0 && ` (used ${o.pointsRedeemed} pts)`}{o.status === 'delivered' && ` · earned ${o.pointsEarned} pts`}</p>
          {o.status === 'placed' && <>
            <button className="btn" onClick={() => run(() => call(`/orders/${o._id}/deliver`, { method: 'PATCH' }), 'Marked delivered — points awarded.')}>Mark delivered</button>{' '}
            <button className="btn ghost" onClick={() => run(() => api(`/orders/${o._id}/cancel`, { method: 'PATCH', token }), 'Order cancelled — points returned.')}>Cancel</button>
          </>}
          {o.status === 'delivered' && <button className="btn ghost" onClick={() => confirm('Refund this order and reverse its points?') && run(() => api(`/orders/${o._id}/cancel`, { method: 'PATCH', token }), 'Order refunded — points reversed.')}>Refund</button>}
        </div>
      ))}

      {tab === 'users' && (
        <div className="card">
          {users.map((u) => (
            <div className="row" key={u.id}>
              <span className="grow">{u.name} <span className="muted small">{u.email} · {u.role}</span></span>
              <strong>{u.balance} pts</strong>
            </div>
          ))}
        </div>
      )}

      {tab === 'settings' && settings && (
        <form className="card narrow" onSubmit={saveSettings}>
          <h3>Reward rules</h3>
          {FIELDS.map(([k, label, step]) => (
            <label key={k}>{label}<input type="number" step={step} min="0" value={settings[k]} onChange={(e) => setSettings({ ...settings, [k]: e.target.value })} /></label>
          ))}
          <button className="btn">Save settings</button>
        </form>
      )}
    </>
  );
}

