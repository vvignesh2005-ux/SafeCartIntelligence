import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Search,
  Globe,
  ShieldCheck,
  AlertTriangle,
  Scale,
  PlusCircle,
  CheckCircle2,
  ArrowRight,
  Lock,
} from 'lucide-react';
import StarRating from '../components/StarRating';
import {
  API_BASE_URL,
  normalizeQuery,
  getRecentSearches,
  saveRecentSearch,
} from '../api';

export default function PlatformAnalysis() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';

  const [query, setQuery] = useState(initialQuery);
  const [platform, setPlatform] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notFoundTerm, setNotFoundTerm] = useState('');
  const [recentSearches, setRecentSearches] = useState(() =>
    getRecentSearches('sci_recent_platforms')
  );

  // Add Platform Evidence Form
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEscrow, setNewEscrow] = useState('Escrow Held Until Delivery');
  const [newGrievanceOfficer, setNewGrievanceOfficer] = useState('Published & Active');
  const [newRating, setNewRating] = useState('4');
  const [newPolicyNotes, setNewPolicyNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState('');

  async function fetchPlatform(rawTerm) {
    const clean = normalizeQuery(rawTerm);
    if (!clean) {
      setError('Enter a platform or marketplace name to analyze.');
      return;
    }

    setLoading(true);
    setError('');
    setNotFoundTerm('');
    setSubmitSuccess('');
    setSearchParams({ q: clean });

    const updated = saveRecentSearch(clean, 'sci_recent_platforms');
    setRecentSearches(updated);

    const compact = clean.replace(/\s+/g, '');
    const candidates =
      compact.toLowerCase() !== clean.toLowerCase()
        ? [clean, compact]
        : [clean];

    try {
      let foundRecord = null;
      for (const candidate of candidates) {
        const res = await fetch(
          `${API_BASE_URL}/api/platforms/${encodeURIComponent(candidate)}`
        );
        if (res.ok) {
          const data = await res.json();
          const record = data?.platform || data;
          if (record && (record.name || record.platformName)) {
            foundRecord = record;
            break;
          }
        }
      }

      if (foundRecord) {
        setPlatform(foundRecord);
      } else {
        setPlatform(null);
        setNotFoundTerm(clean);
        setNewName(clean);
      }
    } catch {
      setPlatform(null);
      setError(
        'Could not connect to the backend server. Make sure your server is running on port 5000.'
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (initialQuery) {
      setQuery(initialQuery);
      fetchPlatform(initialQuery);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQuery]);

  function handleSearchSubmit(e) {
    e.preventDefault();
    fetchPlatform(query);
  }

  async function handleAddPlatform(e) {
    e.preventDefault();
    const cleanName = normalizeQuery(newName);
    if (!cleanName) return;

    setSubmitting(true);
    setError('');
    setSubmitSuccess('');

    try {
      const payload = {
        name: cleanName,
        rating: Number(newRating),
        protectionScore: Number(newRating),
        escrowPolicy: newEscrow,
        grievanceOfficer: newGrievanceOfficer,
        returnWindowDays: 7,
        evidenceCount: 1,
        policies: newPolicyNotes
          ? [newPolicyNotes]
          : ['Platform buyer protection evidence logged.'],
        summary: newPolicyNotes || 'Platform buyer protection evidence logged.',
      };

      const res = await fetch(`${API_BASE_URL}/api/platforms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save platform evidence.');
      }

      setSubmitSuccess(`Platform evidence saved for "${cleanName}".`);
      setShowAddForm(false);
      setNewPolicyNotes('');
      setQuery(cleanName);
      fetchPlatform(cleanName);
    } catch (err) {
      setError(err.message || 'Error saving platform analysis.');
    } finally {
      setSubmitting(false);
    }
  }

  const displayName = platform?.name || platform?.platformName || '';
  const displayRating =
    platform?.rating ?? platform?.protectionScore ?? platform?.starRating ?? 4.1;
  const displayReports =
    platform?.evidenceCount ?? platform?.reportCount ?? 1;
  const displayEscrow =
    platform?.escrowPolicy || platform?.paymentProtection || 'Standard Marketplace Escrow';
  const displayGrievance =
    platform?.grievanceOfficer || platform?.complianceStatus || 'Listed on Platform';
  const displayReturnDays =
    platform?.returnWindowDays ?? platform?.refundWindow ?? 7;

  const policyList = Array.isArray(platform?.policies)
    ? platform.policies
    : Array.isArray(platform?.features)
    ? platform.features
    : platform?.summary
    ? [platform.summary]
    : platform?.description
    ? [platform.description]
    : [];

  return (
    <div>
      {/* Page Header */}
      <section className="page-header">
        <div className="eyebrow">
          <Globe size={15} />
          Platform Policy & Escrow Intelligence
        </div>
        <h1 className="page-title">
          Compare <span className="gradient-text">marketplace protection</span>{' '}
          rules
        </h1>
        <p className="page-subtitle">
          Inspect how a shopping platform holds payments, enforces return
          windows, and discloses grievance officer details under E-Commerce
          Consumer Protection rules.
        </p>

        {/* Search Bar */}
        <form
          onSubmit={handleSearchSubmit}
          style={{ marginTop: '22px', maxWidth: '780px' }}
          role="search"
          aria-label="Search platform policies"
        >
          <div className="search-shell">
            <div className="search-box">
              <div className="search-input-wrap">
                <Search size={20} color="var(--indigo)" aria-hidden="true" />
                <input
                  type="text"
                  className="search-input"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Enter platform name (e.g., ExampleMarket)..."
                  aria-label="Platform name"
                />
              </div>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? 'Analyzing...' : 'Analyze Platform'}
              </button>
            </div>
          </div>

          <div className="chip-row">
            <span className="chip-label">Try:</span>
            <button
              type="button"
              className="chip"
              onClick={() => {
                setQuery('ExampleMarket');
                fetchPlatform('ExampleMarket');
              }}
            >
              ExampleMarket
            </button>
            <button
              type="button"
              className="chip"
              onClick={() => {
                setQuery('Example Market');
                fetchPlatform('Example Market');
              }}
            >
              Example Market (spaced)
            </button>
            {recentSearches.map((term) => (
              <button
                key={term}
                type="button"
                className="chip"
                onClick={() => {
                  setQuery(term);
                  fetchPlatform(term);
                }}
              >
                Recent: {term}
              </button>
            ))}
          </div>
        </form>
      </section>

      {error && (
        <div className="error-banner" role="alert" style={{ marginBottom: '20px' }}>
          <AlertTriangle size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>{error}</div>
        </div>
      )}

      {submitSuccess && (
        <div
          className="badge-verified"
          role="status"
          style={{
            padding: '12px 16px',
            borderRadius: '12px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <CheckCircle2 size={18} />
          <span>{submitSuccess}</span>
        </div>
      )}

      {loading && (
        <div className="state-card" role="status" aria-live="polite">
          <div className="spinner" />
          <h3>Auditing platform protection structure...</h3>
          <p>Checking escrow holding rules, return windows, and grievance disclosures.</p>
        </div>
      )}

      {!loading && !platform && !notFoundTerm && !error && (
        <div className="state-card">
          <Globe
            size={36}
            color="var(--indigo)"
            style={{ marginBottom: '12px' }}
          />
          <h2 style={{ fontSize: '1.3rem', marginBottom: '8px' }}>
            Select or search a platform to inspect buyer protections
          </h2>
          <p style={{ maxWidth: '54ch', margin: '0 auto 18px' }}>
            Click <strong>ExampleMarket</strong> above to inspect a documented
            marketplace profile, or log policy evidence for a new shopping site.
          </p>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setShowAddForm((prev) => !prev)}
          >
            <PlusCircle size={17} /> Log Platform Evidence
          </button>
        </div>
      )}

      {!loading && notFoundTerm && (
        <div className="card-elevated" style={{ marginBottom: '24px' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              flexWrap: 'wrap',
              gap: '16px',
            }}
          >
            <div>
              <span className="badge badge-warn" style={{ marginBottom: '10px' }}>
                Unindexed Platform
              </span>
              <h2 style={{ fontSize: '1.4rem', marginBottom: '6px' }}>
                No platform policy record yet for "{notFoundTerm}"
              </h2>
              <p style={{ color: 'var(--ink-soft)', maxWidth: '60ch' }}>
                We only display documented policy evidence. Add what you
                observed on their checkout and return page to help future
                buyers.
              </p>
            </div>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setShowAddForm(true)}
            >
              <PlusCircle size={17} /> Add Platform Record
            </button>
          </div>
        </div>
      )}

      {!loading && platform && (
        <section className="card-elevated" style={{ marginBottom: '24px' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              flexWrap: 'wrap',
              gap: '16px',
              paddingBottom: '20px',
              borderBottom: '1px solid var(--border)',
            }}
          >
            <div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  flexWrap: 'wrap',
                  marginBottom: '8px',
                }}
              >
                <h2 style={{ fontSize: '1.65rem' }}>{displayName}</h2>
                <span className="badge badge-verified">
                  <ShieldCheck size={14} /> Policy Evidence Audited
                </span>
              </div>
              <StarRating
                rating={displayRating}
                count={displayReports}
                size={20}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <Link
                to={`/returns?platform=${encodeURIComponent(displayName)}`}
                className="btn btn-secondary btn-sm"
              >
                View Return Steps <ArrowRight size={15} />
              </Link>
              <Link
                to={`/support?q=${encodeURIComponent(displayName)}`}
                className="btn btn-outline btn-sm"
              >
                Verified Contacts
              </Link>
            </div>
          </div>

          <div className="metrics-grid" style={{ marginTop: '20px' }}>
            <div className="metric-box">
              <div className="metric-label">Payment & Escrow Structure</div>
              <div className="metric-value" style={{ fontSize: '1.1rem' }}>
                {displayEscrow}
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--ink-muted)' }}>
                How funds are held before delivery
              </div>
            </div>

            <div className="metric-box">
              <div className="metric-label">Grievance Officer Disclosure</div>
              <div className="metric-value" style={{ fontSize: '1.1rem' }}>
                {displayGrievance}
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--ink-muted)' }}>
                48-hr acknowledgement rule check
              </div>
            </div>

            <div className="metric-box">
              <div className="metric-label">Standard Return Window</div>
              <div className="metric-value">{displayReturnDays} Days</div>
              <div style={{ fontSize: '0.82rem', color: 'var(--ink-muted)' }}>
                Documented post-delivery claim period
              </div>
            </div>
          </div>

          <div style={{ marginTop: '22px' }}>
            <h3
              style={{
                fontSize: '1.08rem',
                marginBottom: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <Scale size={18} color="var(--indigo)" />
              Documented Policy & Compliance Findings
            </h3>

            {policyList.length > 0 ? (
              <ul
                style={{
                  listStyle: 'none',
                  padding: 0,
                  margin: 0,
                  display: 'grid',
                  gap: '10px',
                }}
              >
                {policyList.map((item, idx) => (
                  <li
                    key={idx}
                    style={{
                      background: 'var(--mist)',
                      border: '1px solid var(--border)',
                      borderRadius: '12px',
                      padding: '13px 16px',
                      fontSize: '0.95rem',
                      color: 'var(--ink-soft)',
                    }}
                  >
                    {typeof item === 'string' ? item : JSON.stringify(item)}
                  </li>
                ))}
              </ul>
            ) : (
              <p style={{ color: 'var(--ink-muted)', fontSize: '0.94rem' }}>
                Core escrow and grievance metrics are shown above.
              </p>
            )}
          </div>
        </section>
      )}

      {showAddForm && (
        <section className="card-elevated" aria-label="Log platform evidence">
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px',
            }}
          >
            <h2 style={{ fontSize: '1.3rem' }}>Log Platform Policy Evidence</h2>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => setShowAddForm(false)}
            >
              Close
            </button>
          </div>

          <form onSubmit={handleAddPlatform} className="form-grid">
            <div className="form-group">
              <label className="form-label" htmlFor="plat-name-input">
                Platform Name *
              </label>
              <input
                id="plat-name-input"
                type="text"
                className="form-control"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="plat-escrow-select">
                Payment / Escrow Protection
              </label>
              <select
                id="plat-escrow-select"
                className="form-control"
                value={newEscrow}
                onChange={(e) => setNewEscrow(e.target.value)}
              >
                <option value="Escrow Held Until Delivery">
                  Escrow Held Until Delivery
                </option>
                <option value="Direct UPI / No Escrow">
                  Direct UPI / No Escrow
                </option>
                <option value="Cash on Delivery Available">
                  Cash on Delivery Available
                </option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="plat-grievance-select">
                Grievance Officer Info
              </label>
              <select
                id="plat-grievance-select"
                className="form-control"
                value={newGrievanceOfficer}
                onChange={(e) => setNewGrievanceOfficer(e.target.value)}
              >
                <option value="Published & Active">Published & Active</option>
                <option value="Missing / Hard to Find">
                  Missing / Hard to Find
                </option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="plat-rating-select">
                Protection Evidence Rating
              </label>
              <select
                id="plat-rating-select"
                className="form-control"
                value={newRating}
                onChange={(e) => setNewRating(e.target.value)}
              >
                <option value="5">5 Stars — Strong buyer escrow & clear prior-price rules</option>
                <option value="4">4 Stars — Reliable return window & grievance contact</option>
                <option value="3">3 Stars — Partial protection / strict conditions</option>
                <option value="2">2 Stars — High friction returns</option>
                <option value="1">1 Star — No buyer protection / direct transfer only</option>
              </select>
            </div>

            <div className="form-group full-width">
              <label className="form-label" htmlFor="plat-notes-input">
                Factual Policy Notes
              </label>
              <textarea
                id="plat-notes-input"
                className="form-control"
                value={newPolicyNotes}
                onChange={(e) => setNewPolicyNotes(e.target.value)}
                placeholder="Note return window days, open-box delivery availability, or dark-pattern warnings..."
              />
            </div>

            <div className="form-group full-width">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={submitting}
              >
                <Lock size={17} />
                {submitting ? 'Saving Platform Data...' : 'Save Platform Evidence'}
              </button>
            </div>
          </form>
        </section>
      )}
    </div>
  );
}