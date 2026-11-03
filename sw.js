// 電波がない時でも動くように、アプリのファイルをスマホの中に控えておく仕組み。
// 問題やアプリを直したら VERSION の数字を上げる(スマホ側が新しい物を取り直す)。
const VERSION = 3;
const CACHE = 'iikae-dojo-v' + VERSION;
const FILES = [
  './', './index.html', './manifest.json',
  './icons/icon-192.png', './icons/icon-512.png', './icons/icon-maskable-512.png', './icons/apple-touch-icon.png',
  './data/base.js', './data/iikae_more.js', './data/iikae_more2.js', './data/keigo.js',
  './data/imi.js', './data/imi_more.js', './data/yomi.js', './data/katakana.js', './data/taigi.js',
  './data/anaume.js', './data/goyou.js', './data/tatoe.js', './data/narabe.js',
  './data/free_more.js', './data/tsukkomi.js', './data/sango.js',
  './data/goyou_more.js', './data/narabe_more.js', './data/keigo_more.js', './data/anaume_more.js',
  './data/tatoe_more.js', './data/tsukkomi_more.js', './data/sango_more.js', './data/free_more2.js',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c =>
    Promise.all(FILES.map(f => c.add(new Request(f, { cache: 'reload' })).catch(() => {})))
  ).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
  ).then(() => self.clients.claim()));
});

// 控えがあればすぐそれを出し、電波があれば裏で新しい物に入れ替えておく
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith(caches.open(CACHE).then(async c => {
    const hit = await c.match(req, { ignoreSearch: true });
    const net = fetch(req).then(res => {
      if (res && res.ok) c.put(req, res.clone());
      return res;
    }).catch(() => null);
    if (hit) { e.waitUntil(net); return hit; }
    const res = await net;
    if (res) return res;
    if (req.mode === 'navigate') return (await c.match('./index.html')) || Response.error();
    return Response.error();
  }));
});
