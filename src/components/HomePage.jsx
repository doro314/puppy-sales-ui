import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';

import LitterCard from './LitterCard';
import LitterStrip from './LitterStrip';
import PhotoCarousel from './PhotoCarousel';
import StatusChip from './StatusChip';
import { PawSvg } from './Icons';
import {
  countAvailable, getLitterPhotos, getListedLitters, getParentPhoto, getPuppyPhotos, getPuppyStatus, isSpokenFor,
} from '../data/puppies';
import { DEPOSIT_AMOUNT, formatDay, formatMonthYear } from '../utils';

import './HomePage.css';

// Matches HomePage.css: beside the card from 1100 px, full width beside the sidebar below that.
const HERO_SIZES = '(min-width: 1100px) 560px, (min-width: 768px) calc(100vw - 336px), 100vw';

function litterTitle(litter) {
  return litter.born ? `${litter.mom.name} & ${litter.dad.name}'s litter` : `${litter.mom.name} is expecting`;
}

// The line under the title: when (expecting), how many are left, or that they're all home.
function litterSubtitle(litter, hasPhotos) {
  if (!litter.born) {
    // The checker only warns when "due" is missing, so a fresh litter can go live without one.
    const parents = `${litter.mom.name} × ${litter.dad.name}`;
    return { text: litter.due ? `Due ${formatDay(litter.due)} · ${parents}` : parents, isOpen: false };
  }
  const total = litter.puppies.length;
  // Born, puppies not entered yet: the checker only warns, so this can go live.
  if (total === 0) return { text: 'Puppies coming soon', isOpen: false };
  if (isSpokenFor(litter)) return { text: 'Every puppy has a home', isOpen: false };
  if (!hasPhotos) return { text: `${total} ${total === 1 ? 'puppy' : 'puppies'} · photos coming soon`, isOpen: false };
  return { text: `${countAvailable(litter)} of ${total} still looking for a home`, isOpen: true };
}

function LitterHero({ litter }) {
  const photos = getLitterPhotos(litter);
  const title = litterTitle(litter);
  const subtitle = litterSubtitle(litter, photos.length > 0);
  const text = (
    <div className="hero-text">
      <h2 className="hero-title">{title}</h2>
      <p className={`hero-sub${subtitle.isOpen ? '' : ' hero-sub--off'}`}>{subtitle.text}</p>
    </div>
  );

  if (photos.length === 0) {
    return (
      <div className="hero hero--empty">
        <PawSvg className="hero-paw" aria-hidden="true" />
        {text}
      </div>
    );
  }
  return (
    <PhotoCarousel className="hero" photos={photos} label={title} sizes={HERO_SIZES} isAutoplay showCount>
      <div className="hero-shade" />
      {text}
    </PhotoCarousel>
  );
}

// The one thing a visitor can do next, in the same place every season.
function NextStep({ litter }) {
  if (!litter.born || litter.puppies.length === 0) return <Link to="/contact?about=waitlist" className="home-button">Join the waitlist</Link>;
  if (isSpokenFor(litter)) return <Link to="/contact?about=waitlist" className="home-button">Join the list for the next litter</Link>;
  if (countAvailable(litter) === 0) return null;
  return (
    <Link to="/contact" className="home-deposit">
      <span>Reserve today — <b>${DEPOSIT_AMOUNT}</b> holds your pup</span>
      <span className="home-deposit-go">Inquire →</span>
    </Link>
  );
}

function PuppyCard({ litter, puppy, today }) {
  const photo = getPuppyPhotos(litter, puppy)[0];
  return (
    <Link to={`/${puppy.slug}`} className={`puppy-card puppy-card--${puppy.sex}`}>
      {photo
        ? <img className="puppy-card-photo" src={photo.thumb} srcSet={photo.srcSet} sizes="(min-width: 768px) 200px, 45vw" alt="" loading="lazy" decoding="async" />
        : <span className="puppy-card-empty"><PawSvg className="puppy-card-empty-paw" aria-hidden="true" /><span>Photos soon</span></span>}
      <span className="puppy-card-row">
        <span className="puppy-card-name"><PawSvg className="puppy-card-paw" aria-hidden="true" />{puppy.name}</span>
        <StatusChip status={getPuppyStatus(puppy, litter, today)} readyDate={litter.readyDate} />
      </span>
    </Link>
  );
}

function PuppyGrid({ litter, today, heading = 'Meet the puppies', children }) {
  const available = countAvailable(litter);
  const hasPhotos = litter.puppies.some((puppy) => getPuppyPhotos(litter, puppy).length > 0);
  let note = `${available} available`;
  if (available === 0) note = 'all spoken for';
  else if (!hasPhotos) note = 'photos soon';
  const headingId = `puppies-${litter.id}`;

  return (
    <section className="home-puppies" aria-labelledby={headingId}>
      <div className="home-sechead">
        <h3 id={headingId}>{heading}</h3>
        <span className={available > 0 && hasPhotos ? 'home-sechead-note' : 'home-sechead-note home-sechead-note--off'}>{note}</span>
      </div>
      {children}
      <div className="puppy-grid">
        {litter.puppies.map((puppy) => <PuppyCard key={puppy.slug} litter={litter} puppy={puppy} today={today} />)}
      </div>
    </section>
  );
}

// A litter that's still listed under a newer one: its line and its puppies, no second
// gallery. Happens when a puppy is still unsold as the next litter arrives.
function OlderLitter({ litter, today }) {
  const when = litter.born ? ` ${formatMonthYear(litter.born)}` : '';
  return (
    <div className="home-older" id={`litter-${litter.id}`}>
      <PuppyGrid litter={litter} today={today} heading={`${litter.mom.name} & ${litter.dad.name}'s${when} litter`}>
        <LitterStrip litter={litter} hasLink={false} />
      </PuppyGrid>
    </div>
  );
}

// Behind ?parents=true only: the parents' photos are real but AI-cleaned, so they're
// never shown this large to everyone.
function ParentsSection({ litter }) {
  const parents = [['Dad', litter.dad], ['Mom', litter.mom]];
  return (
    <div className="parents-section">
      <div className="parents-top-bar" />
      <div className="parents-inner">
        <h3 className="parents-heading">Meet the Parents</h3>
        <p className="parents-sub">The proud mom &amp; dad behind this litter</p>
        <div className="parents-grid">
          {parents.map(([role, parent]) => (
            <div className="parent-card" key={role}>
              <div className="parent-img-wrap">
                <img src={getParentPhoto(parent)?.src} alt={`${parent.name} — ${role}`} className="parent-img" />
                <div className="parent-overlay">
                  <span className={`parent-role parent-role--${role.toLowerCase()}`}>{role}</span>
                  <span className="parent-name">{parent.name} / {parent.breed}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Every season leads with the newest listed litter; any older listed litter follows it.
function HomePage({ today, showParents = false }) {
  const location = useLocation();
  const [litter, ...olderLitters] = getListedLitters();
  const isDetailsLink = location.hash === `#litter-${litter.id}`;

  // A puppy page's "About the litter" lands here, on that litter, with its details open.
  useEffect(() => {
    if (location.hash) document.getElementById(location.hash.slice(1))?.scrollIntoView();
  }, [location.hash]);

  return (
    <div className="home">
      <div className="home-top">
        <LitterHero litter={litter} />
        <div className="home-about">
          <LitterCard litter={litter} today={today} defaultOpen={isDetailsLink} />
          {showParents && <ParentsSection litter={litter} />}
          <NextStep litter={litter} />
        </div>
      </div>
      {litter.puppies.length > 0 && <PuppyGrid litter={litter} today={today} />}
      {olderLitters.map((older) => <OlderLitter key={older.id} litter={older} today={today} />)}
    </div>
  );
}

export default HomePage;
