import { describe, expect, it } from 'vitest';
import type { Worldstream } from '../types';
import { sectionWorlds, statusLabel, viewerLabel, worldsForRecommendations } from './catalog';

function world(overrides: Partial<Worldstream>): Worldstream {
  return {
    publicId: 'world-1',
    title: 'World One',
    worldName: 'World One',
    description: 'An interactive world.',
    type: 'show',
    status: 'sleeping',
    viewerCount: null,
    thumbnailUrl: '',
    worldLogoUrl: '',
    demoVideoEnabled: false,
    demoVideoUrl: '',
    ...overrides,
  };
}

describe('catalog helpers', () => {
  it('sorts live worlds ahead of idle worlds', () => {
    const sections = sectionWorlds([
      world({ publicId: 'idle' }),
      world({ publicId: 'live', status: 'live', viewerCount: 4 }),
    ]);
    expect(sections.featured.map(item => item.publicId)).toEqual(['live', 'idle']);
  });

  it('pins Timmy and Paws ahead of every other live world', () => {
    const sections = sectionWorlds([
      world({ publicId: 'regular-live', status: 'live', viewerCount: 999 }),
      world({ publicId: 'rb6Nk00MFXzl', title: 'Paws' }),
      world({ publicId: 'CVyQbC5FNCcE', title: 'Timmy' }),
    ]);
    expect(sections.featured.map(item => item.publicId)).toEqual([
      'CVyQbC5FNCcE',
      'rb6Nk00MFXzl',
      'regular-live',
    ]);
  });

  it('separates games from the trending show rail', () => {
    const sections = sectionWorlds([
      world({ publicId: 'show' }),
      world({ publicId: 'game', type: 'game' }),
    ]);
    expect(sections.trending.map(item => item.publicId)).toEqual(['show']);
    expect(sections.games.map(item => item.publicId)).toEqual(['game']);
  });

  it('preserves Gemini recommendation order and ignores unknown ids', () => {
    const worlds = [world({ publicId: 'a' }), world({ publicId: 'b' })];
    expect(worldsForRecommendations(worlds, ['b', 'missing', 'a']).map(item => item.publicId)).toEqual(['b', 'a']);
  });

  it('uses clear public labels', () => {
    expect(statusLabel('sleeping')).toBe('Idle');
    expect(statusLabel('live')).toBe('Live');
    expect(viewerLabel(null)).toBe('Ready to watch');
    expect(viewerLabel(1_200)).toBe('1.2K viewers');
  });
});
