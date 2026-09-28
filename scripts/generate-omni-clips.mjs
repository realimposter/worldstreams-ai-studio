import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDirectory = dirname(dirname(fileURLToPath(import.meta.url)));
const sequences = JSON.parse(await readFile(join(rootDirectory, 'shared', 'stream-sequences.json'), 'utf8'));
const apiBase = 'https://generativelanguage.googleapis.com/v1beta';
const catalogUrl = 'https://api.sequencer.media/v1/public/worldstreams?limit=60';
const model = 'gemini-omni-1.1-flash';
const outputDurationSeconds = 10;
const playbackDurationSeconds = 15;
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const generateAll = args.includes('--all');
const force = args.includes('--force');
const confirmed = args.includes('--confirm-generation');
const worldArgumentIndex = args.indexOf('--world');
const worldSelector = worldArgumentIndex >= 0 ? args[worldArgumentIndex + 1] : '';

function usage() {
  console.log([
    'Generate four linked Gemini Omni clips for one or more Worldstreams.',
    '',
    'Preview prompts:',
    '  node scripts/generate-omni-clips.mjs --world "Space Mission" --dry-run',
    '',
    'Generate one world:',
    '  node --env-file=.env scripts/generate-omni-clips.mjs --world "Space Mission" --confirm-generation',
    '',
    'Generate every published world:',
    '  node --env-file=.env scripts/generate-omni-clips.mjs --all --confirm-generation',
    '',
    'Use --force to replace existing clips.',
  ].join('\n'));
}

function buildPrompt(world, choice, index) {
  const transition = index === 0
    ? 'Begin from the supplied world artwork and bring it naturally to life.'
    : 'Continue directly from the previous clip with matching characters, lighting, environment, and screen direction.';
  return [
    transition,
    `World: ${world.title}. ${world.description}`,
    `Audience direction: ${choice.label}.`,
    'Create one energetic cinematic story beat with expressive character motion, layered background activity, and a clear visual payoff.',
    'Use a smooth stabilized camera move, natural motion blur, strong depth, and polished cinematic lighting in 16:9.',
    `Make the complete video exactly ${outputDurationSeconds} seconds long at 24 fps. End on a composed hold that can crossfade cleanly into another scene.`,
    'Do not add captions, logos, watermarks, interface elements, or spoken dialogue.',
  ].join(' ');
}

function normalizeInteractionPath(id) {
  const clean = String(id || '').replace(/^\/+/, '').replace(/^v1beta\//, '');
  return clean.startsWith('interactions/') ? clean : `interactions/${clean}`;
}

function extractVideo(interaction) {
  if (interaction?.output_video?.data || interaction?.output_video?.uri) return interaction.output_video;
  for (const step of interaction?.steps || []) {
    if (step?.type !== 'model_output') continue;
    for (const content of step.content || []) {
      if (content?.type === 'video' && (content.data || content.uri)) return content;
    }
  }
  return null;
}

function sleep(milliseconds) {
  return new Promise(resolve => setTimeout(resolve, milliseconds));
}

async function googleRequest(path, options = {}) {
  const response = await fetch(`${apiBase}/${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': process.env.GEMINI_API_KEY,
      ...options.headers,
    },
  });
  if (!response.ok) {
    const body = (await response.text()).slice(0, 1_000);
    throw new Error(`Gemini request failed (${response.status}): ${body}`);
  }
  return response.json();
}

async function pollInteraction(initial) {
  let interaction = initial;
  for (let attempt = 0; attempt < 90; attempt += 1) {
    const video = extractVideo(interaction);
    if (video) return { interaction, video };
    const status = String(interaction?.status || '').toLowerCase();
    if (['failed', 'cancelled', 'canceled'].includes(status)) {
      throw new Error(`Gemini interaction ${interaction.id || ''} ended with status ${status}.`);
    }
    await sleep(8_000);
    interaction = await googleRequest(normalizeInteractionPath(interaction.id));
  }
  throw new Error('Gemini video generation did not finish within 12 minutes.');
}

async function readImage(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Could not download the public world artwork (${response.status}).`);
  const mimeType = (response.headers.get('content-type') || 'image/jpeg').split(';')[0];
  if (!mimeType.startsWith('image/')) throw new Error(`World artwork returned ${mimeType}.`);
  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.byteLength > 12 * 1024 * 1024) throw new Error('World artwork is larger than 12 MB.');
  return { data: bytes.toString('base64'), mimeType };
}

async function videoBytes(video) {
  if (video.data) return Buffer.from(video.data, 'base64');
  const url = new URL(video.uri);
  const allowed = url.protocol === 'https:' && (
    url.hostname === 'generativelanguage.googleapis.com'
    || url.hostname.endsWith('.googleapis.com')
    || url.hostname.endsWith('.googleusercontent.com')
  );
  if (!allowed) throw new Error(`Gemini returned an unsupported video host: ${url.hostname}`);
  const response = await fetch(url, { headers: { 'x-goog-api-key': process.env.GEMINI_API_KEY } });
  if (!response.ok) throw new Error(`Could not download generated video (${response.status}).`);
  return Buffer.from(await response.arrayBuffer());
}

async function exists(path) {
  try {
    return (await stat(path)).isFile();
  } catch {
    return false;
  }
}

async function createInteraction(world, prompt, image, previousInteractionId) {
  const input = previousInteractionId
    ? `Extend the existing video into the next story beat. ${prompt}`
    : image
      ? [
          { type: 'image', data: image.data, mime_type: image.mimeType },
          { type: 'text', text: prompt },
        ]
      : prompt;
  const payload = {
    model,
    input,
    background: true,
    response_format: {
      type: 'video',
      delivery: 'uri',
      resolution: '720p',
      aspect_ratio: '16:9',
    },
  };
  if (previousInteractionId) {
    payload.previous_interaction_id = previousInteractionId;
    payload.generation_config = { video_config: { task: 'extend' } };
  } else if (image) {
    payload.generation_config = { video_config: { task: 'image_to_video' } };
  }
  return googleRequest('interactions', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

async function generateWorld(world) {
  const choices = sequences[world.title];
  if (!Array.isArray(choices) || choices.length !== 4) {
    throw new Error(`No four-part prompt sequence is defined for ${world.title}.`);
  }
  const outputDirectory = join(rootDirectory, 'public', 'streams', world.publicId);
  await mkdir(outputDirectory, { recursive: true });
  const imageUrl = world.thumbnailUrl || world.worldLogoUrl;
  const image = imageUrl ? await readImage(imageUrl) : null;
  let previousInteractionId = '';
  const manifest = {
    publicId: world.publicId,
    title: world.title,
    model,
    generatedAt: new Date().toISOString(),
    sourceDurationSeconds: outputDurationSeconds,
    playbackDurationSeconds,
    segments: [],
  };

  for (let index = 0; index < choices.length; index += 1) {
    const choice = choices[index];
    const fileName = `segment-${index + 1}.mp4`;
    const outputPath = join(outputDirectory, fileName);
    const prompt = buildPrompt(world, choice, index);
    manifest.segments.push({
      id: `segment-${index + 1}`,
      icon: choice.icon,
      label: choice.label,
      prompt,
      videoUrl: `/streams/${world.publicId}/${fileName}`,
    });

    if (!force && await exists(outputPath)) {
      console.log(`[${world.title}] Keeping existing ${fileName}.`);
      previousInteractionId = '';
      continue;
    }

    console.log(`[${world.title}] Generating ${index + 1}/4: ${choice.label}`);
    const initial = await createInteraction(world, prompt, image, previousInteractionId);
    const { interaction, video } = await pollInteraction(initial);
    const bytes = await videoBytes(video);
    await writeFile(outputPath, bytes);
    previousInteractionId = interaction.id || initial.id || '';
    await writeFile(join(outputDirectory, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
    console.log(`[${world.title}] Saved ${fileName} (${(bytes.byteLength / 1024 / 1024).toFixed(1)} MB).`);
  }

  await writeFile(join(outputDirectory, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
}

async function main() {
  if ((!generateAll && !worldSelector) || (generateAll && worldSelector)) {
    usage();
    process.exitCode = 1;
    return;
  }
  const response = await fetch(catalogUrl);
  if (!response.ok) throw new Error(`Public catalog returned ${response.status}.`);
  const body = await response.json();
  const catalog = Array.isArray(body?.worldstreams) ? body.worldstreams : [];
  const targets = generateAll
    ? catalog.filter(world => sequences[world.title])
    : catalog.filter(world => (
        world.publicId === worldSelector
        || world.title.toLowerCase() === worldSelector.toLowerCase()
      ));
  if (targets.length === 0) throw new Error(`No published world matched "${worldSelector}".`);

  if (dryRun) {
    for (const world of targets) {
      console.log(`\n${world.title} (${world.publicId})`);
      sequences[world.title].forEach((choice, index) => {
        console.log(`  ${index + 1}. ${choice.icon} ${choice.label}`);
        console.log(`     ${buildPrompt(world, choice, index)}`);
      });
    }
    return;
  }

  if (!confirmed) throw new Error('Add --confirm-generation to authorize the requested Gemini video generations.');
  if (!process.env.GEMINI_API_KEY) throw new Error('GEMINI_API_KEY is not configured. Add it to the ignored local .env file.');

  console.log(`Generating ${targets.length * 4} video clips for ${targets.length} world(s).`);
  for (const world of targets) await generateWorld(world);
}

main().catch(error => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
