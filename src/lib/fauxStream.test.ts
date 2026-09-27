import { describe, expect, it } from 'vitest';
import type { Worldstream } from '../types';
import { createFauxStreamProfile, seededViewerCount } from './fauxStream';

function world(title: string, publicId = 'world-test'): Worldstream {
  return {
    publicId,
    title,
    worldName: title,
    description: 'An interactive world.',
    type: 'show',
    status: 'sleeping',
    viewerCount: null,
    thumbnailUrl: '',
    worldLogoUrl: '',
    demoVideoEnabled: false,
    demoVideoUrl: '',
  };
}

describe('faux Worldstream profiles', () => {
  it('provides world-specific choices for a production world', () => {
    const profile = createFauxStreamProfile(world('Central Perk Chronicles'));
    expect(profile.choices).toHaveLength(4);
    expect(profile.scene).toContain('coffeehouse');
    expect(new Set(profile.choices.map(choice => choice.label)).size).toBe(4);
  });

  it('provides a complete profile for future catalog worlds', () => {
    const profile = createFauxStreamProfile(world('A Newly Published World'));
    expect(profile.choices).toHaveLength(4);
    expect(profile.messages).toHaveLength(5);
    expect(profile.activity.length).toBeGreaterThan(4);
  });

  it('uses a stable believable viewer count', () => {
    const item = world('Space Mission', 'space-mission');
    expect(seededViewerCount(item)).toBe(seededViewerCount(item));
    expect(seededViewerCount(item)).toBeGreaterThanOrEqual(84);
    expect(seededViewerCount(item)).toBeLessThan(824);
  });
});
