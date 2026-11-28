import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  FileWarning,
  Sparkles,
  Download,
  Copy,
  Check,
  AlertTriangle,
  History,
  FileText,
  Printer,
  Mail,
  Clock,
} from 'lucide-react';
import {
  API_BASE_URL,
  getComplaintHistory,
  saveComplaintHistory,
} from '../api';

function getStatutoryDeadlines() {
  const now = new Date();
  const ackDate = new Date(now.getTime() + 48 * 60 * 60 * 1000);
  const officerDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const nchDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const fmt = (d) =>
    d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  return {
    ack: fmt(ackDate),
    officer: fmt(officerDate),
    nch: fmt(nchDate),
  };
}

export default function ComplaintGenerator() {
  const [searchParams] = useSearchParams();

  const [sellerName, setSellerName] = useState(
    searchParams.get('seller') || ''
  );
  const [platform, setPlatform] = useState(
    searchParams.get('platform') || ''
  );
  const [orderId, setOrderId] = useState('');
  const [issue, setIssue] = useState('');
  const [desiredResolution, setDesiredResolution] = useState('Full Refund');

  const [letterText, setLetterText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [history, setHistory] = useState(() => getComplaintHistory());

  const deadlines = getStatutoryDeadlines();

  useEffect(() => {
    const s = searchParams.get('seller');
    const p = searchParams.get('platform');
    if (s) setSellerName(s);
    if (p) setPlatform(p);
  }, [searchParams]);

  function fillExample() {
    setSellerName('ExampleStore');
    setPlatform('ExampleMarket');
    setOrderId('ORD-9921');
    setIssue(
      'Received a used, non-working charger instead of the sealed original fast charger advertised. Return request has been pending for 8 days without pickup.'
    );
    setDesiredResolution('Full Refund');
    setError('');
  }

  async function handleGenerate(e) {
    e.preventDefault();
    if (!issue.trim()) {
      setError('Please describe what went wrong with your order.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const payload = {
        sellerName: sellerName.trim() || 'Online Seller',
        platform: platform.trim() || 'Direct Online Store',
        orderId: orderId.trim() || 'N/A',
        issue: issue.trim(),
        desiredResolution,
      };

      const res = await fetch(`${API_BASE_URL}/api/complaints`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate complaint letter.');
      }

      const generated =
        data?.complaint?.generatedText ||
        data?.complaint?.letter ||
        data?.complaint?.generatedLetter ||
        data?.generatedText ||
        data?.letter ||
        '';

      if (!generated) {
        throw new Error('AI returned an empty letter. Please try again.');
      }

      setLetterText(generated);

      const updatedHistory = saveComplaintHistory({
        id: data?.complaint?._id || Date.now().toString(),
        sellerName: payload.sellerName,
        platform: payload.platform,
        orderId: payload.orderId,
        createdAt: new Date().toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        }),
        letter: generated,
      });
      setHistory(updatedHistory);
    } catch (err) {
      setError(
        err.message ||
          'Could not connect to Gemini AI backend. Check that your server is running on port 5000.'
      );
    } finally {
      setLoading(false);
    }
  }

  function handleCopyLetter() {
    if (!letterText) return;
    navigator.clipboard?.writeText(letterText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleDownloadPdf() {
    if (!letterText) return;
    window.print();
  }

  function handleDownloadTxt() {
    if (!letterText) return;
    const blob = new Blob([letterText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `SafeCart-Complaint-${orderId || 'Letter'}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  function handleLaunchEmail() {
    if (!letterText) return;
    const subject = encodeURIComponent(
      `Formal Consumer Grievance: Order ${orderId || 'Dispute'} — ${sellerName || platform || 'Online Order'}`
    );
    const body = encodeURIComponent(letterText);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  }

  return (
    <div>
      {/* Page Header */}
      <section className="page-header no-print">
        <div className="eyebrow">
          <FileWarning size={15} />
          AI Legal & Consumer Notice Drafter
        </div>
        <h1 className="page-title">
          Generate a formal <span className="gradient-text">complaint letter</span>{' '}
          in seconds
        </h1>
        <p className="page-subtitle">
          Enter your order facts below. Gemini AI drafts a clear, firm
          consumer notice citing documented dates and refund rules—ready to
          save as a PDF or send to a Grievance Officer.
        </p>

        <div className="chip-row">
          <span className="chip-label">Quick start:</span>
          <button type="button" className="chip" onClick={fillExample}>
            Fill Example Dispute (ExampleStore / ORD-9921)
          </button>
        </div>
      </section>

      {error && (
        <div
          className="error-banner no-print"
          role="alert"
          style={{ marginBottom: '20px' }}
        >
          <AlertTriangle size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>{error}</div>
        </div>
      )}

      {/* Input Form Card */}
      <section className="card-elevated no-print" style={{ marginBottom: '26px' }}>
        <form onSubmit={handleGenerate} className="form-grid">
          <div className="form-group">
            <label className="form-label" htmlFor="comp-seller">
              Seller or Brand Name
            </label>
            <input
              id="comp-seller"
              type="text"
              className="form-control"
              value={sellerName}
              onChange={(e) => setSellerName(e.target.value)}
              placeholder="e.g., ExampleStore"
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="comp-platform">
              Platform / Website
            </label>
            <input
              id="comp-platform"
              type="text"
              className="form-control"
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              placeholder="e.g., ExampleMarket, Instagram"
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="comp-order-id">
              Order ID / Transaction UTR
            </label>
            <input
              id="comp-order-id"
              type="text"
              className="form-control"
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              placeholder="e.g., ORD-9921"
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="comp-resolution">
              Resolution Requested
            </label>
            <select
              id="comp-resolution"
              className="form-control"
              value={desiredResolution}
              onChange={(e) => setDesiredResolution(e.target.value)}
            >
              <option value="Full Refund">Full Refund to Original Payment Method</option>
              <option value="Immediate Replacement">Immediate Replacement with Sealed Item</option>
              <option value="Return Pickup & Refund">Scheduled Return Pickup & Refund</option>
              <option value="Grievance Escalation">Formal Grievance Officer Escalation</option>
            </select>
          </div>

          <div className="form-group full-width">
            <label className="form-label" htmlFor="comp-issue">
              Documented Issue (What happened & when?) *
            </label>
            <textarea
              id="comp-issue"
              className="form-control"
              value={issue}
              onChange={(e) => setIssue(e.target.value)}
              placeholder="Describe the item ordered, what arrived (or non-delivery), dates, and prior support ticket numbers..."
              required
            />
          </div>

          <div className="form-group full-width">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              <Sparkles size={18} />
              {loading
                ? 'Gemini AI is drafting your letter...'
                : 'Generate Formal Complaint Letter'}
            </button>
          </div>
        </form>
      </section>

      {/* Loading State */}
      {loading && (
        <div
          className="state-card no-print"
          role="status"
          aria-live="polite"
          style={{ marginBottom: '26px' }}
        >
          <div className="spinner" />
          <h3>Drafting your formal consumer notice...</h3>
          <p>Formatting order facts, escalation timeline, and resolution demand.</p>
        </div>
      )}

      {/* Generated Letter Preview + Statutory Escalation Timeline */}
      {!loading && letterText && (
        <section
          className="card-elevated printable-letter"
          style={{ marginBottom: '28px' }}
          aria-label="Generated complaint letter"
        >
          <div
            className="no-print"
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px',
              paddingBottom: '16px',
              marginBottom: '18px',
              borderBottom: '1px solid var(--border)',
            }}
          >
            <div>
              <span className="badge badge-verified" style={{ marginBottom: '6px' }}>
                Ready to Send or Save
              </span>
              <h2 style={{ fontSize: '1.35rem' }}>
                Your Formal Complaint Letter
              </h2>
            </div>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={handleCopyLetter}
              >
                {copied ? (
                  <>
                    <Check size={15} color="var(--verify-green)" /> Copied
                  </>
                ) : (
                  <>
                    <Copy size={15} /> Copy Text
                  </>
                )}
              </button>

              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={handleLaunchEmail}
              >
                <Mail size={15} /> Open in Email
              </button>

              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleDownloadTxt}
              >
                <Download size={15} /> Download .TXT
              </button>

              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={handleDownloadPdf}
              >
                <Printer size={15} /> Download PDF
              </button>
            </div>
          </div>

          {/* Statutory SLA Escalation Timeline */}
          <div
            className="no-print"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '10px',
              padding: '14px',
              marginBottom: '16px',
              borderRadius: '12px',
              background: 'var(--mist)',
              border: '1px solid var(--border)',
            }}
          >
            <div>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--indigo)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Clock size={13} /> STEP 1 • 48-HOUR SLA
              </div>
              <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>By {deadlines.ack}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--ink-muted)' }}>
                Mandatory platform ticket acknowledgment deadline
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--indigo)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Clock size={13} /> STEP 2 • 7-DAY ESCALATION
              </div>
              <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>By {deadlines.officer}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--ink-muted)' }}>
                Escalate to Grievance Officer if refund/pickup stalls
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--indigo)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Clock size={13} /> STEP 3 • 30-DAY STATUTORY LIMIT
              </div>
              <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>By {deadlines.nch}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--ink-muted)' }}>
                File on National Consumer Helpline (1915) / e-Jagriti
              </div>
            </div>
          </div>

          <label
            htmlFor="editable-letter-box"
            className="no-print"
            style={{
              display: 'block',
              fontSize: '0.86rem',
              color: 'var(--ink-muted)',
              marginBottom: '8px',
            }}
          >
            Tip: You can edit any name, date, or address directly inside the
            letter below before clicking <strong>Download PDF</strong> (choose
            "Save as PDF" in the print dialog).
          </label>

          <textarea
            id="editable-letter-box"
            className="form-control no-print"
            value={letterText}
            onChange={(e) => setLetterText(e.target.value)}
            style={{
              minHeight: '320px',
              lineHeight: '1.65',
              fontFamily: 'var(--font-body)',
              background: 'var(--mist)',
            }}
          />

          <div
            style={{
              whiteSpace: 'pre-wrap',
              lineHeight: '1.65',
              fontSize: '11pt',
              color: '#000000',
              marginTop: '12px',
            }}
            className="print-only-block"
          >
            <style>{`
              .print-only-block { display: none; }
              @media print { .print-only-block { display: block !important; } }
            `}</style>
            {letterText}
          </div>
        </section>
      )}

      {/* Past Complaint History */}
      {history.length > 0 && (
        <section className="card no-print" aria-label="Past complaint letters">
          <h3
            style={{
              fontSize: '1.12rem',
              marginBottom: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <History size={18} color="var(--indigo)" />
            Recent Complaint History ({history.length})
          </h3>

          <div style={{ display: 'grid', gap: '10px' }}>
            {history.map((item) => (
              <div
                key={item.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '10px',
                  padding: '12px 14px',
                  borderRadius: '12px',
                  background: 'var(--mist)',
                  border: '1px solid var(--border)',
                }}
              >
                <div>
                  <strong style={{ fontSize: '0.96rem' }}>
                    {item.sellerName}
                  </strong>{' '}
                  <span style={{ color: 'var(--ink-muted)', fontSize: '0.88rem' }}>
                    - {item.platform} • Order {item.orderId} ({item.createdAt})
                  </span>
                </div>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => {
                    setSellerName(item.sellerName);
                    setPlatform(item.platform);
                    setOrderId(item.orderId);
                    setLetterText(item.letter);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                >
                  <FileText size={14} /> Open Letter
                </button>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}