import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, rupees } from '../api.js';
import { useAuth, useCart } from '../context.jsx';

export default function Cart() {
  const { items, setQty, clear, payload, subtotalPaise } = useCart();
  const { token, user } = useAuth();
  const nav = useNavigate();
  const [maxQ, setMaxQ] = useState(null); // quote with "use as many points as allowed"
  const [q, setQ] = useState(null); // quote for the points the customer chose
  const [pts, setPts] = useState(0);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const key = JSON.stringify(payload);

  // Cart changed: reset the choice and ask the server what's possible.
  useEffect(() => {
    setPts(0); setQ(null); setMaxQ(null);
    if (!token || !payload.length) return;
    api('/rewards/quote', { method: 'POST', token, body: { items: payload } }).then(setMaxQ).catch((e) => setErr(e.message));
  }, [key, token]); // eslint-disable-line react-hooks/exhaustive-deps

  // Points choice changed: the server recalculates discount, total and points you'll earn.
  useEffect(() => {
    if (!token || !payload.length) return;
    api('/rewards/quote', { method: 'POST', token, body: { items: payload, requested: pts } }).then(setQ).catch((e) => setErr(e.message));
  }, [pts, key, token]); // eslint-disable-line react-hooks/exhaustive-deps

  async function placeOrder() {
    setErr(''); setBusy(true);
    try {
      await api('/orders', { method: 'POST', token, body: { items: payload, pointsToRedeem: pts } });
      clear();
      nav('/orders');
    } catch (e) { setErr(e.message); } finally { setBusy(false); }
  }

  if (!items.length) return <><h1>Your cart</h1><p>Your cart is empty. <Link to="/">Go shopping</Link></p></>;

  const min = maxQ?.minRedeem ?? 0;
  const canRedeem = maxQ && maxQ.allowedPoints >= min && maxQ.allowedPoints > 0;
  const total = q ? q.totalPaise : subtotalPaise;
  const discount = q ? q.discountPaise : 0;

  return (
    <>
      <h1>Your cart</h1>
      <div className="two-col">
        <div className="card">
          {items.map(({ product, qty }) => (
            <div className="row" key={product._id}>
              <span className="emoji sm">{product.emoji}</span>
              <span className="grow">{product.name}<br /><span className="muted small">{rupees(product.pricePaise)} each</span></span>
              <button className="btn ghost" onClick={() => setQty(product._id, qty - 1)}>−</button>
              <span className="qty">{qty}</span>
              <button className="btn ghost" onClick={() => setQty(product._id, qty + 1)}>+</button>
              <strong className="amt">{rupees(product.pricePaise * qty)}</strong>
            </div>
          ))}
        </div>

        <div className="card">
          <h3>Order summary</h3>

          {!user ? (
            <p className="box"><Link to="/login">Log in</Link> to earn and redeem reward points.</p>
          ) : (
            <div className="box">
              <strong>🪙 Reward points</strong>
              {maxQ && <p className="small">You have {maxQ.balance.toLocaleString('en-IN')} points.</p>}
              {canRedeem ? (
                <>
                  <p className="small">You can use up to <b>{maxQ.allowedPoints}</b> points on this cart.</p>
                  <div className="inline">
                    <input type="number" min={min} max={maxQ.allowedPoints} value={pts || ''} placeholder={`${min}+`}
                      onChange={(e) => setPts(Math.min(maxQ.allowedPoints, Math.max(0, Number(e.target.value) || 0)))} />
                    <button className="btn ghost" onClick={() => setPts(maxQ.allowedPoints)}>Use max</button>
                    {pts > 0 && <button className="btn ghost" onClick={() => setPts(0)}>Remove</button>}
                  </div>
                  {pts > 0 && pts < min && <p className="error small">Minimum is {min} points.</p>}
                </>
              ) : (
                maxQ && <p className="muted small">Points can't be used on this cart yet (minimum {min} points; limited by your balance and the cart's max share).</p>
              )}
            </div>
          )}

          <div className="row"><span className="grow">Subtotal</span><span>{rupees(subtotalPaise)}</span></div>
          {discount > 0 && <div className="row good"><span className="grow">Points discount</span><span>−{rupees(discount)}</span></div>}
          <div className="row total"><span className="grow">Total</span><span>{rupees(total)}</span></div>
          {user && q && <p className="earn">You'll earn {q.willEarn} points when this order is delivered.</p>}
          {err && <p className="error">{err}</p>}
          <button className="btn block" disabled={!user || busy || (pts > 0 && pts < min)} onClick={placeOrder}>
            {busy ? 'Placing…' : user ? 'Place order' : 'Log in to order'}
          </button>
        </div>
      </div>
    </>
  );
}
