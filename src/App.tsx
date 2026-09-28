import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import FauxWorldstreamPlayer from './FauxWorldstream';
import {
  displayViewerCount,
  isAlwaysLiveWorld,
  sectionWorlds,
  sortByActivity,
  statusColor,
  statusLabel,
  viewerLabel,
  worldHue,
  worldsForRecommendations,
} from './lib/catalog';
import type {
  CatalogResponse,
  DiscoveryResponse,
  Worldstream,
} from './types';

function PlayIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M8 5.5v13l10-6.5L8 5.5Z" fill="currentColor" />
    </svg>
  );
}

function SparkIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 2l1.55 5.1L19 9l-5.45 1.9L12 16l-1.55-5.1L5 9l5.45-1.9L12 2Zm7 13 .9 2.9L23 19l-3.1 1.1L19 23l-.9-2.9L15 19l3.1-1.1L19 15Z"
        fill="currentColor"
      />
    </svg>
  );
}

function GlobeIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M3.4 12h17.2M12 3c2.2 2.45 3.2 5.45 3.2 9s-1 6.55-3.2 9c-2.2-2.45-3.2-5.45-3.2-9S9.8 5.45 12 3Z"
        stroke="currentColor"
        strokeWidth="1.6"
      />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="m9 18 6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function WorldMedia({ world, eager = false }: { world: Worldstream; eager?: boolean }) {
  const [failed, setFailed] = useState(false);
  const hue = worldHue(world.publicId);
  const hasVideo = world.demoVideoEnabled && world.demoVideoUrl;
  const imageUrl = world.thumbnailUrl || world.worldLogoUrl;
  return (
    <div className="world-media" style={{ '--world-hue': hue } as React.CSSProperties}>
      {hasVideo && !failed ? (
        <video
          src={world.demoVideoUrl}
          poster={imageUrl || undefined}
          muted
          loop
          autoPlay
          playsInline
          onError={() => setFailed(true)}
        />
      ) : imageUrl && !failed ? (
        <img
          src={imageUrl}
          alt=""
          loading={eager ? 'eager' : 'lazy'}
          onError={() => setFailed(true)}
        />
      ) : (
        <div className="world-placeholder">
          <GlobeIcon size={34} />
          <span>{world.title.slice(0, 1).toUpperCase()}</span>
        </div>
      )}
      <div className="world-media-shade" />
    </div>
  );
}

function Avatar({ world, size = 'card' }: { world: Worldstream; size?: 'card' | 'rail' }) {
  const [failed, setFailed] = useState(false);
  const source = world.worldLogoUrl || world.thumbnailUrl;
  return (
    <div
      className={`avatar avatar-${size}`}
      style={{ '--world-hue': worldHue(world.publicId) } as React.CSSProperties}
    >
      {source && !failed
        ? <img src={source} alt="" onError={() => setFailed(true)} />
        : <span>{world.title.slice(0, 1).toUpperCase()}</span>}
    </div>
  );
}

function WorldCard({ world, featured = false, onOpen, reason }: {
  world: Worldstream;
  featured?: boolean;
  onOpen: (world: Worldstream) => void;
  reason?: string;
}) {
  const displayedStatus = isAlwaysLiveWorld(world.publicId) ? 'live' : world.status;
  return (
    <button
      className={`world-card ${featured ? 'world-card-featured' : ''}`}
      type="button"
      onClick={() => onOpen(world)}
      aria-label={`Watch ${world.title}`}
    >
      <div className="world-preview">
        <WorldMedia world={world} eager={featured} />
        <div className="status-chip">
          <span
            className={displayedStatus === 'booting' ? 'status-dot pulse' : 'status-dot'}
            style={{ backgroundColor: statusColor(displayedStatus) }}
          />
          {statusLabel(displayedStatus)}
        </div>
        <span className="play-overlay"><span><PlayIcon /></span></span>
      </div>
      <div className="world-card-copy">
        <Avatar world={world} />
        <span className="world-card-text">
          <span className="world-card-title-row">
            <strong>{world.title}</strong>
            <small>{viewerLabel(displayViewerCount(world.viewerCount, world.publicId))}</small>
          </span>
          <span className="world-name">{reason || world.worldName}</span>
        </span>
      </div>
    </button>
  );
}

function Rail({ title, worlds, featured = false, onOpen, emptyText }: {
  title?: string;
  worlds: Worldstream[];
  featured?: boolean;
  onOpen: (world: Worldstream) => void;
  emptyText?: string;
}) {
  const railRef = useRef<HTMLDivElement>(null);
  const scroll = () => railRef.current?.scrollBy({ left: railRef.current.clientWidth * 0.72, behavior: 'smooth' });
  return (
    <section className={`directory-section ${featured ? 'featured-section' : ''}`}>
      {title ? (
        <div className="section-heading">
          <h2>{title}</h2>
          {worlds.length > 3 ? (
            <button type="button" onClick={scroll}>View more <ArrowIcon /></button>
          ) : null}
        </div>
      ) : null}
      {worlds.length > 0 ? (
        <div className="card-rail" ref={railRef}>
          {worlds.map(world => (
            <WorldCard key={world.publicId} world={world} featured={featured} onOpen={onOpen} />
          ))}
        </div>
      ) : emptyText ? <div className="empty-rail">{emptyText}</div> : null}
    </section>
  );
}

function LoadingRail() {
  return (
    <div className="card-rail" aria-label="Loading worlds">
      {[0, 1, 2, 3].map(item => (
        <div className="world-card loading-card" key={item}>
          <div className="loading-preview" />
          <div className="loading-lines"><span /><span /></div>
        </div>
      ))}
    </div>
  );
}

const moodCapsules = [
  { label: '🌌 Deep Space Horror', query: 'cosmic dark sci-fi horror in deep space with mysterious alien signals' },
  { label: '⚡ Cyberpunk Neon', query: 'neon high-tech cyberpunk city underworld with hacker factions' },
  { label: '🔥 Survival Gauntlet', query: 'post-apocalyptic harsh wilderness survival against extreme environmental storms' },
  { label: '🕵️ Quantum Mystery', query: 'noir detective solving strange reality-bending timeline murders' },
  { label: '🪐 Surreal Comedy', query: 'chaotic hilarious absurd interdimensional game show' },
];

function WorldFinder({
  worlds,
  onOpen,
  externalQuery,
}: {
  worlds: Worldstream[];
  onOpen: (world: Worldstream) => void;
  externalQuery?: string;
}) {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<DiscoveryResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const executeSearch = async (searchTerm: string) => {
    const nextQuery = searchTerm.trim();
    if (nextQuery.length < 3 || loading) return;
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/discover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: nextQuery }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body?.error || 'Could not find a world right now.');
      setResult(body as DiscoveryResponse);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Could not find a world right now.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (externalQuery) {
      setQuery(externalQuery);
      executeSearch(externalQuery);
    }
  }, [externalQuery]);

  const recommendations = useMemo(() => {
    if (!result) return [];
    const reasons = new Map(result.recommendations.map(item => [item.publicId, item.reason]));
    return worldsForRecommendations(worlds, result.recommendations.map(item => item.publicId))
      .map(world => ({ world, reason: reasons.get(world.publicId) || '' }));
  }, [result, worlds]);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    executeSearch(query);
  };

  return (
    <section className="finder" id="world-finder" aria-labelledby="finder-title">
      <div className="finder-glow" />
      <div className="finder-heading">
        <span className="finder-icon"><SparkIcon size={17} /></span>
        <div>
          <div className="finder-label">Gemini Discovery Co-Pilot</div>
          <h2 id="finder-title">Find Your Next Interactive World</h2>
        </div>
      </div>
      <p>Describe your preferred narrative vibe, stakes, or atmosphere. Gemini will analyze the live catalog and curate the perfect interactive entry points.</p>

      <div className="mood-capsules-wrap">
        <span className="mood-label">Instant Moods:</span>
        <div className="mood-capsules">
          {moodCapsules.map(item => (
            <button
              key={item.label}
              type="button"
              className="mood-capsule"
              onClick={() => {
                setQuery(item.query);
                executeSearch(item.query);
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={submit} className="finder-form">
        <label htmlFor="world-query" className="sr-only">Describe a world</label>
        <input
          id="world-query"
          value={query}
          onChange={event => setQuery(event.target.value)}
          maxLength={280}
          placeholder="E.g., High-stakes submarine survival with bioluminescent creatures..."
          autoComplete="off"
        />
        <button type="submit" disabled={loading || query.trim().length < 3}>
          {loading ? <span className="button-spinner" /> : <SparkIcon size={16} />}
          {loading ? 'Curating' : 'Ask Gemini'}
        </button>
      </form>
      {error ? <div className="finder-error" role="alert">{error}</div> : null}
      {result ? (
        <div className="finder-results" aria-live="polite">
          <div className="finder-result-intro">
            <span>{result.intro}</span>
            {result.poweredBy === 'catalog' ? (
              <small>Local catalog match</small>
            ) : (
              <small className="gemini-tag"><SparkIcon size={10} /> Gemini 3.8 Flash Match</small>
            )}
          </div>
          <div className="finder-grid">
            {recommendations.map(({ world, reason }) => (
              <WorldCard key={world.publicId} world={world} reason={reason} onOpen={onOpen} />
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}

function Header() {
  const scrollToFinder = () => document.getElementById('world-finder')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  return (
    <header className="site-header">
      <button type="button" className="brand" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
        <img className="brand-logo brand-logo-full" src="/brand/sequencer-logo.svg" alt="Sequencer" />
        <img className="brand-logo brand-logo-mark" src="/brand/sequencer-mark.svg" alt="Sequencer" />
      </button>
      <nav>
        <span className="gemini-chip"><SparkIcon size={12} /> Gemini 3.8 Flash</span>
        <button type="button" onClick={scrollToFinder}>
          <SparkIcon size={14} /> Find your world
        </button>
      </nav>
    </header>
  );
}

function Sidebar({ worlds, onOpen }: { worlds: Worldstream[]; onOpen: (world: Worldstream) => void }) {
  return (
    <aside className="world-sidebar" aria-label="World shortcuts">
      <div className="sidebar-top"><span className="broadcast-dot"><i /></span></div>
      <div className="sidebar-divider" />
      <div className="sidebar-list">
        {worlds.slice(0, 32).map(world => (
          <button type="button" key={world.publicId} onClick={() => onOpen(world)} aria-label={`Watch ${world.title}`}>
            <Avatar world={world} size="rail" />
            <i style={{ background: statusColor(isAlwaysLiveWorld(world.publicId) ? 'live' : world.status) }} />
            <span className="sidebar-tooltip">{world.title}</span>
          </button>
        ))}
      </div>
    </aside>
  );
}

function HowItWorks() {
  return (
    <section className="how-it-works" id="how-it-works">
      <div className="how-heading">
        <h2>How Worldstreams Work</h2>
        <p>A Worldstream is continuous generative AI video that renders each scene live and responds to viewer directives.</p>
      </div>
      <div className="how-grid">
        <article>
          <span className="how-number">01</span>
          <h3><SparkIcon size={18} /> Generated live as you watch</h3>
          <p>Every frame is generated continuously, preserving persistent world rules, visual consistency, and real-time narrative arcs.</p>
        </article>
        <article>
          <span className="how-number">02</span>
          <h3><GlobeIcon size={18} /> Directed by Gemini & Audiences</h3>
          <p>Gemini orchestrates real-time branching dilemmas, tallies collective votes, and directs the next scene prompt on the fly.</p>
        </article>
      </div>
    </section>
  );
}

const faqs = [
  {
    question: 'What is a Worldstream?',
    answer: 'A Worldstream is a live, audience-directed synthetic world that generates an ongoing sequence of scenes. Everyone watches the same stream and helps steer what happens next.',
  },
  {
    question: 'How does Gemini direct the stream?',
    answer: 'Gemini acts as the autonomous World Director. It evaluates the current story state, creates branching dilemmas for audience voting, and writes the generative video prompts for subsequent scenes.',
  },
  {
    question: 'Do viewers need special hardware?',
    answer: 'No. Worldstreams render in the cloud on Google Cloud Run and stream directly to standard web browsers on desktop or mobile.',
  },
  {
    question: 'Do viewers need an account?',
    answer: 'No account is needed. Select any world to open its interactive stream.',
  },
  {
    question: 'What happens when a Worldstream is idle?',
    answer: 'Its cinematic stream remains available with audience activity, voting, prompts, and reactions.',
  },
];

function WorldstreamsFAQ() {
  return (
    <section className="faq-section">
      <div className="faq-heading">
        <h2>Worldstreams FAQ</h2>
        <p>The essentials for directing and exploring live AI video worlds.</p>
      </div>
      <div className="faq-list">
        {faqs.map(item => (
          <article key={item.question}>
            <h3>{item.question}</h3>
            <p>{item.answer}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="footer-top">
        <div className="footer-intro">
          <img src="/brand/sequencer-logo.svg" alt="Sequencer" />
          <p>The creative suite for AI filmmaking and interactive streaming worlds.</p>
        </div>
        <div className="footer-links">
          <div>
            <strong>Studio</strong>
            <a href="https://sequencer.media/studio" target="_blank" rel="noreferrer">Our Work</a>
            <a href="https://sequencer.media/events" target="_blank" rel="noreferrer">Events</a>
            <a href="https://sequencer.media/posts/tutorials" target="_blank" rel="noreferrer">Academy</a>
          </div>
          <div>
            <strong>Product</strong>
            <a href="https://sequencer.media/film" target="_blank" rel="noreferrer">For Filmmakers</a>
            <a href="https://sequencer.media/extensions" target="_blank" rel="noreferrer">Extensions</a>
            <a href="https://sequencer.media/docs" target="_blank" rel="noreferrer">Documentation</a>
          </div>
          <div>
            <strong>Company</strong>
            <a href="https://sequencer.media/about" target="_blank" rel="noreferrer">About Us</a>
            <a href="https://sequencer.media/careers" target="_blank" rel="noreferrer">Careers</a>
            <a href="https://sequencer.media/pricing" target="_blank" rel="noreferrer">Pricing</a>
          </div>
        </div>
      </div>
      <div className="footer-bottom">
        <span>© 2026 Sequencer Media. Powered by Google Gemini 3.8 Flash.</span>
        <div>
          <a href="https://sequencer.media/terms-of-service" target="_blank" rel="noreferrer">Terms of Service</a>
          <a href="https://sequencer.media/privacy-policy" target="_blank" rel="noreferrer">Privacy Policy</a>
          <a href="https://sequencer.media/content-policy" target="_blank" rel="noreferrer">Content Policy</a>
        </div>
      </div>
    </footer>
  );
}

export default function App() {
  const [worlds, setWorlds] = useState<Worldstream[]>([]);
  const [source, setSource] = useState<'live' | 'cache'>('live');
  const [loading, setLoading] = useState(true);
  const [selectedWorld, setSelectedWorld] = useState<Worldstream | null>(null);

  const sections = useMemo(() => sectionWorlds(worlds), [worlds]);
  const orderedWorlds = useMemo(() => sortByActivity(worlds), [worlds]);

  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/worldstreams', { signal: controller.signal })
      .then(async response => {
        if (!response.ok) throw new Error('Directory unavailable');
        return response.json() as Promise<CatalogResponse>;
      })
      .then(result => {
        setWorlds(result.worldstreams);
        setSource(result.source);
      })
      .catch(error => {
        if (error?.name !== 'AbortError') console.error(error);
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, []);

  const openFirstFeaturedWorld = () => {
    if (sections.featured.length > 0) {
      setSelectedWorld(sections.featured[0]);
    } else if (worlds.length > 0) {
      setSelectedWorld(worlds[0]);
    }
  };

  return (
    <div className="app-shell">
      <Header />
      <div className="app-body">
        <Sidebar worlds={orderedWorlds} onOpen={setSelectedWorld} />
        <main>
          <section className="hero">
            <div className="hero-glow hero-glow-one" />
            <div className="hero-glow hero-glow-two" />
            <div className="hero-heading">
              <h1>WORLDSTREAMS</h1>
              <p>INTERACTIVE AI VIDEO WORLDS SHAPED BY YOU</p>
            </div>
            <div className="hero-rail-wrap">
              {loading ? <LoadingRail /> : <Rail worlds={sections.featured} featured onOpen={setSelectedWorld} />}
            </div>
            <p className="hero-description">
              Explore cinematic AI video worlds and shape what happens next.<br />
              Vote with the audience, write a prompt, and react live as each story unfolds.
            </p>

            <div className="hero-cta-cluster">
              <button
                type="button"
                className="hero-primary-btn"
                onClick={openFirstFeaturedWorld}
              >
                <SparkIcon size={16} />
                <span>Enter a Worldstream</span>
              </button>
              <a
                className="hero-tertiary-link"
                href="#world-finder"
              >
                Explore By Mood ↓
              </a>
            </div>

            {source === 'cache' && !loading ? (
              <div className="cache-note">Showing the bundled catalog while live directory connects.</div>
            ) : null}
          </section>

          <div className="directory-content">
            <Rail title="Trending Worlds" worlds={sections.trending} onOpen={setSelectedWorld} />
            {sections.multiplayer.length ? (
              <Rail title="Multiplayer Worlds" worlds={sections.multiplayer} onOpen={setSelectedWorld} />
            ) : null}
            <Rail title="Playable Games" worlds={sections.games} onOpen={setSelectedWorld} emptyText="More playable worlds are coming online." />
            {sections.stories.length ? <Rail title="World Stories" worlds={sections.stories} onOpen={setSelectedWorld} /> : null}
            <div className="finder-band">
              <WorldFinder worlds={worlds} onOpen={setSelectedWorld} />
            </div>
          </div>
          <HowItWorks />
          <WorldstreamsFAQ />
          <SiteFooter />
        </main>
      </div>

      {selectedWorld ? (
        <FauxWorldstreamPlayer
          key={selectedWorld.publicId}
          world={selectedWorld}
          worlds={orderedWorlds}
          onSelectWorld={setSelectedWorld}
          onClose={() => setSelectedWorld(null)}
        />
      ) : null}
    </div>
  );
}
