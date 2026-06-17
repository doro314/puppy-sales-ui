import { useState } from 'react';
import './Sidebar.css';
import { PawSvg, IconHamburger, IconClose } from './Icons';

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
        {mobileOpen
          ? <IconClose className="mobile-nav-icon" />
          : <IconHamburger className="mobile-nav-icon" />
        }
      </button>

      <nav className="sidebar-nav">
        {categories.filter((c) => !c.folder).map((category) => (
          <button
            key={category.id}
            className={`sidebar-tab ${activeCategory === category.id ? 'active' : ''} bold-tab`}
            onClick={() => handleSelect(category.id)}
          >
            <span className="sidebar-label">{category.name}</span>
          </button>
        ))}

        <div className="sidebar-section-label">Puppies</div>

        {categories.filter((c) => c.folder).map((category) => {
          const isActive = activeCategory === category.id;
          let pawColor = '#e91e8c';
          if (isActive) pawColor = 'white';
          else if (category.icon === 'paw-blue') pawColor = '#4a90d9';

          return (
            <button
              key={category.id}
              className={`sidebar-tab sidebar-tab--puppy ${isActive ? 'active' : ''}`}
              onClick={() => handleSelect(category.id)}
              title={category.icon === 'paw-blue' ? 'Boy' : 'Girl'}
            >
              <PawSvg className="paw-icon" width="20" height="20" fill={pawColor} />
              <span className="sidebar-label">{category.name}</span>
            </button>
          );
        })}

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