import { Routes, Route, Navigate, Link, NavLink } from 'react-router-dom';
import { useAuth, useCart } from './context.jsx';
import Shop from './pages/Shop.jsx';
import Cart from './pages/Cart.jsx';
import Orders from './pages/Orders.jsx';
import Rewards from './pages/Rewards.jsx';
import Admin from './pages/Admin.jsx';
import { Login, Register } from './pages/Auth.jsx';

function Protected({ children, admin }) {
  const { user, loading } = useAuth();
  if (loading) return <p className="muted">Loading…</p>;
  if (!user) return <Navigate to="/login" replace />;
  if (admin && user.role !== 'admin') return <Navigate to="/" replace />;
  return children;
}

function Navbar() {
  const { user, logout } = useAuth();
  const { count } = useCart();
  return (
    <header className="nav">
      <Link to="/" className="brand">Supercoins</Link>
      <nav>
        <NavLink to="/">Shop</NavLink>
        <NavLink to="/cart">Cart{count > 0 && <span className="pill">{count}</span>}</NavLink>
        {user && <NavLink to="/orders">Orders</NavLink>}
        {user && <NavLink to="/rewards">My Rewards</NavLink>}
        {user?.role === 'admin' && <NavLink to="/admin">Admin</NavLink>}
        {user ? (
          <button className="link" onClick={logout}>Logout ({user.name.split(' ')[0]})</button>
        ) : (
          <NavLink to="/login">Login</NavLink>
        )}
      </nav>
    </header>
  );
}

function Footer() {
  return (
    <footer className="footer">
      <p>© {new Date().getFullYear()} Supercoins</p>
      <p className="small">Built by Rishikesh Pandey</p>
    </footer>
  );
}

export default function App() {
  return (
    <>
      <Navbar />
      <main className="container">
        <Routes>
          <Route path="/" element={<Shop />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/orders" element={<Protected><Orders /></Protected>} />
          <Route path="/rewards" element={<Protected><Rewards /></Protected>} />
          <Route path="/admin" element={<Protected admin><Admin /></Protected>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
    </>
  );
}