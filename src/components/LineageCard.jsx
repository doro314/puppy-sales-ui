import { IconCheck } from './Icons';
import { getLineagePhoto } from '../data/puppies';

import './LineageCard.css';

// Kept clear of the pink and blue that mean female and male.
const BREED_GROUPS = [
  ['poodle', 'Poodle', '#2c3e50'],
  ['havanese', 'Havanese', '#b07a46'],
  ['bichon', 'Bichon family', '#d8c3a0'],
  ['other', 'Other', '#a9b6c4'],
];

const BREED_NOTES = { bichon: "Havanese's close cousins" };

function barLabel(breeds) {
  return `${breeds.poodle + breeds.havanese}% Poodle and Havanese, ${breeds.bichon}% Bichon family, ${breeds.other}% other`;
}

// One puppy's test stands for the pair's line, so the card promises the lineage,
// never the percentages: those are always credited to the puppy who was tested.
// A native <details> opens and closes with no state and no script.
function LineageCard({ lineage, mom, dad }) {
  const { breeds, source, sourceUrl, tested, testedFrom } = lineage;
  const photo = getLineagePhoto(lineage);

  return (
    <details className="lineage">
      <summary className="lineage-summary">
        <span className="lineage-summary-top">
          <svg className="lineage-seal" viewBox="0 0 48 48" aria-hidden="true">
            <path fill="#b07a46" d="M24 2l4.6 4.2 6.2-.9 2.3 5.8 5.8 2.3-.9 6.2L46 24l-4 4.4.9 6.2-5.8 2.3-2.3 5.8-6.2-.9L24 46l-4.6-4.2-6.2.9-2.3-5.8-5.8-2.3.9-6.2L2 24l4.2-4.6-.9-6.2 5.8-2.3 2.3-5.8 6.2.9z" />
            <circle cx="24" cy="24" r="13" fill="none" stroke="#fff" strokeWidth="1.6" opacity=".6" />
            <path d="M18 24.5l4 4 8-8.5" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="lineage-summary-text">
            <b>DNA-confirmed Havapoo pairing</b>
            <small>Poodle × Havanese · {source}</small>
          </span>
          <svg className="lineage-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="m6 9 6 6 6-6" />
          </svg>
        </span>
        <span className="lineage-bar" role="img" aria-label={barLabel(breeds)}>
          {BREED_GROUPS.filter(([key]) => breeds[key] > 0).map(([key, , color]) => (
            <span className="lineage-bar-segment" key={key} style={{ '--seg': color, width: `${breeds[key]}%` }} />
          ))}
        </span>
        <span className="lineage-more">What this means for every puppy</span>
      </summary>

      <div className="lineage-body">
        <ul className="lineage-breeds">
          {BREED_GROUPS.map(([key, label, color]) => (
            <li className="lineage-breed" key={key}>
              <span className="lineage-swatch" style={{ '--seg': color }} aria-hidden="true" />
              {label}
              {BREED_NOTES[key] && <em>{BREED_NOTES[key]}</em>}
              <b>{breeds[key]}%</b>
            </li>
          ))}
        </ul>

        <h4 className="lineage-heading">What this means for every puppy</h4>
        <ul className="lineage-points">
          <li className="lineage-point">
            <IconCheck className="lineage-point-icon" />
            <span>Every puppy is half {mom.name}, half {dad.name}, so they all come from this same Poodle × Havanese line.</span>
          </li>
          <li className="lineage-point">
            <IconCheck className="lineage-point-icon" />
            <span>Applies to this litter and every future {mom.name} × {dad.name} litter.</span>
          </li>
          <li className="lineage-point lineage-point--soft">
            <span className="lineage-point-info" aria-hidden="true">i</span>
            <span>Each puppy's exact percentages vary a little, like siblings in any family.</span>
          </li>
        </ul>

        <div className="lineage-proof">
          {photo && <img className="lineage-proof-photo" src={photo.thumb} alt="" loading="lazy" decoding="async" />}
          <span>
            <b>Tested: {tested}<sup className="lineage-ref">1</sup></b>
            {testedFrom && <small>{testedFrom}</small>}
          </span>
        </div>
        <p className="lineage-source">
          <sup>1</sup>{' '}
          {sourceUrl
            ? <a className="lineage-source-link" href={sourceUrl} target="_blank" rel="noopener">{source}</a>
            : source}
          , breed ancestry results for {tested}.
        </p>
      </div>
    </details>
  );
}

export default LineageCard;
