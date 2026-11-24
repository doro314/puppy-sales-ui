import { Fragment } from 'react';
import { Link } from 'react-router-dom';

import ParentAvatars from './ParentAvatars';
import { getCareDone } from '../data/puppies';
import { formatDay } from '../utils';

import './LitterStrip.css';

const CARE_CHECKS = { 'vet-check': 'Vet checked', dewormed: 'Dewormed', vaccinated: 'Vaccinated', microchipped: 'Microchipped' };

// The litter in one line: whose, when, and each care step done. Puppy pages link it
// to the litter's card on Home.
function LitterStrip({ litter, hasLink = true }) {
  const checks = getCareDone(litter).map((step) => CARE_CHECKS[step.type]);
  return (
    <div className="litter-strip">
      <ParentAvatars litter={litter} size={34} />
      <p>
        <b>From {litter.mom.name} × {litter.dad.name}&apos;s litter</b>
        {litter.born && ` · born ${formatDay(litter.born)}`}
        {(checks.length > 0 || hasLink) && <br />}
        {checks.map((check, i) => (
          <Fragment key={check}>
            {i > 0 && ' · '}
            <span className="litter-strip-check">✓ {check}</span>
          </Fragment>
        ))}
        {hasLink && (
          <>
            {checks.length > 0 && ' · '}
            <Link to={`/#litter-${litter.id}`} className="litter-strip-link">About the litter ›</Link>
          </>
        )}
      </p>
    </div>
  );
}

export default LitterStrip;
