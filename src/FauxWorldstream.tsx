import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { createFauxStreamProfile, seededViewerCount, type FauxChatMessage } from './lib/fauxStream';
import { isAlwaysLiveWorld, statusColor, worldHue } from './lib/catalog';
import type { Worldstream } from './types';
import './fauxWorldstream.css';

interface StreamSequenceSegment {
  id: string;
  icon: string;
  label: string;
  prompt: string;
  videoUrl: string;
}

interface StreamSequence {
  model: string;
  playbackDurationSeconds: number;
  segments: StreamSequenceSegment[];
}

function roundVoteCounts(viewerCount: number, leaderIndex: number, choiceCount: number) {
  const counts = Array.from({ length: choiceCount }, (_, index) => (
    Math.max(3, 14 - index * 2) + (viewerCount % (7 + index))
  ));
  counts[leaderIndex] = Math.max(...counts) + 5;
  return counts;
}

function ArrowLeftIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="m15 18-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
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

function FauxFeed({
  world,
  muted,
  segmentIndex,
  clipCycle,
  clipUrl,
  onToggleMuted,
}: {
  world: Worldstream;
  muted: boolean;
  segmentIndex: number;
  clipCycle: number;
  clipUrl: string;
  onToggleMuted: () => void;
}) {
  const [generatedFailed, setGeneratedFailed] = useState(false);
  const [fallbackVideoFailed, setFallbackVideoFailed] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const image = world.thumbnailUrl || world.worldLogoUrl;
  const usingGeneratedClip = Boolean(clipUrl) && !generatedFailed;
  const videoUrl = usingGeneratedClip ? clipUrl : world.demoVideoUrl;
  const showVideo = Boolean(videoUrl) && !fallbackVideoFailed;

  useEffect(() => {
    setGeneratedFailed(false);
    setFallbackVideoFailed(false);
  }, [clipUrl, world.publicId]);

  const prepareVideo = () => {
    const video = videoRef.current;
    if (!video || !Number.isFinite(video.duration) || video.duration <= 0) return;
    if (usingGeneratedClip) {
      video.currentTime = 0;
      video.playbackRate = Math.max(0.5, Math.min(1, video.duration / 15));
    } else {
      video.playbackRate = 1;
      video.currentTime = (segmentIndex * 15) % video.duration;
    }
    void video.play().catch(() => undefined);
  };

  const handleVideoError = () => {
    if (usingGeneratedClip) setGeneratedFailed(true);
    else setFallbackVideoFailed(true);
  };

  return (
    <div className="faux-feed">
      {showVideo ? (
        <video
          key={`${videoUrl}-${segmentIndex}-${clipCycle}`}
          ref={videoRef}
          className="faux-feed-video"
          src={videoUrl}
          poster={image || undefined}
          muted={muted}
          autoPlay
          loop
          playsInline
          onLoadedMetadata={prepareVideo}
          onError={handleVideoError}
        />
      ) : image ? (
        <img
          key={`${world.publicId}-${segmentIndex}-${clipCycle}`}
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
      <div className="faux-feed-controls">
        <button type="button" onClick={onToggleMuted} aria-label={muted ? 'Unmute stream' : 'Mute stream'}>
          <VolumeIcon muted={muted} />
        </button>
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
      <strong style={{ color: message.color }}>{message.name}:</strong>{' '}
      <span>{message.text}</span>
    </div>
  );
}

const reactions = ['🔥', '✨', '👏', '😮', '😂', '💙', '😍', '🚀'];
const voteOptionColors = ['#ff7a00', '#ff3d71', '#ff2ec4', '#8b5cf6'];

export default function FauxWorldstreamPlayer({ world, worlds, onSelectWorld, onClose }: {
  world: Worldstream;
  worlds: Worldstream[];
  onSelectWorld: (world: Worldstream) => void;
  onClose: () => void;
}) {
  const profile = useMemo(() => createFauxStreamProfile(world), [world]);
  const viewerCount = useMemo(() => seededViewerCount(world), [world]);
  const isAlwaysLive = isAlwaysLiveWorld(world.publicId);
  const [resolvedWorld, setResolvedWorld] = useState(world);
  const [detailLoading, setDetailLoading] = useState(true);
  const [muted, setMuted] = useState(true);
  const [secondsLeft, setSecondsLeft] = useState(15);
  const [activeSegmentIndex, setActiveSegmentIndex] = useState(0);
  const [clipCycle, setClipCycle] = useState(0);
  const [sequence, setSequence] = useState<StreamSequence | null>(null);
  const [selectedVote, setSelectedVote] = useState<number | null>(null);
  const [voteCounts, setVoteCounts] = useState(() => Array(profile.choices.length).fill(0));
  const [prompt, setPrompt] = useState('');
  const [queuedPrompt, setQueuedPrompt] = useState('');
  const [messages, setMessages] = useState<FauxChatMessage[]>(profile.messages);
  const [chatInput, setChatInput] = useState('');
  const [reactionBursts, setReactionBursts] = useState<Array<{ id: number; emoji: string }>>([]);
  const chatListRef = useRef<HTMLDivElement>(null);
  const activityIndex = useRef(0);
  const messageId = useRef(100);
  const transitionedCycle = useRef(-1);
  const liveVoteCounts = useRef(voteCounts);
  const voteTargets = useRef(roundVoteCounts(viewerCount, 1, profile.choices.length));

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
    const controller = new AbortController();
    setSequence(null);
    fetch(`/api/worldstreams/${encodeURIComponent(world.publicId)}/sequence`, { signal: controller.signal })
      .then(async response => {
        if (!response.ok) throw new Error('Stream sequence unavailable');
        return response.json() as Promise<StreamSequence>;
      })
      .then(body => {
        if (Array.isArray(body?.segments)) setSequence(body);
      })
      .catch(error => {
        if (error?.name !== 'AbortError') setSequence(null);
      });
    return () => controller.abort();
  }, [world.publicId]);

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
    const timer = window.setInterval(() => {
      setSecondsLeft(current => Math.max(0, current - 1));
    }, 1_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const leaderIndex = (activeSegmentIndex + 1) % profile.choices.length;
    const targets = roundVoteCounts(viewerCount, leaderIndex, profile.choices.length);
    const emptyCounts = Array(profile.choices.length).fill(0);
    const timers: number[] = [];
    voteTargets.current = targets;
    liveVoteCounts.current = emptyCounts;
    setVoteCounts(emptyCounts);

    targets.forEach((target, index) => {
      const addVote = () => {
        const current = liveVoteCounts.current;
        if (current[index] >= voteTargets.current[index]) return;
        const increase = Math.min(
          voteTargets.current[index] - current[index],
          Math.random() < .16 ? 2 : 1,
        );
        const next = current.map((count, choiceIndex) => (
          choiceIndex === index ? count + increase : count
        ));
        liveVoteCounts.current = next;
        setVoteCounts(next);
        timers.push(window.setTimeout(addVote, 210 + Math.round(Math.random() * 280)));
      };

      const initialDelay = index === leaderIndex
        ? 180 + Math.round(Math.random() * 180)
        : 420 + Math.round(Math.random() * 700);
      timers.push(window.setTimeout(addVote, initialDelay));
    });

    return () => timers.forEach(timer => window.clearTimeout(timer));
  }, [activeSegmentIndex, clipCycle, profile.choices.length, viewerCount]);

  useEffect(() => {
    if (secondsLeft !== 0 || transitionedCycle.current === clipCycle) return;
    transitionedCycle.current = clipCycle;
    const sequentialWinner = (activeSegmentIndex + 1) % profile.choices.length;
    const winner = sequence?.segments.length ? sequentialWinner : (selectedVote ?? sequentialWinner);
    const winnerLabel = profile.choices[winner].label;
    setActiveSegmentIndex(winner);
    setClipCycle(cycle => cycle + 1);
    setSelectedVote(null);
    setMessages(items => [...items.slice(-23), {
      id: `system-${messageId.current++}`,
      name: 'Worldstream',
      color: '#ff2e88',
      text: `Next: “${winnerLabel}”`,
      system: true,
    }]);
    setSecondsLeft(15);
  }, [activeSegmentIndex, clipCycle, profile.choices, secondsLeft, selectedVote, sequence, viewerCount]);

  useEffect(() => {
    let timer = 0;
    const addMessage = () => {
      const index = activityIndex.current++;
      const names = ['nightbyte', 'pixelpilot', 'mossboss', 'juno_tv', 'orbital', 'nova_gg'];
      const colors = ['#f472b6', '#81baec', '#7dd3a8', '#c4a7ff', '#ffb86c', '#67d8e8'];
      setMessages(items => [...items.slice(-23), {
        id: `activity-${messageId.current++}`,
        name: names[index % names.length],
        color: colors[index % colors.length],
        text: profile.activity[index % profile.activity.length],
      }]);
      timer = window.setTimeout(addMessage, 900 + Math.round(Math.random() * 2_700));
    };
    timer = window.setTimeout(addMessage, 650 + Math.round(Math.random() * 1_800));
    return () => window.clearTimeout(timer);
  }, [profile]);

  useEffect(() => {
    const list = chatListRef.current;
    if (list) list.scrollTop = list.scrollHeight;
  }, [messages]);

  const sequentialNextIndex = (activeSegmentIndex + 1) % profile.choices.length;
  const hasGeneratedStory = Boolean(sequence?.segments.length);
  const winningIndex = hasGeneratedStory
    ? sequentialNextIndex
    : voteCounts.indexOf(Math.max(...voteCounts));
  const visibleVoteIndices = Array.from(
    { length: Math.min(4, profile.choices.length) },
    (_, offset) => (sequentialNextIndex + offset) % profile.choices.length,
  );
  const visibleVotes = Math.max(1, visibleVoteIndices.reduce((sum, index) => sum + voteCounts[index], 0));
  const nextSegmentIndex = hasGeneratedStory ? sequentialNextIndex : (selectedVote ?? sequentialNextIndex);
  const activeScene = profile.choices[activeSegmentIndex].label;
  const generatedSegment = sequence?.segments.find(segment => segment.label === activeScene)
    || sequence?.segments[activeSegmentIndex];

  const castVote = (index: number) => {
    if (selectedVote === index) return;
    setVoteCounts(counts => {
      let nextCounts: number[];
      if (hasGeneratedStory) {
        const nextChapterCount = counts[sequentialNextIndex];
        nextCounts = counts.map((count, choiceIndex) => {
          if (choiceIndex !== index) return count;
          if (index === sequentialNextIndex) return Math.max(...counts) + 7;
          return Math.min(count + 3, Math.max(count, nextChapterCount - 1));
        });
      } else {
        const winningCount = Math.max(...counts) + 7;
        nextCounts = counts.map((count, choiceIndex) => choiceIndex === index ? winningCount : count);
      }
      liveVoteCounts.current = nextCounts;
      voteTargets.current = voteTargets.current.map((target, choiceIndex) => (
        choiceIndex === index ? Math.max(target, nextCounts[index]) : target
      ));
      return nextCounts;
    });
    setSelectedVote(index);
    setMessages(items => [...items.slice(-23), {
      id: `vote-${messageId.current++}`,
      name: 'Worldstream',
      color: '#ff2e88',
      text: hasGeneratedStory
        ? `Voted: “${profile.choices[index].label}”`
        : `Leading: “${profile.choices[index].label}”`,
      system: true,
    }]);
  };

  const submitPrompt = (event: FormEvent) => {
    event.preventDefault();
    const value = prompt.trim();
    if (!value) return;
    setQueuedPrompt(value);
    setPrompt('');
    setMessages(items => [...items.slice(-23), {
      id: `prompt-${messageId.current++}`,
      name: 'Worldstream',
      color: '#ff2e88',
      text: `Queued: “${value}”`,
      system: true,
    }]);
  };

  const submitChat = (event: FormEvent) => {
    event.preventDefault();
    const value = chatInput.trim();
    if (!value) return;
    setMessages(items => [...items.slice(-23), {
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
    <div className="faux-worldstream" role="dialog" aria-modal="true" aria-label={`${world.title} live stream`}>
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
          <span className="faux-live-status-pill"><i /> {isAlwaysLive ? 'Always live' : 'Live stream'}</span>
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
                <i style={{ background: statusColor(isAlwaysLiveWorld(item.publicId) ? 'live' : item.status) }} />
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
                muted={muted}
                segmentIndex={activeSegmentIndex}
                clipCycle={clipCycle}
                clipUrl={generatedSegment?.videoUrl || ''}
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
              <div><span>Next</span><strong>{profile.choices[nextSegmentIndex].label}</strong></div>
              <div><span>Queued</span><strong>{queuedPrompt || 'Open for the next vote'}</strong></div>
            </div>

            <div className="faux-world-info">
              <div>
                <h1>{resolvedWorld.title}</h1>
                <span className="faux-world-live"><i /> {isAlwaysLive ? 'Always live' : 'Live stream'}</span>
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
                <strong>{secondsLeft}</strong>
              </div>
              <div className="faux-vote-countdown"><i style={{ width: `${secondsLeft / 15 * 100}%` }} /></div>
              <div className="faux-vote-list">
                {visibleVoteIndices.map((index, visibleIndex) => {
                  const choice = profile.choices[index];
                  const percent = Math.max(4, Math.round(voteCounts[index] / visibleVotes * 100));
                  const isWinner = index === winningIndex;
                  return (
                    <button
                      type="button"
                      key={choice.label}
                      className={`${isWinner ? 'winning' : ''} ${selectedVote === index ? 'selected' : ''}`}
                      onClick={() => castVote(index)}
                      style={{ '--vote-color': voteOptionColors[visibleIndex] } as React.CSSProperties}
                    >
                      <i className="faux-vote-fill" style={{ width: `${percent}%` }} />
                      <span className="faux-vote-label"><b>{choice.icon}</b> {choice.label}</span>
                      <span className="faux-vote-meta">
                        {isWinner
                          ? <em className="faux-up-next">Up next</em>
                          : <em className="faux-vote-action">{selectedVote === index ? 'Voted' : 'Vote'}</em>}
                        <strong
                          key={`${clipCycle}-${index}-${voteCounts[index]}`}
                          className="faux-vote-count"
                        >{voteCounts[index]}</strong>
                      </span>
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
              <small className="faux-activity-note">Live audience activity</small>
            </section>
          </aside>
        </main>
      </div>
    </div>
  );
}
