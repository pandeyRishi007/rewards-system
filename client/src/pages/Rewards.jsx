import { useEffect, useState } from 'react';
import { api, rupees } from '../api.js';
import { useAuth } from '../context.jsx';

const LABEL = {
  EARN: 'Earned on order', REDEEM: 'Redeemed', REFUND: 'Points returned', REVERSE: 'Points reversed',
};

export default function Rewards() {
  const { token } = useAuth();
  const [d, setD] = useState(null);
  const [err, setErr] = useState('');
  useEffect(() => { api('/rewards/me', { token }).then(setD).catch((e) => setErr(e.message)); }, [token]);

  if (!d) return <p className="muted">{err || 'Loading…'}</p>;
  const r = d.rules;
  return (
    <>
      <h1>My Rewards</h1>
      <div className="card balance">
        <div className="big">🪙 {d.balance.toLocaleString('en-IN')} <span className="muted">points</span></div>
        <p>Worth <b>{rupees(d.worthPaise)}</b> at checkout</p>
      </div>

      <div className="card">
        <h3>How it works</h3>
        <ul className="rules">
          <li>Earn <b>{r.earnPer100Rupees} points</b> for every ₹100 you spend (after delivery).</li>
          <li>Each point is worth <b>{rupees(r.redeemValuePaise)}</b>; redeem at least <b>{r.minRedeem}</b> at a time.</li>
          <li>Points can pay for up to <b>{r.maxPercent}%</b> of your cart.</li>
        </ul>
      </div>

      <div className="card">
        <h3>History</h3>
        {!d.history.length && <p className="muted">No activity yet.</p>}
        {d.history.map((h) => (
          <div className="row" key={h._id}>
            <span className="grow">{LABEL[h.type] || h.type}<br /><span className="muted small">{h.note} · {new Date(h.createdAt).toLocaleDateString('en-IN')}</span></span>
            <strong className={h.points >= 0 ? 'good' : 'bad'}>{h.points > 0 ? '+' : ''}{h.points}</strong>
          </div>
        ))}
      </div>
    </>
  );
}

