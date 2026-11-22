import { useEffect, useState } from 'react';
import { api, rupees } from '../api.js';
import { useCart } from '../context.jsx';

export default function Shop() {
  const [products, setProducts] = useState([]);
  const [rules, setRules] = useState(null);
  const [err, setErr] = useState('');
  const { add } = useCart();

  useEffect(() => {
    Promise.all([api('/products'), api('/rewards/settings')])
      .then(([p, r]) => { setProducts(p); setRules(r); })
      .catch((e) => setErr(e.message));
  }, []);

  if (err) return <p className="error">{err}</p>;
  return (
    <>
      <h1>Shop</h1>
      {rules && <p className="muted">Earn {rules.earnPer100Rupees} points per ₹100 spent · 1 point = {rupees(rules.redeemValuePaise)}</p>}
      <div className="grid">
        {products.map((p) => {
          const pts = rules ? Math.floor((p.pricePaise * rules.earnPer100Rupees) / 10000) : 0;
          return (
            <div className="card product" key={p._id}>
              <div className="emoji">{p.emoji}</div>
              <h3>{p.name}</h3>
              <p className="muted small">{p.description}</p>
              <p className="price">{rupees(p.pricePaise)}</p>
              {pts > 0 && <p className="earn">Earn {pts} points</p>}
              <button className="btn" onClick={() => add(p)}>Add to cart</button>
            </div>
          );
        })}
      </div>
    </>
  );
}
