import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context.jsx';

function AuthForm({ mode }) {
  const { login, register } = useAuth();
  const nav = useNavigate();
  const [f, setF] = useState({ name: '', email: '', password: '' });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const isReg = mode === 'register';
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setErr(''); setBusy(true);
    try {
      if (isReg) await register(f.name, f.email, f.password);
      else await login(f.email, f.password);
      nav('/');
    } catch (ex) {
      setErr([ex.message, ...(ex.details || [])].join(' — '));
    } finally { setBusy(false); }
  }

  return (
    <form className="card narrow" onSubmit={submit}>
      <h2>{isReg ? 'Create account' : 'Welcome back'}</h2>
      {isReg && <label>Name<input value={f.name} onChange={set('name')} required minLength={2} /></label>}
      <label>Email<input type="email" value={f.email} onChange={set('email')} required /></label>
      <label>Password<input type="password" value={f.password} onChange={set('password')} required minLength={isReg ? 8 : 1} /></label>
      {err && <p className="error">{err}</p>}
      <button className="btn" disabled={busy}>{busy ? 'Please wait…' : isReg ? 'Sign up' : 'Log in'}</button>
      <p className="muted">
        {isReg ? <>Have an account? <Link to="/login">Log in</Link></> : <>New here? <Link to="/register">Create account</Link></>}
      </p>
      {!isReg && <p className="muted small">Demo: user@demo.com / User@123 · admin@demo.com / Admin@123</p>}
    </form>
  );
}

export const Login = () => <AuthForm mode="login" />;
export const Register = () => <AuthForm mode="register" />;

