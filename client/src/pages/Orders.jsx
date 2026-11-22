import { useEffect, useState } from 'react';
import { api, rupees } from '../api.js';
import { useAuth } from '../context.jsx';

export default function Orders() {
  const { token } = useAuth();
  const [orders, setOrders] = useState(null);
  const [err, setErr] = useState('');

  const load = () => api('/orders/mine', { token }).then(setOrders).catch((e) => setErr(e.message));
  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function cancel(id) {
    if (!confirm('Cancel this order? Any points you used will be returned.')) return;
    try { await api(`/orders/${id}/cancel`, { method: 'PATCH', token }); load(); } catch (e) { setErr(e.message); }
  }

  if (!orders) return <p className="muted">{err || 'Loading…'}</p>;
  return (
    <>
      <h1>My orders</h1>
      {err && <p className="error">{err}</p>}
      {!orders.length && <p>No orders yet.</p>}
      {orders.map((o) => (
        <div className="card" key={o._id}>
          <div className="row">
            <strong className="grow">Order #{o._id.slice(-6)}</strong>
            <span className={`badge ${o.status}`}>{o.status}</span>
          </div>
          <p className="muted small">{new Date(o.createdAt).toLocaleString('en-IN')}</p>
          {o.items.map((i) => <div className="row small" key={i.product}><span className="grow">{i.name} × {i.qty}</span><span>{rupees(i.pricePaise * i.qty)}</span></div>)}
          {o.pointsRedeemed > 0 && <div className="row small good"><span className="grow">Used {o.pointsRedeemed} points</span><span>−{rupees(o.discountPaise)}</span></div>}
          <div className="row total"><span className="grow">Paid</span><span>{rupees(o.totalPaise)}</span></div>
          {o.status === 'delivered' && <p className="earn">Earned {o.pointsEarned} points on this order 🎉</p>}
          {o.status === 'placed' && <p className="muted small">You'll earn points once the order is delivered.</p>}
          {o.status === 'placed' && <button className="btn ghost" onClick={() => cancel(o._id)}>Cancel order</button>}
        </div>
      ))}
    </>
  );
}
