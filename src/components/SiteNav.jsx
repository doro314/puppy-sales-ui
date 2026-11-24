import { Fragment, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import StatusChip from './StatusChip';
import { IconClose, IconHamburger, PawSvg } from './Icons';
import { ACCENTS } from '../utils';

import './SiteNav.css';

function NavLink({ to, isActive, isBold = false, onNavigate, children }) {
  let className = 'site-nav-link';
  if (isBold) className += ' site-nav-link--bold';
  if (isActive) className += ' site-nav-link--active';
  return (
    <Link to={to} className={className} aria-current={isActive ? 'page' : undefined} onClick={onNavigate}>
      {children}
    </Link>
  );
}

// Phones: one sticky bar; its menu button opens the page list over the page.
// From 768 px: the header spans the top and the page list is a sidebar.
// Every puppy's status sits beside its name, so nobody opens a reserved puppy expecting to inquire.
// puppyGroups: one group per listed litter with puppies — [{ id, label, puppies }].
function SiteNav({ siteName, tagline, puppyGroups, activeId, showContact = false }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const closeMenu = () => setIsMenuOpen(false);

  // Any navigation closes the menu — Back, or a link inside the page. A tap on the
  // page you're already on changes nothing here, so the links close it themselves.
  useEffect(() => {
    setIsMenuOpen(false);
  }, [activeId]);

  useEffect(() => {
    if (!isMenuOpen) return;
    const handleKey = (e) => { if (e.key === 'Escape') setIsMenuOpen(false); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isMenuOpen]);

  return (
    <>
      <header className="site-header">
        <Link to="/" className="site-brand" onClick={closeMenu}>
          <PawSvg className="site-brand-paw" aria-hidden="true" />
          <span className="site-brand-emoji" aria-hidden="true">🐾</span>
          <span className="site-brand-text">
            <span className="site-title">{siteName}</span>
            <span className="site-tagline">{tagline}</span>
          </span>
        </Link>
        <button
          type="button"
          className="site-menu-button"
          onClick={() => setIsMenuOpen((open) => !open)}
          aria-expanded={isMenuOpen}
          aria-controls="site-nav"
          aria-label={isMenuOpen ? 'Close menu' : 'Menu'}
        >
          {isMenuOpen ? <IconClose className="site-menu-icon" /> : <IconHamburger className="site-menu-icon" />}
        </button>
      </header>

      {isMenuOpen && <div className="site-nav-scrim" onClick={closeMenu} aria-hidden="true" />}

      <nav id="site-nav" className={`site-nav${isMenuOpen ? ' site-nav--open' : ''}`} aria-label="Pages">
        <NavLink to="/" isActive={activeId === 'home'} isBold onNavigate={closeMenu}>Home</NavLink>
        {puppyGroups.map((group) => (
          <Fragment key={group.id}>
            <p className="site-nav-section">{group.label}</p>
            {group.puppies.map((puppy) => {
              const isActive = activeId === puppy.slug;
              const pawColor = isActive ? 'white' : (ACCENTS[puppy.sex] ?? ACCENTS.neutral).light;
              return (
                <NavLink key={puppy.slug} to={`/${puppy.slug}`} isActive={isActive} onNavigate={closeMenu}>
                  <PawSvg className="site-nav-paw" fill={pawColor} aria-hidden="true" />
                  <span className="site-nav-name">{puppy.name}</span>
                  <StatusChip status={puppy.status} readyDate={puppy.readyDate} />
                </NavLink>
              );
            })}
          </Fragment>
        ))}
        {showContact && (
          <div className="site-nav-contact">
            <NavLink to="/contact" isActive={activeId === 'contact'} onNavigate={closeMenu}>Contact Us</NavLink>
          </div>
        )}
      </nav>
    </>
  );
}

export default SiteNav;
