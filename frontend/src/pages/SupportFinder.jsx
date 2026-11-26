import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Search,
  Headphones,
  PhoneCall,
  Mail,
  Globe,
  ShieldCheck,
  AlertTriangle,
  Copy,
  Check,
  PlusCircle,
  CheckCircle2,
  ArrowRight,
  UserCheck,
} from 'lucide-react';
import {
  API_BASE_URL,
  normalizeQuery,
  getRecentSearches,
  saveRecentSearch,
} from '../api';

export default function SupportFinder() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';

  const [query, setQuery] = useState(initialQuery);
  const [contact, setContact] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notFoundTerm, setNotFoundTerm] = useState('');
  const [copiedField, setCopiedField] = useState('');
  const [recentSearches, setRecentSearches] = useState(() =>
    getRecentSearches('sci_recent_support')
  );

  // Add Verified Contact Form
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newWebsite, setNewWebsite] = useState('');
  const [newGrievanceEmail, setNewGrievanceEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState('');

  async function fetchSupport(rawTerm) {
    const clean = normalizeQuery(rawTerm);
    if (!clean) {
      setError('Enter a store or platform name to find verified support.');
      return;
    }

    setLoading(true);
    setError('');
    setNotFoundTerm('');
    setSubmitSuccess('');
    setSearchParams({ q: clean });

    const updated = saveRecentSearch(clean, 'sci_recent_support');
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
          `${API_BASE_URL}/api/support/${encodeURIComponent(candidate)}`
        );
        if (res.ok) {
          const data = await res.json();
          const record = data?.support || data?.contact || data;
          if (
            record &&
            (record.name ||
              record.storeName ||
              record.email ||
              record.phone ||
              record.supportEmail)
          ) {
            foundRecord = record;
            break;
          }
        }
      }

      if (foundRecord) {
        setContact(foundRecord);
      } else {
        setContact(null);
        setNotFoundTerm(clean);
        setNewName(clean);
      }
    } catch {
      setContact(null);
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
      fetchSupport(initialQuery);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQuery]);

  function handleSearchSubmit(e) {
    e.preventDefault();
    fetchSupport(query);
  }

  function handleCopy(text, label) {
    if (!text) return;
    navigator.clipboard?.writeText(text);
    setCopiedField(label);
    setTimeout(() => setCopiedField(''), 2000);
  }

  async function handleSaveContact(e) {
    e.preventDefault();
    const cleanName = normalizeQuery(newName);
    if (!cleanName) return;

    setSubmitting(true);
    setError('');
    setSubmitSuccess('');

    try {
      const payload = {
        name: cleanName,
        storeName: cleanName,
        email: newEmail.trim(),
        supportEmail: newEmail.trim(),
        phone: newPhone.trim(),
        supportPhone: newPhone.trim(),
        website: newWebsite.trim(),
        portalUrl: newWebsite.trim(),
        grievanceEmail: newGrievanceEmail.trim(),
        verified: true,
      };

      const res = await fetch(`${API_BASE_URL}/api/support`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save support contact.');
      }

      setSubmitSuccess(`Verified support contact saved for "${cleanName}".`);
      setShowAddForm(false);
      setQuery(cleanName);
      fetchSupport(cleanName);
    } catch (err) {
      setError(err.message || 'Error saving support contact.');
    } finally {
      setSubmitting(false);
    }
  }

  const displayName =
    contact?.name || contact?.storeName || contact?.platform || '';
  const displayEmail =
    contact?.email || contact?.supportEmail || 'Not listed yet';
  const displayPhone =
    contact?.phone || contact?.supportPhone || 'In-app / Email support only';
  const displayWebsite =
    contact?.website || contact?.portalUrl || contact?.url || '';
  const displayGrievance =
    contact?.grievanceEmail ||
    contact?.grievanceOfficer ||
    'Use official support email & request Grievance Escalation';

  return (
    <div>
      {/* Page Header */}
      <section className="page-header">
        <div className="eyebrow">
          <Headphones size={15} />
          Anti-Scam Verified Support Directory
        </div>
        <h1 className="page-title">
          Find <span className="gradient-text">real customer support</span>—never
          fake helpline ads
        </h1>
        <p className="page-subtitle">
          Scammers buy fake helpline numbers on search engines. Look up
          verified support emails, grievance contacts, and official help portals
          here.
        </p>

        {/* Search Bar */}
        <form
          onSubmit={handleSearchSubmit}
          style={{ marginTop: '22px', maxWidth: '780px' }}
          role="search"
          aria-label="Search verified support contacts"
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
                  placeholder="Enter store or platform name (e.g., ExampleStore)..."
                  aria-label="Store or platform name"
                />
              </div>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? 'Looking up...' : 'Find Verified Contact'}
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
                fetchSupport('ExampleStore');
              }}
            >
              ExampleStore
            </button>
            <button
              type="button"
              className="chip"
              onClick={() => {
                setQuery('Example Store');
                fetchSupport('Example Store');
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
                  fetchSupport(term);
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
          <h3>Checking verified support directory...</h3>
          <p>Looking up official email, helpline, and grievance contacts.</p>
        </div>
      )}

      {!loading && !contact && !notFoundTerm && !error && (
        <div className="state-card" style={{ marginBottom: '24px' }}>
          <Headphones
            size={36}
            color="var(--indigo)"
            style={{ marginBottom: '12px' }}
          />
          <h2 style={{ fontSize: '1.3rem', marginBottom: '8px' }}>
            Search a brand or store for verified contact channels
          </h2>
          <p style={{ maxWidth: '54ch', margin: '0 auto 18px' }}>
            Click <strong>ExampleStore</strong> above to inspect verified
            contact records, or add a verified support channel from an
            official invoice.
          </p>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setShowAddForm((prev) => !prev)}
          >
            <PlusCircle size={17} /> Add Verified Support Contact
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
                Unverified Contact Warning
              </span>
              <h2 style={{ fontSize: '1.4rem', marginBottom: '6px' }}>
                No verified support contact stored yet for "{notFoundTerm}"
              </h2>
              <p style={{ color: 'var(--ink-soft)', maxWidth: '62ch' }}>
                Do not call random customer-care numbers found in search ads.
                Check the official invoice or domain footer, and save the
                verified contact here to protect other shoppers.
              </p>
            </div>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setShowAddForm(true)}
            >
              <PlusCircle size={17} /> Log Verified Contact
            </button>
          </div>
        </div>
      )}

      {/* Verified Contact Result Card */}
      {!loading && contact && (
        <section className="card-elevated" style={{ marginBottom: '24px' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              flexWrap: 'wrap',
              gap: '16px',
              paddingBottom: '18px',
              borderBottom: '1px solid var(--border)',
            }}
          >
            <div>
              <span className="badge badge-verified" style={{ marginBottom: '8px' }}>
                <ShieldCheck size={14} /> Documented Official Contact
              </span>
              <h2 style={{ fontSize: '1.65rem' }}>{displayName}</h2>
            </div>

            <Link
              to={`/complaint?seller=${encodeURIComponent(displayName)}`}
              className="btn btn-primary btn-sm"
            >
              Draft Complaint to This Store <ArrowRight size={15} />
            </Link>
          </div>

          <div className="metrics-grid" style={{ marginTop: '20px' }}>
            {/* Official Email */}
            <div className="metric-box">
              <div
                className="metric-label"
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Mail size={15} color="var(--indigo)" /> Official Support Email
              </div>
              <div
                className="metric-value"
                style={{ fontSize: '1.05rem', wordBreak: 'break-all' }}
              >
                {displayEmail}
              </div>
              {displayEmail !== 'Not listed yet' && (
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  style={{ marginTop: '10px' }}
                  onClick={() => handleCopy(displayEmail, 'email')}
                >
                  {copiedField === 'email' ? (
                    <>
                      <Check size={14} color="var(--verify-green)" /> Copied
                    </>
                  ) : (
                    <>
                      <Copy size={14} /> Copy Email
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Official Phone */}
            <div className="metric-box">
              <div
                className="metric-label"
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <PhoneCall size={15} color="var(--indigo)" /> Verified Helpline
              </div>
              <div className="metric-value" style={{ fontSize: '1.05rem' }}>
                {displayPhone}
              </div>
              {displayPhone !== 'In-app / Email support only' && (
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  style={{ marginTop: '10px' }}
                  onClick={() => handleCopy(displayPhone, 'phone')}
                >
                  {copiedField === 'phone' ? (
                    <>
                      <Check size={14} color="var(--verify-green)" /> Copied
                    </>
                  ) : (
                    <>
                      <Copy size={14} /> Copy Number
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Grievance Officer */}
            <div className="metric-box">
              <div
                className="metric-label"
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <UserCheck size={15} color="var(--indigo)" /> Grievance Escalation
              </div>
              <div
                className="metric-value"
                style={{ fontSize: '1.02rem', wordBreak: 'break-word' }}
              >
                {displayGrievance}
              </div>
            </div>
          </div>

          {displayWebsite && (
            <div style={{ marginTop: '16px' }}>
              <a
                href={
                  /^https?:\/\//i.test(displayWebsite)
                    ? displayWebsite
                    : `https://${displayWebsite}`
                }
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary btn-sm"
              >
                <Globe size={15} /> Open Official Support Portal
              </a>
            </div>
          )}
        </section>
      )}

      {/* National Escalation Safety Card (Always Visible for Seniors & Shoppers) */}
      <section
        className="card"
        style={{
          marginBottom: '24px',
          background: 'linear-gradient(135deg, #ffffff 0%, #eef2ff 100%)',
        }}
      >
        <h3 style={{ fontSize: '1.12rem', marginBottom: '6px' }}>
          National Consumer Helpline (India — Official Government Escalation)
        </h3>
        <p style={{ color: 'var(--ink-soft)', fontSize: '0.94rem', marginBottom: '12px' }}>
          If a seller or platform refuses a valid refund, use the official
          Government of India consumer redressal channels (free, no middlemen):
        </p>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={() => handleCopy('1915', 'nch')}
          >
            <PhoneCall size={14} />
            {copiedField === 'nch'
              ? 'Copied 1915!'
              : 'Toll-Free Helpline: 1915 / 1800-11-4000'}
          </button>
          <a
            href="https://consumerhelpline.gov.in/"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secondary btn-sm"
          >
            <Globe size={14} /> consumerhelpline.gov.in
          </a>
        </div>
      </section>

      {/* Add Verified Support Form */}
      {showAddForm && (
        <section className="card-elevated" aria-label="Add verified support contact">
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px',
            }}
          >
            <h2 style={{ fontSize: '1.3rem' }}>Log Verified Support Contact</h2>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => setShowAddForm(false)}
            >
              Close
            </button>
          </div>

          <form onSubmit={handleSaveContact} className="form-grid">
            <div className="form-group">
              <label className="form-label" htmlFor="sup-name-input">
                Store or Platform Name *
              </label>
              <input
                id="sup-name-input"
                type="text"
                className="form-control"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="sup-email-input">
                Official Support Email
              </label>
              <input
                id="sup-email-input"
                type="email"
                className="form-control"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="support@examplestore.com"
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="sup-phone-input">
                Verified Helpline Phone
              </label>
              <input
                id="sup-phone-input"
                type="text"
                className="form-control"
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                placeholder="e.g., 1800-XXX-XXXX"
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="sup-grievance-input">
                Grievance Officer Email
              </label>
              <input
                id="sup-grievance-input"
                type="email"
                className="form-control"
                value={newGrievanceEmail}
                onChange={(e) => setNewGrievanceEmail(e.target.value)}
                placeholder="grievance@examplestore.com"
              />
            </div>

            <div className="form-group full-width">
              <label className="form-label" htmlFor="sup-url-input">
                Official Help Center URL
              </label>
              <input
                id="sup-url-input"
                type="text"
                className="form-control"
                value={newWebsite}
                onChange={(e) => setNewWebsite(e.target.value)}
                placeholder="https://examplestore.com/help"
              />
            </div>

            <div className="form-group full-width">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={submitting}
              >
                <ShieldCheck size={17} />
                {submitting ? 'Saving Contact...' : 'Save Verified Contact'}
              </button>
            </div>
          </form>
        </section>
      )}
    </div>
  );
}