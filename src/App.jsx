import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import './App.css';
import Sidebar from './components/Sidebar';
import ImageGallery from './components/ImageGallery';
import ContactForm from './components/ContactForm';
import { getCategories } from './data/puppies';
import { isLikelyBot } from './utils';

// ── Toggle contact tab on/off ──────────────────────────────────────────────
const SHOW_CONTACT = true;
// ──────────────────────────────────────────────────────────────────────────

function App() {
  const [searchParams] = useSearchParams();
  const showParents = searchParams.get('parents') === 'true';
  const showCount = searchParams.has('count');

  const categories = getCategories();
  const [activeCategory, setActiveCategory] = useState('all');
  const [contactPrefill, setContactPrefill] = useState('');
  const [contactAccentColor, setContactAccentColor] = useState('#8a9bb0');
  const [visitorCount, setVisitorCount] = useState(null);

  useEffect(() => {
    if (isLikelyBot()) { console.log('[counter] bot detected, skipping'); return; }
    fetch('https://api.countapi.xyz/hit/doro-family-puppies/visits')
      .then(r => r.json())
      .then(d => { console.log('[counter]', d); setVisitorCount(d.value ?? null); })
      .catch(err => console.error('[counter] error:', err));
  }, []);

  const handleCategoryChange = (id) => {
    setActiveCategory(id);
    if (id !== 'contact') {
      setContactPrefill('');
      setContactAccentColor('#8a9bb0');
    }
  };

  const handleInquire = (puppyName, accentColor = '#8a9bb0') => {
    setContactPrefill(`Hi! I'm interested in ${puppyName} and would love to learn more. Please let me know about availability and next steps.`);
    setContactAccentColor(accentColor);
    setActiveCategory('contact');
  };

  const handleNavigate = (id) => {
    setActiveCategory(id);
  };

  return (
    <div className="app-wrapper">
      <header className="site-header">
        <span className="site-header-icon">🐾</span>
        <div className="site-header-text">
          <h1 className="site-title">Doro Family Puppies</h1>
          <p className="site-tagline">Lovingly raised, family bred</p>
        </div>
      </header>
      <div className="app-layout">
        <Sidebar
          categories={categories}
          activeCategory={activeCategory}
          onCategoryChange={handleCategoryChange}
          showContact={SHOW_CONTACT}
        />
        <main className="main-content">
          {activeCategory === 'contact' && SHOW_CONTACT
            ? <ContactForm initialMessage={contactPrefill} accentColor={contactAccentColor} />
            : <ImageGallery activeCategory={activeCategory} onInquire={handleInquire} onNavigate={handleNavigate} categories={categories} showParents={showParents} showCount={showCount} visitorCount={visitorCount} />
          }
        </main>
      </div>
    </div>
  );
}

export default App;
