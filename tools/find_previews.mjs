// 為 songs.js 每首歌找 Apple Music（iTunes Search API）的 30 秒官方試聽。
//
// 用法：node tools/find_previews.mjs [songs.js] [out.json]
//
// 以「歌手 + 曲名」在日本區搜尋，挑曲名與歌手最相符的結果；
// 輸出 trackId、previewUrl、trackViewUrl 與比對到的曲名／歌手，請人工檢查 score 低的項目。
// iTunes API 每分鐘約 20 次請求上限，所以每次請求間隔 3.2 秒。

import { readFileSync, writeFileSync } from 'node:fs';

const [src = 'songs.js', outPath = 'tools/previews.json'] = process.argv.slice(2);
const text = readFileSync(src, 'utf8');
const SONGS = new Function(text.replace(/const SONGS\s*=/, 'return '))();

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
// 去掉括號註記、空白、標點，統一全形半形與大小寫
const norm = (s) => (s || '')
  .normalize('NFKC').toLowerCase()
  .replace(/[（(【\[].*?[）)】\]]/g, '')
  .replace(/[\s!！?？・･.,'"“”~～\-–—:：;/、。☆★●*]/g, '');

function similar(a, b) {
  a = norm(a); b = norm(b);
  if (!a || !b) return 0;
  if (a === b) return 1;
  if (a.includes(b) || b.includes(a)) return 0.8;
  // 字元重疊比例
  const set = new Set(b);
  const hit = [...a].filter((c) => set.has(c)).length;
  return 0.6 * hit / Math.max(a.length, b.length);
}

async function search(term, country) {
  const url = `https://itunes.apple.com/search?country=${country}&media=music&entity=song&limit=15&term=${encodeURIComponent(term)}`;
  for (let i = 0; i < 4; i++) {
    try {
      const r = await fetch(url);
      if (r.status === 403 || r.status === 429) { await sleep(20000); continue; }
      return (await r.json()).results || [];
    } catch { await sleep(3000); }
  }
  return [];
}

function pick(song, results) {
  // 曲名：去掉我們加的註記，例如「炎（劇場版 無限列車篇）」→「炎」
  const track = song.track.replace(/（.*?）/g, '');
  let best = null;
  for (const r of results) {
    if (!r.previewUrl) continue;
    const t = similar(r.trackName, track);
    const a = Math.max(similar(r.artistName, song.composer), ...song.composer.split(/[&×・、]/).map((x) => similar(r.artistName, x)));
    // 避開 Instrumental / off vocal / カラオケ / TV size 等版本
    const bad = /instrumental|off ?vocal|karaoke|カラオケ|backing|tv ?size|tvサイズ|オリジナル・カラオケ/i.test(r.trackName) ? 0.5 : 0;
    const score = t * 0.65 + a * 0.35 - bad;
    if (!best || score > best.score) best = { r, score };
  }
  return best;
}

const out = [];
for (const [i, song] of SONGS.entries()) {
  const track = song.track.replace(/（.*?）/g, '');
  let best = null;
  for (const [term, country] of [[`${song.composer} ${track}`, 'JP'], [track, 'JP'], [`${song.composer} ${track}`, 'TW']]) {
    const res = await search(term, country);
    await sleep(3200);
    const b = pick(song, res);
    if (b && (!best || b.score > best.score)) best = b;
    if (best && best.score >= 0.9) break;
  }
  const row = { i, zh: song.zh, track: song.track, composer: song.composer };
  if (best) {
    Object.assign(row, {
      score: Number(best.score.toFixed(2)),
      matchTrack: best.r.trackName, matchArtist: best.r.artistName,
      trackId: best.r.trackId, previewUrl: best.r.previewUrl, appleUrl: best.r.trackViewUrl,
    });
  }
  out.push(row);
  console.log(`${String(i).padStart(2)} ${row.score ?? '--'}  ${song.track} / ${song.composer}  =>  ${row.matchTrack ?? 'NOT FOUND'} / ${row.matchArtist ?? ''}`);
  writeFileSync(outPath, JSON.stringify(out, null, 1));
}
console.log(`\n${out.filter((r) => r.previewUrl).length} / ${SONGS.length} found`);
