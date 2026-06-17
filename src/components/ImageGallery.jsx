import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { getCategoryById } from "../data/puppies";
import { getImagesByFolder } from "../data/imageLoader";

const allImagesByFolder = getImagesByFolder();

function formatKey(key) {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (s) => s.toUpperCase());
}

const GENDER_COLORS = {
  "paw-blue": "#4a90d9",
  "paw-pink": "#e91e8c",
};

function IconClock() {
  return (
    <svg className="cta-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function IconHome() {
  return (
    <svg className="cta-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z" />
      <polyline points="9 21 9 12 15 12 15 21" />
    </svg>
  );
}

function IconPaw() {
  return (
    <svg className="cta-icon" viewBox="0 0 24 24" fill="currentColor">
      <ellipse cx="12" cy="19" rx="5" ry="4" />
      <ellipse cx="6" cy="11" rx="2.5" ry="3" />
      <ellipse cx="18" cy="11" rx="2.5" ry="3" />
      <ellipse cx="9" cy="6" rx="2" ry="2.5" />
      <ellipse cx="15" cy="6" rx="2" ry="2.5" />
    </svg>
  );
}

function PawPlaceholder({ color = "#c8d6e5" }) {
  return (
    <div className="paw-placeholder">
      <svg viewBox="0 0 24 24" fill={color} className="paw-placeholder-icon">
        <ellipse cx="12" cy="19" rx="5" ry="4" />
        <ellipse cx="6" cy="11" rx="2.5" ry="3" />
        <ellipse cx="18" cy="11" rx="2.5" ry="3" />
        <ellipse cx="9" cy="6" rx="2" ry="2.5" />
        <ellipse cx="15" cy="6" rx="2" ry="2.5" />
      </svg>
      <p className="paw-placeholder-text">Photos coming soon</p>
    </div>
  );
}

function formatValue(key, value) {
  if (value === null || value === undefined || value === "") return "\u2014\u2014";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (key === "weightAsOf" && typeof value === "object") {
    if (!value.value && !value.asOf) return "\u2014\u2014";
    return `${value.value ?? "\u2014\u2014"} · ${value.asOf ? new Date(value.asOf + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "\u2014\u2014"}`;
  }
  if ((key.toLowerCase().includes("date") || key === "readyToAdoptDate") && typeof value === "string") {
    const d = new Date(value + "T00:00:00");
    return isNaN(d) ? "\u2014\u2014" : d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  }
  return String(value);
}

function PuppyDetails({ details, genderColor, isAvailableSoon = false }) {
  if (!details) return null;
  const { litterDescription, available, ...fields } = details;
  const statEntries = Object.entries(fields);
  const isGrid = statEntries.length > 5;

  return (
    <div
      className={`puppy-details${isGrid ? " puppy-details--grid" : ""}`}
      style={genderColor ? { "--gender-color": genderColor } : undefined}
    >
      <div className="details-top-bar" />
      <div className="details-body">
        <div className={isGrid ? "details-grid" : "details-stats"}>
          {statEntries.map(([key, value]) => (
            <div className={isGrid ? "details-grid-item" : "details-stat"} key={key}>
              {isGrid ? (
                <>
                  <span className="details-stat-label">{formatKey(key)}</span>
                  <span className="details-stat-value">{formatValue(key, value)}</span>
                </>
              ) : (
                <div className="details-stat-inner">
                  <span className="details-stat-label">{formatKey(key)}</span>
                  {key === "sex" && genderColor && value ? (
                    <span className="sex-pill">{String(value)}</span>
                  ) : (
                    <span className="details-stat-value" title={formatValue(key, value)}>{formatValue(key, value)}</span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
        {!isGrid && available != null && (
          <span className={
            isAvailableSoon ? "status-badge status-available-soon"
            : available ? "status-badge status-available"
            : "status-badge status-adopted"
          }>
            {isAvailableSoon ? "Available Soon" : available ? "Available" : "Adopted"}
          </span>
        )}
      </div>
      {litterDescription && (
        <p className="litter-description">{litterDescription}</p>
      )}
    </div>
  );
}

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

function CtaSection({ categoryFolder, categoryName, isAvailableSoon, available, accentColor, availablePuppies, onInquire, onNavigate }) {
  if (!categoryFolder) return null;

  const goToRandomAvailable = () => {
    if (!availablePuppies.length || !onNavigate) return;
    const pick = availablePuppies[Math.floor(Math.random() * availablePuppies.length)];
    onNavigate(pick.id);
  };

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

  if (!isAvailableSoon && available === false && availablePuppies.length > 0) {
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
            <button className="cta-button" onClick={goToRandomAvailable}>Meet Another Pup</button>
          </div>
        </div>
      </>
    );
  }

  if (!isAvailableSoon && available && onInquire) {
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

function ImageGallery({ activeCategory, onInquire, onNavigate, categories = [], showParents = false }) {
  const availablePuppies = categories.filter(
    (c) => c.folder && c.details?.available && c.id !== activeCategory
  );

  const categoryInfo = getCategoryById(activeCategory);
  const categoryName = categoryInfo ? categoryInfo.name : "All Puppies";
  const categoryFolder = categoryInfo?.folder;
  const accentColor = categoryFolder
    ? (GENDER_COLORS[categoryInfo?.icon] ?? "#8a9bb0")
    : "#8a9bb0";

  const litterInfo = getCategoryById("all");
  const readyToAdoptDate = litterInfo?.details?.readyToAdoptDate;
  const isAvailableSoon = readyToAdoptDate
    ? new Date() < new Date(readyToAdoptDate + "T00:00:00")
    : false;

  const imageList = useMemo(() => {
    if (activeCategory === "all") {
      return Object.entries(allImagesByFolder).flatMap(([folder, images]) => {
        const puppy = categories.find(c => c.folder === folder);
        return images.map(src => ({
          src,
          puppyName: puppy?.name ?? folder,
          puppyId: puppy?.id ?? null,
          puppyIcon: puppy?.icon ?? null,
        }));
      });
    }
    if (categoryFolder && allImagesByFolder[categoryFolder]) {
      return allImagesByFolder[categoryFolder].map(src => ({ src, puppyName: null }));
    }
    return [];
  }, [activeCategory, categoryFolder, categories]);

  const [bigImage, setBigImage] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [stripWidth, setStripWidth] = useState(48);
  const containerRef = useRef(null);
  const imgRef = useRef(null);

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

  useEffect(() => {
    if (imageList.length > 0) {
      setBigImage(imageList[0]);
      setCurrentIndex(0);
    } else {
      setBigImage(null);
      setCurrentIndex(0);
    }
  }, [activeCategory, imageList]);

  const handleClick = (image, index) => {
    setBigImage(image);
    setCurrentIndex(index);
  };

  const nextFunc = () => {
    if (imageList.length === 0) return;
    const nextIndex = (currentIndex + 1) % imageList.length;
    setCurrentIndex(nextIndex);
    setBigImage(imageList[nextIndex]);
  };

  const backFunc = () => {
    if (imageList.length === 0) return;
    const prevIndex = (currentIndex - 1 + imageList.length) % imageList.length;
    setCurrentIndex(prevIndex);
    setBigImage(imageList[prevIndex]);
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
        {activeCategory === 'all' && showParents && <ParentsSection dadName={litterInfo?.details?.dad} momName={litterInfo?.details?.mom} />}
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
          onInquire={onInquire}
          onNavigate={onNavigate}
        />
        <p className="gallery-copyright">&copy; {new Date().getFullYear()} All rights reserved.</p>
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

      {activeCategory === 'all' && showParents && <ParentsSection dadName={litterInfo?.details?.dad} momName={litterInfo?.details?.mom} />}
      <PuppyDetails details={categoryInfo?.details} genderColor={accentColor} isAvailableSoon={isAvailableSoon} />

      <div className="main-image-container" ref={containerRef}>
        <img className="main-image-blur-bg" src={bigImage?.src} alt="" aria-hidden="true" />
        <img
          className="main-image"
          src={bigImage?.src}
          alt={categoryName}
          ref={imgRef}
          onLoad={calcStripWidth}
        />
        {activeCategory === "all" && bigImage?.puppyName && (
          <div className="photo-puppy-label">
            <svg className="photo-paw-icon" viewBox="0 0 24 24" fill={GENDER_COLORS[bigImage.puppyIcon] ?? "#8a9bb0"}>
              <ellipse cx="12" cy="19" rx="5" ry="4" />
              <ellipse cx="6" cy="11" rx="2.5" ry="3" />
              <ellipse cx="18" cy="11" rx="2.5" ry="3" />
              <ellipse cx="9" cy="6" rx="2" ry="2.5" />
              <ellipse cx="15" cy="6" rx="2" ry="2.5" />
            </svg>
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
      </div>
      <div className="image-card-footer">
        <div className="footer-nav-buttons">
          <button className="footer-nav-button" onClick={backFunc} aria-label="Previous image">&#8249;</button>
          <button className="footer-nav-button" onClick={nextFunc} aria-label="Next image">&#8250;</button>
        </div>
        <span className="image-counter">{currentIndex + 1} / {imageList.length}</span>
      </div>

      <div className="thumbnail-strip">
        {imageList.map((image, index) => (
          <button
            key={image.src}
            className={`thumbnail-btn ${index === currentIndex ? "active" : ""}`}
            onClick={() => handleClick(image, index)}
            aria-label={`View photo ${index + 1} of ${imageList.length}`}
            aria-pressed={index === currentIndex}
          >
            <img className="thumbnail" src={image.src} alt="" />
            {activeCategory === "all" && image.puppyName && (
              <span className="thumbnail-puppy-label">
                <svg className="thumbnail-paw-icon" viewBox="0 0 24 24" fill={GENDER_COLORS[image.puppyIcon] ?? "#8a9bb0"}>
                  <ellipse cx="12" cy="19" rx="5" ry="4" />
                  <ellipse cx="6" cy="11" rx="2.5" ry="3" />
                  <ellipse cx="18" cy="11" rx="2.5" ry="3" />
                  <ellipse cx="9" cy="6" rx="2" ry="2.5" />
                  <ellipse cx="15" cy="6" rx="2" ry="2.5" />
                </svg>
                {image.puppyName}
              </span>
            )}
          </button>
        ))}
      </div>

      <CtaSection
        categoryFolder={categoryFolder}
        categoryName={categoryName}
        isAvailableSoon={isAvailableSoon}
        available={categoryInfo?.details?.available}
        accentColor={accentColor}
        availablePuppies={availablePuppies}
        onInquire={onInquire}
        onNavigate={onNavigate}
      />
      <p className="gallery-copyright">&copy; {new Date().getFullYear()} All rights reserved.</p>
    </div>
  );
}

export default ImageGallery;
