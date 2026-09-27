import type { Worldstream } from '../types';

export function worldHue(id: string) {
  let hash = 0;
  for (const character of id) hash = ((hash << 5) - hash + character.charCodeAt(0)) | 0;
  return Math.abs(hash) % 360;
}

export function statusLabel(status: string) {
  if (status === 'live') return 'Live';
  if (status === 'booting') return 'Starting';
  return 'Ready';
}

export function statusColor(status: string) {
  if (status === 'live') return '#2cf59a';
  if (status === 'booting') return '#ffd43b';
  return '#7d8492';
}

export function viewerLabel(value: number | null) {
  if (value === null) return 'Ready to watch';
  if (value >= 1_000) return `${(value / 1_000).toFixed(value >= 10_000 ? 0 : 1)}K viewers`;
  return `${value.toLocaleString()} ${value === 1 ? 'viewer' : 'viewers'}`;
}

export function sortByActivity(worlds: Worldstream[]) {
  return [...worlds].sort((left, right) => (
    Number(right.status === 'live') - Number(left.status === 'live')
    || Number(right.viewerCount || 0) - Number(left.viewerCount || 0)
  ));
}

export function sectionWorlds(worlds: Worldstream[]) {
  const active = sortByActivity(worlds);
  return {
    featured: active.slice(0, 9),
    trending: active.filter(world => !['game', 'multiplayer', 'book'].includes(world.type)).slice(0, 12),
    multiplayer: active.filter(world => world.type === 'multiplayer'),
    games: active.filter(world => world.type === 'game'),
    stories: active.filter(world => world.type === 'book'),
  };
}

export function worldsForRecommendations(worlds: Worldstream[], ids: string[]) {
  const byId = new Map(worlds.map(world => [world.publicId, world]));
  return ids.flatMap(id => {
    const world = byId.get(id);
    return world ? [world] : [];
  });
}
