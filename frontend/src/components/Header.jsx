import { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { ShieldCheck, Menu, X } from 'lucide-react';

const NAV_ITEMS = [
  { to: '/', label: 'Home' },
  { to: '/seller', label: 'Seller Check' },
  { to: '/platform', label: 'Platforms' },
  { to: '/returns', label: 'Return Guide' },
  { to: '/support', label: 'Support Finder' },
  { to: '/complaint', label: 'Complaint AI' },
  { to: '/knowledge', label: 'Solution Loop' },
];

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="site-header">
      <div className="header-inner">
        <Link
          to="/"
          className="brand-link"
          onClick={() => setMenuOpen(false)}
          aria-label="Safe Cart Intelligence Home"
        >
          <span className="brand-badge" aria-hidden="true">
            <ShieldCheck size={20} strokeWidth={2.4} />
          </span>
          <span>Safe Cart</span>
          <span className="brand-tag">Evidence Only</span>
        </Link>

        <nav className="desktop-nav" aria-label="Main navigation">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `nav-item${isActive ? ' active' : ''}`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <button
          type="button"
          className="mobile-menu-btn"
          onClick={() => setMenuOpen((prev) => !prev)}
          aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={menuOpen}
        >
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {menuOpen && (
        <nav
          className="mobile-nav-drawer open"
          aria-label="Mobile navigation"
        >
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              onClick={() => setMenuOpen(false)}
              className={({ isActive }) =>
                `nav-item${isActive ? ' active' : ''}`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      )}
    </header>
  );
}