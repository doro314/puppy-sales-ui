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
  vi.unstubAllGlobals();
  litter.puppies.forEach((p, i) => { p.status = originalStatuses[i]; });
  litter.listed = true;
  fixture.litters.splice(0, fixture.litters.length, litter);
});

// A newer litter, listed above the fixture one — what the next litter will look like.
function addNewerLitter(fields) {
  fixture.litters.unshift({
    id: '2027-01-test-litter',
    listed: true,
    breed: 'Test Breed',
    mom: { name: 'Mamma', breed: 'Test Breed' },
    dad: { name: 'Pappa', breed: 'Test Breed' },
    puppies: [],
    ...fields,
  });
}

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

  test('every puppy in the nav carries its status (PLUS-2)', () => {
    renderAt();
    const nav = screen.getByRole('navigation');
    expect(within(nav).getByRole('link', { name: /PupReserved/ })).toHaveTextContent('Reserved');
    expect(within(nav).getByRole('link', { name: /PupAdopted/ })).toHaveTextContent('Adopted');
    expect(within(nav).getByRole('link', { name: /PupAvailable/ })).toHaveTextContent('Available');
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
    fireEvent.click(screen.getByRole('link', { name: /Inquire about PupAvailable/ }));
    expect(screen.getByRole('textbox', { name: /message/i }).value).toMatch(/PupAvailable/);
  });

  test('a contact link names the puppy in the message', () => {
    renderAt('/contact?about=pup-available');
    expect(screen.getByRole('textbox', { name: /message/i }).value).toMatch(/PupAvailable/);
  });

  test('the waitlist link opens the form ready to join the list', () => {
    renderAt('/contact?about=waitlist');
    expect(screen.getByRole('textbox', { name: /message/i }).value).toMatch(/next litter/);
  });
});

describe('Puppy pages (PUP-2)', () => {
  const idBlock = () => document.querySelector('.pup-id');

  test('an available puppy: status, a ready line and Inquire right under the name', () => {
    renderAt('/pup-available');
    expect(within(idBlock()).getByText('Available')).toBeInTheDocument();
    expect(idBlock()).toHaveTextContent('Male · ready to go home now');
    expect(screen.getByRole('link', { name: /Inquire about PupAvailable/ })).toHaveAttribute('href', '/contact?about=pup-available');
    expect(screen.getByText('Reserve today — $100 holds him')).toBeInTheDocument();
  });

  test('facts read in words, and empty ones are skipped', () => {
    renderAt('/pup-available');
    const facts = document.querySelector('.pup-facts');
    expect(facts).toHaveTextContent('ColorSolid black');
    expect(facts).toHaveTextContent('Weight27.8 oz at 3 weeks');
    expect(facts).toHaveTextContent('PersonalityPlayful');
    expect(facts).not.toHaveTextContent('Markings');
  });

  test('a puppy with no facts has no About section and never prints undefined or null', () => {
    renderAt('/pup-partial');
    expect(document.querySelector('.pup-facts')).toBeNull();
    expect(screen.queryByText(/undefined|null/)).not.toBeInTheDocument();
  });

  test('before the ready date: the date, her age, and Get in line', () => {
    vi.setSystemTime(new Date(2026, 6, 10));
    renderAt('/pup-partial');
    expect(idBlock()).toHaveTextContent('Ready Jul 28');
    expect(idBlock()).toHaveTextContent('Female · 5 weeks old');
    expect(screen.getByRole('link', { name: /Get in line for PupPartial/ })).toBeInTheDocument();
  });

  test('a reserved puppy points to the littermates still available, not a dead-end button', () => {
    vi.setSystemTime(new Date(2026, 6, 10));
    renderAt('/pup-reserved');
    expect(within(idBlock()).getByText('Reserved')).toBeInTheDocument();
    const stillLooking = screen.getByText('Still looking for homes').closest('section');
    expect(within(stillLooking).getByRole('link', { name: /PupAvailable/ })).toBeInTheDocument();
    expect(within(stillLooking).getByRole('link', { name: /PupPartial/ })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Inquire about|Get in line/ })).not.toBeInTheDocument();
  });

  test('once every puppy has a home, the page offers the list for the next litter', () => {
    litter.puppies.forEach((p) => { if (p.status === 'available') p.status = 'adopted'; });
    renderAt('/pup-reserved');
    expect(screen.getByRole('link', { name: 'Join the list for the next litter' })).toHaveAttribute('href', '/contact?about=waitlist');
  });

  test('littermates and the litter strip close an available puppy page', () => {
    renderAt('/pup-available');
    expect(screen.getByText('His littermates')).toBeInTheDocument();
    expect(screen.getByText("From Mamma × Pappa's litter")).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'About the litter ›' })).toHaveAttribute('href', '/#litter-2026-06-test-litter');
  });
});

describe('Every season (PLUS-5)', () => {
  test('expecting: the due date, the waitlist, and the older litter below', () => {
    addNewerLitter({ due: '2027-01-12' });
    renderAt();
    expect(screen.getByRole('heading', { level: 2, name: 'Mamma is expecting' })).toBeInTheDocument();
    expect(screen.getByText('Due Jan 12 · Mamma × Pappa')).toBeInTheDocument();
    expect(document.querySelector('.litter-tiles')).toHaveTextContent('DueJan 12');
    expect(screen.getByRole('link', { name: 'Join the waitlist' })).toHaveAttribute('href', '/contact?about=waitlist');
    expect(screen.getByRole('heading', { level: 3, name: "Mamma & Pappa's June 2026 litter" })).toBeInTheDocument();
    expect(screen.getAllByText('PupAvailable').length).toBeGreaterThan(0);
  });

  test('born, no photos yet: a count instead of a gallery, and placeholders', () => {
    litter.listed = false;
    addNewerLitter({
      born: '2027-01-10',
      readyDate: '2027-03-07',
      puppies: [
        { slug: 'maple', name: 'Maple', sex: 'female', status: 'available' },
        { slug: 'rocky', name: 'Rocky', sex: 'male', status: 'available' },
      ],
    });
    vi.setSystemTime(new Date(2027, 0, 20));
    renderAt();
    expect(screen.getByText('2 puppies · photos coming soon')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Reserve today/ })).toBeInTheDocument();
    expect(screen.getAllByText('Photos soon')).toHaveLength(2);
    expect(within(document.querySelector('.puppy-grid')).getAllByText('Ready Mar 7')).toHaveLength(2);
  });

  test('two litters with puppies: the nav groups them', () => {
    addNewerLitter({ born: '2027-01-10', readyDate: '2027-03-07', puppies: [{ slug: 'maple', name: 'Maple', sex: 'female', status: 'available' }] });
    renderAt();
    const nav = screen.getByRole('navigation');
    expect(nav).toHaveTextContent('January 2027 litter');
    expect(nav).toHaveTextContent('June 2026 litter');
  });

  test('a puppy from a retired litter has gone home, and the next litter is open', () => {
    litter.listed = false;
    addNewerLitter({ due: '2027-01-12' });
    renderAt('/pup-available');
    expect(document.querySelector('.pup-id')).toHaveTextContent('Male · has gone home');
    expect(within(document.querySelector('.pup-id')).getByText('Adopted')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Join the list for the next litter' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Inquire about/ })).not.toBeInTheDocument();
  });
});

describe('The inquiry knows the puppy (PLUS-6)', () => {
  function stubFormspree() {
    const fetchMock = vi.fn(() => Promise.resolve({ ok: true }));
    vi.stubGlobal('fetch', fetchMock);
    return fetchMock;
  }

  function fillAndSend({ phone = '' } = {}) {
    fireEvent.change(screen.getByLabelText(/^Name/), { target: { value: 'Ann' } });
    fireEvent.change(screen.getByLabelText(/^Email/), { target: { value: 'ann@example.com' } });
    if (phone) fireEvent.change(screen.getByLabelText(/^Phone/), { target: { value: phone } });
    fireEvent.click(screen.getByRole('button', { name: /Send Message/ }));
  }

  const sentBody = (fetchMock) => JSON.parse(fetchMock.mock.calls[0][1].body);

  test('the form shows which puppy, and sends it with a subject that names her', async () => {
    const fetchMock = stubFormspree();
    renderAt('/contact?about=pup-available');
    expect(screen.getByText('About PupAvailable')).toBeInTheDocument();
    expect(screen.getByText('Male · available')).toBeInTheDocument();
    fillAndSend({ phone: '(555) 555-0123' });
    expect(await screen.findByText(/Thanks for reaching out/)).toBeInTheDocument();
    expect(sentBody(fetchMock)).toMatchObject({
      name: 'Ann',
      phone: '(555) 555-0123',
      puppy: 'pup-available',
      subject: 'Puppy inquiry — PupAvailable',
    });
  });

  test('clearing the puppy sends a general inquiry', async () => {
    const fetchMock = stubFormspree();
    renderAt('/contact?about=pup-available');
    fireEvent.click(screen.getByRole('button', { name: 'Not about PupAvailable' }));
    expect(screen.queryByText('About PupAvailable')).not.toBeInTheDocument();
    fillAndSend();
    await screen.findByText(/Thanks for reaching out/);
    expect(sentBody(fetchMock)).toMatchObject({ puppy: '', subject: 'Puppy inquiry' });
  });

  test('the waitlist sends its own subject', async () => {
    const fetchMock = stubFormspree();
    renderAt('/contact?about=waitlist');
    expect(screen.getByText('The list for the next litter')).toBeInTheDocument();
    fillAndSend();
    await screen.findByText(/Thanks for reaching out/);
    expect(sentBody(fetchMock)).toMatchObject({ puppy: 'waitlist', subject: 'Waitlist — next litter' });
  });

  test('the phone number is optional, but a short one gets a gentle note', () => {
    renderAt('/contact');
    const phone = screen.getByLabelText(/^Phone/);
    fireEvent.change(phone, { target: { value: '123' } });
    fireEvent.blur(phone);
    expect(screen.getByText(/Please enter a number we can text, or leave it blank/)).toBeInTheDocument();
  });
});
