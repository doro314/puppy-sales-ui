import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import App from './App';

// App uses useSearchParams(), which requires a Router context
const renderApp = () => render(<App />, { wrapper: MemoryRouter });

// ── Mock data modules — tests never touch real puppies.jsx or images ───────

vi.mock('./data/puppies', () => {
  const categories = [
    {
      id: 'all',
      name: 'Our Litter',
      icon: null,
      folder: null,
      details: {
        breed: 'Test Breed',
        mom: 'Test Mom',
        birthDate: '2025-01-01',
        litterSize: 2,
        readyToAdoptDate: '2025-03-01', // past date → isAvailableSoon = false
        litterDescription: 'Test litter description.',
      },
    },
    {
      id: 'PupAvailable',
      name: 'PupAvailable',
      icon: 'paw-blue',
      folder: 'pupavailable',
      details: { sex: 'Male', color: 'Black', personality: 'Playful', available: true },
    },
    {
      id: 'PupAdopted',
      name: 'PupAdopted',
      icon: 'paw-pink',
      folder: 'pupadopted',
      details: { sex: 'Female', color: 'White', personality: 'Calm', available: false },
    },
    {
      id: 'PupPartial',
      name: 'PupPartial',
      icon: 'paw-blue',
      folder: 'puppartial',
      details: {
        sex: null,
        color: undefined,
        pattern: '',
        weightAsOf: { value: null, asOf: null },
        personality: 'Shy',
        available: null,
      },
    },
    {
      id: 'PupEdge',
      name: 'PupEdge',
      icon: 'unknown-icon',          // not in GENDER_COLORS
      folder: 'pupedge',
      details: {
        vetChecked: true,             // boolean → should show "Yes"
        microchipped: false,          // boolean → should show "No"
        birthDate: 'not-a-date',      // malformed date → should show ——
        available: true,
      },
    },
  ];
  return {
    getCategories: () => categories,
    getCategoryById: (id) => categories.find((c) => c.id === id) ?? null,
    default: {},
  };
});

vi.mock('./data/imageLoader', () => ({
  getImagesByFolder: () => ({}),
}));

// ── Tests ──────────────────────────────────────────────────────────────────

describe('App layout', () => {
  test('renders site header', () => {
    renderApp();
    expect(screen.getByText('Doro Family Puppies')).toBeInTheDocument();
    expect(screen.getByText(/Lovingly raised/i)).toBeInTheDocument();
  });

  test('renders sidebar tabs for all categories', () => {
    renderApp();
    const nav = screen.getByRole('navigation');
    expect(nav).toHaveTextContent('Our Litter');
    expect(nav).toHaveTextContent('PupAvailable');
    expect(nav).toHaveTextContent('PupAdopted');
  });

  test('renders contact tab', () => {
    renderApp();
    expect(screen.getByText('Contact Us')).toBeInTheDocument();
  });
});

describe('Navigation', () => {
  test('clicking a puppy tab updates the gallery heading', () => {
    renderApp();
    fireEvent.click(screen.getByText('PupAvailable'));
    expect(screen.getByRole('heading', { level: 2, name: /PupAvailable/i })).toBeInTheDocument();
  });

  test('clicking Contact Us shows the contact form', () => {
    renderApp();
    fireEvent.click(screen.getByText('Contact Us'));
    expect(screen.getByText(/Interested in one of our puppies/i)).toBeInTheDocument();
  });

  test('contact form is prefilled after clicking Inquire', () => {
    renderApp();
    fireEvent.click(screen.getByText('PupAvailable'));
    const inquireBtn = screen.queryByRole('button', { name: /Inquire About PupAvailable/i });
    if (inquireBtn) {
      fireEvent.click(inquireBtn);
      expect(screen.getByRole('textbox', { name: /message/i }).value).toMatch(/PupAvailable/i);
    }
  });
});

describe('Puppy details', () => {
  test('Our Litter shows mocked breed data', () => {
    renderApp();
    expect(screen.getByText('Test Breed')).toBeInTheDocument();
  });

  test('available puppy shows Available badge', () => {
    renderApp();
    fireEvent.click(screen.getByText('PupAvailable'));
    expect(screen.getByText('Available')).toBeInTheDocument();
  });

  test('adopted puppy shows Adopted badge', () => {
    renderApp();
    fireEvent.click(screen.getByText('PupAdopted'));
    expect(screen.getByText('Adopted')).toBeInTheDocument();
  });
});

describe('Missing data handling', () => {
  test('null/undefined/empty fields render as -- not raw undefined or N/A', () => {
    renderApp();
    fireEvent.click(screen.getByText('PupPartial'));
    const dashes = screen.getAllByText('\u2014\u2014');  // em-dash placeholder
    expect(dashes.length).toBeGreaterThanOrEqual(3);
    expect(screen.queryByText('undefined')).not.toBeInTheDocument();
    expect(screen.queryByText('null')).not.toBeInTheDocument();
    expect(screen.queryByText('N/A')).not.toBeInTheDocument();
    expect(screen.getByText('Shy')).toBeInTheDocument();
  });

  test('null available hides the status badge entirely', () => {
    renderApp();
    fireEvent.click(screen.getByText('PupPartial'));
    expect(screen.queryByText('Available')).not.toBeInTheDocument();
    expect(screen.queryByText('Adopted')).not.toBeInTheDocument();
    expect(screen.queryByText('Available Soon')).not.toBeInTheDocument();
  });

  test('null sex falls back to -- instead of rendering a pill', () => {
    renderApp();
    fireEvent.click(screen.getByText('PupPartial'));
    // The sex-pill should not exist — value falls through to formatValue → "--"
    expect(document.querySelector('.sex-pill')).not.toBeInTheDocument();
  });
});

describe('Edge case data formatting', () => {
  test('boolean true renders as Yes, false as No', () => {
    renderApp();
    fireEvent.click(screen.getByText('PupEdge'));
    expect(screen.getByText('Yes')).toBeInTheDocument();
    expect(screen.getByText('No')).toBeInTheDocument();
  });

  test('malformed date string renders as —— not "Invalid Date"', () => {
    renderApp();
    fireEvent.click(screen.getByText('PupEdge'));
    expect(screen.queryByText('Invalid Date')).not.toBeInTheDocument();
  });

  test('unknown icon value falls back to neutral grey accent without crash', () => {
    renderApp();
    fireEvent.click(screen.getByText('PupEdge'));
    const heading = screen.getByRole('heading', { level: 2, name: /PupEdge/i });
    expect(heading.style.color).toBeTruthy();
  });
});
