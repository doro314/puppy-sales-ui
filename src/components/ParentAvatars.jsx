import { getParentPhoto } from '../data/puppies';

import './ParentAvatars.css';

function Avatar({ parent, role, size }) {
  const photo = getParentPhoto(parent);
  return (
    <span className="parent-avatar" style={{ '--avatar-size': `${size}px` }}>
      {photo
        ? <img src={photo.thumb} alt={`${parent.name}, ${role}`} loading="lazy" decoding="async" />
        : <span className="parent-avatar-initial" aria-label={`${parent.name}, ${role}`}>{parent.name.charAt(0)}</span>}
    </span>
  );
}

// The parents only ever appear this small: their photos are real but AI-cleaned.
function ParentAvatars({ litter, size = 36 }) {
  return (
    <span className="parent-avatars">
      <Avatar parent={litter.mom} role="mom" size={size} />
      <Avatar parent={litter.dad} role="dad" size={size} />
    </span>
  );
}

export default ParentAvatars;
