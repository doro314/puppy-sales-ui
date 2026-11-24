import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';

import App from './App';

// ── A fixture litter stands in for litters.json; the real data layer runs on it ──

const fixture = vi.hoisted(() => ({
  litters: [
    {
      id: '2026-06-test-litter',
      listed: true,
      breed: 'Test Breed',
      mom: { name: 'Mamma', breed: 'Test Breed', photo: 'mamma.jpg' },
      dad: { name: 'Pappa', breed: 'Test Breed', photo: 'pappa.jpg' },
      born: '2026-06-02',
      readyDate: '2026-07-28',
      care: [{ type: 'dewormed', date: '2026-06-29' }, { type: 'vet-check' }],
      description: 'Raised with kids and cats, so they settle in fast.',
      facts: ['Small and friendly'],
      puppies: [
        { slug: 'pup-available', name: 'PupAvailable', sex: 'male', status: 'available', color: ['black'], pattern: 'solid', personality: 'Playful', weights: [{ date: '2026-06-28', oz: 27.8 }] },
        { slug: 'pup-adopted', name: 'PupAdopted', sex: 'female', status: 'adopted', color: ['white'], personality: 'Calm' },
        { slug: 'pup-reserved', name: 'PupReserved', sex: 'male', status: 'reserved', color: ['brown'], personality: 'Bold' },
        { slug: 'pup-partial', name: 'PupPartial', sex: 'female', status: 'available' },
      ],
    },
  ],
}));

vi.mock('./data/litters.json', () => ({ default: fixture }));

vi.mock('./data/imageLoader', () => {
  const photo = { name: 'a.jpg', src: '/a-1280.webp', srcSet: '/a-1280.webp 1280w', thumb: '/a-320.webp' };
  const folders = { '2026-06-test-litter': [photo] };
  return {
    getFolderPhotos: (folder) => folders[folder] ?? [],
    getPhoto: () => null,
    getImagesByFolder: () => ({}),
    getPhotoSrc: () => null,
  };
});

const litter = fixture.litters[0];
const originalStatuses = litter.puppies.map((p) => p.status);

const renderAt = (path = '/') => render(<MemoryRouter initialEntries={[path]}><App /></MemoryRouter>);

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(2026, 7, 1));
});

afterEach(() => {
  vi.useRealTimers();
  litter.puppies.forEach((p, i) => { p.status = originalStatuses[i]; });
});

// ── Tests ──────────────────────────────────────────────────────────────────

describe('Site chrome', () => {
  test('the bar names the site and the nav lists every page', () => {
    renderAt();
    expect(screen.getByText('Doro Family Puppies')).toBeInTheDocument();
    const nav = screen.getByRole('navigation');
    for (const name of ['Home', 'PupAvailable', 'PupAdopted', 'PupReserved', 'Contact Us']) {
      expect(nav).toHaveTextContent(name);
    }
  });
});

describe('Home (HOME-8)', () => {
  test('the gallery names the litter and how many are still looking', () => {
    renderAt();
    expect(screen.getByRole('heading', { level: 2, name: "Mamma & Pappa's litter" })).toBeInTheDocument();
    expect(screen.getByText('2 of 4 still looking for a home')).toBeInTheDocument();
  });

  test('the litter card shows the parents and opens more about the litter in place', () => {
    renderAt();
    expect(screen.getByText('Mamma × Pappa')).toBeInTheDocument();
    expect(screen.getByText(/Mom & dad · Test Breeds/)).toBeInTheDocument();
    expect(screen.queryByText('Small and friendly')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /More about the litter/ }));
    expect(screen.getByText('Care so far')).toBeInTheDocument();
    expect(screen.getByText('Small and friendly')).toBeInTheDocument();
  });

  test('a tile for each major detail, care steps only once done', () => {
    renderAt();
    const tiles = document.querySelector('.litter-tiles');
    expect(tiles).toHaveTextContent('BornJun 2');
    expect(tiles).toHaveTextContent('Goes homeNow');
    expect(tiles).toHaveTextContent('Vet checkedYes');
    expect(tiles).toHaveTextContent('DewormedJun 29');
    expect(tiles).not.toHaveTextContent('Vaccinated');
  });

  test('the reserve banner sits under the tiles while a puppy is available', () => {
    renderAt();
    expect(screen.getByRole('link', { name: /Reserve today — \$100 holds your pup/ })).toHaveAttribute('href', '/contact');
  });

  test('every puppy card carries its status', () => {
    renderAt();
    const grid = document.querySelector('.puppy-grid');
    expect(within(grid).getByRole('link', { name: /PupReserved/ })).toHaveTextContent('Reserved');
    expect(within(grid).getByRole('link', { name: /PupAdopted/ })).toHaveTextContent('Adopted');
    expect(within(grid).getAllByText('Available')).toHaveLength(2);
  });

  test('before the ready date, available puppies show when they can go home', () => {
    vi.setSystemTime(new Date(2026, 6, 10));
    renderAt();
    expect(within(document.querySelector('.puppy-grid')).getAllByText('Ready Jul 28')).toHaveLength(2);
    expect(document.querySelector('.litter-tiles')).toHaveTextContent('Goes homeJul 28');
  });

  test('once every puppy is spoken for, the banner gives way to the next-litter list', () => {
    litter.puppies.forEach((p) => { if (p.status === 'available') p.status = 'reserved'; });
    renderAt();
    expect(screen.getByText('Every puppy has a home')).toBeInTheDocument();
    expect(screen.queryByText(/Reserve today/)).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Join the list for the next litter' })).toHaveAttribute('href', '/contact?about=waitlist');
  });

  test('?parents=true still shows the parents section', () => {
    renderAt('/?parents=true');
    expect(screen.getByText('Meet the Parents')).toBeInTheDocument();
  });
});

describe('Navigation and links', () => {
  test('a puppy card opens that puppy', () => {
    renderAt();
    fireEvent.click(within(document.querySelector('.puppy-grid')).getByRole('link', { name: /PupReserved/ }));
    expect(screen.getByRole('heading', { level: 2, name: /PupReserved/ })).toBeInTheDocument();
  });

  test('a puppy has its own address', () => {
    renderAt('/pup-adopted');
    expect(screen.getByRole('heading', { level: 2, name: /PupAdopted/ })).toBeInTheDocument();
    expect(document.title).toBe('PupAdopted · Doro Family Puppies');
  });

  test('an unknown address goes Home', () => {
    renderAt('/nobody-by-that-name');
    expect(screen.getByRole('heading', { level: 2, name: "Mamma & Pappa's litter" })).toBeInTheDocument();
  });

  test('Contact Us opens the form', () => {
    renderAt();
    fireEvent.click(screen.getByText('Contact Us'));
    expect(screen.getByText(/Interested in one of our puppies/i)).toBeInTheDocument();
  });

  test('Inquire opens the form with the puppy named in the message', () => {
    renderAt('/pup-available');
    fireEvent.click(screen.getByRole('button', { name: /Inquire About PupAvailable/i }));
    expect(screen.getByRole('textbox', { name: /message/i }).value).toMatch(/PupAvailable/);
  });

  test('a contact link names the puppy in the message', () => {
    renderAt('/contact?about=pup-available');
    expect(screen.getByRole('textbox', { name: /message/i }).value).toMatch(/PupAvailable/);
  });
});

describe('Puppy pages', () => {
  test('each status shows its badge', () => {
    renderAt('/pup-available');
    expect(screen.getByText('Available')).toBeInTheDocument();
  });

  test('a reserved puppy is never offered as Available Soon', () => {
    vi.setSystemTime(new Date(2026, 6, 10));
    renderAt('/pup-reserved');
    expect(screen.getByText('Reserved')).toBeInTheDocument();
    expect(screen.queryByText('Available Soon')).not.toBeInTheDocument();
  });

  test('missing facts never print as undefined or null', () => {
    renderAt('/pup-partial');
    expect(screen.queryByText(/undefined/)).not.toBeInTheDocument();
    expect(screen.queryByText(/null/)).not.toBeInTheDocument();
  });
});
