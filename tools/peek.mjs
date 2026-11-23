import { searchVideoIds, oembed } from './yt.mjs';
for (const q of process.argv.slice(2)) {
  console.log('## ' + q);
  const ids = await searchVideoIds(q);
  for (const id of ids.slice(0, 6)) {
    const i = await oembed(id);
    console.log('  ' + id + (i ? `  ${i.title}  [${i.author_name}]` : '  (no embed)'));
  }
}
