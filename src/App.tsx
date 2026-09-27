import { FormEvent, KeyboardEvent, useEffect, useMemo, useRef, useState } from 'react';
import {
  displayViewerCount,
  sectionWorlds,
  statusColor,
  statusLabel,
  viewerLabel,
  worldHue,
  worldsForRecommendations,
} from './lib/catalog';
import type { CatalogResponse, DiscoveryResponse, Recommendation, Worldstream } from './types';

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
      <path d="M12 2l1.55 5.1L19 9l-5.45 1.9L12 16l-1.55-5.1L5 9l5.45-1.9L12 2Zm7 13 .9 2.9L23 19l-3.1 1.1L19 23l-.9-2.9L15 19l3.1-1.1L19 15Z" fill="currentColor" />
    </svg>
  );
}

function GlobeIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
      <path d="M3.4 12h17.2M12 3c2.2 2.45 3.2 5.45 3.2 9s-1 6.55-3.2 9c-2.2-2.45-3.2-5.45-3.2-9S9.8 5.45 12 3Z" stroke="currentColor" strokeWidth="1.6" />
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
            className={world.status === 'booting' ? 'status-dot pulse' : 'status-dot'}
            style={{ backgroundColor: statusColor(world.status) }}
          />
          {statusLabel(world.status)}
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

function WorldFinder({ worlds, onOpen }: { worlds: Worldstream[]; onOpen: (world: Worldstream) => void }) {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<DiscoveryResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const recommendations = useMemo(() => {
    if (!result) return [];
    const reasons = new Map(result.recommendations.map(item => [item.publicId, item.reason]));
    return worldsForRecommendations(worlds, result.recommendations.map(item => item.publicId))
      .map(world => ({ world, reason: reasons.get(world.publicId) || '' }));
  }, [result, worlds]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const nextQuery = query.trim();
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

  return (
    <section className="finder" id="world-finder" aria-labelledby="finder-title">
      <div className="finder-glow" />
      <div className="finder-heading">
        <span className="finder-icon"><SparkIcon size={17} /></span>
        <div>
          <div className="finder-label">Powered by Gemini</div>
          <h2 id="finder-title">Find your next world</h2>
        </div>
      </div>
      <p>Describe a mood, story, or place. Gemini will curate three worlds from the live directory.</p>
      <form onSubmit={submit} className="finder-form">
        <label htmlFor="world-query" className="sr-only">Describe a world</label>
        <input
          id="world-query"
          value={query}
          onChange={event => setQuery(event.target.value)}
          maxLength={280}
          placeholder="A strange cosmic adventure with impossible creatures..."
          autoComplete="off"
        />
        <button type="submit" disabled={loading || query.trim().length < 3}>
          {loading ? <span className="button-spinner" /> : <SparkIcon size={16} />}
          {loading ? 'Searching' : 'Ask Gemini'}
        </button>
      </form>
      {error ? <div className="finder-error" role="alert">{error}</div> : null}
      {result ? (
        <div className="finder-results" aria-live="polite">
          <div className="finder-result-intro">
            <span>{result.intro}</span>
            {result.poweredBy === 'catalog' ? <small>Local preview match</small> : <small>Gemini recommendation</small>}
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

function PlayerModal({ world, onClose }: { world: Worldstream; onClose: () => void }) {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [onClose]);

  return (
    <div className="player-modal" role="dialog" aria-modal="true" aria-label={`Playing ${world.title}`}>
      <header className="player-header">
        <button type="button" onClick={onClose} className="player-back" aria-label="Back to Worldstreams">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="m15 18-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <Avatar world={world} />
        <div className="player-title">
          <strong>{world.title}</strong>
          <span><i style={{ background: statusColor(world.status) }} /> {statusLabel(world.status)}</span>
        </div>
      </header>
      <div className="player-preview-stage">
        <WorldMedia world={world} eager />
        <div className="player-preview-vignette" />
        <div className="player-preview-content">
          <div className="player-preview-kicker"><span /><span>{world.type || 'Interactive world'}</span></div>
          <h2>{world.title}</h2>
          <p>{world.description || 'Enter an interactive AI video world shaped by its audience.'}</p>
          <div className="player-preview-actions">
            <a
              href={`https://worldstreams.ai/w/${encodeURIComponent(world.publicId)}`}
              target="_blank"
              rel="noreferrer"
            >
              <PlayIcon size={16} /> Enter live world
            </a>
            <button type="button" onClick={onClose}>Keep browsing</button>
          </div>
          <small>The live player opens on worldstreams.ai</small>
        </div>
      </div>
    </div>
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
        <span className="gemini-chip"><SparkIcon size={12} /> Gemini curator</span>
        <button type="button" onClick={scrollToFinder}><SparkIcon size={14} /> Find your world</button>
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
            <i style={{ background: statusColor(world.status) }} />
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
        <h2>How Worldstreams work</h2>
        <p>A Worldstream is continuous AI video that creates each scene as it plays and responds to the people exploring it.</p>
      </div>
      <div className="how-grid">
        <article>
          <span className="how-number">01</span>
          <h3><SparkIcon size={18} /> Generated live as you watch</h3>
          <p>Each scene is generated fast enough to keep the experience moving continuously, with its visual world and story state carried forward.</p>
        </article>
        <article>
          <span className="how-number">02</span>
          <h3><GlobeIcon size={18} /> Directed at every turn</h3>
          <p>Audience choices steer the next segment. The world remembers its characters, recent events, and visual language as the journey unfolds.</p>
        </article>
      </div>
    </section>
  );
}

const faqs = [
  {
    question: 'What is a Worldstream?',
    answer: 'A Worldstream is a live, audience-directed world that generates an ongoing sequence of scenes. Everyone watches the same stream and helps choose what happens next.',
  },
  {
    question: 'How do viewers influence the story?',
    answer: 'Each live round presents new choices. Viewers vote, suggest prompts, and steer the next scene while the world carries its characters and story history forward.',
  },
  {
    question: 'Do viewers need an account?',
    answer: 'Published Worldstreams are open to watch. Select a world here and enter its public live player on worldstreams.ai.',
  },
  {
    question: 'What happens when a Worldstream is idle?',
    answer: 'Its public page and share link remain available. The directory marks it as idle until the live stream starts again.',
  },
];

function WorldstreamsFAQ() {
  return (
    <section className="faq-section">
      <div className="faq-heading">
        <h2>Worldstreams FAQ</h2>
        <p>The essentials for watching and directing a live Worldstream.</p>
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
          <p>The creative suite for AI filmmaking.</p>
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
        <span>© 2026 Sequencer. All rights reserved.</span>
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

  return (
    <div className="app-shell">
      <Header />
      <div className="app-body">
        <Sidebar worlds={worlds} onOpen={setSelectedWorld} />
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
              Worldstreams are interactive AI video experiences generated live and shaped in real time.<br />
              Vote on what happens, sit back, and watch the journey unfold.
            </p>
            <a className="hero-button" href="#world-finder"><span>EXPLORE WITH GEMINI</span></a>
            {source === 'cache' && !loading ? <div className="cache-note">Showing the offline catalog while the live directory reconnects.</div> : null}
          </section>

          <div className="directory-content">
            <Rail title="Trending Worlds" worlds={sections.trending} onOpen={setSelectedWorld} />
            {sections.multiplayer.length ? (
              <Rail title="Multiplayer Worlds" worlds={sections.multiplayer} onOpen={setSelectedWorld} />
            ) : null}
            <Rail title="Games" worlds={sections.games} onOpen={setSelectedWorld} emptyText="More playable worlds are coming online." />
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
      {selectedWorld ? <PlayerModal world={selectedWorld} onClose={() => setSelectedWorld(null)} /> : null}
    </div>
  );
}
