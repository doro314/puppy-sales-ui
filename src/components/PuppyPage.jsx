import { useState } from 'react';
import { Link } from 'react-router-dom';

import LitterStrip from './LitterStrip';
import PhotoCarousel from './PhotoCarousel';
import StatusChip from './StatusChip';
import { PawSvg } from './Icons';
import { getPuppyPhotos, getPuppyStatus, isSpokenFor } from '../data/puppies';
import { DEPOSIT_AMOUNT, capitalize, formatAge, formatCoat, formatWeight } from '../utils';

import './PuppyPage.css';

// The facts a puppy page shows, in this order, under these labels. A fact with no value
// is skipped. A new fact needs a line here as well as in the data — on purpose.
const PUPPY_FACTS = [
  ['Color', (puppy) => formatCoat(puppy.color, puppy.pattern)],
  ['Markings', (puppy) => puppy.markings],
  ['Weight', (puppy, litter) => formatWeight(puppy.weights, litter.born)],
  ['Personality', (puppy) => puppy.personality],
];

const pronoun = (puppy) => (puppy.sex === 'female' ? { subject: 'her', possessive: 'Her' } : { subject: 'him', possessive: 'His' });

function statusLine(litter, status, today, isRetired) {
  if (isRetired) return 'has gone home';
  if (status === 'available') return 'ready to go home now';
  if (status === 'soon') return litter.born ? formatAge(litter.born, today) : 'coming soon';
  if (status === 'reserved') return 'has a family waiting';
  return isSpokenFor(litter) ? 'every puppy in this litter has a home' : 'has found a home';
}

function MateCard({ litter, puppy, today }) {
  const photo = getPuppyPhotos(litter, puppy)[0];
  return (
    <Link to={`/${puppy.slug}`} className={`pup-mate pup-mate--${puppy.sex}`}>
      {photo
        ? <img className="pup-mate-photo" src={photo.thumb} alt="" loading="lazy" decoding="async" />
        : <span className="pup-mate-photo pup-mate-photo--empty"><PawSvg className="pup-mate-empty-paw" aria-hidden="true" /></span>}
      <span className="pup-mate-name"><PawSvg className="pup-mate-paw" aria-hidden="true" />{puppy.name}</span>
      <StatusChip status={getPuppyStatus(puppy, litter, today)} readyDate={litter.readyDate} />
    </Link>
  );
}

function MateRow({ litter, puppies, today, heading }) {
  return (
    <section className="pup-mates">
      <h3 className="pup-sec">{heading}</h3>
      <div className="pup-mates-row">
        {puppies.map((mate) => <MateCard key={mate.slug} litter={litter} puppy={mate} today={today} />)}
      </div>
    </section>
  );
}

function WaitlistStep() {
  return (
    <div className="pup-next">
      <Link to="/contact?about=waitlist" className="pup-button pup-button--navy">Join the list for the next litter</Link>
      <p className="pup-note">Opens the form, ready to send</p>
    </div>
  );
}

// What a visitor can do on this page: inquire, get in line, meet who's left, or join the list.
function NextStep({ puppy, litter, status, today, isRetired }) {
  if (isRetired) return <WaitlistStep />;
  if (status === 'available' || status === 'soon') {
    return (
      <div className="pup-next">
        <Link to={`/contact?about=${puppy.slug}`} className="pup-button">
          <PawSvg className="pup-button-paw" aria-hidden="true" />
          {status === 'soon' ? `Get in line for ${puppy.name}` : `Inquire about ${puppy.name}`}
        </Link>
        <p className="pup-note">Reserve today — ${DEPOSIT_AMOUNT} holds {pronoun(puppy).subject}</p>
      </div>
    );
  }
  const stillLooking = litter.puppies.filter((mate) => mate.status === 'available');
  if (stillLooking.length > 0) {
    return <MateRow litter={litter} puppies={stillLooking} today={today} heading="Still looking for homes" />;
  }
  return <WaitlistStep />;
}

// PUP-2: the photo first, then who she is and whether she can be yours, then how.
// A puppy from a retired litter ("listed": false) keeps her page, so an old link still
// lands somewhere true: she has gone home, and the list for the next litter is open.
function PuppyPage({ puppy, litter, today }) {
  const [photoIndex, setPhotoIndex] = useState(0);
  const isRetired = !litter.listed;
  const photos = getPuppyPhotos(litter, puppy);
  const status = isRetired ? 'adopted' : getPuppyStatus(puppy, litter, today);
  const facts = PUPPY_FACTS
    .map(([label, read]) => [label, read(puppy, litter)])
    .filter(([, value]) => value);
  const mates = litter.puppies.filter((mate) => mate.slug !== puppy.slug);
  const isOffered = status === 'available' || status === 'soon';

  return (
    <article className={`pup pup--${puppy.sex}`}>
      <div className="pup-back">
        <Link to="/">‹ All puppies</Link>
        {photos.length > 1 && <span aria-hidden="true">{photoIndex + 1} / {photos.length}</span>}
      </div>

      {photos.length > 0
        ? <PhotoCarousel className="pup-photos" photos={photos} label={puppy.name} sizes="(min-width: 768px) 440px, 100vw" showDots showThumbnails onIndexChange={setPhotoIndex} />
        : <div className="pup-photos-empty"><PawSvg className="pup-photos-empty-paw" aria-hidden="true" /><span>Photos coming soon</span></div>}

      <div className="pup-main">
        <div className="pup-id">
          <div className="pup-id-row">
            <h2 className="pup-title"><span className="pup-title-prefix">Name | </span>{puppy.name}</h2>
            <StatusChip status={status} readyDate={litter.readyDate} />
          </div>
          <p className="pup-sub"><b>{capitalize(puppy.sex)}</b> · {statusLine(litter, status, today, isRetired)}</p>
        </div>

        <NextStep puppy={puppy} litter={litter} status={status} today={today} isRetired={isRetired} />

        {facts.length > 0 && (
          <section className="pup-about">
            <h3 className="pup-sec">About {puppy.name}</h3>
            <dl className="pup-facts">
              {facts.map(([label, value]) => (
                <div className="pup-fact" key={label}>
                  <dt>{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
          </section>
        )}

        <LitterStrip litter={litter} hasLink={!isRetired} />
      </div>

      {isOffered && mates.length > 0 && (
        <MateRow litter={litter} puppies={mates} today={today} heading={`${pronoun(puppy).possessive} littermates`} />
      )}
    </article>
  );
}

export default PuppyPage;
