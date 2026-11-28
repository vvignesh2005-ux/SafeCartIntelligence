import { useState } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function FeeScanner() {
  const [platform, setPlatform] = useState('');
  const [checkoutText, setCheckoutText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleScan = async (e) => {
    e.preventDefault();
    if (!checkoutText.trim()) return;
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const res = await fetch(`${API_BASE}/api/problems/analyze-checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform: platform.trim() || 'Online Store',
          checkoutText,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Checkout scan failed');
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section style={{ maxWidth: '820px', margin: '2rem auto', padding: '0 1rem' }}>
      <span className="badge">Pre-Purchase Protection</span>
      <h1>Scan checkout text for hidden fees & dark patterns</h1>
      <p>
        Paste your cart summary, fee breakdown, or offer terms before paying to detect drip pricing,
        forced add-ons, and unfair return traps.
      </p>

      <form
        onSubmit={handleScan}
        style={{
          background: '#ffffff',
          padding: '1.5rem',
          borderRadius: '16px',
          border: '1px solid #e5e7eb',
          marginTop: '1.25rem',
          boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
        }}
      >
        <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem' }}>
          Platform or Store Name
        </label>
        <input
          type="text"
          placeholder="e.g., QuickMart, FlightApp, FashionStore"
          value={platform}
          onChange={(e) => setPlatform(e.target.value)}
          style={{
            width: '100%',
            padding: '0.75rem',
            marginBottom: '1rem',
            borderRadius: '10px',
            border: '1px solid #d1d5db',
          }}
        />

        <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem' }}>
          Checkout Summary or Offer Terms *
        </label>
        <textarea
          rows={5}
          required
          placeholder="Paste cart lines here (e.g., Item ₹999 + Platform Fee ₹49 + Priority Handling ₹79 + Auto-added Protection Plan ₹149)..."
          value={checkoutText}
          onChange={(e) => setCheckoutText(e.target.value)}
          style={{
            width: '100%',
            padding: '0.75rem',
            marginBottom: '1rem',
            borderRadius: '10px',
            border: '1px solid #d1d5db',
          }}
        />

        <button
          type="submit"
          disabled={loading}
          style={{
            background: '#3b49df',
            color: '#ffffff',
            padding: '0.75rem 1.5rem',
            borderRadius: '10px',
            border: 'none',
            fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? 'Inspecting Checkout Terms...' : 'Scan for Hidden Fees'}
        </button>
      </form>

      {error && (
        <p style={{ color: '#dc2626', marginTop: '1rem', fontWeight: 500 }}>{error}</p>
      )}

      {result && (
        <div
          style={{
            background: '#ffffff',
            padding: '1.5rem',
            borderRadius: '16px',
            border: '1px solid #e5e7eb',
            marginTop: '1.5rem',
            boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
          }}
        >
          <h3 style={{ marginBottom: '0.75rem' }}>
            Inspection Result — Signal Level: {result.riskLevel}
          </h3>
          <ul style={{ paddingLeft: '1.25rem', lineHeight: 1.6 }}>
            {result.flags?.map((flag, idx) => (
              <li key={idx} style={{ marginBottom: '0.75rem' }}>
                <strong>{flag.type}:</strong> {flag.detail}{' '}
                <span style={{ color: '#6b7280', fontSize: '0.9rem' }}>
                  ({flag.ruleReference})
                </span>
              </li>
            ))}
          </ul>
          <div
            style={{
              marginTop: '1rem',
              padding: '0.85rem 1rem',
              background: '#f3f4f6',
              borderRadius: '10px',
            }}
          >
            <strong>Before Paying:</strong> {result.safestPaymentTip}
          </div>
        </div>
      )}
    </section>
  );
}