import { useState } from 'react';

import ParentAvatars from './ParentAvatars';
import { IconCalendar, IconCheck, IconHome } from './Icons';
import { getCareDone, getCareLog, isSpokenFor } from '../data/puppies';
import { firstClause, formatDay, pluralize } from '../utils';

import './LitterCard.css';

const CARE_LABELS = {
  'vet-check': 'Vet checked',
  dewormed: 'Dewormed',
  vaccinated: 'Vaccinated',
  microchipped: 'Microchipped',
};

function careValue(step) {
  if (!step.date) return step.type === 'dewormed' ? 'Done' : 'Yes';
  return step.note ? `${formatDay(step.date)} · ${step.note}` : formatDay(step.date);
}

// One tile per major detail: due (while expecting), born, goes home, then each care
// step once it's done. A step that hasn't happened has no tile — never a blank.
function litterTiles(litter, today) {
  if (!litter.born) {
    return litter.due ? [{ key: 'due', icon: <IconCalendar className="litter-tile-icon" />, label: 'Due', value: formatDay(litter.due) }] : [];
  }
  const tiles = [{ key: 'born', icon: <IconCalendar className="litter-tile-icon" />, label: 'Born', value: formatDay(litter.born) }];
  if (litter.readyDate) {
    const isHomeTime = today >= litter.readyDate && !isSpokenFor(litter);
    tiles.push({ key: 'home', icon: <IconHome className="litter-tile-icon" />, label: 'Goes home', value: isHomeTime ? 'Now' : formatDay(litter.readyDate) });
  }
  for (const step of getCareDone(litter)) {
    tiles.push({ key: step.type, icon: <IconCheck className="litter-tile-icon" />, isDone: true, label: CARE_LABELS[step.type], value: careValue(step) });
  }
  return tiles;
}

function LitterDetails({ litter }) {
  const careLog = getCareLog(litter);
  return (
    <div className="litter-details">
      {careLog.length > 0 && (
        <>
          <h4 className="litter-details-heading">Care so far</h4>
          <dl className="litter-details-care">
            {careLog.map((step) => (
              <div className="litter-details-row" key={`${step.type}-${step.date ?? 'done'}`}>
                <dt>{step.date ? formatDay(step.date) : '✓ Done'}</dt>
                <dd>{CARE_LABELS[step.type]}{step.note ? ` — ${step.note}` : ''}</dd>
              </div>
            ))}
          </dl>
        </>
      )}
      {litter.description && (
        <>
          <h4 className="litter-details-heading">Raised with us</h4>
          <p className="litter-details-text">{litter.description}</p>
        </>
      )}
      {litter.facts?.length > 0 && (
        <>
          <h4 className="litter-details-heading">About {pluralize(litter.breed)}</h4>
          <ul className="litter-details-facts">
            {litter.facts.map((fact) => <li key={fact}>{fact}</li>)}
          </ul>
        </>
      )}
    </div>
  );
}

// Who (the parents as small icons and how the puppies are raised) above what and
// when (the tiles). "More about the litter" opens the care log and breed facts in place.
function LitterCard({ litter, today, defaultOpen = false }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const tiles = litterTiles(litter, today);
  const hasDetails = Boolean(litter.description || litter.facts?.length || litter.care?.length);

  return (
    <section className="litter-card" id={`litter-${litter.id}`} aria-label="About the litter">
      <div className="litter-card-panel">
        <div className="litter-card-bar" />
        <div className="litter-story">
          <div className="litter-story-head">
            <ParentAvatars litter={litter} />
            <p><b>{litter.mom.name} × {litter.dad.name}</b> · Mom &amp; dad · {pluralize(litter.breed)}</p>
          </div>
          {(litter.description || hasDetails) && (
            <p className="litter-story-text">
              {litter.description && `${firstClause(litter.description)} `}
              {hasDetails && (
                <button type="button" className="litter-more" aria-expanded={isOpen} onClick={() => setIsOpen((open) => !open)}>
                  {isOpen ? 'Less about the litter' : 'More about the litter'} <span aria-hidden="true">{isOpen ? '‹' : '›'}</span>
                </button>
              )}
            </p>
          )}
        </div>
        {isOpen && <LitterDetails litter={litter} />}
      </div>

      {tiles.length > 0 && (
        <div className="litter-tiles">
          {tiles.map((tile, i) => {
            const isLastAlone = i === tiles.length - 1 && tiles.length % 2 === 1;
            return (
              <div className={`litter-tile${isLastAlone ? ' litter-tile--span' : ''}`} key={tile.key}>
                <span className={`litter-tile-badge${tile.isDone ? ' litter-tile-badge--done' : ''}`}>{tile.icon}</span>
                <span className="litter-tile-text">
                  <small>{tile.label}</small>
                  <b>{tile.value}</b>
                </span>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default LitterCard;
