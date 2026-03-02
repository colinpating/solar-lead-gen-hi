"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function AdminLoginForm() {
  const router = useRouter();
  const [token, setToken] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);

    const response = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token })
    });

    if (!response.ok) {
      setError('Invalid token');
      setPending(false);
      return;
    }

    router.push('/admin/leads');
    router.refresh();
  }

  return (
    <form className="admin-login" onSubmit={onSubmit}>
      <h1>Admin Login</h1>
      <label>
        Access token
        <input type="password" value={token} onChange={(e) => setToken(e.target.value)} required />
      </label>
      {error ? <p className="error">{error}</p> : null}
      <button type="submit" disabled={pending}>
        {pending ? 'Signing in...' : 'Sign in'}
      </button>
    </form>
  );
}
