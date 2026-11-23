// Shared helpers for fetching YouTube pages from Node (18+).
// YouTube redirect-loops without a consent cookie and sometimes drops connections,
// so every request sends a consent cookie + desktop UA and retries with backoff.

export const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36';

const HEADERS = { 'User-Agent': UA, 'Accept-Language': 'en', Cookie: 'CONSENT=YES+cb; SOCS=CAI' };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export async function fetchText(url, tries = 4) {
  for (let i = 0; i < tries; i++) {
    try {
      const r = await fetch(url, { headers: HEADERS });
      return await r.text();
    } catch {
      await sleep(1500 * (i + 1));
    }
  }
  return '';
}

/** Video IDs of the search results page, in order. */
export async function searchVideoIds(query) {
  const html = await fetchText(
    'https://www.youtube.com/results?search_query=' + encodeURIComponent(query) + '&hl=en',
  );
  const ids = [...html.matchAll(/"videoRenderer":\{"videoId":"([\w-]{11})"/g)].map((m) => m[1]);
  return [...new Set(ids)];
}

/** oEmbed info ({ title, author_name }) or null when the video is missing or blocks embedding. */
export async function oembed(id) {
  try {
    const r = await fetch(
      `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${id}&format=json`,
    );
    return r.ok ? await r.json() : null;
  } catch {
    return null;
  }
}

/** { length, markers: [{ start, dur, v }] } from the watch page's "Most replayed" heatmap. */
export async function heatmap(id) {
  const html = await fetchText(`https://www.youtube.com/watch?v=${id}&hl=en`);
  const length = Number((html.match(/"lengthSeconds":"(\d+)"/) || [])[1] || 0);
  const seen = new Map();
  for (const m of html.matchAll(
    /\{"startMillis":"(\d+)","durationMillis":"(\d+)","intensityScoreNormalized":([\d.eE-]+)\}/g,
  )) {
    seen.set(m[1], { start: m[1] / 1000, dur: m[2] / 1000, v: Number(m[3]) });
  }
  return { length, markers: [...seen.values()].sort((a, b) => a.start - b.start) };
}
