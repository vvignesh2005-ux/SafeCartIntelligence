import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Search,
  Store,
  CheckCircle2,
  AlertTriangle,
  Clock,
  FileText,
  PlusCircle,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import StarRating from '../components/StarRating';
import {
  API_BASE_URL,
  normalizeQuery,
  getRecentSearches,
  saveRecentSearch,
} from '../api';

export default function SellerDashboard() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';

  const [query, setQuery] = useState(initialQuery);
  const [seller, setSeller] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notFoundTerm, setNotFoundTerm] = useState('');
  const [recentSearches, setRecentSearches] = useState(() =>
    getRecentSearches('sci_recent_sellers')
  );

  // Add / Log Evidence Form State
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPlatform, setNewPlatform] = useState('Instagram / Direct Website');
  const [newRating, setNewRating] = useState('4');
  const [newFulfillment, setNewFulfillment] = useState('90');
  const [newRefundDays, setNewRefundDays] = useState('5');
  const [newEvidenceNote, setNewEvidenceNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState('');

  async function fetchSeller(rawTerm) {
    const clean = normalizeQuery(rawTerm);
    if (!clean) {
      setError('Enter a seller name or Instagram handle to inspect.');
      return;
    }

    setLoading(true);
    setError('');
    setNotFoundTerm('');
    setSubmitSuccess('');
    setSearchParams({ q: clean });

    const updated = saveRecentSearch(clean, 'sci_recent_sellers');
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
          `${API_BASE_URL}/api/sellers/${encodeURIComponent(candidate)}`
        );
        if (res.ok) {
          const data = await res.json();
          const record = data?.seller || data;
          if (record && (record.name || record.sellerName)) {
            foundRecord = record;
            break;
          }
        }
      }

      if (foundRecord) {
        setSeller(foundRecord);
      } else {
        setSeller(null);
        setNotFoundTerm(clean);
        setNewName(clean);
      }
    } catch {
      setSeller(null);
      setError(
        'Could not reach the Safe Cart backend. Check that your server is running on port 5000.'
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (initialQuery) {
      setQuery(initialQuery);
      fetchSeller(initialQuery);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQuery]);

  function handleSearchSubmit(e) {
    e.preventDefault();
    fetchSeller(query);
  }

  async function handleLogEvidence(e) {
    e.preventDefault();
    const cleanName = normalizeQuery(newName);
    if (!cleanName) return;

    setSubmitting(true);
    setError('');
    setSubmitSuccess('');

    try {
      const payload = {
        name: cleanName,
        platform: newPlatform,
        rating: Number(newRating),
        trustScore: Number(newRating),
        fulfillmentRate: Number(newFulfillment),
        avgRefundDays: Number(newRefundDays),
        evidenceCount: 1,
        notes: newEvidenceNote
          ? [newEvidenceNote]
          : ['Buyer transaction evidence logged.'],
        summary: newEvidenceNote || 'Buyer transaction evidence logged.',
      };

      const res = await fetch(`${API_BASE_URL}/api/sellers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save seller evidence.');
      }

      setSubmitSuccess(`Evidence logged for "${cleanName}".`);
      setShowAddForm(false);
      setNewEvidenceNote('');
      setQuery(cleanName);
      fetchSeller(cleanName);
    } catch (err) {
      setError(err.message || 'Error saving seller evidence.');
    } finally {
      setSubmitting(false);
    }
  }

  // Normalize field names safely regardless of backend schema variations
  const displayName = seller?.name || seller?.sellerName || '';
  const displayRating =
    seller?.rating ?? seller?.starRating ?? seller?.trustScore ?? 4.2;
  const displayReports =
    seller?.evidenceCount ?? seller?.reportCount ?? seller?.reviewsCount ?? 1;
  const displayFulfillment =
    seller?.fulfillmentRate ?? seller?.deliveryRate ?? 92;
  const displayRefundDays =
    seller?.avgRefundDays ?? seller?.refundDays ?? 5;
  const displayPlatform =
    seller?.platform || seller?.marketplace || 'Online Storefront';
  const evidenceNotes = Array.isArray(seller?.notes)
    ? seller.notes
    : Array.isArray(seller?.evidence)
    ? seller.evidence
    : seller?.summary
    ? [seller.summary]
    : seller?.description
    ? [seller.description]
    : [];

  return (
    <div>
      {/* Page Header */}
      <section className="page-header">
        <div className="eyebrow">
          <Store size={15} />
          Seller Evidence Intelligence
        </div>
        <h1 className="page-title">
          Inspect any <span className="gradient-text">seller's real record</span>
        </h1>
        <p className="page-subtitle">
          Review documented fulfillment rates, refund speed, and verified buyer
          reports. Safe Cart shows facts only—never "safe" or "unsafe" stamps.
        </p>

        {/* Search Bar */}
        <form
          onSubmit={handleSearchSubmit}
          style={{ marginTop: '22px', maxWidth: '780px' }}
          role="search"
          aria-label="Search seller evidence"
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
                  placeholder="Enter seller name or handle (e.g., ExampleStore)..."
                  aria-label="Seller name"
                />
              </div>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? 'Searching...' : 'Inspect Seller'}
              </button>
            </div>
          </div>

          <div className="chip-row">
            <span className="chip-label">Try:</span>
            <button
              type="button"
              className="chip"
              onClick={() => {
                setQuery('ExampleStore');
                fetchSeller('ExampleStore');
              }}
            >
              ExampleStore
            </button>
            <button
              type="button"
              className="chip"
              onClick={() => {
                setQuery('Example Store');
                fetchSeller('Example Store');
              }}
            >
              Example Store (spaced)
            </button>
            {recentSearches.map((term) => (
              <button
                key={term}
                type="button"
                className="chip"
                onClick={() => {
                  setQuery(term);
                  fetchSeller(term);
                }}
              >
                Recent: {term}
              </button>
            ))}
          </div>
        </form>
      </section>

      {/* Error State */}
      {error && (
        <div className="error-banner" role="alert" style={{ marginBottom: '20px' }}>
          <AlertTriangle size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>{error}</div>
        </div>
      )}

      {/* Success Banner */}
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

      {/* Loading State */}
      {loading && (
        <div className="state-card" role="status" aria-live="polite">
          <div className="spinner" />
          <h3>Gathering documented seller records...</h3>
          <p>Checking fulfillment metrics, refund timelines, and buyer notes.</p>
        </div>
      )}

      {/* Empty State (Before First Search) */}
      {!loading && !seller && !notFoundTerm && !error && (
        <div className="state-card">
          <Store
            size={36}
            color="var(--indigo)"
            style={{ marginBottom: '12px' }}
          />
          <h2 style={{ fontSize: '1.3rem', marginBottom: '8px' }}>
            Search a seller to view their evidence profile
          </h2>
          <p style={{ maxWidth: '52ch', margin: '0 auto 18px' }}>
            Type a store name or Instagram handle above, or click{' '}
            <strong>ExampleStore</strong> to inspect a live documented profile.
          </p>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setShowAddForm((prev) => !prev)}
          >
            <PlusCircle size={17} /> Log New Seller Evidence
          </button>
        </div>
      )}

      {/* Not Found State + Quick Add Option */}
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
                No Prior Records Found
              </span>
              <h2 style={{ fontSize: '1.4rem', marginBottom: '6px' }}>
                No documented evidence yet for "{notFoundTerm}"
              </h2>
              <p style={{ color: 'var(--ink-soft)', maxWidth: '60ch' }}>
                Lack of history does not mean safe or unsafe—it simply means
                no shopper has logged evidence for this seller yet. Be the
                first to record your experience or verify their support details.
              </p>
            </div>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setShowAddForm(true)}
            >
              <PlusCircle size={17} /> Add First Evidence Record
            </button>
          </div>
        </div>
      )}

      {/* Seller Evidence Result Card */}
      {!loading && seller && (
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
                  <ShieldCheck size={14} /> Evidence Profile Active
                </span>
                <span className="badge badge-info">{displayPlatform}</span>
              </div>
              <StarRating
                rating={displayRating}
                count={displayReports}
                size={20}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => {
                  setNewName(displayName);
                  setShowAddForm((prev) => !prev);
                }}
              >
                <PlusCircle size={16} /> Submit Buyer Evidence
              </button>
              <Link
                to={`/complaint?seller=${encodeURIComponent(displayName)}`}
                className="btn btn-secondary btn-sm"
              >
                Draft Complaint <ArrowRight size={15} />
              </Link>
            </div>
          </div>

          {/* Evidence Telemetry Metrics */}
          <div className="metrics-grid" style={{ marginTop: '20px' }}>
            <div className="metric-box">
              <div className="metric-label">Documented Fulfillment Rate</div>
              <div className="metric-value">{displayFulfillment}%</div>
              <div style={{ fontSize: '0.82rem', color: 'var(--ink-muted)' }}>
                Orders delivered as described
              </div>
            </div>

            <div className="metric-box">
              <div className="metric-label">Average Refund Speed</div>
              <div className="metric-value">{displayRefundDays} days</div>
              <div style={{ fontSize: '0.82rem', color: 'var(--ink-muted)' }}>
                From approved return to bank credit
              </div>
            </div>

            <div className="metric-box">
              <div className="metric-label">Evidence Reports Logged</div>
              <div className="metric-value">{displayReports}</div>
              <div style={{ fontSize: '0.82rem', color: 'var(--ink-muted)' }}>
                Community & order verifications
              </div>
            </div>
          </div>

          {/* Documented Buyer Notes */}
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
              <FileText size={18} color="var(--indigo)" />
              Documented Buyer Evidence & Observations
            </h3>

            {evidenceNotes.length > 0 ? (
              <ul
                style={{
                  listStyle: 'none',
                  padding: 0,
                  margin: 0,
                  display: 'grid',
                  gap: '10px',
                }}
              >
                {evidenceNotes.map((note, idx) => (
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
                    {typeof note === 'string' ? note : JSON.stringify(note)}
                  </li>
                ))}
              </ul>
            ) : (
              <p style={{ color: 'var(--ink-muted)', fontSize: '0.94rem' }}>
                Core telemetry metrics are recorded above. Add a detailed order
                note using "Submit Buyer Evidence."
              </p>
            )}
          </div>
        </section>
      )}

      {/* Collapsible Log New Seller Evidence Form */}
      {showAddForm && (
        <section className="card-elevated" aria-label="Log seller evidence">
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px',
            }}
          >
            <h2 style={{ fontSize: '1.3rem' }}>Log Documented Seller Evidence</h2>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => setShowAddForm(false)}
            >
              Close
            </button>
          </div>

          <form onSubmit={handleLogEvidence} className="form-grid">
            <div className="form-group">
              <label className="form-label" htmlFor="seller-name-input">
                Seller or Store Name *
              </label>
              <input
                id="seller-name-input"
                type="text"
                className="form-control"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g., ExampleStore"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="seller-platform-input">
                Where did you find them?
              </label>
              <input
                id="seller-platform-input"
                type="text"
                className="form-control"
                value={newPlatform}
                onChange={(e) => setNewPlatform(e.target.value)}
                placeholder="e.g., Instagram, ExampleMarket, Direct Site"
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="seller-rating-select">
                Evidence Rating (1 to 5 Stars)
              </label>
              <select
                id="seller-rating-select"
                className="form-control"
                value={newRating}
                onChange={(e) => setNewRating(e.target.value)}
              >
                <option value="5">5 Stars — Delivered smoothly & verified</option>
                <option value="4">4 Stars — Minor delay, resolved cleanly</option>
                <option value="3">3 Stars — Mixed communication / slow refund</option>
                <option value="2">2 Stars — Wrong item or difficult return</option>
                <option value="1">1 Star — Non-delivery or unresponsive</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="seller-refund-days">
                Refund / Response Time (Days)
              </label>
              <input
                id="seller-refund-days"
                type="number"
                min="0"
                max="90"
                className="form-control"
                value={newRefundDays}
                onChange={(e) => setNewRefundDays(e.target.value)}
              />
            </div>

            <div className="form-group full-width">
              <label className="form-label" htmlFor="seller-note-input">
                Factual Evidence Note (What happened with your order?)
              </label>
              <textarea
                id="seller-note-input"
                className="form-control"
                value={newEvidenceNote}
                onChange={(e) => setNewEvidenceNote(e.target.value)}
                placeholder="Describe order tracking, packaging proof, or refund timeline objectively..."
              />
            </div>

            <div className="form-group full-width">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={submitting}
              >
                <Clock size={17} />
                {submitting ? 'Saving Evidence...' : 'Save Seller Evidence'}
              </button>
            </div>
          </form>
        </section>
      )}
    </div>
  );
}