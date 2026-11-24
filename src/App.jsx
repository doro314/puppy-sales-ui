import { useEffect, useState } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate, useNavigationType, useParams, useSearchParams } from 'react-router-dom';

import ContactForm from './components/ContactForm';
import HomePage from './components/HomePage';
import PuppyPage from './components/PuppyPage';
import SiteNav from './components/SiteNav';
import { findPuppy, getListedLitters, getPuppyPhotos, getPuppyStatus } from './data/puppies';
import { ACCENTS, capitalize, formatDay, formatMonthYear, isLikelyBot, todayString } from './utils';

import './App.css';

const SHOW_CONTACT = true;
const SITE_NAME = 'Doro Family Puppies';
const TAGLINE = 'Lovingly raised, family bred';
const COUNTER_BASE = 'https://api.counterapi.dev/v1/doro-family-puppies';
const VISITED_KEY = 'dfp-visited';
const WAITLIST = 'waitlist';
const WAITLIST_MESSAGE = "Hi! We'd love to join the list for your next litter. Please let us know when puppies are on the way.";

let counterFired = false;

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

    // Storage throws when the visitor blocks site data; uncaught here it would blank the page.
    let isNewVisitor = false;
    try {
      isNewVisitor = !localStorage.getItem(VISITED_KEY);
      if (isNewVisitor) localStorage.setItem(VISITED_KEY, '1');
    } catch {
      isNewVisitor = false;
    }
    if (isNewVisitor) {
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

function HomeRoute({ today, showParents }) {
  usePageTitle(SITE_NAME);
  return <HomePage today={today} showParents={showParents} />;
}

function PuppyRoute({ today }) {
  const { slug } = useParams();
  const found = findPuppy(slug);
  usePageTitle(found ? `${found.puppy.name} · ${SITE_NAME}` : SITE_NAME);
  if (!found) return <Navigate to="/" replace />;
  return <PuppyPage key={slug} puppy={found.puppy} litter={found.litter} today={today} />;
}

// "Female · available" — the line under the puppy's name on the form
function topicDetail(puppy, litter, today) {
  const status = litter.listed ? getPuppyStatus(puppy, litter, today) : 'adopted';
  const word = status === 'soon' ? `ready ${formatDay(litter.readyDate)}` : status;
  return `${capitalize(puppy.sex)} · ${word}`;
}

function ContactRoute({ today }) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  usePageTitle(`Contact · ${SITE_NAME}`);

  const about = searchParams.get('about');
  const found = about && about !== WAITLIST ? findPuppy(about) : null;
  let topic = null;
  let message = '';
  if (about === WAITLIST) {
    topic = { kind: WAITLIST };
    message = WAITLIST_MESSAGE;
  } else if (found) {
    const { puppy, litter } = found;
    topic = {
      kind: 'puppy',
      slug: puppy.slug,
      name: puppy.name,
      detail: topicDetail(puppy, litter, today),
      photo: getPuppyPhotos(litter, puppy)[0]?.thumb,
    };
    message = `Hi! I'm interested in ${puppy.name} and would love to learn more. Please let me know about availability and next steps.`;
  }
  const accent = ACCENTS[found?.puppy.sex] ?? ACCENTS.neutral;

  // A visit that starts on this page has nothing to go back to: Back goes Home instead of leaving the site.
  const handleBack = () => (location.key === 'default' ? navigate('/') : navigate(-1));

  return (
    <ContactForm
      key={about ?? 'general'}
      topic={topic}
      initialMessage={message}
      accentColor={accent.light}
      accentStrongColor={accent.strong}
      onBack={handleBack}
    />
  );
}

function App() {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigationType = useNavigationType();
  const { visitorCount, uniqueCount } = useVisitCounter();

  // A new page starts at the top; Back and Forward keep the position the browser restores,
  // and a link to a spot on the page (#litter-…) is scrolled there by that page.
  useEffect(() => {
    if (navigationType === 'PUSH' && !location.hash) window.scrollTo(0, 0);
  }, [location.pathname, location.hash, navigationType]);

  const today = todayString();
  const showCount = searchParams.has('count');
  const littersWithPuppies = getListedLitters().filter((litter) => litter.puppies.length > 0);
  const navGroups = littersWithPuppies.map((litter) => ({
    id: litter.id,
    label: littersWithPuppies.length > 1 && litter.born ? `${formatMonthYear(litter.born)} litter` : 'Puppies',
    puppies: litter.puppies.map((puppy) => ({
      slug: puppy.slug,
      name: puppy.name,
      sex: puppy.sex,
      status: getPuppyStatus(puppy, litter, today),
      readyDate: litter.readyDate,
    })),
  }));

  return (
    <div className="app-wrapper">
      <SiteNav
        siteName={SITE_NAME}
        tagline={TAGLINE}
        puppyGroups={navGroups}
        activeId={location.pathname.slice(1) || 'home'}
        showContact={SHOW_CONTACT}
      />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<HomeRoute today={today} showParents={searchParams.get('parents') === 'true'} />} />
          {SHOW_CONTACT && <Route path="/contact" element={<ContactRoute today={today} />} />}
          <Route path="/:slug" element={<PuppyRoute today={today} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <footer className="site-footer">
          <p className="site-footer-copy">&copy; {new Date().getFullYear()} All rights reserved.</p>
          {showCount && (
            <p className="site-footer-count">
              {visitorCount === null ? '…' : `${visitorCount.toLocaleString()} visits`}
              {uniqueCount !== null && ` · ${uniqueCount.toLocaleString()} unique`}
            </p>
          )}
        </footer>
      </main>
    </div>
  );
}

export default App;
