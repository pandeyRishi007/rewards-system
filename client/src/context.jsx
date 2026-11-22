import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { api } from './api.js';

const AuthCtx = createContext(null);
const CartCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);
export const useCart = () => useContext(CartCtx);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(!!localStorage.getItem('token'));

  useEffect(() => {
    if (!token) { setUser(null); setLoading(false); return; }
    api('/auth/me', { token })
      .then((r) => setUser(r.user))
      .catch(() => { localStorage.removeItem('token'); setToken(null); })
      .finally(() => setLoading(false));
  }, [token]);

  const finish = (r) => { localStorage.setItem('token', r.token); setToken(r.token); setUser(r.user); };
  const value = useMemo(() => ({
    token, user, loading,
    login: async (email, password) => finish(await api('/auth/login', { method: 'POST', body: { email, password } })),
    register: async (name, email, password) => finish(await api('/auth/register', { method: 'POST', body: { name, email, password } })),
    logout: () => { localStorage.removeItem('token'); setToken(null); setUser(null); },
  }), [token, user, loading]);

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => JSON.parse(localStorage.getItem('cart') || '[]'));
  useEffect(() => localStorage.setItem('cart', JSON.stringify(items)), [items]);

  const add = useCallback((product) => setItems((cur) => {
    const found = cur.find((i) => i.product._id === product._id);
    return found ? cur.map((i) => (i === found ? { ...i, qty: Math.min(99, i.qty + 1) } : i)) : [...cur, { product, qty: 1 }];
  }), []);
  const setQty = useCallback((id, qty) => setItems((cur) => (qty < 1 ? cur.filter((i) => i.product._id !== id) : cur.map((i) => (i.product._id === id ? { ...i, qty: Math.min(99, qty) } : i)))), []);
  const clear = useCallback(() => setItems([]), []);

  const value = useMemo(() => ({
    items, add, setQty, clear,
    count: items.reduce((n, i) => n + i.qty, 0),
    subtotalPaise: items.reduce((n, i) => n + i.qty * i.product.pricePaise, 0),
    payload: items.map((i) => ({ productId: i.product._id, qty: i.qty })),
  }), [items, add, setQty, clear]);

  return <CartCtx.Provider value={value}>{children}</CartCtx.Provider>;
}
