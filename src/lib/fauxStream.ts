import type { Worldstream } from '../types';

export interface FauxChoice {
  label: string;
  icon: string;
}

export interface FauxChatMessage {
  id: string;
  name: string;
  text: string;
  color: string;
  system?: boolean;
}

export interface FauxStreamProfile {
  scene: string;
  nextScene: string;
  choices: FauxChoice[];
  progressLabel: string;
  progress: number;
  messages: FauxChatMessage[];
  activity: string[];
}

type StoryProfile = Pick<FauxStreamProfile, 'scene' | 'nextScene' | 'choices' | 'progressLabel' | 'progress'>;

const storyProfiles: Record<string, StoryProfile> = {
  'Timmy’s Adventures': {
    scene: 'The silhouette slips beneath the broken bridge',
    nextScene: 'Follow the distant lantern',
    choices: [
      { icon: '🕯️', label: 'Follow the distant lantern' },
      { icon: '🐦‍⬛', label: 'Chase the lantern thief' },
      { icon: '⚙️', label: 'Repair the clockwork bridge' },
      { icon: '🕷️', label: 'Outsmart the shadow spider' },
      { icon: '🌙', label: 'Unlock the moon gate' },
      { icon: '⏰', label: 'Escape before midnight' },
    ],
    progressLabel: 'Escape the shadow district',
    progress: 63,
  },
  'Space Mission': {
    scene: 'The squad crosses the shattered alien outpost',
    nextScene: 'Signal the stranded dropship',
    choices: [
      { icon: '🚀', label: 'Signal the stranded dropship' },
      { icon: '🛡️', label: 'Hold the canyon checkpoint' },
      { icon: '📡', label: 'Decode the enemy transmission' },
      { icon: '🌌', label: 'Enter the unstable portal' },
    ],
    progressLabel: 'Secure the frontier beacon',
    progress: 71,
  },
  'Magic Chronicles': {
    scene: 'A forgotten spell wakes beneath the ruins',
    nextScene: 'Trust the talking map',
    choices: [
      { icon: '🗺️', label: 'Trust the talking map' },
      { icon: '✨', label: 'Cast the forbidden spell' },
      { icon: '🏰', label: 'Search the floating citadel' },
      { icon: '🦊', label: 'Follow the crystal fox' },
    ],
    progressLabel: 'Restore the ancient waystone',
    progress: 46,
  },
  'Central Perk Chronicles': {
    scene: 'A surprise visitor walks into the coffeehouse',
    nextScene: 'Reveal the mysterious invitation',
    choices: [
      { icon: '✉️', label: 'Reveal the mysterious invitation' },
      { icon: '☕', label: 'Challenge everyone to a coffee contest' },
      { icon: '🎤', label: 'Take over open-mic night' },
      { icon: '🛋️', label: 'Confess the secret on the orange couch' },
    ],
    progressLabel: 'Unlock the rooftop hangout',
    progress: 79,
  },
  'Interdimensional Chaos Trip': {
    scene: 'A portal tears open beneath the garage',
    nextScene: 'Jump into the unstable dimension',
    choices: [
      { icon: '🌀', label: 'Jump into the unstable dimension' },
      { icon: '🧪', label: 'Test the glowing canister' },
      { icon: '🤖', label: 'Negotiate with the robot guards' },
      { icon: '🏃', label: 'Run before reality collapses' },
    ],
    progressLabel: 'Stabilize the portal network',
    progress: 58,
  },
  'Land of Ooo': {
    scene: 'A candy storm rolls across the valley',
    nextScene: 'Rescue the marshmallow village',
    choices: [
      { icon: '🍬', label: 'Rescue the marshmallow village' },
      { icon: '🗡️', label: 'Challenge the ice guardian' },
      { icon: '🎵', label: 'Sing to calm the storm' },
      { icon: '🐕', label: 'Stretch across the canyon' },
    ],
    progressLabel: 'Reach the crystal kingdom',
    progress: 67,
  },
  'Sector 7 Meltdown': {
    scene: 'The neighborhood loses power at the worst moment',
    nextScene: 'Investigate the glowing basement',
    choices: [
      { icon: '💡', label: 'Investigate the glowing basement' },
      { icon: '🍩', label: 'Raid the emergency snack supply' },
      { icon: '☎️', label: 'Call the suspicious technician' },
      { icon: '🚗', label: 'Escape across town' },
    ],
    progressLabel: 'Restore power to Sector 7',
    progress: 52,
  },
  'Skybound Chase': {
    scene: 'The ancient beast dives into the canyon mist',
    nextScene: 'Dive through the narrow arch',
    choices: [
      { icon: '🪽', label: 'Dive through the narrow arch' },
      { icon: '🏹', label: 'Fire the tether at its wing' },
      { icon: '⛈️', label: 'Climb above the thunderhead' },
      { icon: '🏔️', label: 'Land on the ruined peak' },
    ],
    progressLabel: 'Track the sky titan',
    progress: 74,
  },
  'Asphalt Hoops Showdown': {
    scene: 'The final possession begins under the floodlights',
    nextScene: 'Drive hard to the rim',
    choices: [
      { icon: '🏀', label: 'Drive hard to the rim' },
      { icon: '🎯', label: 'Take the corner three' },
      { icon: '🤝', label: 'Set up the alley-oop' },
      { icon: '⏱️', label: 'Hold for the last shot' },
    ],
    progressLabel: 'Win the neighborhood tournament',
    progress: 86,
  },
  'Neo Apex Skyline': {
    scene: 'Security drones flood the rain-soaked rooftop',
    nextScene: 'Wall-run across the neon divide',
    choices: [
      { icon: '🏃', label: 'Wall-run across the neon divide' },
      { icon: '⚡', label: 'Disable the drone network' },
      { icon: '🕵️', label: 'Steal the Citadel access key' },
      { icon: '🚁', label: 'Hijack the patrol aircraft' },
    ],
    progressLabel: 'Expose the Citadel regime',
    progress: 61,
  },
  'Paws of the Sunken Grove': {
    scene: 'The explorer finds a doorway beneath the vines',
    nextScene: 'Chase the map-stealing butterfly',
    choices: [
      { icon: '🦋', label: 'Chase the map-stealing butterfly' },
      { icon: '🐢', label: 'Cross the turtle-stone bridge' },
      { icon: '🌿', label: 'Outsmart the vine temple' },
      { icon: '☀️', label: 'Return the stolen sunstone' },
      { icon: '🌊', label: 'Surf the flood back home' },
    ],
    progressLabel: 'Open the sunken sanctuary',
    progress: 69,
  },
  'Dimension Hoppers': {
    scene: 'The portal gun selects a very wrong reality',
    nextScene: 'Pretend to belong here',
    choices: [
      { icon: '🥸', label: 'Pretend to belong here' },
      { icon: '🌀', label: 'Open another portal immediately' },
      { icon: '👽', label: 'Ask the locals for directions' },
      { icon: '🔬', label: 'Collect a dangerously alive sample' },
    ],
    progressLabel: 'Find the original timeline',
    progress: 55,
  },
  "Dragon Queen's Ascent": {
    scene: 'The dragon circles above the frozen stronghold',
    nextScene: 'Land beyond the castle walls',
    choices: [
      { icon: '🐉', label: 'Land beyond the castle walls' },
      { icon: '👑', label: 'Demand the throne at sunrise' },
      { icon: '🔥', label: 'Burn the enemy siege line' },
      { icon: '🤝', label: 'Accept the northern alliance' },
    ],
    progressLabel: 'Unite the fractured kingdoms',
    progress: 77,
  },
  'Dust and Rust Pursuit': {
    scene: 'The convoy enters a wall of red dust',
    nextScene: 'Leap onto the armored tanker',
    choices: [
      { icon: '🚙', label: 'Leap onto the armored tanker' },
      { icon: '💥', label: 'Detonate the canyon bridge' },
      { icon: '🛞', label: 'Cut through the salt flats' },
      { icon: '⛽', label: 'Risk a moving fuel transfer' },
    ],
    progressLabel: 'Reach the last green valley',
    progress: 64,
  },
  'Abyssal Tide': {
    scene: 'A colossal shadow moves beneath the glowing reef',
    nextScene: 'Dive toward the bioluminescent signal',
    choices: [
      { icon: '🌊', label: 'Dive toward the bioluminescent signal' },
      { icon: '🐋', label: 'Call the ancient sea guardian' },
      { icon: '🏝️', label: 'Return to the floating village' },
      { icon: '🔱', label: 'Recover the sunken relic' },
    ],
    progressLabel: 'Map the abyssal passage',
    progress: 48,
  },
  'Emerald Vanguard': {
    scene: 'The fleet drops from hyperspace without warning',
    nextScene: 'Raise the emerald shield',
    choices: [
      { icon: '🛡️', label: 'Raise the emerald shield' },
      { icon: '💚', label: 'Channel the unstable core' },
      { icon: '🪐', label: 'Evacuate the moon colony' },
      { icon: '⚔️', label: 'Board the enemy flagship' },
    ],
    progressLabel: 'Defend the outer systems',
    progress: 72,
  },
  'The Memory Lantern': {
    scene: 'A precious family memory begins to flicker',
    nextScene: 'Repair the lantern before dawn',
    choices: [
      { icon: '🏮', label: 'Repair the lantern before dawn' },
      { icon: '🎸', label: 'Play the forgotten family song' },
      { icon: '🌼', label: 'Cross the marigold bridge' },
      { icon: '💀', label: 'Ask the skeletal artisan for help' },
    ],
    progressLabel: 'Restore the family archive',
    progress: 82,
  },
};

const defaultStory: StoryProfile = {
  scene: 'A new path appears beyond the horizon',
  nextScene: 'Follow the signal into the unknown',
  choices: [
    { icon: '✨', label: 'Follow the signal into the unknown' },
    { icon: '🗺️', label: 'Search for a hidden route' },
    { icon: '🤝', label: 'Trust the mysterious stranger' },
    { icon: '⚡', label: 'Take the dangerous shortcut' },
  ],
  progressLabel: 'Unlock the next location',
  progress: 62,
};

const people = [
  { name: 'nightbyte', color: '#f472b6' },
  { name: 'pixelpilot', color: '#81baeC' },
  { name: 'mossboss', color: '#7dd3a8' },
  { name: 'juno_tv', color: '#c4a7ff' },
  { name: 'orbital', color: '#ffb86c' },
  { name: 'nova_gg', color: '#67d8e8' },
];

function message(id: string, index: number, text: string): FauxChatMessage {
  const person = people[index % people.length];
  return { id, name: person.name, color: person.color, text };
}

export function createFauxStreamProfile(world: Worldstream): FauxStreamProfile {
  const story = storyProfiles[world.title] || defaultStory;
  return {
    ...story,
    messages: [
      message(`${world.publicId}-1`, 0, 'W intro'),
      message(`${world.publicId}-2`, 1, 'vote 2 chat'),
      message(`${world.publicId}-3`, 2, 'no way 😭'),
      message(`${world.publicId}-4`, 3, 'clean transition'),
      message(`${world.publicId}-5`, 4, 'LOOK BEHIND'),
    ],
    activity: [
      'W',
      'LMAO',
      'go go go',
      'chat??',
      'nahhh 😭',
      '2',
      '🔥🔥🔥',
      'RUN',
      'clean',
      'wait WHAT',
    ],
  };
}

export function seededViewerCount(world: Worldstream) {
  let hash = 0;
  for (const character of world.publicId) hash = Math.imul(31, hash) + character.charCodeAt(0) | 0;
  return 84 + Math.abs(hash % 740);
}
