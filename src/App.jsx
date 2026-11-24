import { useEffect, useState } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate, useNavigationType, useParams, useSearchParams } from 'react-router-dom';

import ContactForm from './components/ContactForm';
import ImageGallery from './components/ImageGallery';
import Sidebar from './components/Sidebar';
import { getCategories, getCategoryById } from './data/puppies';
import { GENDER_COLORS, NEUTRAL_ACCENT, isLikelyBot } from './utils';

import './App.css';

const SHOW_CONTACT = true;
const SITE_NAME = 'Doro Family Puppies';
const COUNTER_BASE = 'https://api.counterapi.dev/v1/doro-family-puppies';

let counterFired = false;

// "home" → "/", "contact" → "/contact", a puppy's slug → "/bella"
function pathFor(id) {
  return id === 'home' ? '/' : `/${id}`;
}

function usePageTitle(title) {
  useEffect(() => {
    document.title = title;
  }, [title]);
}

function useVisitCounter() {
  const [visitorCount, setVisitorCount] = useState(null);
  const [uniqueCount, setUniqueCount] = useState(null);

  useEffect(() => {
    if (counterFired || isLikelyBot()) return;
    counterFired = true;

    fetch(`${COUNTER_BASE}/visits/up`)
      .then(r => r.json())
      .then(d => setVisitorCount(d.count ?? null))
      .catch(() => {});

    const isNewVisitor = !localStorage.getItem('dfp-visited');
    if (isNewVisitor) {
      localStorage.setItem('dfp-visited', '1');
      fetch(`${COUNTER_BASE}/uniques/up`)
        .then(r => r.json())
        .then(d => setUniqueCount(d.count ?? null))
        .catch(() => {});
    } else {
      fetch(`${COUNTER_BASE}/uniques/`)
        .then(r => r.json())
        .then(d => setUniqueCount(d.count ?? null))
        .catch(() => {});
    }
  }, []);

  return { visitorCount, uniqueCount };
}

function HomeRoute({ galleryProps }) {
  usePageTitle(SITE_NAME);
  return <ImageGallery activeCategory="home" {...galleryProps} />;
}

function PuppyRoute({ galleryProps }) {
  const { slug } = useParams();
  const puppy = getCategoryById(slug);
  usePageTitle(puppy ? `${puppy.name} · ${SITE_NAME}` : SITE_NAME);
  if (!puppy?.folder) return <Navigate to="/" replace />;
  return <ImageGallery activeCategory={slug} {...galleryProps} />;
}

function ContactRoute() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  usePageTitle(`Contact · ${SITE_NAME}`);

  const about = getCategoryById(searchParams.get('about'));
  const puppy = about?.folder ? about : null;
  const message = puppy
    ? `Hi! I'm interested in ${puppy.name} and would love to learn more. Please let me know about availability and next steps.`
    : '';
  const accentColor = GENDER_COLORS[puppy?.icon] ?? NEUTRAL_ACCENT;

  // A visit that starts on this page has nothing to go back to: Back goes Home instead of leaving the site.
  const handleBack = () => (location.key === 'default' ? navigate('/') : navigate(-1));

  return <ContactForm initialMessage={message} accentColor={accentColor} onBack={handleBack} />;
}

function App() {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const navigationType = useNavigationType();
  const { visitorCount, uniqueCount } = useVisitCounter();

  // A new page starts at the top; Back and Forward keep the position the browser restores.
  useEffect(() => {
    if (navigationType === 'PUSH') window.scrollTo(0, 0);
  }, [location.pathname, navigationType]);

  const categories = getCategories();
  const activeCategory = location.pathname.slice(1) || 'home';

  const goTo = (id) => navigate(pathFor(id));
  const handleInquire = (puppyId) => navigate(`/contact?about=${encodeURIComponent(puppyId)}`);

  const galleryProps = {
    categories,
    onInquire: handleInquire,
    onNavigate: goTo,
    showParents: searchParams.get('parents') === 'true',
    showCount: searchParams.has('count'),
    visitorCount,
    uniqueCount,
  };

  return (
    <div className="app-wrapper">
      <header className="site-header">
        <span className="site-header-icon">🐾</span>
        <div className="site-header-text">
          <h1 className="site-title">{SITE_NAME}</h1>
          <p className="site-tagline">Lovingly raised, family bred</p>
        </div>
      </header>
      <div className="app-layout">
        <Sidebar
          categories={categories}
          activeCategory={activeCategory}
          onCategoryChange={goTo}
          showContact={SHOW_CONTACT}
        />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<HomeRoute galleryProps={galleryProps} />} />
            {SHOW_CONTACT && <Route path="/contact" element={<ContactRoute />} />}
            <Route path="/:slug" element={<PuppyRoute galleryProps={galleryProps} />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default App;
