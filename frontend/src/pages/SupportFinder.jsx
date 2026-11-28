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
  Clock,
  Sparkles,
  Star,
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
  const [aiGenerated, setAiGenerated] = useState(false);
  const [popularContacts, setPopularContacts] = useState([
    'Amazon India',
    'Flipkart',
    'Meesho',
    'Myntra',
    'National Consumer Helpline (NCH)',
  ]);
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
  const [newSupportHours, setNewSupportHours] = useState('24/7 via Official App');
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState('');

  // 1-5 Star Support & Service Feedback
  const [supportStars, setSupportStars] = useState(5);
  const [serviceStars, setServiceStars] = useState(5);
  const [supportComment, setSupportComment] = useState('');
  const [serviceNote, setServiceNote] = useState('');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState('');

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/support`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.contacts?.length) {
          setPopularContacts(data.contacts.slice(0, 6).map((c) => c.name));
        }
      })
      .catch(() => {});
  }, []);

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
    setFeedbackSuccess('');
    setSearchParams({ q: clean });

    const updated = saveRecentSearch(clean, 'sci_recent_support');
    setRecentSearches(updated);

    try {
      const res = await fetch(
        `${API_BASE_URL}/api/support/${encodeURIComponent(clean)}`
      );
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Could not look up support contact.');
      }

      const record = data?.support || data?.contact || data;
      if (record && (record.name || record.email || record.phone)) {
        setContact(record);
        setAiGenerated(Boolean(data?.aiGenerated));
      } else {
        setContact(null);
        setNotFoundTerm(clean);
        setNewName(clean);
      }
    } catch (err) {
      setContact(null);
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
        email: newEmail.trim(),
        phone: newPhone.trim() || 'Use official in-app Help Center callback',
        website: newWebsite.trim(),
        supportHours: newSupportHours.trim() || '24/7 Official Portal',
        liveChatAvailable: true,
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

  async function handleFeedbackSubmit(e) {
    e.preventDefault();
    if (!contact?._id) return;

    setSubmittingFeedback(true);
    setError('');
    setFeedbackSuccess('');

    try {
      const res = await fetch(
        `${API_BASE_URL}/api/support/${contact._id}/feedback`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            supportRating: supportStars,
            serviceRating: serviceStars,
            comment: supportComment,
            serviceFeedback: serviceNote,
          }),
        }
      );

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save feedback.');
      }

      setSupportComment('');
      setServiceNote('');
      setFeedbackSuccess(
        `Thank you! Your ${supportStars}/5 support rating and ${serviceStars}/5 Safe Cart service feedback are saved to MongoDB.`
      );
    } catch (err) {
      setError(err.message || 'Could not save feedback.');
    } finally {
      setSubmittingFeedback(false);
    }
  }

  const displayName =
    contact?.name || contact?.storeName || contact?.platform || '';
  const displayEmail =
    contact?.email || contact?.supportEmail || 'Not listed yet';
  const displayPhone =
    contact?.phone || contact?.supportPhone || 'Use official in-app Help Center callback';
  const displayWebsite =
    contact?.website || contact?.portalUrl || contact?.url || '';
  const displayHours =
    contact?.supportHours || '24/7 via official app & help portal';

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
          powered by MongoDB and Gemini AI.
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
                  placeholder="Enter brand or platform name (e.g., Amazon India, Flipkart, Swiggy, Boat)..."
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
            <span className="chip-label">Verified Channels:</span>
            {popularContacts.map((name) => (
              <button
                key={name}
                type="button"
                className="chip"
                onClick={() => {
                  setQuery(name);
                  fetchSupport(name);
                }}
              >
                <ShieldCheck size={13} /> {name}
              </button>
            ))}

            {recentSearches
              .filter((t) => !popularContacts.includes(t))
              .slice(0, 3)
              .map((term) => (
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
            Pick a verified brand above or search any company
          </h2>
          <p style={{ maxWidth: '54ch', margin: '0 auto 18px' }}>
            Safe Cart checks MongoDB first and uses Gemini AI to retrieve
            anti-scam official channels and store them for future users.
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
        <>
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
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
                  {aiGenerated ? (
                    <span className="badge badge-info">
                      <Sparkles size={14} /> AI Verified Channel (Saved to DB)
                    </span>
                  ) : (
                    <span className="badge badge-verified">
                      <ShieldCheck size={14} /> Verified Official Contact
                    </span>
                  )}
                </div>
                <h2 style={{ fontSize: '1.65rem' }}>{displayName}</h2>
              </div>

              <Link
                to={`/complaint?platform=${encodeURIComponent(displayName)}`}
                className="btn btn-primary btn-sm"
              >
                Draft Complaint to This Brand <ArrowRight size={15} />
              </Link>
            </div>

            <div className="metrics-grid" style={{ marginTop: '20px' }}>
              {/* Official Email */}
              <div className="metric-box">
                <div
                  className="metric-label"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Mail size={15} color="var(--indigo)" /> Official Support / Grievance Email
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
                {displayPhone !== 'Use official in-app Help Center callback' && (
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

              {/* Support Hours */}
              <div className="metric-box">
                <div
                  className="metric-label"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Clock size={15} color="var(--indigo)" /> Support Hours & Availability
                </div>
                <div
                  className="metric-value"
                  style={{ fontSize: '1.02rem', wordBreak: 'break-word' }}
                >
                  {displayHours}
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

          {/* Interactive 5-Star Support & Safe Cart Service Feedback Card */}
          <section
            className="card-elevated"
            style={{ marginBottom: '24px' }}
            aria-label="Rate support contact and Safe Cart service"
          >
            <h2 style={{ fontSize: '1.3rem', marginBottom: '6px' }}>
              Was This Contact Helpful? Rate Support & Safe Cart Service
            </h2>
            <p
              style={{
                color: 'var(--ink-soft)',
                fontSize: '0.94rem',
                marginBottom: '16px',
              }}
            >
              Confirm if {displayName}'s contact worked and rate Safe Cart's
              directory service out of 5 stars.
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
                  Rate {displayName}'s Support Response (1 to 5 Stars)
                </label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  {[1, 2, 3, 4, 5].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setSupportStars(num)}
                      className="btn btn-outline btn-sm"
                      style={{
                        borderColor:
                          supportStars >= num ? '#F59E0B' : 'var(--border)',
                        background:
                          supportStars >= num
                            ? 'rgba(245, 158, 11, 0.12)'
                            : 'transparent',
                        color:
                          supportStars >= num ? '#B45309' : 'var(--ink-soft)',
                      }}
                    >
                      <Star
                        size={16}
                        fill={supportStars >= num ? '#F59E0B' : 'none'}
                        color={supportStars >= num ? '#F59E0B' : 'currentColor'}
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
                <label className="form-label" htmlFor="support-contact-note">
                  Contact Verification Note (Optional)
                </label>
                <textarea
                  id="support-contact-note"
                  className="form-control"
                  value={supportComment}
                  onChange={(e) => setSupportComment(e.target.value)}
                  placeholder="e.g., Grievance officer replied within 24 hours..."
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="support-service-note">
                  How is Safe Cart's service? (Optional feedback)
                </label>
                <textarea
                  id="support-service-note"
                  className="form-control"
                  value={serviceNote}
                  onChange={(e) => setServiceNote(e.target.value)}
                  placeholder="e.g., Saved me from calling a fake helpline ad..."
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
                    ? 'Saving Feedback...'
                    : 'Submit Support Rating & Service Feedback'}
                </button>
              </div>
            </form>
          </section>
        </>
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
                Official Support / Grievance Email
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
              <label className="form-label" htmlFor="sup-hours-input">
                Support Hours
              </label>
              <input
                id="sup-hours-input"
                type="text"
                className="form-control"
                value={newSupportHours}
                onChange={(e) => setNewSupportHours(e.target.value)}
                placeholder="e.g., 24/7 In-App Help"
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