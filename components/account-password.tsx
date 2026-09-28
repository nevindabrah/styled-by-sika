'use client';
import { useState } from 'react';

// Lets the braider choose or change her own password after signing in with an email link.
export function AccountPassword({ email }: { email: string }) {
  const [password, setPassword] = useState(''), [confirm, setConfirm] = useState(''), [busy, setBusy] = useState(false), [message, setMessage] = useState('');
  const mismatch = confirm.length > 0 && password !== confirm;
  async function save(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setMessage('');
    try {
      const res = await fetch('/api/auth', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'password', password }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setPassword(''); setConfirm(''); setMessage('Password saved. Next time, sign in with your email and this password.');
    } catch (error) { setMessage((error as Error).message || 'Could not save the password.'); } finally { setBusy(false); }
  }
  return <section className="account-password" aria-labelledby="password-heading">
    <h2 id="password-heading" className="small-heading">Your sign-in</h2>
    <p className="muted">You sign in as <strong>{email}</strong>. Choose a password (at least 10 characters), or change it any time here.</p>
    <form className="editor-card" onSubmit={save}>
      <label className="editor-field"><span>New password</span><input type="password" autoComplete="new-password" minLength={10} required value={password} onChange={e => setPassword(e.target.value)} /></label>
      <label className="editor-field"><span>Type it again</span><input type="password" autoComplete="new-password" minLength={10} required value={confirm} onChange={e => setConfirm(e.target.value)} aria-invalid={mismatch} /></label>
      {mismatch && <p className="field-error">The two passwords don’t match.</p>}
      <button className="button" disabled={busy || password.length < 10 || password !== confirm}>{busy ? 'Saving…' : 'Save password'}</button>
    </form>
    {message && <p className="status-message" role="status">{message}</p>}
  </section>;
}
