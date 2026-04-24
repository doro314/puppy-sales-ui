import { useState } from 'react';
import './Sidebar.css';

// Paw icon SVG components
const PawIcon = ({ color = "#4a90d9" }) => (
  <svg 
    className="paw-icon" 
    viewBox="0 0 24 24" 
    width="20" 
    height="20"
    fill={color}
  >
    <ellipse cx="12" cy="19" rx="5" ry="4" />
    <ellipse cx="6" cy="11" rx="2.5" ry="3" />
    <ellipse cx="18" cy="11" rx="2.5" ry="3" />
    <ellipse cx="9" cy="6" rx="2" ry="2.5" />
    <ellipse cx="15" cy="6" rx="2" ry="2.5" />
  </svg>
);

function Sidebar({ categories, activeCategory, onCategoryChange, showContact = false }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const allTabs = [
    ...categories,
    ...(showContact ? [{ id: 'contact', name: 'Contact Us', folder: null }] : []),
  ];
  const activeLabel = allTabs.find((t) => t.id === activeCategory)?.name ?? 'Menu';

  const handleSelect = (id) => {
    onCategoryChange(id);
    setMobileOpen(false);
  };

  return (
    <div className={`sidebar${mobileOpen ? ' sidebar--open' : ''}`}>
      <div className="sidebar-header">
        <h2>Puppy Gallery</h2>
      </div>

      {/* Mobile-only accordion trigger */}
      <button
        className="mobile-nav-trigger"
        onClick={() => setMobileOpen((o) => !o)}
        aria-expanded={mobileOpen}
      >
        <span className="mobile-nav-label">{activeLabel}</span>
        <svg
          className="mobile-nav-chevron"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      <nav className="sidebar-nav">
        {categories.map((category) => (
          <button
            key={category.id}
            className={`sidebar-tab ${activeCategory === category.id ? 'active' : ''} ${!category.folder ? 'bold-tab' : ''}`}
            onClick={() => handleSelect(category.id)}
            title={category.icon === 'paw-blue' ? 'Boy' : category.icon === 'paw-pink' ? 'Girl' : undefined}
          >
            {category.folder && (
              <PawIcon color={activeCategory === category.id ? 'white' : category.icon === 'paw-blue' ? '#4a90d9' : '#e91e8c'} />
            )}
            <span className="sidebar-label">{category.name}</span>
          </button>
        ))}

        {showContact && (
          <button
            className={`sidebar-tab contact-tab ${activeCategory === 'contact' ? 'active' : ''}`}
            onClick={() => handleSelect('contact')}
          >
            <span className="sidebar-label">Contact Us</span>
          </button>
        )}
      </nav>
    </div>
  );
}

export default Sidebar;