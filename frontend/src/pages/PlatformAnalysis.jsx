import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Search,
  Globe,
  ShieldCheck,
  AlertTriangle,
  Scale,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Star,
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
  const [aiGenerated, setAiGenerated] = useState(false);
  const [popularPlatforms, setPopularPlatforms] = useState([
    'Amazon India',
    'Flipkart',
    'Meesho',
    'Myntra',
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [recentSearches, setRecentSearches] = useState(() =>
    getRecentSearches('sci_recent_platforms')
  );

  // 1-5 Star Platform & Service Feedback State
  const [platformStars, setPlatformStars] = useState(5);
  const [serviceStars, setServiceStars] = useState(5);
  const [platformComment, setPlatformComment] = useState('');
  const [serviceNote, setServiceNote] = useState('');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState('');

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/platforms`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.platforms?.length) {
          setPopularPlatforms(data.platforms.slice(0, 6).map((p) => p.name));
        }
      })
      .catch(() => {});
  }, []);

  async function fetchPlatform(rawTerm) {
    const clean = normalizeQuery(rawTerm);
    if (!clean) {
      setError('Enter a platform or marketplace name to analyze.');
      return;
    }

    setLoading(true);
    setError('');
    setFeedbackSuccess('');
    setSearchParams({ q: clean });

    const updated = saveRecentSearch(clean, 'sci_recent_platforms');
    setRecentSearches(updated);

    try {
      const res = await fetch(
        `${API_BASE_URL}/api/platforms/${encodeURIComponent(clean)}`
      );
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Could not analyze platform.');
      }

      const record = data?.platform || data;
      setPlatform(record);
      setAiGenerated(Boolean(data?.aiGenerated));
    } catch (err) {
      setPlatform(null);
      setError(
        err.message ||
          'Could not connect to the backend server. Make sure your server is running.'
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

  async function handleFeedbackSubmit(e) {
    e.preventDefault();
    if (!platform?._id) return;

    setSubmittingFeedback(true);
    setError('');
    setFeedbackSuccess('');

    try {
      const res = await fetch(
        `${API_BASE_URL}/api/platforms/${platform._id}/feedback`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            platformRating: platformStars,
            serviceRating: serviceStars,
            comment: platformComment,
            serviceFeedback: serviceNote,
          }),
        }
      );

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save platform feedback.');
      }

      setPlatform(data.platform);
      setAiGenerated(false);
      setPlatformComment('');
      setServiceNote('');
      setFeedbackSuccess(
        `Thank you! Your ${platformStars}/5 platform rating and ${serviceStars}/5 service feedback are saved to MongoDB.`
      );
    } catch (err) {
      setError(err.message || 'Error saving platform feedback.');
    } finally {
      setSubmittingFeedback(false);
    }
  }

  const displayName = platform?.name || platform?.platformName || '';
  const r = platform?.ratings || {};
  const ratingValues = [
    r.publicReputation,
    r.customerSatisfaction,
    r.deliveryPerformance,
    r.supportQuality,
    r.returnExperience,
    r.refundSpeed,
  ].filter((v) => typeof v === 'number' && v > 0);

  const displayRating =
    ratingValues.length > 0
      ? Number(
          (
            ratingValues.reduce((sum, val) => sum + val, 0) / ratingValues.length
          ).toFixed(1)
        )
      : platform?.rating ?? 4.1;

  const displayRefundTime =
    platform?.averageRefundTime || '3–5 business days to original payment method';
  const displayReturnScore = r.returnExperience
    ? `${r.returnExperience} / 5`
    : '4.1 / 5';
  const displaySupportScore = r.supportQuality
    ? `${r.supportQuality} / 5`
    : '3.9 / 5';

  const complaintsList = Array.isArray(platform?.commonComplaints)
    ? platform.commonComplaints
    : Array.isArray(platform?.policies)
    ? platform.policies
    : [];

  return (
    <div>
      {/* Page Header */}
      <section className="page-header">
        <div className="eyebrow">
          <Globe size={15} />
          AI + Crowd-Verified Platform Intelligence
        </div>
        <h1 className="page-title">
          Compare <span className="gradient-text">marketplace protection</span>{' '}
          rules
        </h1>
        <p className="page-subtitle">
          Inspect refund turnaround times, dispute patterns, and grievance
          escalation scores across major shopping platforms—powered by MongoDB
          and Gemini AI.
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
                  placeholder="Enter any platform name (e.g., Amazon India, Flipkart, Meesho, Nykaa)..."
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
            <span className="chip-label">Top Platforms:</span>
            {popularPlatforms.map((name) => (
              <button
                key={name}
                type="button"
                className="chip"
                onClick={() => {
                  setQuery(name);
                  fetchPlatform(name);
                }}
              >
                <Globe size={13} /> {name}
              </button>
            ))}

            {recentSearches
              .filter((t) => !popularPlatforms.includes(t))
              .slice(0, 3)
              .map((term) => (
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

      {loading && (
        <div className="state-card" role="status" aria-live="polite">
          <div className="spinner" />
          <h3>Checking database & analyzing platform policies...</h3>
          <p>
            If this platform is new, Gemini AI is summarizing consumer protection
            records and saving them to MongoDB.
          </p>
        </div>
      )}

      {!loading && !platform && !error && (
        <div className="state-card">
          <Globe
            size={36}
            color="var(--indigo)"
            style={{ marginBottom: '12px' }}
          />
          <h2 style={{ fontSize: '1.3rem', marginBottom: '8px' }}>
            Pick a platform above or search any shopping app
          </h2>
          <p style={{ maxWidth: '54ch', margin: '0 auto' }}>
            Every new platform searched is analyzed via Gemini AI, stored in
            MongoDB, and updated with real shopper star ratings.
          </p>
        </div>
      )}

      {!loading && platform && (
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
                      <Sparkles size={14} /> AI Policy Audit (Saved to DB)
                    </span>
                  ) : (
                    <span className="badge badge-verified">
                      <ShieldCheck size={14} /> Verified Database Record
                    </span>
                  )}
                </div>
                <StarRating rating={displayRating} count={6} size={20} />
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

            {/* AI / Policy Summary Banner */}
            {platform.aiSummary && (
              <div
                style={{
                  marginTop: '18px',
                  padding: '14px 16px',
                  borderRadius: '12px',
                  background: 'var(--sky)',
                  border: '1px solid rgba(45, 63, 224, 0.16)',
                  color: 'var(--ink-soft)',
                  fontSize: '0.95rem',
                  lineHeight: '1.6',
                }}
              >
                <strong style={{ color: 'var(--indigo)' }}>
                  Consumer Protection Summary:{' '}
                </strong>
                {platform.aiSummary}
              </div>
            )}

            <div className="metrics-grid" style={{ marginTop: '20px' }}>
              <div className="metric-box">
                <div className="metric-label">Average Refund Speed</div>
                <div className="metric-value" style={{ fontSize: '1.08rem' }}>
                  {displayRefundTime}
                </div>
                <div style={{ fontSize: '0.82rem', color: 'var(--ink-muted)' }}>
                  Documented bank/UPI credit timeline
                </div>
              </div>

              <div className="metric-box">
                <div className="metric-label">Return Experience Score</div>
                <div className="metric-value">{displayReturnScore}</div>
                <div style={{ fontSize: '0.82rem', color: 'var(--ink-muted)' }}>
                  Pickup & replacement reliability
                </div>
              </div>

              <div className="metric-box">
                <div className="metric-label">Support & SLA Quality</div>
                <div className="metric-value">{displaySupportScore}</div>
                <div style={{ fontSize: '0.82rem', color: 'var(--ink-muted)' }}>
                  48-hr ticket & grievance responsiveness
                </div>
              </div>
            </div>

            {/* 6-Pillar Breakdown Bars */}
            {ratingValues.length > 0 && (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                  gap: '12px',
                  marginTop: '20px',
                  padding: '16px',
                  borderRadius: '14px',
                  background: 'var(--mist)',
                  border: '1px solid var(--border)',
                }}
              >
                {[
                  ['Public Reputation', r.publicReputation],
                  ['Customer Satisfaction', r.customerSatisfaction],
                  ['Delivery Performance', r.deliveryPerformance],
                  ['Support Quality', r.supportQuality],
                  ['Return Experience', r.returnExperience],
                  ['Refund Speed', r.refundSpeed],
                ].map(([label, score]) => (
                  <div key={label}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: '0.84rem',
                        marginBottom: '4px',
                      }}
                    >
                      <span style={{ color: 'var(--ink-soft)' }}>{label}</span>
                      <strong>{(Number(score) || 4).toFixed(1)} / 5</strong>
                    </div>
                    <div
                      style={{
                        height: '7px',
                        borderRadius: '999px',
                        background: 'var(--border)',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          width: `${Math.min(100, ((Number(score) || 4) / 5) * 100)}%`,
                          height: '100%',
                          background: 'var(--indigo)',
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Documented Dispute Patterns & User Notes */}
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
                Documented Dispute Patterns & Buyer Observations
              </h3>

              {complaintsList.length > 0 ? (
                <ul
                  style={{
                    listStyle: 'none',
                    padding: 0,
                    margin: 0,
                    display: 'grid',
                    gap: '10px',
                  }}
                >
                  {complaintsList.map((item, idx) => (
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

          {/* Interactive 5-Star Platform Rating & Safe Cart Service Feedback Card */}
          <section className="card-elevated" aria-label="Rate platform and service">
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
              and helps improve Safe Cart Intelligence.
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
              <div className="form-group">
                <label className="form-label">
                  Rate {displayName} (1 to 5 Stars) *
                </label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  {[1, 2, 3, 4, 5].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setPlatformStars(num)}
                      className="btn btn-outline btn-sm"
                      style={{
                        borderColor:
                          platformStars >= num ? '#F59E0B' : 'var(--border)',
                        background:
                          platformStars >= num
                            ? 'rgba(245, 158, 11, 0.12)'
                            : 'transparent',
                        color:
                          platformStars >= num ? '#B45309' : 'var(--ink-soft)',
                      }}
                    >
                      <Star
                        size={16}
                        fill={platformStars >= num ? '#F59E0B' : 'none'}
                        color={platformStars >= num ? '#F59E0B' : 'currentColor'}
                      />
                      {num}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">
                  How was Safe Cart's service? (1 to 5 Stars)
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
                <label className="form-label" htmlFor="platform-buyer-note">
                  Your Experience on {displayName} (Saved to DB)
                </label>
                <textarea
                  id="platform-buyer-note"
                  className="form-control"
                  value={platformComment}
                  onChange={(e) => setPlatformComment(e.target.value)}
                  placeholder="e.g., Open-box delivery worked smoothly and refund credited in 3 days..."
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="platform-service-note">
                  How is Safe Cart's service? (Optional feedback)
                </label>
                <textarea
                  id="platform-service-note"
                  className="form-control"
                  value={serviceNote}
                  onChange={(e) => setServiceNote(e.target.value)}
                  placeholder="e.g., Clear refund breakdown and fast AI summary..."
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
                    : 'Submit Platform Rating & Feedback'}
                </button>
              </div>
            </form>
          </section>
        </>
      )}
    </div>
  );
}