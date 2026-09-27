import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { createFauxStreamProfile, seededViewerCount, type FauxChatMessage } from './lib/fauxStream';
import { statusColor, worldHue } from './lib/catalog';
import type { Worldstream } from './types';
import './fauxWorldstream.css';

function ArrowLeftIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="m15 18-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PlayPauseIcon({ playing }: { playing: boolean }) {
  return playing ? (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M6.5 5h4v14h-4zM13.5 5h4v14h-4z" />
    </svg>
  ) : (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="m8 5 11 7-11 7V5Z" />
    </svg>
  );
}

function VolumeIcon({ muted }: { muted: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 10v4h3l4 3V7l-4 3H5Z" fill="currentColor" />
      {muted
        ? <path d="m16 10 4 4m0-4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        : <path d="M16 9.5c1.4 1.4 1.4 3.6 0 5m2-7c2.5 2.5 2.5 6.5 0 9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />}
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M2.5 12s3.4-5.5 9.5-5.5 9.5 5.5 9.5 5.5-3.4 5.5-9.5 5.5S2.5 12 2.5 12Z" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="12" cy="12" r="2.4" fill="currentColor" />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="m4 4 16 8-16 8 2.7-8L4 4Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M7 12h12" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function StreamAvatar({ world, small = false }: { world: Worldstream; small?: boolean }) {
  const [failed, setFailed] = useState(false);
  const source = world.worldLogoUrl || world.thumbnailUrl;
  return (
    <span
      className={`faux-avatar ${small ? 'faux-avatar-small' : ''}`}
      style={{ '--world-hue': worldHue(world.publicId) } as React.CSSProperties}
    >
      {source && !failed
        ? <img src={source} alt="" onError={() => setFailed(true)} />
        : <b>{world.title.slice(0, 1).toUpperCase()}</b>}
    </span>
  );
}

function FauxFeed({ world, playing, muted, sceneIndex, onTogglePlayback, onToggleMuted }: {
  world: Worldstream;
  playing: boolean;
  muted: boolean;
  sceneIndex: number;
  onTogglePlayback: () => void;
  onToggleMuted: () => void;
}) {
  const [videoFailed, setVideoFailed] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const image = world.thumbnailUrl || world.worldLogoUrl;
  const showVideo = Boolean(world.demoVideoUrl) && !videoFailed;

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (playing) void video.play().catch(() => undefined);
    else video.pause();
  }, [playing, showVideo]);

  return (
    <div className={`faux-feed ${playing ? 'faux-feed-playing' : 'faux-feed-paused'}`}>
      {showVideo ? (
        <video
          ref={videoRef}
          src={world.demoVideoUrl}
          poster={image || undefined}
          muted={muted}
          autoPlay
          loop
          playsInline
          onError={() => setVideoFailed(true)}
        />
      ) : image ? (
        <img
          key={`${world.publicId}-${sceneIndex}`}
          className="faux-feed-image"
          src={image}
          alt=""
        />
      ) : (
        <div className="faux-feed-fallback" style={{ '--world-hue': worldHue(world.publicId) } as React.CSSProperties}>
          <img src="/brand/sequencer-mark.svg" alt="" />
        </div>
      )}
      <div className="faux-feed-grade" />
      <div className="faux-feed-grain" />
      <div className="faux-live-badge"><i /> Demo stream</div>
      <div className="faux-feed-controls">
        <button type="button" onClick={onTogglePlayback} aria-label={playing ? 'Pause stream' : 'Play stream'}>
          <PlayPauseIcon playing={playing} />
        </button>
        <button type="button" onClick={onToggleMuted} aria-label={muted ? 'Unmute stream' : 'Mute stream'}>
          <VolumeIcon muted={muted} />
        </button>
        <span>{showVideo ? 'Demo video feed' : 'Generated scene preview'}</span>
      </div>
    </div>
  );
}

function ChatMessage({ message }: { message: FauxChatMessage }) {
  if (message.system) {
    return <div className="faux-chat-system"><img src="/brand/sequencer-mark.svg" alt="" /> {message.text}</div>;
  }
  return (
    <div className="faux-chat-message">
      <span className="faux-chat-avatar" style={{ backgroundColor: message.color }}>{message.name.slice(0, 1).toUpperCase()}</span>
      <span>
        <strong style={{ color: message.color }}>{message.name}</strong>
        <span>{message.text}</span>
      </span>
    </div>
  );
}

const reactions = ['🔥', '✨', '👏', '😮', '😂', '💙', '😍', '🚀'];

export default function FauxWorldstreamPlayer({ world, worlds, onSelectWorld, onClose }: {
  world: Worldstream;
  worlds: Worldstream[];
  onSelectWorld: (world: Worldstream) => void;
  onClose: () => void;
}) {
  const profile = useMemo(() => createFauxStreamProfile(world), [world]);
  const viewerCount = useMemo(() => seededViewerCount(world), [world]);
  const [resolvedWorld, setResolvedWorld] = useState(world);
  const [detailLoading, setDetailLoading] = useState(true);
  const [playing, setPlaying] = useState(true);
  const [muted, setMuted] = useState(true);
  const [secondsLeft, setSecondsLeft] = useState(15);
  const [sceneIndex, setSceneIndex] = useState(0);
  const [selectedVote, setSelectedVote] = useState<number | null>(null);
  const [voteCounts, setVoteCounts] = useState(() => [18, 11, 7, 3].map((count, index) => count + (viewerCount % (9 - index))));
  const [prompt, setPrompt] = useState('');
  const [queuedPrompt, setQueuedPrompt] = useState('');
  const [messages, setMessages] = useState<FauxChatMessage[]>(profile.messages);
  const [chatInput, setChatInput] = useState('');
  const [reactionBursts, setReactionBursts] = useState<Array<{ id: number; emoji: string }>>([]);
  const chatListRef = useRef<HTMLDivElement>(null);
  const activityIndex = useRef(0);
  const messageId = useRef(100);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    setDetailLoading(true);
    fetch(`/api/worldstreams/${encodeURIComponent(world.publicId)}`, { signal: controller.signal })
      .then(async response => {
        if (!response.ok) throw new Error('World detail unavailable');
        return response.json();
      })
      .then(body => {
        if (active && body?.worldstream) setResolvedWorld(body.worldstream as Worldstream);
      })
      .catch(error => {
        if (active && error?.name !== 'AbortError') setResolvedWorld(world);
      })
      .finally(() => {
        if (active) setDetailLoading(false);
      });
    return () => {
      active = false;
      controller.abort();
    };
  }, [world]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [onClose]);

  useEffect(() => {
    if (!playing) return;
    const timer = window.setInterval(() => {
      setSecondsLeft(current => {
        if (current > 1) return current - 1;
        setSceneIndex(index => index + 1);
        setSelectedVote(null);
        setVoteCounts(counts => counts.map((count, index) => Math.max(1, Math.round(count * 0.42) + index)));
        setMessages(items => [...items.slice(-13), {
          id: `system-${messageId.current++}`,
          name: 'Worldstream',
          color: '#ff2e88',
          text: 'A new scene is generating from the winning choice.',
          system: true,
        }]);
        return 15;
      });
    }, 1_000);
    return () => window.clearInterval(timer);
  }, [playing]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      const index = activityIndex.current++;
      const names = ['nova.wave', 'pixelpilot', 'mossy', 'juno.jpg', 'afterimage', 'orbiting'];
      const colors = ['#f472b6', '#81baec', '#7dd3a8', '#c4a7ff', '#ffb86c', '#67d8e8'];
      setMessages(items => [...items.slice(-13), {
        id: `activity-${messageId.current++}`,
        name: names[index % names.length],
        color: colors[index % colors.length],
        text: profile.activity[index % profile.activity.length],
      }]);
    }, 3_800);
    return () => window.clearInterval(timer);
  }, [profile]);

  useEffect(() => {
    const list = chatListRef.current;
    if (list) list.scrollTop = list.scrollHeight;
  }, [messages]);

  const totalVotes = voteCounts.reduce((sum, count) => sum + count, 0);
  const winningIndex = voteCounts.indexOf(Math.max(...voteCounts));
  const activeScene = sceneIndex % 2 === 0 ? profile.scene : profile.nextScene;

  const castVote = (index: number) => {
    if (selectedVote === index) return;
    setVoteCounts(counts => counts.map((count, choiceIndex) => {
      if (choiceIndex === index) return count + 1;
      if (choiceIndex === selectedVote) return Math.max(0, count - 1);
      return count;
    }));
    setSelectedVote(index);
  };

  const submitPrompt = (event: FormEvent) => {
    event.preventDefault();
    const value = prompt.trim();
    if (!value) return;
    setQueuedPrompt(value);
    setPrompt('');
    setMessages(items => [...items.slice(-13), {
      id: `prompt-${messageId.current++}`,
      name: 'Worldstream',
      color: '#ff2e88',
      text: `Viewer prompt queued: “${value}”`,
      system: true,
    }]);
  };

  const submitChat = (event: FormEvent) => {
    event.preventDefault();
    const value = chatInput.trim();
    if (!value) return;
    setMessages(items => [...items.slice(-13), {
      id: `you-${messageId.current++}`,
      name: 'you',
      color: '#ffffff',
      text: value,
    }]);
    setChatInput('');
  };

  const react = (emoji: string) => {
    const id = Date.now() + Math.random();
    setReactionBursts(items => [...items, { id, emoji }]);
    window.setTimeout(() => setReactionBursts(items => items.filter(item => item.id !== id)), 1_500);
  };

  return (
    <div className="faux-worldstream" role="dialog" aria-modal="true" aria-label={`${world.title} demo stream`}>
      <header className="faux-header">
        <button type="button" className="faux-back" onClick={onClose} aria-label="Back to Worldstreams"><ArrowLeftIcon /></button>
        <button type="button" className="faux-brand" onClick={onClose}>
          <img src="/brand/sequencer-mark.svg" alt="" />
          <span>WORLDSTREAMS</span>
        </button>
        <div className="faux-header-title">
          <StreamAvatar world={resolvedWorld} small />
          <strong>{resolvedWorld.title}</strong>
        </div>
        <div className="faux-header-status">
          <span className="faux-demo-pill"><i /> Interactive demo</span>
          <span className="faux-viewers"><EyeIcon /> {viewerCount.toLocaleString()}</span>
        </div>
      </header>

      <div className="faux-body">
        <aside className="faux-world-rail" aria-label="Switch Worldstream">
          <div className="faux-broadcast"><i /></div>
          <div className="faux-rail-line" />
          <div className="faux-rail-worlds">
            {worlds.map(item => (
              <button
                type="button"
                key={item.publicId}
                className={item.publicId === world.publicId ? 'active' : ''}
                onClick={() => onSelectWorld(item)}
                aria-label={`Open ${item.title}`}
              >
                <StreamAvatar world={item} />
                <i style={{ background: statusColor(item.status) }} />
                <span>{item.title}</span>
              </button>
            ))}
          </div>
        </aside>

        <main className="faux-experience">
          <section className="faux-stage-column">
            <div className="faux-stage-wrap">
              <FauxFeed
                world={resolvedWorld}
                playing={playing}
                muted={muted}
                sceneIndex={sceneIndex}
                onTogglePlayback={() => setPlaying(value => !value)}
                onToggleMuted={() => setMuted(value => !value)}
              />
              {detailLoading ? <div className="faux-detail-loading"><span /> Tuning into this reality</div> : null}
              <div className="faux-scene-timer">
                <span>Next scene</span>
                <strong>0:{secondsLeft.toString().padStart(2, '0')}</strong>
              </div>
            </div>

            <div className="faux-scene-strip">
              <div><span>Playing</span><strong>{activeScene}</strong></div>
              <div><span>Next</span><strong>{profile.choices[winningIndex].label}</strong></div>
              <div><span>Queued</span><strong>{queuedPrompt || 'Open for the next vote'}</strong></div>
            </div>

            <div className="faux-world-info">
              <div>
                <h1>{resolvedWorld.title}</h1>
                <span className="faux-world-live"><i /> Demo live</span>
              </div>
              <p>{resolvedWorld.description}</p>
            </div>

            <div className="faux-progress">
              <div className="faux-progress-heading">
                <strong>🎉 {profile.progressLabel}</strong>
                <span>{profile.progress * 10}/1K</span>
              </div>
              <div><i style={{ width: `${profile.progress}%` }} /></div>
            </div>
          </section>

          <aside className="faux-interaction-panel">
            <section className="faux-vote-panel">
              <div className="faux-panel-heading">
                <h2>Vote for the next live</h2>
                <span>{totalVotes} votes</span>
              </div>
              <div className="faux-vote-list">
                {profile.choices.map((choice, index) => {
                  const percent = Math.max(4, Math.round(voteCounts[index] / totalVotes * 100));
                  return (
                    <button
                      type="button"
                      key={choice.label}
                      className={`${index === winningIndex ? 'winning' : ''} ${selectedVote === index ? 'selected' : ''}`}
                      onClick={() => castVote(index)}
                    >
                      <i className="faux-vote-fill" style={{ width: `${percent}%` }} />
                      <span><b>{choice.icon}</b> {choice.label}</span>
                      <em>{selectedVote === index ? 'Voted' : 'Vote'} <strong>{voteCounts[index]}</strong></em>
                    </button>
                  );
                })}
              </div>
              <form className="faux-prompt-form" onSubmit={submitPrompt}>
                <input
                  value={prompt}
                  onChange={event => setPrompt(event.target.value)}
                  maxLength={120}
                  placeholder="Write the next prompt..."
                  aria-label="Suggest the next prompt"
                />
                <button type="submit" disabled={!prompt.trim()}>Submit <SendIcon /></button>
              </form>
            </section>

            <section className="faux-chat-panel">
              <div className="faux-chat-heading">
                <span>▣</span>
                <h2>Chat</h2>
                <span className="faux-chat-filter">Top&nbsp;&nbsp; All</span>
              </div>
              <div className="faux-chat-list" ref={chatListRef}>
                {messages.map(item => <ChatMessage key={item.id} message={item} />)}
              </div>
              <div className="faux-reactions">
                {reactions.map(emoji => (
                  <button type="button" key={emoji} onClick={() => react(emoji)} aria-label={`React ${emoji}`}>{emoji}</button>
                ))}
                <div className="faux-reaction-bursts" aria-live="polite">
                  {reactionBursts.map(item => <span key={item.id}>{item.emoji}</span>)}
                </div>
              </div>
              <form className="faux-chat-form" onSubmit={submitChat}>
                <input
                  value={chatInput}
                  onChange={event => setChatInput(event.target.value)}
                  maxLength={140}
                  placeholder="Message the room..."
                  aria-label="Message the room"
                />
                <button type="submit" disabled={!chatInput.trim()} aria-label="Send message"><SendIcon /></button>
              </form>
              <small className="faux-demo-disclaimer">Simulated activity for this interactive demo</small>
            </section>
          </aside>
        </main>
      </div>
    </div>
  );
}
