import { useState } from 'react';
import { supabase } from './supabaseClient'; // Make sure you have this file set up

export default function Login() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    // Uses Magic Link (No passwords needed)
    const { error } = await supabase.auth.signInWithOtp({ email });
    if (error) {
      alert(error.message);
    } else {
      alert('Check your email for the login link!');
    }
    setLoading(false);
  };

  return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#09090b', color: 'white' }}>
      <div style={{ width: '350px', padding: '2rem', border: '1px solid #27272a', borderRadius: '12px', background: '#18181b' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '1.5rem', color: '#fff' }}>Welcome to Refactorly</h2>
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ padding: '12px', background: '#09090b', border: '1px solid #333', color: 'white', borderRadius: '6px' }}
            required
          />
          <button disabled={loading} style={{ padding: '12px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
            {loading ? 'Sending...' : 'Send Login Link'}
          </button>
        </form>
      </div>
    </div>
  );
}
