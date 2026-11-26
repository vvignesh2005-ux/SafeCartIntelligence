import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search,
  Mic,
  Link2,
  ImagePlus,
  Store,
  Globe,
  RotateCcw,
  Headphones,
  FileWarning,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  TrendingUp,
  ShieldCheck,
} from 'lucide-react';
import StarRating from '../components/StarRating';
import {
  API_BASE_URL,
  normalizeQuery,
  getRecentSearches,
  saveRecentSearch,
} from '../api';

export default function LandingPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [listening, setListening] = useState(false);
  const [helperNotice, setHelperNotice] = useState('');
  const [recentSearches, setRecentSearches] = useState(() =>
    getRecentSearches()
  );

  function extractTargetName(rawInput) {
    const trimmed = normalizeQuery(rawInput);
    if (!trimmed) return '';
    try {
      const withProtocol = /^https?:\/\//i.test(trimmed)
        ? trimmed
        : trimmed.includes('.') && !trimmed.includes(' ')
        ? `https://${trimmed}`
        : null;
      if (withProtocol) {
        const url = new URL(withProtocol);
        const host = url.hostname.replace(/^www\./i, '');
        const parts = host.split('.');
        return parts[0] || host;
      }
    } catch {
      // Not a URL; keep cleaned text
    }
    return trimmed;
  }

  async function handleSmartSearch(rawTerm) {
    const target = extractTargetName(rawTerm ?? query);
    if (!target) {
      setHelperNotice('Enter a seller name, store link, or marketplace to inspect.');
      return;
    }

    setHelperNotice('');
    setSearching(true);
    const updated = saveRecentSearch(target);
    setRecentSearches(updated);

    const compact = target.replace(/\s+/g, '');
    const candidates =
      compact.toLowerCase() !== target.toLowerCase()
        ? [target, compact]
        : [target];

    try {
      for (const name of candidates) {
        const sellerRes = await fetch(
          `${API_BASE_URL}/api/sellers/${encodeURIComponent(name)}`
        );
        if (sellerRes.ok) {
          const data = await sellerRes.json();
          if (data && (data.name || data.seller)) {
            navigate(`/seller?q=${encodeURIComponent(name)}`);
            return;
          }
        }
      }

      for (const name of candidates) {
        const platRes = await fetch(
          `${API_BASE_URL}/api/platforms/${encodeURIComponent(name)}`
        );
        if (platRes.ok) {
          const data = await platRes.json();
          if (data && (data.name || data.platform)) {
            navigate(`/platform?q=${encodeURIComponent(name)}`);
            return;
          }
        }
      }

      navigate(`/seller?q=${encodeURIComponent(target)}`);
    } catch {
      navigate(`/seller?q=${encodeURIComponent(target)}`);
    } finally {
      setSearching(false);
    }
  }

  function handleFormSubmit(e) {
    e.preventDefault();
    handleSmartSearch(query);
  }

  async function handlePasteLink() {
    setHelperNotice('');
    try {
      if (!navigator.clipboard?.readText) {
        setHelperNotice('Clipboard access is blocked here. Paste your link directly into the box above.');
        return;
      }
      const clipText = await navigator.clipboard.readText();
      if (!clipText || !clipText.trim()) {
        setHelperNotice('Your clipboard is empty. Copy a store link first, then click Paste Link.');
        return;
      }
      const extracted = extractTargetName(clipText);
      setQuery(extracted);
      setHelperNotice(`Extracted "${extracted}" from clipboard link. Checking evidence...`);
      handleSmartSearch(extracted);
    } catch {
      setHelperNotice('Allow clipboard permission or press Ctrl+V inside the search bar.');
    }
  }

  function handleVoiceSearch() {
    setHelperNotice('');
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setHelperNotice('Voice search works in Chrome or Edge. Type the store name above instead.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-IN';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setListening(true);
      setHelperNotice('Listening... Say a store or platform name now.');
    };

    recognition.onresult = (event) => {
      const spoken = event.results[0][0].transcript;
      setQuery(spoken);
      setHelperNotice(`Heard "${spoken}". Checking evidence...`);
      handleSmartSearch(spoken);
    };

    recognition.onerror = () => {
      setListening(false);
      setHelperNotice('Could not hear clearly. Try speaking closer to the mic or type the name.');
    };

    recognition.onend = () => {
      setListening(false);
    };

    recognition.start();
  }

  function handleScreenshotChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const baseName = file.name
      .replace(/\.[^/.]+$/, '')
      .replace(/[_-]+/g, ' ')
      .replace(/screenshot|img|whatsapp|instagram|photo|\d+/gi, '')
      .trim();

    if (baseName.length >= 3) {
      setQuery(baseName);
      setHelperNotice(
        `Screenshot "${file.name}" attached. Checking "${baseName}" — or open Complaint AI to draft a refund letter.`
      );
    } else {
      setHelperNotice(
        `Screenshot "${file.name}" ready. Type the seller's handle above to check their record, or open Complaint AI.`
      );
    }
    e.target.value = '';
  }

  return (
    <div>
      {/* Trending Startup Hero Section */}
      <section className="page-header" style={{ maxWidth: '880px' }}>
        <div className="eyebrow">
          <span className="pulse-dot" aria-hidden="true" />
          Evidence-Only Intelligence • Zero Guesswork
        </div>

        <h1 className="page-title">
          Verify the <span className="gradient-text">documented evidence</span>{' '}
          before you pay online.
        </h1>

        <p className="page-subtitle">
          Safe Cart never stamps a store "safe" or "unsafe." Inspect verified
          delivery rates, refund speed, real support contacts, and
          crowd-tested recovery playbooks in seconds—no sign-up needed.
        </p>

        {/* Elevated Spotlight Search Shell */}
        <form
          onSubmit={handleFormSubmit}
          style={{ marginTop: '26px' }}
          role="search"
          aria-label="Search seller or platform evidence"
        >
          <div className="search-shell">
            <div className="search-box">
              <div className="search-input-wrap">
                <Search size={21} color="var(--indigo)" aria-hidden="true" />
                <input
                  type="text"
                  className="search-input"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search seller, Instagram handle, or marketplace (e.g., ExampleStore)..."
                  aria-label="Seller or platform name"
                />
              </div>

              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={handlePasteLink}
                  aria-label="Paste link from clipboard"
                >
                  <Link2 size={15} />
                  <span>Paste Link</span>
                </button>

                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={handleVoiceSearch}
                  aria-label="Search by voice"
                >
                  <Mic
                    size={15}
                    color={listening ? '#DC2626' : 'currentColor'}
                  />
                  <span>{listening ? 'Listening...' : 'Voice'}</span>
                </button>

                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => fileInputRef.current?.click()}
                  aria-label="Upload order or store screenshot"
                >
                  <ImagePlus size={15} />
                  <span>Screenshot</span>
                </button>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleScreenshotChange}
                  style={{ display: 'none' }}
                  aria-hidden="true"
                />

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={searching}
                >
                  {searching ? 'Checking...' : 'Check Evidence'}
                </button>
              </div>
            </div>
          </div>

          {helperNotice && (
            <p
              role="status"
              style={{
                marginTop: '10px',
                fontSize: '0.9rem',
                color: 'var(--indigo)',
                fontWeight: 500,
              }}
            >
              {helperNotice}
            </p>
          )}

          {/* Quick Example & Recent Search Chips */}
          <div className="chip-row">
            <span className="chip-label">Try live records:</span>
            <button
              type="button"
              className="chip"
              onClick={() => handleSmartSearch('ExampleStore')}
            >
              <Store size={14} /> ExampleStore
            </button>
            <button
              type="button"
              className="chip"
              onClick={() => handleSmartSearch('ExampleMarket')}
            >
              <Globe size={14} /> ExampleMarket
            </button>

            {recentSearches.map((item) => (
              <button
                key={item}
                type="button"
                className="chip"
                onClick={() => handleSmartSearch(item)}
              >
                Recent: {item}
              </button>
            ))}
          </div>
        </form>
      </section>

      {/* High-Craft Asymmetric Bento Grid */}
      <section className="bento-grid" aria-label="Safe Cart Protection Tools">
        {/* Dark Telemetry Hero Tile: Seller Intelligence */}
        <article className="bento-hero-tile">
          <div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '10px',
                marginBottom: '16px',
              }}
            >
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '7px',
                  background: 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.16)',
                  padding: '5px 12px',
                  borderRadius: '999px',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                }}
              >
                <Store size={14} />
                Seller Evidence Engine
              </span>

              <span
                style={{
                  fontSize: '0.8rem',
                  color: '#6EE7B7',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontWeight: 600,
                }}
              >
                <CheckCircle2 size={15} /> Verified Telemetry
              </span>
            </div>

            <h2 style={{ fontSize: '1.65rem', marginBottom: '8px' }}>
              Audit any seller's real fulfillment record
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.82)', fontSize: '0.96rem' }}>
              Star ratings computed strictly from buyer-submitted order logs,
              refund turnaround times, and verified business identifiers.
            </p>

            {/* Live Evidence Card Preview */}
            <div
              style={{
                marginTop: '20px',
                background: 'rgba(255, 255, 255, 0.06)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255, 255, 255, 0.14)',
                borderRadius: '16px',
                padding: '18px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '8px',
                  marginBottom: '10px',
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: '0.75rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      color: 'rgba(255,255,255,0.62)',
                      fontWeight: 600,
                    }}
                  >
                    Sample Record
                  </div>
                  <strong style={{ fontSize: '1.12rem' }}>ExampleStore</strong>
                </div>
                <span
                  style={{
                    fontSize: '0.78rem',
                    background: 'rgba(16, 185, 129, 0.2)',
                    border: '1px solid rgba(52, 211, 153, 0.35)',
                    color: '#6EE7B7',
                    padding: '4px 10px',
                    borderRadius: '999px',
                    fontWeight: 600,
                  }}
                >
                  GST & Warehouse Logged
                </span>
              </div>

              <StarRating rating={4.3} count={128} size={17} light />

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                  gap: '14px',
                  marginTop: '14px',
                }}
              >
                <div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '0.8rem',
                      color: 'rgba(255,255,255,0.8)',
                    }}
                  >
                    <span>On-Time Delivery</span>
                    <strong>94%</strong>
                  </div>
                  <div className="evidence-bar-track">
                    <div
                      className="evidence-bar-fill"
                      style={{ width: '94%' }}
                    />
                  </div>
                </div>

                <div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '0.8rem',
                      color: 'rgba(255,255,255,0.8)',
                    }}
                  >
                    <span>Dispute Resolution</span>
                    <strong>89%</strong>
                  </div>
                  <div className="evidence-bar-track">
                    <div
                      className="evidence-bar-fill"
                      style={{ width: '89%' }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <Link
              to="/seller?q=ExampleStore"
              className="btn"
              style={{
                background: '#FFFFFF',
                color: '#0F172A',
                boxShadow: '0 8px 20px rgba(0,0,0,0.2)',
              }}
            >
              Inspect Seller Profile <ArrowRight size={17} />
            </Link>
          </div>
        </article>

        {/* Self-Improving Knowledge Loop Tile */}
        <article className="bento-side-tile">
          <div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '16px',
              }}
            >
              <div className="tile-icon">
                <Sparkles size={22} />
              </div>
              <span className="badge badge-verified">
                <TrendingUp size={13} /> Self-Improving AI
              </span>
            </div>

            <h2 style={{ fontSize: '1.42rem', marginBottom: '10px' }}>
              Crowd-Ranked Solution Loop
            </h2>
            <p style={{ color: 'var(--ink-soft)', fontSize: '0.96rem' }}>
              Describe a stuck refund or fake parcel. Our system matches the
              highest-success recovery playbook proven by past buyers—or uses
              Gemini AI to generate 4 tailored steps and learns from your
              outcome.
            </p>

            <div
              style={{
                marginTop: '16px',
                padding: '12px 14px',
                borderRadius: '12px',
                background: 'var(--sky)',
                border: '1px solid rgba(45, 63, 224, 0.14)',
                fontSize: '0.86rem',
                color: 'var(--indigo)',
                fontWeight: 500,
              }}
            >
              Every "Solved" vote boosts that solution to #1 for the next
              shopper.
            </div>
          </div>

          <Link
            to="/knowledge"
            className="btn btn-primary"
            style={{ width: '100%' }}
          >
            Launch Solution Loop <ArrowRight size={17} />
          </Link>
        </article>

        {/* Bottom Row Tile 1: Platform Analysis */}
        <article className="bento-tile">
          <div>
            <div className="tile-icon" style={{ marginBottom: '14px' }}>
              <Globe size={22} />
            </div>
            <h3 style={{ fontSize: '1.22rem', marginBottom: '8px' }}>
              Platform Analysis
            </h3>
            <p style={{ color: 'var(--ink-soft)', fontSize: '0.94rem' }}>
              Compare escrow protection, return enforcement, and dispute
              timelines across marketplaces and social commerce apps.
            </p>
          </div>
          <Link to="/platform?q=ExampleMarket" className="btn btn-secondary">
            Compare Platforms <ArrowRight size={16} />
          </Link>
        </article>

        {/* Bottom Row Tile 2: Return & Refund Guide */}
        <article className="bento-tile">
          <div>
            <div className="tile-icon" style={{ marginBottom: '14px' }}>
              <RotateCcw size={22} />
            </div>
            <h3 style={{ fontSize: '1.22rem', marginBottom: '8px' }}>
              Return & Refund Guide
            </h3>
            <p style={{ color: 'var(--ink-soft)', fontSize: '0.94rem' }}>
              Pick your exact platform to see real return windows, unboxing
              video rules, and bank chargeback deadlines.
            </p>
          </div>
          <Link to="/returns" className="btn btn-secondary">
            Open Return Rules <ArrowRight size={16} />
          </Link>
        </article>

        {/* Bottom Row Tile 3: Verified Support & Complaint AI */}
        <article className="bento-tile">
          <div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '14px',
              }}
            >
              <div style={{ display: 'flex', gap: '8px' }}>
                <div className="tile-icon">
                  <Headphones size={21} />
                </div>
                <div className="tile-icon">
                  <FileWarning size={21} />
                </div>
              </div>
              <span className="badge badge-info">
                <ShieldCheck size={13} /> PDF Ready
              </span>
            </div>
            <h3 style={{ fontSize: '1.22rem', marginBottom: '8px' }}>
              Verified Support & Complaint AI
            </h3>
            <p style={{ color: 'var(--ink-soft)', fontSize: '0.94rem' }}>
              Avoid scam helpline numbers and generate a formal consumer
              complaint letter ready to export as PDF.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <Link to="/support" className="btn btn-outline btn-sm">
              Support Contacts
            </Link>
            <Link to="/complaint" className="btn btn-secondary btn-sm">
              Complaint AI <ArrowRight size={15} />
            </Link>
          </div>
        </article>
      </section>
    </div>
  );
}