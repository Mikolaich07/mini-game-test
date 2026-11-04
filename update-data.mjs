// Оновлює data.js свіжими героями, здібностями й предметами з Deadlock API.
// Запуск (Node 18+):  node update-data.mjs
import { writeFileSync } from 'node:fs';

const P = 'https://assets-bucket.deadlock-api.com/assets-api-res/images/';
const strip = u => (u || '').startsWith(P) ? u.slice(P.length) : (u || '');
const get = async u => { const r = await fetch(u); if (!r.ok) throw new Error(u + ' → ' + r.status); return r.json(); };

const [H, I] = await Promise.all([
  get('https://api.deadlock-api.com/v1/assets/heroes'),
  get('https://api.deadlock-api.com/v1/assets/items'),
]);
let uk = {};
try { (await get('https://apidraft.deadlockua.com/heroes')).forEach(h => uk[h.externalId] = h.nameUk); }
catch (e) { console.warn('Українські імена не завантажились:', e.message); }

const byCls = Object.fromEntries(I.map(i => [i.class_name, i]));
const h = H.filter(x => x.player_selectable && !x.disabled && !x.in_development).map(x => {
  const im = x.images || {};
  const ab = [1, 2, 3, 4].map(n => byCls[x.items['signature' + n]]).filter(Boolean)
    .map(a => [a.name, strip(a.image_webp || a.image)]);
  return [x.id, x.name, uk[x.id] || '', strip(im.icon_hero_card_webp || im.icon_hero_card),
    strip(im.icon_image_small_webp || im.icon_image_small), ab, x.gun_tag || '', x.hero_type || '', x.complexity || 0];
});
const i = I.filter(x => x.type === 'upgrade' && x.shopable && !x.disabled)
  .map(x => [x.name, x.item_slot_type[0], x.item_tier, strip(x.shop_image_small_webp || x.shop_image_webp || x.shop_image || x.image_webp || x.image)]);

const data = { updated: new Date().toISOString().slice(0, 10), h, i };
writeFileSync(new URL('./data.js', import.meta.url),
  '// Знімок даних Deadlock. Оновити: node update-data.mjs\nwindow.DL_DATA = ' + JSON.stringify(data) + ';\n');
console.log(`OK: ${h.length} героїв, ${i.length} предметів`);
