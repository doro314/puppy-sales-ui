import { formatDay } from '../utils';

import './StatusChip.css';

const LABELS = { available: 'Available', reserved: 'Reserved', adopted: 'Adopted' };

// status is getPuppyStatus's answer: "soon" shows the litter's ready date instead of a word.
function StatusChip({ status, readyDate }) {
  const label = status === 'soon' ? `Ready ${formatDay(readyDate)}` : LABELS[status];
  return <span className={`status-chip status-chip--${status}`}>{label}</span>;
}

export default StatusChip;
