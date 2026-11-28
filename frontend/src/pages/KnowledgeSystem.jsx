import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  CheckCircle2,
  AlertCircle,
  XCircle,
  AlertTriangle,
  ThumbsUp,
  Layers,
  RefreshCw,
  Star,
  ArrowRight,
} from 'lucide-react';
import { API_BASE_URL } from '../api';

const CATEGORIES = [
  'Refund Delayed',
  'Fake or Counterfeit Product',
  'Non-Delivery / Fake Tracking',
  'Return Rejected Unfairly',
  'Wrong or Damaged Item',
  'Order Not Delivered',
  'Seller Blocked / Unresponsive',
];

const FALLBACK_COMMON_CASES = [
  {
    platform: 'Amazon India',
    category: 'Refund Delayed',
    problemText:
      'Return pickup completed 5 days ago, but refund is still not credited to bank account.',
  },
  {
    platform: 'Flipkart',
    category: 'Wrong or Damaged Item',
    problemText:
      'Received a different or damaged product and return request was rejected.',
  },
  {
    platform: 'Instagram Store',
    category: 'Order Not Delivered',
    problemText:
      'Paid via UPI to an Instagram seller who stopped replying and shared no tracking ID.',
  },
];

export default function KnowledgeSystem() {
  const [category, setCategory] = useState('Refund Delayed');
  const [platform, setPlatform] = useState('Amazon India');
  const [problemText, setProblemText] = useState('');
  const [commonCases, setCommonCases] = useState(FALLBACK_COMMON_CASES);

  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [error, setError] = useState('');

  const [solution, setSolution] = useState(null);
  const [sourceType, setSourceType] = useState(''); // 'verified' | 'ai'

  // Feedback + 1-5 Star Service Rating State
  const [outcome, setOutcome] = useState('solved'); // 'solved' | 'partial' | 'failed'
  const [whichStepWorked, setWhichStepWorked] = useState('Step 1');
  const [serviceStars, setServiceStars] = useState(5);
  const [serviceNote, setServiceNote] = useState('');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [feedbackSaved, setFeedbackSaved] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/problems/common`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.problems?.length) {
          setCommonCases(data.problems.slice(0, 5));
        }
      })
      .catch(() => {});
  }, []);

  function applyCommonCase(item) {
    setCategory(item.category || 'Refund Delayed');
    setPlatform(item.platform || 'Amazon India');
    setProblemText(item.problemText || '');
    setError('');
  }

  function normalizeSteps(solObj) {
    if (!solObj || !Array.isArray(solObj.steps)) return [];
    return solObj.steps.map((s) =>
      typeof s === 'string'
        ? s
        : s.instruction || s.description || s.text || s.title || JSON.stringify(s)
    );
  }

  async function handleFindOrGenerateSolution(e) {
    e.preventDefault();
    if (!problemText.trim()) {
      setError('Describe your shopping issue so we can match or generate a solution.');
      return;
    }

    setLoading(true);
    setError('');
    setSolution(null);
    setFeedbackSaved(false);
    setStatusMessage('Searching crowd-verified playbooks & Gemini AI...');

    const cleanPlatform = platform.trim() || 'Online Store';

    try {
      const probRes = await fetch(`${API_BASE_URL}/api/problems`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category,
          platform: cleanPlatform,
          problemText: problemText.trim(),
        }),
      });

      const probData = await probRes.json();
      if (!probRes.ok) {
        throw new Error(probData.error || 'Failed to find or generate solution.');
      }

      if (probData.solution) {
        setSolution(probData.solution);
        const isAi =
          Boolean(probData.aiGenerated) || probData.solution.source === 'ai';
        setSourceType(isAi ? 'ai' : 'verified');
        setWhichStepWorked('Step 1');
        setStatusMessage('');
        return;
      }

      throw new Error('No solution returned from backend.');
    } catch (err) {
      setStatusMessage('');
      setError(
        err.message ||
          'Could not connect to the backend server. Check that your server is running.'
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmitFeedback(e) {
    e.preventDefault();
    if (!solution?._id) return;

    setSubmittingFeedback(true);
    setError('');

    try {
      const res = await fetch(`${API_BASE_URL}/api/problems/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          solutionId: solution._id,
          result: outcome,
          whichStepWorked: outcome === 'failed' ? 'None' : whichStepWorked,
          serviceRating: serviceStars,
          serviceFeedback: serviceNote,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to record feedback.');
      }

      if (data.solution) {
        setSolution(data.solution);
      }
      setServiceNote('');
      setFeedbackSaved(true);
    } catch (err) {
      setError(err.message || 'Could not save feedback.');
    } finally {
      setSubmittingFeedback(false);
    }
  }

  const stepsList = normalizeSteps(solution);
  const solvedCount = solution?.solvedCount ?? 0;
  const partialCount = solution?.partialCount ?? 0;
  const failedCount = solution?.failedCount ?? 0;

  return (
    <div>
      {/* Page Header */}
      <section className="page-header">
        <div className="eyebrow">
          <Sparkles size={15} />
          Self-Improving Crowd + AI Knowledge Loop
        </div>
        <h1 className="page-title">
          Get <span className="gradient-text">crowd-proven recovery steps</span>{' '}
          that improve after every case
        </h1>
        <p className="page-subtitle">
          Safe Cart checks MongoDB to see if past shoppers already solved your
          platform dispute. For new cases, Gemini AI drafts a 4-step recovery
          playbook and saves it—and your outcome vote ranks the best solution #1.
        </p>

        <div className="chip-row">
          <span className="chip-label">Common Disputes:</span>
          {commonCases.map((item, idx) => (
            <button
              key={item._id || idx}
              type="button"
              className="chip"
              onClick={() => applyCommonCase(item)}
            >
              {item.platform} • {item.category}
            </button>
          ))}
        </div>
      </section>

      {error && (
        <div className="error-banner" role="alert" style={{ marginBottom: '20px' }}>
          <AlertTriangle size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>{error}</div>
        </div>
      )}

      {/* Problem Submission Card */}
      <section className="card-elevated" style={{ marginBottom: '26px' }}>
        <form onSubmit={handleFindOrGenerateSolution} className="form-grid">
          <div className="form-group">
            <label className="form-label" htmlFor="know-category">
              Issue Category *
            </label>
            <select
              id="know-category"
              className="form-control"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="know-platform">
              Platform or Store Name *
            </label>
            <input
              id="know-platform"
              type="text"
              className="form-control"
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              placeholder="e.g., Amazon India, Flipkart, Instagram Seller"
              required
            />
          </div>

          <div className="form-group full-width">
            <label className="form-label" htmlFor="know-problem">
              Describe What Happened *
            </label>
            <textarea
              id="know-problem"
              className="form-control"
              value={problemText}
              onChange={(e) => setProblemText(e.target.value)}
              placeholder="Explain what you ordered, how you paid (UPI/Card/COD), and where the seller or platform stopped responding..."
              required
            />
          </div>

          <div className="form-group full-width">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              <RefreshCw size={17} />
              {loading
                ? 'Finding Best Solution...'
                : 'Find Proven Solution or Generate AI Steps'}
            </button>
          </div>
        </form>
      </section>

      {/* Loading State */}
      {loading && (
        <div
          className="state-card"
          role="status"
          aria-live="polite"
          style={{ marginBottom: '26px' }}
        >
          <div className="spinner" />
          <h3>{statusMessage || 'Analyzing your dispute...'}</h3>
          <p>Matching category + platform history sorted by verified success count.</p>
        </div>
      )}

      {/* Solution & Feedback Loop Card */}
      {!loading && solution && (
        <section className="card-elevated" aria-label="Recommended recovery plan">
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              flexWrap: 'wrap',
              gap: '14px',
              paddingBottom: '18px',
              borderBottom: '1px solid var(--border)',
            }}
          >
            <div>
              <div
                style={{
                  display: 'flex',
                  gap: '8px',
                  flexWrap: 'wrap',
                  marginBottom: '8px',
                }}
              >
                {sourceType === 'verified' ? (
                  <span className="badge badge-verified">
                    <CheckCircle2 size={14} /> Matched Top Crowd-Verified Playbook
                  </span>
                ) : (
                  <span className="badge badge-info">
                    <Sparkles size={14} /> Gemini AI Playbook (Saved to DB)
                  </span>
                )}
                <span className="badge badge-info">{category}</span>
              </div>
              <h2 style={{ fontSize: '1.45rem' }}>
                4-Step Action Plan for {platform}
              </h2>
            </div>

            {/* Live Evidence Counters */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
              <span className="badge badge-verified">
                Solved: {solvedCount}
              </span>
              <span className="badge badge-warn">
                Partial: {partialCount}
              </span>
              <span
                className="badge"
                style={{
                  background: 'var(--danger-bg)',
                  color: 'var(--danger-red)',
                }}
              >
                Unresolved: {failedCount}
              </span>
              <Link
                to={`/complaint?platform=${encodeURIComponent(
                  platform
                )}&issue=${encodeURIComponent(problemText)}`}
                className="btn btn-outline btn-sm"
              >
                Draft Formal Notice <ArrowRight size={14} />
              </Link>
            </div>
          </div>

          {/* 4 Action Steps */}
          <div style={{ marginTop: '20px', display: 'grid', gap: '12px' }}>
            {stepsList.map((step, index) => (
              <div
                key={index}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '14px',
                  padding: '16px',
                  borderRadius: '14px',
                  background: 'var(--mist)',
                  border: '1px solid var(--border)',
                }}
              >
                <span
                  style={{
                    width: '30px',
                    height: '30px',
                    borderRadius: '9px',
                    background: 'var(--indigo)',
                    color: '#FFFFFF',
                    fontFamily: 'var(--font-heading)',
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    display: 'grid',
                    placeItems: 'center',
                    flexShrink: 0,
                  }}
                >
                  {index + 1}
                </span>
                <div style={{ color: 'var(--ink-soft)', fontSize: '0.97rem' }}>
                  {step}
                </div>
              </div>
            ))}
          </div>

          {/* Self-Improving Feedback + 5-Star Service Rating Loop */}
          <div
            style={{
              marginTop: '26px',
              padding: '20px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #eef2ff 0%, #f8faff 100%)',
              border: '1px solid rgba(45, 63, 224, 0.18)',
            }}
          >
            <h3
              style={{
                fontSize: '1.15rem',
                marginBottom: '6px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <Layers size={19} color="var(--indigo)" />
              Close the Loop: Did these steps work & how was Safe Cart's service?
            </h3>
            <p
              style={{
                fontSize: '0.92rem',
                color: 'var(--ink-soft)',
                marginBottom: '16px',
              }}
            >
              Your outcome and star rating update our live rankings in MongoDB
              so the next shopper sees the most effective solution first.
            </p>

            {feedbackSaved ? (
              <div
                className="badge-verified"
                role="status"
                style={{
                  padding: '12px 16px',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <CheckCircle2 size={18} />
                <span>
                  Thank you! Your outcome and {serviceStars}/5 service rating
                  are saved to MongoDB.
                </span>
              </div>
            ) : (
              <form onSubmit={handleSubmitFeedback}>
                <div
                  style={{
                    display: 'flex',
                    gap: '10px',
                    flexWrap: 'wrap',
                    marginBottom: '16px',
                  }}
                >
                  <button
                    type="button"
                    className={
                      outcome === 'solved'
                        ? 'btn btn-success btn-sm'
                        : 'btn btn-outline btn-sm'
                    }
                    onClick={() => setOutcome('solved')}
                  >
                    <CheckCircle2 size={15} /> Solved
                  </button>

                  <button
                    type="button"
                    className={
                      outcome === 'partial'
                        ? 'btn btn-primary btn-sm'
                        : 'btn btn-outline btn-sm'
                    }
                    onClick={() => setOutcome('partial')}
                  >
                    <AlertCircle size={15} /> Partially Solved
                  </button>

                  <button
                    type="button"
                    className={
                      outcome === 'failed'
                        ? 'btn btn-primary btn-sm'
                        : 'btn btn-outline btn-sm'
                    }
                    onClick={() => setOutcome('failed')}
                  >
                    <XCircle size={15} /> Not Solved
                  </button>
                </div>

                <div className="form-grid" style={{ marginBottom: '14px' }}>
                  {outcome !== 'failed' && (
                    <div className="form-group">
                      <label className="form-label" htmlFor="worked-step-select">
                        Which step made the difference?
                      </label>
                      <select
                        id="worked-step-select"
                        className="form-control"
                        value={whichStepWorked}
                        onChange={(e) => setWhichStepWorked(e.target.value)}
                      >
                        {stepsList.map((_, i) => (
                          <option key={i} value={`Step ${i + 1}`}>
                            Step {i + 1}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="form-group">
                    <label className="form-label">
                      Rate Safe Cart's Recovery Service (1 to 5 Stars)
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

                  <div className="form-group full-width">
                    <label className="form-label" htmlFor="knowledge-service-note">
                      How was Safe Cart's service? (Optional feedback)
                    </label>
                    <input
                      id="knowledge-service-note"
                      type="text"
                      className="form-control"
                      value={serviceNote}
                      onChange={(e) => setServiceNote(e.target.value)}
                      placeholder="e.g., Step 3 helped me get my refund within 48 hours..."
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submittingFeedback}
                >
                  <ThumbsUp size={16} />
                  {submittingFeedback
                    ? 'Updating Rankings...'
                    : 'Submit Outcome & Rating'}
                </button>
              </form>
            )}
          </div>
        </section>
      )}
    </div>
  );
}