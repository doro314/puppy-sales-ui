import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { getCategoryById } from "../data/puppies";
import { getImagesByFolder } from "../data/imageLoader";
import PuppyDetails from "./PuppyDetails";
import { IconClock, IconClose, IconExpand, IconHome, IconPaw, PawPlaceholder, PawSvg } from "./Icons";

const allImagesByFolder = getImagesByFolder();

const GENDER_COLORS = {
  "paw-blue": "#4a90d9",
  "paw-pink": "#e91e8c",
};

const AUTOPLAY_INTERVAL_MS = 8000;

function ParentsSection({ dadName, momName }) {
  return (
    <div className="parents-section">
      <div className="parents-top-bar" />
      <div className="parents-inner">
        <h3 className="parents-heading">Meet the Parents</h3>
        <p className="parents-sub">The proud mom &amp; dad behind this litter</p>
        <div className="parents-grid">
          <div className="parent-card">
            <div className="parent-img-wrap">
              <img src="/Leo.jpg" alt={`${dadName} — Dad`} className="parent-img" />
              <div className="parent-overlay">
                <span className="parent-role parent-role--dad">Dad</span>
                <span className="parent-name">{dadName}</span>
              </div>
            </div>
          </div>
          <div className="parent-card">
            <div className="parent-img-wrap">
              <img src="/Coco.jpg" alt={`${momName} — Mom`} className="parent-img" />
              <div className="parent-overlay">
                <span className="parent-role parent-role--mom">Mom</span>
                <span className="parent-name">{momName}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CtaSection({ categoryFolder, categoryName, isAvailableSoon, available, accentColor, availablePuppies, browsablePuppies, onInquire, onNavigate }) {
  if (!categoryFolder) return null;

  const goToRandom = (pool) => {
    if (!pool.length || !onNavigate) return;
    const pick = pool[Math.floor(Math.random() * pool.length)];
    onNavigate(pick.id);
  };

  if (available === "reserved") {
    const pool = browsablePuppies.length > 0 ? browsablePuppies : availablePuppies;
    if (!pool.length) return null;
    return (
      <>
        <div className="section-divider" />
        <div className="cta-card" style={{ "--cta-color": "#8a9bb0" }}>
          <div className="cta-card-top-bar" />
          <div className="cta-card-body">
            <div className="cta-card-text">
              <IconHome />
              <div>
                <p className="cta-card-heading">{categoryName} has been reserved!</p>
                <p className="cta-card-sub">But we still have puppies looking for theirs.</p>
              </div>
            </div>
            <button className="cta-button" onClick={() => goToRandom(pool)}>Meet Another Pup</button>
          </div>
        </div>
      </>
    );
  }

  if (isAvailableSoon && onInquire) {
    return (
      <>
        <div className="section-divider" />
        <div className="cta-card" style={{ "--cta-color": "#8a9bb0" }}>
          <div className="cta-card-top-bar" />
          <div className="cta-card-body">
            <div className="cta-card-text">
              <IconClock />
              <div>
                <p className="cta-card-heading">{categoryName} isn't ready quite yet!</p>
                <p className="cta-card-sub">But you can reach out to get first in line.</p>
              </div>
            </div>
            <button className="cta-button" onClick={() => onInquire(categoryName, accentColor)}>Express Interest</button>
          </div>
        </div>
      </>
    );
  }

  if (available === "adopted" && availablePuppies.length > 0) {
    return (
      <>
        <div className="section-divider" />
        <div className="cta-card" style={{ "--cta-color": "#8a9bb0" }}>
          <div className="cta-card-top-bar" />
          <div className="cta-card-body">
            <div className="cta-card-text">
              <IconHome />
              <div>
                <p className="cta-card-heading">{categoryName} has found a home!</p>
                <p className="cta-card-sub">But we still have puppies looking for theirs.</p>
              </div>
            </div>
            <button className="cta-button" onClick={() => goToRandom(availablePuppies)}>Meet Another Pup</button>
          </div>
        </div>
      </>
    );
  }

  if (available === "available" && onInquire) {
    return (
      <>
        <div className="section-divider" />
        <div className="cta-card" style={{ "--cta-color": accentColor }}>
          <div className="cta-card-top-bar" />
          <div className="cta-card-body">
            <div className="cta-card-text">
              <IconPaw />
              <div>
                <p className="cta-card-heading">Like to bring me home?</p>
                <p className="cta-card-sub">Reach out and we'll guide you through the next steps.</p>
              </div>
            </div>
            <button className="cta-button" onClick={() => onInquire(categoryName, accentColor)}>Inquire About {categoryName}</button>
          </div>
        </div>
      </>
    );
  }

  return null;
}

function ImageGallery({ activeCategory, onInquire, onNavigate, categories = [], showParents = false, showCount = false, visitorCount = null, uniqueCount = null }) {
  const availablePuppies = categories.filter(
    (c) => c.folder && c.details?.available === "available" && c.id !== activeCategory
  );

  // Non-reserved, non-adopted pups — used as "Meet Another Pup" targets from a reserved page
  const browsablePuppies = categories.filter(
    (c) => c.folder && c.details?.available !== "reserved" && c.details?.available !== "adopted" && c.id !== activeCategory
  );

  const categoryInfo = getCategoryById(activeCategory);
  const categoryName = categoryInfo ? categoryInfo.name : "All Puppies";
  const categoryFolder = categoryInfo?.folder;
  const accentColor = categoryFolder
    ? (GENDER_COLORS[categoryInfo?.icon] ?? "#8a9bb0")
    : "#8a9bb0";

  const litterInfo = getCategoryById("home");
  const readyToAdoptDate = litterInfo?.details?.readyToAdoptDate;
  const isAvailableSoon = readyToAdoptDate
    ? new Date() < new Date(readyToAdoptDate + "T00:00:00")
    : false;

  const isHome = activeCategory === "home";

  const imageList = useMemo(() => {
    if (activeCategory === "home") {
      return (allImagesByFolder["home"] ?? []).map(src => ({ src, puppyName: null }));
    }
    if (categoryFolder && allImagesByFolder[categoryFolder]) {
      return allImagesByFolder[categoryFolder].map(src => ({ src, puppyName: null }));
    }
    return [];
  }, [activeCategory, categoryFolder]);

  const [bigImage, setBigImage] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [stripWidth, setStripWidth] = useState(48);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const containerRef = useRef(null);
  const imgRef = useRef(null);
  const intervalRef = useRef(null);
  const imageListRef = useRef(imageList);

  const clearTimer = useCallback(() => {
    clearInterval(intervalRef.current);
  }, []);

  const startTimer = useCallback(() => {
    clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setCurrentIndex(prev => {
        if (!imageListRef.current.length) return prev;
        const next = (prev + 1) % imageListRef.current.length;
        setBigImage(imageListRef.current[next]);
        return next;
      });
    }, AUTOPLAY_INTERVAL_MS);
  }, []);

  const calcStripWidth = useCallback(() => {
    const container = containerRef.current;
    const img = imgRef.current;
    if (!container || !img || !img.naturalWidth) return;
    const containerW = container.clientWidth;
    const containerH = container.clientHeight;
    const naturalRatio = img.naturalWidth / img.naturalHeight;
    const containerRatio = containerW / containerH;
    if (naturalRatio < containerRatio) {
      // portrait image — blurred strips on sides
      const renderedW = containerH * naturalRatio;
      setStripWidth(Math.max(0, Math.floor((containerW - renderedW) / 2)));
    } else {
      // landscape image — fills width, no side strips
      setStripWidth(0);
    }
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const ro = new ResizeObserver(calcStripWidth);
    ro.observe(container);
    return () => ro.disconnect();
  }, [calcStripWidth]);

  useEffect(() => { imageListRef.current = imageList; }, [imageList]);

  useEffect(() => {
    if (!isHome || lightboxOpen || imageList.length === 0) {
      clearTimer();
      return;
    }
    startTimer();
    return clearTimer;
  }, [isHome, lightboxOpen, imageList.length, startTimer, clearTimer]);

  useEffect(() => {
    if (imageList.length > 0) {
      setBigImage(imageList[0]);
      setCurrentIndex(0);
    } else {
      setBigImage(null);
      setCurrentIndex(0);
    }
    setLightboxOpen(false);
  }, [activeCategory, imageList]);

  useEffect(() => {
    if (!lightboxOpen) return;
    const handleKey = (e) => { if (e.key === 'Escape') setLightboxOpen(false); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [lightboxOpen]);

  useEffect(() => {
    document.body.style.overflow = lightboxOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [lightboxOpen]);

  const handleClick = (image, index) => {
    setBigImage(image);
    setCurrentIndex(index);
  };

  const nextFunc = () => {
    if (imageList.length === 0) return;
    const nextIndex = (currentIndex + 1) % imageList.length;
    setCurrentIndex(nextIndex);
    setBigImage(imageList[nextIndex]);
    if (isHome) startTimer();
  };

  const backFunc = () => {
    if (imageList.length === 0) return;
    const prevIndex = (currentIndex - 1 + imageList.length) % imageList.length;
    setCurrentIndex(prevIndex);
    setBigImage(imageList[prevIndex]);
    if (isHome) startTimer();
  };

  if (imageList.length === 0) {
    return (
      <div className="gallery-container">
        <header className="gallery-header">
          <h2 className="gallery-title" style={{ color: accentColor }}>
            {categoryFolder && <span className="gallery-title-prefix">Name | </span>}
            {categoryName}
          </h2>
        </header>
        {activeCategory === 'home' && showParents && <ParentsSection dadName={litterInfo?.details?.dad} momName={litterInfo?.details?.mom} />}
        <PuppyDetails details={categoryInfo?.details} genderColor={accentColor} isAvailableSoon={isAvailableSoon} />
        <div className="paw-placeholder-container">
          <PawPlaceholder color={accentColor} />
        </div>
        <CtaSection
          categoryFolder={categoryFolder}
          categoryName={categoryName}
          isAvailableSoon={isAvailableSoon}
          available={categoryInfo?.details?.available}
          accentColor={accentColor}
          availablePuppies={availablePuppies}
          browsablePuppies={browsablePuppies}
          onInquire={onInquire}
          onNavigate={onNavigate}
        />
        <p className="gallery-copyright">&copy; {new Date().getFullYear()} All rights reserved.</p>
        {showCount && (
          <p className="gallery-visit-count">
            {visitorCount === null ? '…' : `${visitorCount.toLocaleString()} visits`}
            {uniqueCount !== null && ` · ${uniqueCount.toLocaleString()} unique`}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="gallery-container">
      <header className="gallery-header">
        <h2 className="gallery-title" style={{ color: accentColor }}>
          {categoryFolder && <span className="gallery-title-prefix">Name | </span>}
          {categoryName}
        </h2>
      </header>

      {activeCategory === 'home' && showParents && <ParentsSection dadName={litterInfo?.details?.dad} momName={litterInfo?.details?.mom} />}
      <PuppyDetails details={categoryInfo?.details} genderColor={accentColor} isAvailableSoon={isAvailableSoon} />

      <div className="main-image-container" ref={containerRef}>
        <img className="main-image-blur-bg" src={bigImage?.src} alt="" aria-hidden="true" />
        <img
          className="main-image"
          src={bigImage?.src}
          alt={categoryName}
          ref={imgRef}
          onLoad={calcStripWidth}
          onClick={() => setLightboxOpen(true)}
          decoding="async"
          style={{ cursor: 'zoom-in' }}
        />
        <button className="expand-btn" onClick={() => setLightboxOpen(true)} aria-label="View fullscreen">
          <IconExpand className="expand-btn-icon" />
        </button>
        {bigImage?.puppyName && (
          <div className="photo-puppy-label">
            <PawSvg className="photo-paw-icon" fill={GENDER_COLORS[bigImage.puppyIcon] ?? "#8a9bb0"} />
            {bigImage.puppyId && onNavigate && (
              <span className="photo-puppy-cta" onClick={() => onNavigate(bigImage.puppyId)}>
                View →
              </span>
            )}
            <span className="photo-puppy-name">{bigImage.puppyName}</span>
          </div>
        )}
        <button className="arrow-button arrow-left" onClick={backFunc} style={{ width: stripWidth }}>&#8249;</button>
        <button className="arrow-button arrow-right" onClick={nextFunc} style={{ width: stripWidth }}>&#8250;</button>
        {isHome && imageList.length > 1 && (
          <div className="slideshow-progress">
            <div
              key={currentIndex}
              className="slideshow-progress-bar"
              style={{ animationDuration: `${AUTOPLAY_INTERVAL_MS}ms` }}
            />
          </div>
        )}
      </div>
      <div className="image-card-footer">
        <div className="footer-nav-buttons">
          <button className="footer-nav-button" onClick={backFunc} aria-label="Previous image">&#8249;</button>
          <button className="footer-nav-button" onClick={nextFunc} aria-label="Next image">&#8250;</button>
        </div>
        <span className="image-counter">{currentIndex + 1} / {imageList.length}</span>
      </div>

      {!isHome && (
        <div className="thumbnail-strip">
          {imageList.map((image, index) => (
            <button
              key={image.src}
              className={`thumbnail-btn ${index === currentIndex ? "active" : ""}`}
              onClick={() => handleClick(image, index)}
              aria-label={`View photo ${index + 1} of ${imageList.length}`}
              aria-pressed={index === currentIndex}
            >
              <img className="thumbnail" src={image.src} alt="" loading="lazy" decoding="async" />
              {image.puppyName && (
                <span className="thumbnail-puppy-label">
                  <PawSvg className="thumbnail-paw-icon" fill={GENDER_COLORS[image.puppyIcon] ?? "#8a9bb0"} />
                  {image.puppyName}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      <CtaSection
        categoryFolder={categoryFolder}
        categoryName={categoryName}
        isAvailableSoon={isAvailableSoon}
        available={categoryInfo?.details?.available}
        accentColor={accentColor}
        availablePuppies={availablePuppies}
        browsablePuppies={browsablePuppies}
        onInquire={onInquire}
        onNavigate={onNavigate}
      />
      <p className="gallery-copyright">&copy; {new Date().getFullYear()} All rights reserved.</p>
      {showCount && (
        <p className="gallery-visit-count">
          {visitorCount === null ? '…' : `${visitorCount.toLocaleString()} visits`}
          {uniqueCount !== null && ` · ${uniqueCount.toLocaleString()} unique`}
        </p>
      )}

      {lightboxOpen && (
        <div className="lightbox-overlay" onClick={() => setLightboxOpen(false)}>
          <button
            className="lightbox-close"
            onClick={(e) => { e.stopPropagation(); setLightboxOpen(false); }}
            aria-label="Close fullscreen"
          >
            <IconClose className="lightbox-close-icon" />
          </button>
          <img className="lightbox-img" src={bigImage?.src} alt={categoryName} />
        </div>
      )}
    </div>
  );
}

export default ImageGallery;
