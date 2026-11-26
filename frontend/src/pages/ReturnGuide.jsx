import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  RotateCcw,
  Video,
  Clock,
  ShieldAlert,
  CheckCircle2,
  ArrowRight,
  Landmark,
  FileCheck2,
} from 'lucide-react';
import { API_BASE_URL, normalizeQuery } from '../api';

const PLATFORM_GUIDES = {
  ExampleMarket: {
    name: 'ExampleMarket',
    category: 'Verified Escrow Marketplace',
    returnWindow: '7 to 10 Days from Delivery',
    refundTimeline: '3 to 5 Business Days after Pickup',
    escrowRule:
      'Payment is held in marketplace escrow until the return window closes or delivery is confirmed.',
    steps: [
      'Record a continuous, unedited unboxing video showing the outer shipping label and seal before opening.',
      'Open Orders inside ExampleMarket before the 7-day window expires and select "Item Defective / Not as Described."',
      'Upload clear photos of the serial number, packaging, and defect inside the in-app claim form.',
      'Keep the courier pickup receipt; if refund is not credited within 5 business days, escalate via Grievance Officer or Complaint AI.',
    ],
  },
  'Amazon / Flipkart': {
    name: 'Amazon / Flipkart',
    category: 'Large E-Commerce Marketplace',
    returnWindow: '7 to 10 Days (Replacement or Refund)',
    refundTimeline: '2 to 5 Business Days (UPI / Card)',
    escrowRule:
      'Marketplace holds seller payout; Open-Box Delivery (OBD) requires inspecting the item before sharing the delivery OTP.',
    steps: [
      'For Open-Box Delivery orders, inspect the physical product in front of the delivery agent before giving the OTP.',
      'Never share your delivery OTP over a phone call if the courier has not arrived at your door.',
      'Submit the return request inside the app within the listed return window with photos of the outer box and invoice.',
      'If a seller rejects a valid return, escalate to the platform Grievance Officer (48-hour acknowledgement rule) or call 1915.',
    ],
  },
  'Instagram / WhatsApp Seller': {
    name: 'Instagram / WhatsApp Seller',
    category: 'Direct Social Commerce (No Escrow)',
    returnWindow: 'No Built-In Platform Return Window',
    refundTimeline: 'Depends on Seller / Bank Chargeback',
    escrowRule:
      'Direct UPI transfers go straight to the seller without escrow. Protection relies on pre-payment verification and bank dispute windows.',
    steps: [
      'Save screenshots of the Instagram profile, product post, promised delivery date, and full WhatsApp chat history.',
      'Record a complete unboxing video starting from the sealed parcel with the AWB tracking number clearly visible.',
      'Send a written refund demand on WhatsApp/Email with a clear 48-hour deadline and keep proof of delivery.',
      'If blocked or ignored, raise a UPI/Card dispute with your bank within 45 calendar days (using your UTR number) and file on consumerhelpline.gov.in.',
    ],
  },
  'Meesho / Myntra / Ajio': {
    name: 'Meesho / Myntra / Ajio',
    category: 'Fashion & Lifestyle Marketplace',
    returnWindow: '5 to 14 Days (Check Tag & Seal Rules)',
    refundTimeline: '3 to 7 Business Days',
    escrowRule:
      'Escrow-backed marketplace; brand tags and original packaging must stay intact during doorstep quality check.',
    steps: [
      'Keep all original brand tags, hygiene seals, and barcode pouches intact until you confirm fit and quality.',
      'Film a quick opening video in case the wrong size, used item, or empty box arrives.',
      'Initiate return in-app before the deadline and ensure the pickup agent marks Quality Check Passed on their device.',
      'Save the SMS/email pickup confirmation until the refund reflects in your bank or original payment method.',
    ],
  },
};

export default function ReturnGuide() {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlPlatform = normalizeQuery(searchParams.get('platform'));

  const [selectedKey, setSelectedKey] = useState('ExampleMarket');
  const [customPlatformName, setCustomPlatformName] = useState('');
  const [livePlatformData, setLivePlatformData] = useState(null);
  const [checkedSteps, setCheckedSteps] = useState({});

  useEffect(() => {
    if (!urlPlatform) return;

    const matchedKey = Object.keys(PLATFORM_GUIDES).find(
      (k) => k.toLowerCase() === urlPlatform.toLowerCase()
    );

    if (matchedKey) {
      setSelectedKey(matchedKey);
      setCustomPlatformName('');
    } else {
      setSelectedKey('CUSTOM');
      setCustomPlatformName(urlPlatform);
    }

    // Also try fetching live policy details from backend if available
    fetch(`${API_BASE_URL}/api/platforms/${encodeURIComponent(urlPlatform)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        const record = data?.platform || data;
        if (record && (record.name || record.platformName)) {
          setLivePlatformData(record);
        } else {
          setLivePlatformData(null);
        }
      })
      .catch(() => setLivePlatformData(null));
  }, [urlPlatform]);

  function handleSelectPreset(key) {
    setSelectedKey(key);
    setCustomPlatformName('');
    setLivePlatformData(null);
    setCheckedSteps({});
    setSearchParams({ platform: key });
  }

  function toggleStep(idx) {
    setCheckedSteps((prev) => ({ ...prev, [idx]: !prev[idx] }));
  }

  const activeGuide =
    selectedKey === 'CUSTOM'
      ? {
          name: customPlatformName || 'Custom Online Store',
          category: livePlatformData
            ? 'Documented Backend Profile'
            : 'Custom Storefront Checklist',
          returnWindow: livePlatformData?.returnWindowDays
            ? `${livePlatformData.returnWindowDays} Days (Logged Policy)`
            : 'Check Product Page Before Ordering',
          refundTimeline: '3 to 7 Business Days (or Bank Dispute)',
          escrowRule:
            livePlatformData?.escrowPolicy ||
            'Verify whether the site uses a regulated payment gateway or direct bank/UPI transfer.',
          steps: [
            `Screenshot the product description, price, and return policy shown on ${
              customPlatformName || 'the store'
            }.`,
            'Record a continuous unboxing video showing the sealed package and courier label before opening.',
            'Submit a written return or refund request via official email/support ticket and record the ticket ID.',
            'If unresolved after 48 hours, generate a formal letter in Complaint AI or raise a bank chargeback within 45 days.',
          ],
        }
      : PLATFORM_GUIDES[selectedKey] || PLATFORM_GUIDES.ExampleMarket;

  return (
    <div>
      {/* Page Header */}
      <section className="page-header">
        <div className="eyebrow">
          <RotateCcw size={15} />
          Platform-Specific Return & Refund Playbook
        </div>
        <h1 className="page-title">
          Follow the exact <span className="gradient-text">refund rules</span>{' '}
          for your platform
        </h1>
        <p className="page-subtitle">
          Choose where you bought the item to see verified return windows,
          unboxing evidence rules, and RBI/NPCI payment dispute deadlines.
        </p>

        {/* Platform Selector Pills */}
        <div className="chip-row" style={{ marginTop: '18px' }}>
          <span className="chip-label">Select Platform:</span>
          {Object.keys(PLATFORM_GUIDES).map((key) => {
            const isSelected = selectedKey === key;
            return (
              <button
                key={key}
                type="button"
                className="chip"
                onClick={() => handleSelectPreset(key)}
                aria-pressed={isSelected}
                style={
                  isSelected
                    ? {
                        background: 'var(--indigo)',
                        color: '#FFFFFF',
                        borderColor: 'var(--indigo)',
                      }
                    : undefined
                }
              >
                {key}
              </button>
            );
          })}
          {selectedKey === 'CUSTOM' && customPlatformName && (
            <span
              className="chip"
              style={{
                background: 'var(--indigo)',
                color: '#FFFFFF',
                borderColor: 'var(--indigo)',
              }}
            >
              {customPlatformName}
            </span>
          )}
        </div>
      </section>

      {/* Active Platform Rule Summary */}
      <section className="card-elevated" style={{ marginBottom: '24px' }}>
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
            <span className="badge badge-info" style={{ marginBottom: '8px' }}>
              {activeGuide.category}
            </span>
            <h2 style={{ fontSize: '1.6rem' }}>
              Platform: {activeGuide.name}
            </h2>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <Link
              to={`/complaint?platform=${encodeURIComponent(activeGuide.name)}`}
              className="btn btn-primary btn-sm"
            >
              Draft Refund Letter <ArrowRight size={15} />
            </Link>
            <Link
              to={`/support?q=${encodeURIComponent(activeGuide.name)}`}
              className="btn btn-outline btn-sm"
            >
              Official Support Contacts
            </Link>
          </div>
        </div>

        {/* Key Policy Metrics */}
        <div className="metrics-grid" style={{ marginTop: '20px' }}>
          <div className="metric-box">
            <div className="metric-label">Return Claim Window</div>
            <div className="metric-value" style={{ fontSize: '1.12rem' }}>
              {activeGuide.returnWindow}
            </div>
          </div>

          <div className="metric-box">
            <div className="metric-label">Expected Refund Credit</div>
            <div className="metric-value" style={{ fontSize: '1.12rem' }}>
              {activeGuide.refundTimeline}
            </div>
          </div>

          <div className="metric-box">
            <div className="metric-label">UPI / Card Chargeback Cutoff</div>
            <div className="metric-value" style={{ fontSize: '1.12rem' }}>
              45 Calendar Days
            </div>
          </div>
        </div>

        {/* Escrow Explanation */}
        <div
          style={{
            marginTop: '18px',
            padding: '14px 16px',
            borderRadius: '12px',
            background: 'var(--sky)',
            border: '1px solid rgba(45, 63, 224, 0.16)',
            color: 'var(--ink-soft)',
            fontSize: '0.95rem',
          }}
        >
          <strong style={{ color: 'var(--indigo)' }}>Payment Rule: </strong>
          {activeGuide.escrowRule}
        </div>

        {/* Interactive Step-by-Step Evidence Checklist */}
        <div style={{ marginTop: '24px' }}>
          <h3
            style={{
              fontSize: '1.12rem',
              marginBottom: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <FileCheck2 size={19} color="var(--indigo)" />
            Step-by-Step Return & Evidence Checklist (Click to Tick Off)
          </h3>

          <div style={{ display: 'grid', gap: '10px' }}>
            {activeGuide.steps.map((stepText, idx) => {
              const done = !!checkedSteps[idx];
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => toggleStep(idx)}
                  aria-pressed={done}
                  style={{
                    textAlign: 'left',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                    padding: '14px 16px',
                    borderRadius: '13px',
                    border: done
                      ? '1.5px solid var(--verify-green)'
                      : '1px solid var(--border)',
                    background: done ? 'var(--verify-bg)' : 'var(--mist)',
                    cursor: 'pointer',
                  }}
                >
                  <CheckCircle2
                    size={20}
                    color={done ? 'var(--verify-green)' : 'var(--ink-muted)'}
                    style={{ flexShrink: 0, marginTop: '2px' }}
                  />
                  <span
                    style={{
                      color: done ? 'var(--ink)' : 'var(--ink-soft)',
                      textDecoration: done ? 'line-through' : 'none',
                      fontSize: '0.96rem',
                    }}
                  >
                    <strong>Step {idx + 1}:</strong> {stepText}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Consumer Rights Reference Cards */}
      <section className="metrics-grid" aria-label="Consumer escalation rights">
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <Video size={18} color="var(--indigo)" />
            <h3 style={{ fontSize: '1.05rem' }}>Unboxing Proof Standard</h3>
          </div>
          <p style={{ fontSize: '0.92rem', color: 'var(--ink-soft)' }}>
            Always film all 6 sides of the sealed parcel and the shipping label
            before cutting tape. Uncut video is the strongest evidence for both
            marketplace claims and bank chargebacks.
          </p>
        </div>

        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <Landmark size={18} color="var(--indigo)" />
            <h3 style={{ fontSize: '1.05rem' }}>Bank & UPI Dispute Clock</h3>
          </div>
          <p style={{ fontSize: '0.92rem', color: 'var(--ink-soft)' }}>
            Under NPCI rules, UPI payment disputes can be raised with your
            remitting bank within 45 calendar days using the 12-digit UTR
            number, and beneficiary banks have 15 days to respond.
          </p>
        </div>

        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <ShieldAlert size={18} color="var(--indigo)" />
            <h3 style={{ fontSize: '1.05rem' }}>National Consumer Helpline</h3>
          </div>
          <p style={{ fontSize: '0.92rem', color: 'var(--ink-soft)' }}>
            If a platform ignores your written complaint past 48 hours, call{' '}
            <strong>1915</strong> (toll-free) or file online at{' '}
            <strong>consumerhelpline.gov.in</strong> with your order ID.
          </p>
        </div>
      </section>
    </div>
  );
}