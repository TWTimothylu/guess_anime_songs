// 把 tools/previews.json（find_previews.mjs 的結果）合併進 songs.js。
// OVERRIDES：人工檢查後修正的比對（翻唱、Live 版等），值為 Apple trackId，可同時修改歌曲欄位。
import { readFileSync, writeFileSync } from 'node:fs';

const OVERRIDES = {
  32: { appleId: 0, composer: 'きただにひろし × 氣志團' },            // 比對正確，只修正歌手
  40: { appleId: 1618913658, track: '謎', composer: '小松未歩', year: 1997, youtubeId: null }, // 胸がドキドキ 原唱沒有上架
  41: { appleId: 1750438915, composer: '三石琴乃、金元寿子、佐藤利奈、小清水亜美、伊藤静（劇場版 Cosmos）' }, // DALI 原唱沒有上架
  42: { appleId: 1318186200, composer: 'GUMI' },
  67: { appleId: 1535798233 },
  68: { appleId: 1742554343 },
};

const text = readFileSync('songs.js', 'utf8');
const header = text.slice(0, text.indexOf('const SONGS')).replace(/^\/\/ hot:.*\n/m, '');
const SONGS = new Function(text.replace(/const SONGS\s*=/, 'return '))();
const previews = JSON.parse(readFileSync('tools/previews.json', 'utf8'));

async function lookup(id) {
  const r = await fetch(`https://itunes.apple.com/lookup?id=${id}&country=JP`);
  const x = (await r.json()).results[0];
  console.log(`lookup ${id}: ${x.trackName} / ${x.artistName}`);
  return { appleId: x.trackId, preview: x.previewUrl, appleUrl: x.trackViewUrl };
}

const out = [];
for (const [i, s] of SONGS.entries()) {
  const p = previews[i];
  let apple = { appleId: p.trackId, preview: p.previewUrl, appleUrl: p.appleUrl };
  const o = OVERRIDES[i] || {};
  if (o.appleId) { apple = await lookup(o.appleId); await new Promise((r) => setTimeout(r, 3200)); }
  const { appleId, ...fields } = o;
  const merged = { ...s, ...fields, ...apple };
  delete merged.hot;
  const keys = ['zh', 'en', 'track', 'composer', 'year', 'type', 'appleId', 'preview', 'appleUrl', 'youtubeId'];
  out.push(Object.fromEntries(keys.filter((k) => merged[k] != null).map((k) => [k, merged[k]])));
}
writeFileSync('songs.js', header.replace('youtubeId 皆已確認可嵌入播放（oEmbed + 瀏覽器實測）。', '試聽來自 Apple Music（iTunes Search API），已人工確認為原唱版本。\n// appleId / preview / appleUrl：Apple 曲目 ID、30 秒試聽網址、Apple Music 頁面；youtubeId 僅用於揭曉時的 YouTube 連結') +
  'const SONGS = [\n' + out.map((x) => '  ' + JSON.stringify(x)).join(',\n') + '\n];\n');
console.log(out.length, 'songs written');
