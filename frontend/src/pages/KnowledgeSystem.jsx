import { useState } from 'react';
import {
  Sparkles,
  CheckCircle2,
  AlertCircle,
  XCircle,
  AlertTriangle,
  ThumbsUp,
  Layers,
  RefreshCw,
} from 'lucide-react';
import { API_BASE_URL } from '../api';

const CATEGORIES = [
  'Refund Delay',
  'Fake or Counterfeit Product',
  'Non-Delivery / Fake Tracking',
  'Return Rejected Unfairly',
  'Wrong Item Received',
  'Seller Blocked / Unresponsive',
];

function buildTailoredSteps(category, platformName) {
  const store = platformName || 'the platform';

  const library = {
    'Refund Delay': [
      `Screenshot your order ID, payment UTR/transaction receipt, and ${store} return/cancellation approval confirmation.`,
      `Send a written follow-up to ${store} official support quoting your order ID and requesting a clear 48-hour refund credit SLA.`,
      `If the refund remains pending past the promised timeline, escalate to ${store}'s Grievance Officer with your support ticket number.`,
      `Raise a payment dispute/chargeback with your bank (within 45 calendar days for UPI/cards) or file a complaint at consumerhelpline.gov.in (1915).`,
    ],
    'Fake or Counterfeit Product': [
      `Record a clear video and photos showing the counterfeit packaging, missing brand holograms/serial numbers, and invoice.`,
      `Report the item as "Counterfeit / Not Authentic" inside ${store} within the return window and attach your unboxing evidence.`,
      `Demand a full refund without restocking fees in writing; cite brand verification failure under E-Commerce Consumer Protection rules.`,
      `If ${store} refuses or closes the ticket, file a formal grievance on consumerhelpline.gov.in (1915) and request a card/UPI chargeback.`,
    ],
    'Non-Delivery / Fake Tracking': [
      `Download the courier tracking log and screenshot any "delivered" status that lacks your signature or valid OTP confirmation.`,
      `Notify ${store} immediately in writing that the parcel was never physically handed over and request proof of delivery (POD).`,
      `Escalate to ${store}'s Grievance Officer if the courier fails to produce signed POD within 48 hours.`,
      `Initiate a non-receipt dispute with your bank/UPI provider using the 12-digit UTR number and log a complaint on 1915.`,
    ],
    'Return Rejected Unfairly': [
      `Gather your uncut unboxing video showing all 6 sides of the sealed parcel, shipping label, and original brand tags intact.`,
      `Re-open the support ticket on ${store} and attach links/screenshots proving the defect or mismatch existed upon opening.`,
      `Escalate to the Grievance Officer quoting the 48-hour acknowledgement rule if automated support rejects the return again.`,
      `Use Safe Cart's Complaint AI to send a formal consumer notice before filing on consumerhelpline.gov.in (1915).`,
    ],
    'Wrong Item Received': [
      `Photograph the wrong item next to the outer shipping label (AWB) and invoice showing what you actually ordered.`,
      `Submit a "Wrong Item Delivered" return claim inside ${store} before the return window closes.`,
      `Ensure the pickup executive verifies the item condition and gives you a digital/SMS pickup receipt.`,
      `If refund is delayed after pickup, escalate to ${store} Grievance Support or file a bank chargeback with your pickup proof.`,
    ],
    'Seller Blocked / Unresponsive': [
      `Export and screenshot the full chat history, seller profile handle, payment receipt (UTR), and promised delivery dates.`,
      `Check Safe Cart's Verified Support Finder for an official brand email or grievance contact outside social chat.`,
      `Contact your remitting bank immediately (within 45 days for UPI) to raise an unresolved merchant dispute using your UTR.`,
      `Register a formal consumer complaint at consumerhelpline.gov.in or call 1915 with the seller's bank/UPI details.`,
    ],
  };

  return library[category] || library['Refund Delay'];
}

export default function KnowledgeSystem() {
  const [category, setCategory] = useState('Refund Delay');
  const [platform, setPlatform] = useState('ExampleMarket');
  const [problemText, setProblemText] = useState('');

  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [error, setError] = useState('');

  const [solution, setSolution] = useState(null);
  const [sourceType, setSourceType] = useState(''); // 'verified' | 'ai'

  // Feedback Loop State
  const [outcome, setOutcome] = useState('solved'); // 'solved' | 'partial' | 'failed'
  const [whichStepWorked, setWhichStepWorked] = useState('Step 1');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [feedbackSaved, setFeedbackSaved] = useState(false);

  function fillExampleProblem() {
    setCategory('Refund Delay');
    setPlatform('ExampleMarket');
    setProblemText(
      'Refund was approved 12 days ago after return pickup, but the amount has still not credited to my bank account.'
    );
    setError('');
  }

  function normalizeSteps(solObj) {
    if (!solObj) return [];
    if (Array.isArray(solObj.steps) && solObj.steps.length > 0) {
      return solObj.steps.map((s) =>
        typeof s === 'string'
          ? s
          : s.instruction || s.description || s.text || s.title || JSON.stringify(s)
      );
    }
    return buildTailoredSteps(category, platform);
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
    setStatusMessage('Searching crowd-verified solutions in MongoDB...');

    const cleanPlatform = platform.trim() || 'Online Store';

    try {
      // 1. Check MongoDB for highest-performing solution matching category + platform
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
        throw new Error(probData.error || 'Failed to submit problem.');
      }

      const activeProblemId = probData.problemId || '';

      // Reuse existing solution ONLY if it actually has non-empty steps
      if (
        probData.found &&
        probData.solution &&
        Array.isArray(probData.solution.steps) &&
        probData.solution.steps.length > 0
      ) {
        setSolution(probData.solution);
        setSourceType('verified');
        setWhichStepWorked('Step 1');
        setStatusMessage('');
        return;
      }

      // 2. Otherwise build 4 tailored steps and persist them via POST /api/problems/solution
      setStatusMessage(
        'Building a tailored 4-step recovery playbook and saving to knowledge loop...'
      );

      const tailoredSteps = buildTailoredSteps(category, cleanPlatform);

      const solRes = await fetch(`${API_BASE_URL}/api/problems/solution`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          problemId: activeProblemId,
          steps: tailoredSteps,
          source: 'ai',
        }),
      });

      const solData = await solRes.json();
      if (!solRes.ok) {
        throw new Error(solData.error || 'Failed to save solution.');
      }

      setSolution(solData.solution);
      setSourceType('ai');
      setWhichStepWorked('Step 1');
      setStatusMessage('');
    } catch (err) {
      setStatusMessage('');
      setError(
        err.message ||
          'Could not connect to the backend server. Check that your server is running on port 5000.'
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
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to record feedback.');
      }

      if (data.solution) {
        setSolution(data.solution);
      }
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
          Safe Cart checks if past shoppers already solved your exact platform
          issue. If not, it creates a 4-step recovery plan—and your outcome
          vote ranks the best solution #1 for future buyers.
        </p>

        <div className="chip-row">
          <span className="chip-label">Try example case:</span>
          <button type="button" className="chip" onClick={fillExampleProblem}>
            Refund Delay on ExampleMarket
          </button>
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
              placeholder="e.g., ExampleMarket, Instagram Seller"
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
                : 'Find Proven Solution or Generate Recovery Steps'}
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
                    <CheckCircle2 size={14} /> Matched Top Crowd-Verified Solution
                  </span>
                ) : (
                  <span className="badge badge-info">
                    <Sparkles size={14} /> New Recovery Playbook Saved
                  </span>
                )}
                <span className="badge badge-info">{category}</span>
              </div>
              <h2 style={{ fontSize: '1.45rem' }}>
                4-Step Action Plan for {platform}
              </h2>
            </div>

            {/* Live Evidence Counters */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
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

          {/* Self-Improving Feedback Loop Form */}
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
              Close the Loop: Did these steps work for you?
            </h3>
            <p
              style={{
                fontSize: '0.92rem',
                color: 'var(--ink-soft)',
                marginBottom: '16px',
              }}
            >
              Your outcome updates our live ranking counters in MongoDB so the
              next shopper sees the most effective solution first.
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
                  Thank you! Outcome recorded and solution rankings updated in
                  MongoDB.
                </span>
              </div>
            ) : (
              <form onSubmit={handleSubmitFeedback}>
                <div
                  style={{
                    display: 'flex',
                    gap: '10px',
                    flexWrap: 'wrap',
                    marginBottom: '14px',
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

                {outcome !== 'failed' && (
                  <div
                    className="form-group"
                    style={{ maxWidth: '340px', marginBottom: '14px' }}
                  >
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

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submittingFeedback}
                >
                  <ThumbsUp size={16} />
                  {submittingFeedback
                    ? 'Updating Counters...'
                    : 'Submit Outcome & Update Rankings'}
                </button>
              </form>
            )}
          </div>
        </section>
      )}
    </div>
  );
}