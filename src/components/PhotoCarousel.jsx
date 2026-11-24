import { useCallback, useEffect, useRef, useState } from 'react';

import { IconClose, IconExpand } from './Icons';

import './PhotoCarousel.css';

const AUTOPLAY_INTERVAL_MS = 8000;
const MAX_DOTS = 12;

function usePrefersReducedMotion() {
  const query = '(prefers-reduced-motion: reduce)';
  const [prefersReduced, setPrefersReduced] = useState(() => window.matchMedia?.(query).matches ?? false);
  useEffect(() => {
    const media = window.matchMedia?.(query);
    if (!media) return undefined;
    const handleChange = () => setPrefersReduced(media.matches);
    media.addEventListener('change', handleChange);
    return () => media.removeEventListener('change', handleChange);
  }, []);
  return prefersReduced;
}

function Lightbox({ photos, index, label, onIndexChange, onClose }) {
  const closeRef = useRef(null);
  const count = photos.length;
  const photo = photos[index];

  useEffect(() => {
    closeRef.current?.focus();
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowRight') onIndexChange((index + 1) % count);
      else if (e.key === 'ArrowLeft') onIndexChange((index - 1 + count) % count);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [index, count, onClose, onIndexChange]);

  const step = (e, delta) => {
    e.stopPropagation();
    onIndexChange((index + delta + count) % count);
  };

  return (
    <div className="carousel-lightbox" role="dialog" aria-modal="true" aria-label={`${label} — fullscreen photos`} onClick={onClose}>
      <img
        className="carousel-lightbox-photo"
        src={photo.src}
        srcSet={photo.srcSet}
        sizes="100vw"
        alt={`${label}, photo ${index + 1} of ${count}`}
      />
      <button ref={closeRef} type="button" className="carousel-lightbox-button carousel-lightbox-close" onClick={onClose} aria-label="Close fullscreen">
        <IconClose className="carousel-lightbox-icon" />
      </button>
      {count > 1 && (
        <>
          <button type="button" className="carousel-lightbox-button carousel-lightbox-prev" onClick={(e) => step(e, -1)} aria-label="Previous photo">‹</button>
          <button type="button" className="carousel-lightbox-button carousel-lightbox-next" onClick={(e) => step(e, 1)} aria-label="Next photo">›</button>
          <span className="carousel-lightbox-count">{index + 1} / {count}</span>
        </>
      )}
    </div>
  );
}

// Photos you swipe through (native scroll-snap), with an optional fullscreen view.
// A photo is fetched once it's shown or the one on screen before it has finished loading,
// so a 27-photo gallery starts with two photos, and the next is ready before a swipe needs it.
function PhotoCarousel({
  photos, label, sizes = '100vw', className = '', isAutoplay = false,
  showCount = false, showDots = false, showThumbnails = false, onIndexChange, children,
}) {
  const trackRef = useRef(null);
  const expandRef = useRef(null);
  const [index, setIndex] = useState(0);
  const [wanted, setWanted] = useState(() => new Set([0]));
  const [isPaused, setIsPaused] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const prefersReducedMotion = usePrefersReducedMotion();
  const count = photos.length;
  const isPlaying = isAutoplay && count > 1 && !isPaused && !isLightboxOpen && !prefersReducedMotion;

  // A set, not "everything up to": stepping back from the first photo to the last must
  // fetch the last one, not the whole gallery. Only the photo on screen fetches the next
  // one; otherwise each load would chain into the next and everything would download.
  const loadedRef = useRef(new Set());
  const want = useCallback((indexes) => {
    setWanted((current) => {
      const missing = indexes.filter((i) => i < count && !current.has(i));
      return missing.length === 0 ? current : new Set([...current, ...missing]);
    });
  }, [count]);

  const showIndex = useCallback((i) => {
    setIndex(i);
    want(loadedRef.current.has(i) ? [i, i + 1] : [i]);
    onIndexChange?.(i);
  }, [onIndexChange, want]);

  const handlePhotoLoaded = (i) => {
    loadedRef.current.add(i);
    if (i === index) want([i + 1]);
  };

  const scrollToIndex = useCallback((i, behavior = 'smooth') => {
    const track = trackRef.current;
    if (track) track.scrollTo({ left: i * track.clientWidth, behavior });
  }, []);

  // A jump of more than one photo (the wrap from last to first, a thumbnail) is instant:
  // a smooth scroll would pass every photo in between, and each one it passes is fetched.
  const goTo = useCallback((i) => {
    scrollToIndex(i, Math.abs(i - index) > 1 ? 'instant' : 'smooth');
  }, [index, scrollToIndex]);

  const handleScroll = () => {
    const track = trackRef.current;
    if (!track.clientWidth) return;
    const i = Math.min(count - 1, Math.round(track.scrollLeft / track.clientWidth));
    if (i !== index) showIndex(i);
  };

  useEffect(() => {
    if (!isPlaying) return undefined;
    const timer = setTimeout(() => goTo((index + 1) % count), AUTOPLAY_INTERVAL_MS);
    return () => clearTimeout(timer);
  }, [isPlaying, index, count, goTo]);

  const handleLightboxIndex = useCallback((i) => {
    showIndex(i);
    scrollToIndex(i, 'instant');
  }, [showIndex, scrollToIndex]);

  const closeLightbox = useCallback(() => {
    setIsLightboxOpen(false);
    expandRef.current?.focus();
  }, []);

  const pause = () => setIsPaused(true);
  const resume = () => setIsPaused(false);

  return (
    <div className={`carousel ${className}`}>
      <div className="carousel-frame" onMouseEnter={pause} onMouseLeave={resume}>
        <div
          ref={trackRef}
          className="carousel-track"
          onScroll={handleScroll}
          onTouchStart={pause}
          onTouchEnd={resume}
          tabIndex={0}
          role="region"
          aria-label={`Photos of ${label}`}
        >
          {photos.map((photo, i) => (
            <div className="carousel-slide" key={photo.src}>
              {wanted.has(i) && (
                <img
                  src={photo.src}
                  srcSet={photo.srcSet}
                  sizes={sizes}
                  alt={`${label}, photo ${i + 1} of ${count}`}
                  fetchPriority={i === 0 ? 'high' : undefined}
                  decoding="async"
                  draggable={false}
                  onLoad={() => handlePhotoLoaded(i)}
                  onClick={() => setIsLightboxOpen(true)}
                />
              )}
            </div>
          ))}
        </div>

        {showCount && count > 1 && <span className="carousel-count">{index + 1} / {count}</span>}
        <button ref={expandRef} type="button" className="carousel-expand" onClick={() => setIsLightboxOpen(true)} aria-label="View photos fullscreen">
          <IconExpand className="carousel-expand-icon" />
        </button>
        {count > 1 && (
          <>
            <button type="button" className="carousel-step carousel-step--prev" onClick={() => goTo((index - 1 + count) % count)} aria-label="Previous photo">‹</button>
            <button type="button" className="carousel-step carousel-step--next" onClick={() => goTo((index + 1) % count)} aria-label="Next photo">›</button>
          </>
        )}
        {showDots && count > 1 && count <= MAX_DOTS && (
          <div className="carousel-dots" aria-hidden="true">
            {photos.map((photo, i) => <i key={photo.src} className={i === index ? 'carousel-dot carousel-dot--on' : 'carousel-dot'} />)}
          </div>
        )}
        {children}
        {isPlaying && (
          <span className="carousel-progress" aria-hidden="true">
            <span key={index} style={{ animationDuration: `${AUTOPLAY_INTERVAL_MS}ms` }} />
          </span>
        )}
      </div>

      {showThumbnails && count > 1 && (
        <div className="carousel-thumbs">
          {photos.map((photo, i) => (
            <button
              key={photo.src}
              type="button"
              className={`carousel-thumb${i === index ? ' carousel-thumb--on' : ''}`}
              onClick={() => goTo(i)}
              aria-label={`Show photo ${i + 1} of ${count}`}
              aria-pressed={i === index}
            >
              <img src={photo.thumb} alt="" loading="lazy" decoding="async" />
            </button>
          ))}
        </div>
      )}

      {isLightboxOpen && (
        <Lightbox photos={photos} index={index} label={label} onIndexChange={handleLightboxIndex} onClose={closeLightbox} />
      )}
    </div>
  );
}

export default PhotoCarousel;
