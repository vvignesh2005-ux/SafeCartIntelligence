import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Search,
  Store,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  FileText,
  Star,
  ArrowRight,
  ShieldCheck,
  ThumbsUp,
  ThumbsDown,
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
  const [aiGenerated, setAiGenerated] = useState(false);
  const [popularSellers, setPopularSellers] = useState([
    'Cocoblu Retail',
    'Clicktech Retail',
    'VRP Telematics',
    'ExampleStore',
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [recentSearches, setRecentSearches] = useState(() =>
    getRecentSearches('sci_recent_sellers')
  );

  // Interactive 5-Star Seller & Service Feedback State
  const [sellerStars, setSellerStars] = useState(5);
  const [serviceStars, setServiceStars] = useState(5);
  const [buyerComment, setBuyerComment] = useState('');
  const [serviceNote, setServiceNote] = useState('');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState('');

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/sellers`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.sellers?.length) {
          setPopularSellers(data.sellers.slice(0, 6).map((s) => s.name));
        }
      })
      .catch(() => {});
  }, []);

  async function fetchSeller(rawTerm) {
    const clean = normalizeQuery(rawTerm);
    if (!clean) {
      setError('Enter a seller name or store handle to inspect.');
      return;
    }

    setLoading(true);
    setError('');
    setFeedbackSuccess('');
    setSearchParams({ q: clean });

    const updated = saveRecentSearch(clean, 'sci_recent_sellers');
    setRecentSearches(updated);

    try {
      const res = await fetch(
        `${API_BASE_URL}/api/sellers/${encodeURIComponent(clean)}`
      );
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Could not fetch seller record.');
      }

      const record = data?.seller || data;
      setSeller(record);
      setAiGenerated(Boolean(data?.aiGenerated || record?.aiGenerated));
    } catch (err) {
      setSeller(null);
      setError(
        err.message ||
          'Could not reach Safe Cart backend. Check that your server is running.'
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

  async function handleFeedbackSubmit(e) {
    e.preventDefault();
    if (!seller?._id) return;

    setSubmittingFeedback(true);
    setError('');
    setFeedbackSuccess('');

    try {
      const res = await fetch(
        `${API_BASE_URL}/api/sellers/${seller._id}/feedback`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sellerRating: sellerStars,
            serviceRating: serviceStars,
            comment: buyerComment,
            serviceFeedback: serviceNote,
          }),
        }
      );

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save your feedback.');
      }

      setSeller(data.seller);
      setAiGenerated(false);
      setBuyerComment('');
      setServiceNote('');
      setFeedbackSuccess(
        `Thank you! Your ${sellerStars}/5 seller rating and ${serviceStars}/5 service feedback are saved to MongoDB.`
      );
    } catch (err) {
      setError(err.message || 'Could not save feedback.');
    } finally {
      setSubmittingFeedback(false);
    }
  }

  const displayName = seller?.name || '';
  const displayRating = seller?.rating ?? 4.0;
  const displayReports = seller?.evidenceCount ?? 1;
  const displayFulfillment = seller?.fulfillmentRate ?? 88;
  const displayRefundDays = seller?.avgRefundDays ?? 5;
  const displayPlatform =
    seller?.platformType || seller?.platform || 'Online Storefront';
  const evidenceNotes = Array.isArray(seller?.notes) ? seller.notes : [];

  return (
    <div>
      {/* Page Header */}
      <section className="page-header">
        <div className="eyebrow">
          <Store size={15} />
          AI + Crowd-Verified Seller Intelligence
        </div>
        <h1 className="page-title">
          Inspect any <span className="gradient-text">seller's real record</span>
        </h1>
        <p className="page-subtitle">
          Search any marketplace merchant or online store. Safe Cart loads
          verified buyer evidence from MongoDB—or uses Gemini AI to synthesize
          online reviews and saves the record for future shoppers.
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
                  placeholder="Enter any seller name (e.g., Cocoblu Retail, VRP Telematics, or any store)..."
                  aria-label="Seller name"
                />
              </div>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? 'Analyzing...' : 'Inspect Seller'}
              </button>
            </div>
          </div>

          <div className="chip-row">
            <span className="chip-label">Top & Common Sellers:</span>
            {popularSellers.map((name) => (
              <button
                key={name}
                type="button"
                className="chip"
                onClick={() => {
                  setQuery(name);
                  fetchSeller(name);
                }}
              >
                <Store size={13} /> {name}
              </button>
            ))}

            {recentSearches
              .filter((t) => !popularSellers.includes(t))
              .slice(0, 3)
              .map((term) => (
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

      {/* Loading State */}
      {loading && (
        <div className="state-card" role="status" aria-live="polite">
          <div className="spinner" />
          <h3>Checking database & synthesizing online reviews...</h3>
          <p>
            If this seller is new, Gemini AI is analyzing public buyer feedback
            and storing the profile in MongoDB.
          </p>
        </div>
      )}

      {/* Empty State (Before First Search) */}
      {!loading && !seller && !error && (
        <div className="state-card">
          <Store
            size={36}
            color="var(--indigo)"
            style={{ marginBottom: '12px' }}
          />
          <h2 style={{ fontSize: '1.3rem', marginBottom: '8px' }}>
            Pick a common seller above or search any new store
          </h2>
          <p style={{ maxWidth: '54ch', margin: '0 auto' }}>
            Every new seller you search is researched via Gemini AI, stored in
            MongoDB, and refined by real shopper star ratings.
          </p>
        </div>
      )}

      {/* Seller Evidence Result Card */}
      {!loading && seller && (
        <>
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
                  {aiGenerated ? (
                    <span className="badge badge-info">
                      <Sparkles size={14} /> AI Online Review Summary (Saved)
                    </span>
                  ) : (
                    <span className="badge badge-verified">
                      <ShieldCheck size={14} /> Verified Database Record
                    </span>
                  )}
                  <span className="badge badge-info">{displayPlatform}</span>
                </div>
                <StarRating
                  rating={displayRating}
                  count={displayReports}
                  size={20}
                />
                {seller.productsSold && (
                  <p
                    style={{
                      marginTop: '8px',
                      fontSize: '0.9rem',
                      color: 'var(--ink-soft)',
                    }}
                  >
                    <strong>Categories:</strong> {seller.productsSold}
                  </p>
                )}
              </div>

              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <Link
                  to={`/complaint?seller=${encodeURIComponent(
                    displayName
                  )}&platform=${encodeURIComponent(displayPlatform)}`}
                  className="btn btn-secondary btn-sm"
                >
                  Draft Complaint <ArrowRight size={15} />
                </Link>
              </div>
            </div>

            {/* Evidence Telemetry Metrics */}
            <div className="metrics-grid" style={{ marginTop: '20px' }}>
              <div className="metric-box">
                <div className="metric-label">Fulfillment Reliability</div>
                <div className="metric-value">{displayFulfillment}%</div>
                <div style={{ fontSize: '0.82rem', color: 'var(--ink-muted)' }}>
                  Orders delivered as described
                </div>
              </div>

              <div className="metric-box">
                <div className="metric-label">Average Refund Speed</div>
                <div className="metric-value">{displayRefundDays} days</div>
                <div style={{ fontSize: '0.82rem', color: 'var(--ink-muted)' }}>
                  From return pickup to credit
                </div>
              </div>

              <div className="metric-box">
                <div className="metric-label">Reviews & Logs Stored</div>
                <div className="metric-value">{displayReports}</div>
                <div style={{ fontSize: '0.82rem', color: 'var(--ink-muted)' }}>
                  Updated live with shopper ratings
                </div>
              </div>
            </div>

            {/* Positive & Negative Online Review Highlights */}
            {(seller.positiveReview || seller.negativeReview) && (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                  gap: '12px',
                  marginTop: '18px',
                }}
              >
                {seller.positiveReview && (
                  <div
                    style={{
                      padding: '14px',
                      borderRadius: '12px',
                      background: 'rgba(16, 185, 129, 0.08)',
                      border: '1px solid rgba(16, 185, 129, 0.25)',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        color: '#047857',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        marginBottom: '4px',
                      }}
                    >
                      <ThumbsUp size={14} /> COMMON POSITIVE FEEDBACK
                    </div>
                    <p style={{ fontSize: '0.92rem', color: 'var(--ink-soft)' }}>
                      {seller.positiveReview}
                    </p>
                  </div>
                )}

                {seller.negativeReview && (
                  <div
                    style={{
                      padding: '14px',
                      borderRadius: '12px',
                      background: 'rgba(245, 158, 11, 0.08)',
                      border: '1px solid rgba(245, 158, 11, 0.25)',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        color: '#B45309',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        marginBottom: '4px',
                      }}
                    >
                      <ThumbsDown size={14} /> WATCH-OUTS & DISPUTE NOTES
                    </div>
                    <p style={{ fontSize: '0.92rem', color: 'var(--ink-soft)' }}>
                      {seller.negativeReview}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Documented Buyer & AI Observations */}
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
                Stored Evidence & Buyer Reviews ({evidenceNotes.length})
              </h3>

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
            </div>
          </section>

          {/* Interactive 5-Star Seller Rating & Safe Cart Service Feedback Card */}
          <section className="card-elevated" aria-label="Rate seller and service">
            <h2 style={{ fontSize: '1.3rem', marginBottom: '6px' }}>
              Rate {displayName} & Share Quick Service Feedback
            </h2>
            <p
              style={{
                color: 'var(--ink-soft)',
                fontSize: '0.94rem',
                marginBottom: '16px',
              }}
            >
              Your star rating updates {displayName}'s live score in MongoDB
              for future buyers, and helps improve Safe Cart Intelligence.
            </p>

            {feedbackSuccess && (
              <div
                className="badge-verified"
                role="status"
                style={{
                  padding: '12px 16px',
                  borderRadius: '12px',
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <CheckCircle2 size={18} />
                <span>{feedbackSuccess}</span>
              </div>
            )}

            <form onSubmit={handleFeedbackSubmit} className="form-grid">
              {/* Seller Star Rating (1-5) */}
              <div className="form-group">
                <label className="form-label">
                  Rate {displayName} (1 to 5 Stars) *
                </label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  {[1, 2, 3, 4, 5].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setSellerStars(num)}
                      className="btn btn-outline btn-sm"
                      style={{
                        borderColor:
                          sellerStars >= num ? '#F59E0B' : 'var(--border)',
                        background:
                          sellerStars >= num
                            ? 'rgba(245, 158, 11, 0.12)'
                            : 'transparent',
                        color: sellerStars >= num ? '#B45309' : 'var(--ink-soft)',
                      }}
                      aria-label={`Rate seller ${num} out of 5 stars`}
                    >
                      <Star
                        size={16}
                        fill={sellerStars >= num ? '#F59E0B' : 'none'}
                        color={sellerStars >= num ? '#F59E0B' : 'currentColor'}
                      />
                      {num}
                    </button>
                  ))}
                </div>
              </div>

              {/* Safe Cart Service Star Rating (1-5) */}
              <div className="form-group">
                <label className="form-label">
                  How was Safe Cart's evidence service? (1 to 5 Stars)
                </label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  {[1, 2, 3, 4, 5].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setServiceStars(num)}
                      className="btn btn-outline btn-sm"
                      style={{
                        borderColor:
                          serviceStars >= num ? 'var(--indigo)' : 'var(--border)',
                        background:
                          serviceStars >= num
                            ? 'rgba(45, 63, 224, 0.1)'
                            : 'transparent',
                        color:
                          serviceStars >= num ? 'var(--indigo)' : 'var(--ink-soft)',
                      }}
                      aria-label={`Rate Safe Cart service ${num} out of 5 stars`}
                    >
                      <Star
                        size={16}
                        fill={serviceStars >= num ? 'var(--indigo)' : 'none'}
                        color={
                          serviceStars >= num ? 'var(--indigo)' : 'currentColor'
                        }
                      />
                      {num}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="buyer-seller-review">
                  Your Review of {displayName} (Stored for next buyers)
                </label>
                <textarea
                  id="buyer-seller-review"
                  className="form-control"
                  value={buyerComment}
                  onChange={(e) => setBuyerComment(e.target.value)}
                  placeholder="e.g., Delivered sealed laptop on time with valid GST invoice..."
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="safe-cart-service-note">
                  How is Safe Cart's service? (Optional suggestion)
                </label>
                <textarea
                  id="safe-cart-service-note"
                  className="form-control"
                  value={serviceNote}
                  onChange={(e) => setServiceNote(e.target.value)}
                  placeholder="e.g., Very helpful instant review summary and clear refund timeline..."
                />
              </div>

              <div className="form-group full-width">
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submittingFeedback}
                >
                  <CheckCircle2 size={17} />
                  {submittingFeedback
                    ? 'Saving Rating & Feedback...'
                    : 'Submit Seller Rating & Feedback'}
                </button>
              </div>
            </form>
          </section>
        </>
      )}
    </div>
  );
}