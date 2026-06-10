const W = 800, H = 600, R = Math.random, F = Math.floor, S = Math.sin, C = Math.cos, P = Math.PI, SQ = Math.sqrt, MN = Math.min, MX = Math.max, AB = Math.abs;

// CABINET_KEYS maps physical cabinet controls. DO NOT change existing mappings.
const CABINET_KEYS = {
  P1_U: ['w'], P1_D: ['s'], P1_L: ['a'], P1_R: ['d'],
  P1_1: ['u'], P1_2: ['i'], P1_3: ['o'], P1_4: ['j'], P1_5: ['k'], P1_6: ['l'],
  P2_U: ['ArrowUp'], P2_D: ['ArrowDown'], P2_L: ['ArrowLeft'], P2_R: ['ArrowRight'],
  P2_1: ['r'], P2_2: ['t'], P2_3: ['y'], P2_4: ['f'], P2_5: ['g'], P2_6: ['h'],
  START1: ['Enter'], START2: ['2'],
};

const K = {}, input = { held: {}, pressed: {} };
for (const [code, keys] of Object.entries(CABINET_KEYS)) for (const key of keys) K[key.length === 1 ? key.toLowerCase() : key] = code;
addEventListener('keydown', e => {
  const k = e.key.length === 1 ? e.key.toLowerCase() : e.key, c = K[k];
  if (c && !input.held[c]) input.held[c] = input.pressed[c] = true;
});
addEventListener('keyup', e => { const k = e.key.length === 1 ? e.key.toLowerCase() : e.key, c = K[k]; if (c) input.held[c] = false; });
function tap(c) { if (input.pressed[c]) return input.pressed[c] = false, true; return false; }
function store() {
  return window.platanusArcadeStorage || {
    async get(k) { try { const v = localStorage.getItem(k); return v ? { found: true, value: JSON.parse(v) } : { found: false }; } catch { return { found: false }; } },
    async set(k, v) { localStorage.setItem(k, JSON.stringify(v)); }
  };
}

let scene, state = 'MENU', g, fx, ui = {}, players = [], enemies, bullets, cores, sparks;
let score = 0, stash = 0, mult = 1, heat = 0, wave = 1, spawn = 0, left = 0, stop = 0, grid = 0, mode = 1, menu = 0, dif = 1, boss = null, bossBar = null;
let scores = [], name = ['A', 'A', 'A'], ni = 0, stars = [], cashCd = 0, surge = 0, bonus = 0;
let ac, gain, filter, sounds = {}, beat, step = 0, next = 0;
const COL = [0x00f3ff, 0xff00b3], RED = 0xff2555, GREEN = 0x22ff88, GOLD = 0xffea00;
const DN = ['CHILL', 'NORMAL', 'HARD', 'NIGHTMARE'], DS = [.75, 1, 1.25, 1.55], DH = [6, 5, 4, 3], DP = [.85, 1, 1.25, 1.6], DB = [.3, .45, .55, .68];

new Phaser.Game({
  type: Phaser.AUTO, width: W, height: H, parent: 'game-root',
  backgroundColor: '#020308', antialias: true,
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  physics: { default: 'arcade', arcade: { gravity: { y: 0 }, debug: false } },
  scene: { create, update }
});

function tex(n, w, h, fn) {
  const c = document.createElement('canvas'), x = c.getContext('2d');
  c.width = w; c.height = h; x.shadowBlur = 7; fn(x, w, h); scene.textures.addCanvas(n, c);
}
function makeTex() {
  function ship(n, c) {
    tex(n, 34, 34, (x, w, h) => {
      x.shadowColor = c; x.fillStyle = '#06111b'; x.strokeStyle = c; x.lineWidth = 3;
      x.beginPath(); x.moveTo(w - 4, h / 2); x.lineTo(5, h - 6); x.lineTo(11, h / 2); x.lineTo(5, 6); x.closePath(); x.fill(); x.stroke();
      x.fillStyle = '#fff'; x.beginPath(); x.arc(17, 17, 4, 0, P * 2); x.fill();
    });
  }
  ship('p1', '#00f3ff'); ship('p2', '#ff00b3');
  tex('runner', 24, 24, (x, w, h) => {
    x.shadowColor = '#ff2555'; x.strokeStyle = '#ff2555'; x.fillStyle = '#1b0208'; x.lineWidth = 2;
    x.beginPath(); x.moveTo(w - 2, h / 2); x.lineTo(w / 2, h - 2); x.lineTo(3, h / 2); x.lineTo(w / 2, 2); x.closePath(); x.fill(); x.stroke();
  });
  tex('gunner', 28, 28, (x, w, h) => {
    x.shadowColor = '#ff8a00'; x.strokeStyle = '#ff8a00'; x.fillStyle = '#1b0901'; x.lineWidth = 2;
    x.beginPath(); for (let i = 0; i < 8; i++) { const a = i * P / 4, xx = w / 2 + C(a) * 11, yy = h / 2 + S(a) * 11; i ? x.lineTo(xx, yy) : x.moveTo(xx, yy); } x.closePath(); x.fill(); x.stroke();
    x.strokeStyle = '#fff'; x.beginPath(); x.arc(w / 2, h / 2, 4, 0, P * 2); x.stroke();
  });
  tex('mine', 24, 24, (x, w, h) => {
    x.shadowColor = '#ff0055'; x.strokeStyle = '#ff0055'; x.fillStyle = '#21020a'; x.lineWidth = 2;
    x.beginPath(); for (let i = 0; i < 12; i++) { const a = i * P / 6, d = i % 2 ? 6 : 11, xx = w / 2 + C(a) * d, yy = h / 2 + S(a) * d; i ? x.lineTo(xx, yy) : x.moveTo(xx, yy); } x.closePath(); x.fill(); x.stroke();
  });
  tex('core', 18, 18, (x, w, h) => {
    x.shadowColor = '#22ff88'; x.strokeStyle = '#22ff88'; x.fillStyle = '#042012'; x.lineWidth = 2;
    x.beginPath(); x.moveTo(w / 2, 2); x.lineTo(w - 2, h / 2); x.lineTo(w / 2, h - 2); x.lineTo(2, h / 2); x.closePath(); x.fill(); x.stroke();
  });
  tex('bullet', 14, 6, (x, w, h) => { x.shadowColor = '#ffea00'; x.fillStyle = '#fff'; x.beginPath(); x.ellipse(w / 2, h / 2, 6, 2.5, 0, 0, P * 2); x.fill(); });
  tex('boss', 84, 84, (x, w, h) => {
    x.shadowColor = '#ff0055'; x.strokeStyle = '#ff0055'; x.fillStyle = '#14010a'; x.lineWidth = 4;
    x.beginPath(); for (let i = 0; i < 10; i++) { const a = i * P / 5, d = i % 2 ? 28 : 38, xx = w / 2 + C(a) * d, yy = h / 2 + S(a) * d; i ? x.lineTo(xx, yy) : x.moveTo(xx, yy); } x.closePath(); x.fill(); x.stroke();
    x.shadowColor = '#00f3ff'; x.strokeStyle = '#00f3ff'; x.lineWidth = 3; x.beginPath(); x.arc(w / 2, h / 2, 22, 0, P * 2); x.stroke();
    x.fillStyle = '#fff'; x.beginPath(); x.arc(w / 2, h / 2, 8, 0, P * 2); x.fill();
  });
}

function initAudio() {
  ac = scene.sound.context; if (!ac) return;
  gain = ac.createGain(); filter = ac.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.value = 18000; gain.gain.value = .28; filter.connect(gain); gain.connect(ac.destination);
  const sr = ac.sampleRate;
  function buf(n, len, fn) { const b = ac.createBuffer(1, F(sr * len), sr), d = b.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = fn(i / sr, i / d.length); sounds[n] = b; }
  buf('hit', .28, (t, p) => (S(2 * P * (130 - t * 260) * t) * .35 + (R() * 2 - 1) * .5) * (1 - p));
  buf('zap', .14, (t, p) => S(2 * P * (650 + t * 4200) * t) * (1 - p) * .35);
  buf('slash', .12, (t, p) => (S(2 * P * (1300 - t * 3600) * t) + (R() * 2 - 1) * .2) * (1 - p) * .35);
  buf('cash', .45, (t, p) => (S(2 * P * 220 * t) + S(2 * P * 440 * t) * .5 + S(2 * P * 660 * t) * .3) * (1 - p) * .28);
}
function snd(n, v = 1, p = 1) {
  if (!ac || !sounds[n]) return;
  try { const s = ac.createBufferSource(), g2 = ac.createGain(); s.buffer = sounds[n]; s.playbackRate.value = p; g2.gain.value = v; s.connect(g2); g2.connect(filter); s.start(); } catch {}
}
function music(on) {
  if (!ac) return; if (beat) clearInterval(beat), beat = null; if (!on) return;
  if (ac.state === 'suspended') ac.resume();
  next = ac.currentTime; step = 0;
  beat = setInterval(() => {
    while (next < ac.currentTime + .08) {
      const f = [55, 65.4, 73.4, 82.4][step % 4] * (1 + heat / 130);
      try {
        const o = ac.createOscillator(), g2 = ac.createGain(); o.type = step % 2 ? 'square' : 'sawtooth'; o.frequency.setValueAtTime(f, next);
        o.connect(g2); g2.connect(filter); g2.gain.setValueAtTime(step % 4 ? .05 : .16, next); g2.gain.exponentialRampToValueAtTime(.001, next + .12); o.start(next); o.stop(next + .14);
      } catch {}
      next += .13; step++;
    }
  }, 25);
}

function create() {
  scene = this; makeTex(); initAudio();
  g = this.add.graphics(); fx = this.add.graphics().setDepth(20);
  enemies = this.physics.add.group(); bullets = this.physics.add.group(); cores = this.physics.add.group(); sparks = this.add.group();
  for (let i = 0; i < 36; i++) stars.push({ x: R() * W, y: R() * H, v: 18 + R() * 55, a: .12 + R() * .4, s: 1 + R() * 2 });
  store().get('neon-heist-scores').then(r => { if (r.found && Array.isArray(r.value)) scores = r.value.filter(x => x && typeof x.score === 'number').slice(0, 5); });

  ui.title = this.add.text(W / 2, 78, 'NEON HEIST', { font: 'bold 68px Courier New', fill: '#00f3ff' }).setOrigin(.5);
  ui.sub = this.add.text(W / 2, 136, 'CORE RUSH', { font: 'bold 28px Courier New', fill: '#ff00b3' }).setOrigin(.5);
  ui.opts = ['1 PLAYER', '2 PLAYERS', 'LEADERBOARD'].map((t, i) => this.add.text(W / 2, 226 + i * 42, t, { font: 'bold 25px Courier New', fill: '#fff' }).setOrigin(.5));
  ui.diff = this.add.text(W / 2, 382, '', { font: 'bold 21px Courier New', fill: '#ffea00' }).setOrigin(.5);
  ui.help = this.add.text(W / 2, 492, 'UP/DOWN MODE  |  LEFT/RIGHT DIFFICULTY  |  START SELECTS\nSLASH: BUTTON 1  DASH: BUTTON 2  START IN RUN: CASH OUT', { font: '14px monospace', fill: '#88aadd', align: 'center' }).setOrigin(.5);
  ui.bank = this.add.text(22, 18, '', { font: 'bold 22px Courier New', fill: '#fff' }).setVisible(false);
  ui.loot = this.add.text(W - 22, 18, '', { font: 'bold 22px Courier New', fill: '#22ff88' }).setOrigin(1, 0).setVisible(false);
  ui.mid = this.add.text(W / 2, 18, '', { font: 'bold 24px Courier New', fill: '#ffea00', align: 'center' }).setOrigin(.5, 0).setVisible(false);
  ui.alert = this.add.text(W / 2, H / 2, '', { font: 'bold 44px Courier New', fill: '#ff0055', align: 'center' }).setOrigin(.5).setVisible(false).setDepth(50);
  ui.nameTitle = this.add.text(W / 2, 108, 'HIGH SCORE HEIST', { font: 'bold 38px Courier New', fill: '#00f3ff' }).setOrigin(.5).setVisible(false);
  ui.nameHelp = this.add.text(W / 2, 168, 'UP/DOWN CHANGE LETTER  |  BUTTON 1 CONFIRMS', { font: '16px monospace', fill: '#88aadd' }).setOrigin(.5).setVisible(false);
  ui.nameChars = [0, 1, 2].map(i => this.add.text(320 + i * 80, 284, 'A', { font: 'bold 52px Courier New', fill: '#fff' }).setOrigin(.5).setVisible(false));
  ui.boardTitle = this.add.text(W / 2, 116, 'VAULT LEADERBOARD', { font: 'bold 34px Courier New', fill: '#ff00b3' }).setOrigin(.5).setVisible(false);
  ui.boardHead = this.add.text(W / 2, 194, 'RANK   NAME      BANK      WAVE', { font: 'bold 17px Courier New', fill: '#00f3ff' }).setOrigin(.5).setVisible(false);
  ui.lines = [0, 1, 2, 3, 4].map(i => this.add.text(W / 2, 244 + i * 37, '', { font: 'bold 18px Courier New', fill: '#88aadd' }).setOrigin(.5).setVisible(false));
  ui.back = this.add.text(W / 2, 492, 'PRESS START TO RETURN', { font: 'bold 16px Courier New', fill: '#22ff88' }).setOrigin(.5).setVisible(false);

  this.tweens.add({ targets: ui.title, scaleX: 1.04, scaleY: 1.04, duration: 1400, yoyo: true, repeat: -1 });
}

function showMenu(v) { [ui.title, ui.sub, ui.help, ui.diff, ...ui.opts].forEach(o => o.setVisible(v)); }
function hud(v) { [ui.bank, ui.loot, ui.mid].forEach(o => o.setVisible(v)); }
function clearRun() {
  enemies.clear(true, true); bullets.clear(true, true); cores.clear(true, true); sparks.clear(true, true);
  if (bossBar) bossBar.clear(); if (boss) boss.destroy(); boss = null; players.forEach(p => p.sprite && p.sprite.destroy()); players = [];
}
function startGame(n) {
  mode = n; state = 'PLAY'; showMenu(false); hud(true); clearRun();
  score = 0; stash = 0; mult = 1; heat = 0; wave = 0; bonus = 0; cashCd = 0;
  addPlayer(W / 3, H / 2, 'p1', 0); if (n === 2) addPlayer(W * 2 / 3, H / 2, 'p2', 1);
  music(true); nextWave();
}
function addPlayer(x, y, id, ix) {
  const p = { id, ix, color: COL[ix], sprite: scene.physics.add.sprite(x, y, id), hp: DH[dif], max: DH[dif], slash: 0, cd: 0, dash: 0, dashCd: 0, dx: 1, dy: 0, inv: 0, tagged: [] };
  p.sprite.body.setCollideWorldBounds(true); p.sprite.body.setDrag(1200); players.push(p);
}
function nextWave() {
  wave++;
  if (wave > 1) {
    bonus = 3500; players.forEach(p => p.hp = MN(p.max, p.hp + 1));
    pop(W / 2, 130, 'VAULT SURGE: +HP, CASH WINDOW!', '#22ff88', 1.2);
  }
  if (wave % 4 === 0) spawnBoss(); else left = F((7 + wave * 2 + F(heat / 10)) * DS[dif]), spawn = 250;
  hudText();
}
function spawnEnemy() {
  const side = R() > .5, x = side ? -30 : W + 30, y = 50 + R() * (H - 100), pool = ['runner', 'runner', 'gunner', wave > 2 ? 'mine' : 'runner'];
  const type = pool[F(R() * pool.length)], e = scene.physics.add.sprite(x, y, type);
  e.type = type; e.hp = (type === 'gunner' ? 2 + F(wave / 5) : 1 + F(wave / 6)) + F(dif / 2); e.t = 400 + R() * 700; e.val = type === 'mine' ? 90 : type === 'gunner' ? 120 : 100; enemies.add(e);
}
function spawnBoss() {
  boss = scene.physics.add.sprite(W / 2, -80, 'boss'); boss.hp = F((22 + wave * 4) * (.8 + dif * .25)); boss.max = boss.hp; boss.t = 1100 - dif * 120; boss.pat = 0;
  scene.tweens.add({ targets: boss, y: 150, duration: 1200, ease: 'Power2' });
  bossBar = scene.add.graphics().setDepth(30); pop(W / 2, 220, 'VAULT GUARDIAN', '#ff0055', 1.35); snd('hit', 1, .45);
}
function loot(v, why, x = W / 2, y = H / 2) {
  const add = F(v * mult); stash += add; heat = MN(99, heat + (2 + mult * .45) * DS[dif]); pop(x, y, '+' + add + ' LOOT', '#22ff88', .95); hudText();
  if (why) pop(x, y - 22, why, '#ffea00', .82);
}
function boost(n = .25) { mult = MN(9.9, +(mult + n).toFixed(2)); hudText(); }
function cashout() {
  if (stash <= 0 || cashCd > 0) return;
  const take = F(stash * DP[dif]); score += take; stash = 0; heat = MX(0, heat - 15); mult = MX(1, +(mult * .55).toFixed(2)); cashCd = 900;
  scene.cameras.main.flash(140, 34, 255, 136); scene.cameras.main.shake(120, .01); snd('cash', 1.1, 1 + MN(take / 8000, .8));
  pop(W / 2, H / 2 - 40, 'CASHOUT +' + take, '#22ff88', 1.65); hudText();
}
function burn(p, dmg) {
  if (p.inv > 0) return; p.hp -= dmg; p.inv = 900; scene.cameras.main.shake(120, .014); snd('hit', 1, .55);
  const lost = F(stash * DB[dif]); stash -= lost; mult = 1; heat = MN(99, heat + 5 + dif * 2); pop(p.sprite.x, p.sprite.y - 26, lost ? 'STASH BURN -' + lost : '-1 HP', '#ff2555', 1.1); hudText(); boom(p.sprite.x, p.sprite.y, RED, 18);
}
function hudText() {
  ui.bank.setText('BANK: ' + score); ui.loot.setText('LOOT: ' + stash);
  ui.mid.setText(DN[dif] + '  WAVE ' + wave + '  MULT x' + mult + '  HEAT ' + F(heat));
}
function pop(x, y, t, c = '#fff', s = 1) {
  const a = scene.add.text(x, y, t, { font: 'bold 20px Courier New', fill: c, align: 'center' }).setOrigin(.5).setDepth(60); a.scale = s;
  scene.tweens.add({ targets: a, y: y - 45, alpha: 0, duration: 800, onComplete: () => a.destroy() });
}
function boom(x, y, c, n) {
  for (let i = 0; i < n; i++) {
    const r = scene.add.rectangle(x, y, 5, 5, c); scene.physics.add.existing(r); r.body.setVelocity((R() - .5) * 380, (R() - .5) * 380); r.body.setDrag(210); r.life = .7 + R() * .45; sparks.add(r);
  }
}
function bullet(x, y, a, sp, owner = 'enemy') {
  const b = scene.physics.add.sprite(x, y, 'bullet'); b.owner = owner; b.base = sp; b.ang = a; b.setRotation(a); b.body.setVelocity(C(a) * sp, S(a) * sp); bullets.add(b);
}
function kill(e, p, beam) {
  const v = F(e.val * (beam ? .55 : 1)); loot(v, beam ? 'LINK STEAL' : 'CORE STOLEN', e.x, e.y); boost(beam ? .08 : .18);
  if (R() < .45) { const c = scene.physics.add.sprite(e.x, e.y, 'core'); c.val = 60; c.body.setVelocity((R() - .5) * 170, (R() - .5) * 170); c.body.setDrag(100); cores.add(c); }
  boom(e.x, e.y, p.color, 12); snd('hit', .8, 1); e.destroy();
}
function gameOver() {
  music(false); clearRun(); state = 'NAME'; hud(false); name = ['A', 'A', 'A']; ni = 0; ui.nameTitle.setVisible(true); ui.nameHelp.setVisible(true); ui.nameChars.forEach((c, i) => c.setText(name[i]).setVisible(true));
}
function board() {
  state = 'BOARD'; showMenu(false); hud(false); [ui.nameTitle, ui.nameHelp, ...ui.nameChars].forEach(o => o.setVisible(false));
  ui.boardTitle.setVisible(true); ui.boardHead.setVisible(true); ui.back.setVisible(true);
  for (let i = 0; i < 5; i++) {
    const s = scores[i], t = s ? `${(i + 1 + '').padEnd(4)}   ${s.name.padEnd(6)}    ${(s.score + '').padEnd(8)}  ${('' + s.wave).padStart(2)}` : `${i + 1}      ------    00000000  00`;
    ui.lines[i].setText(t).setColor(['#00f3ff', '#ff00b3', '#ffea00', '#88aadd', '#88aadd'][i]).setVisible(true);
  }
}
function hideBoard() { [ui.boardTitle, ui.boardHead, ui.back, ...ui.lines].forEach(o => o.setVisible(false)); }

function update(time, delta) {
  Object.keys(input.pressed).forEach(k => { if (!input.held[k]) input.pressed[k] = false; });
  grid = (grid + delta * (.06 + heat / 1600)) % 40; g.clear(); g.lineStyle(1.5, 0x081024, .55);
  for (let x = 0; x < W; x += 40) { g.moveTo(x, 0); g.lineTo(x, H); }
  for (let y = -40; y < H; y += 40) { g.moveTo(0, y + grid); g.lineTo(W, y + grid); }
  g.strokePath(); g.lineStyle(1, 0x000000, .16); for (let y = 0; y < H; y += 5) { g.moveTo(0, y); g.lineTo(W, y); } g.strokePath();
  stars.forEach(s => { s.y += s.v * delta / 1000 * (1 + heat / 70); if (s.y > H) s.y = 0, s.x = R() * W; g.fillStyle(0xffffff, s.a); g.fillRect(s.x, s.y, s.s, s.s); });
  fx.clear(); if (stop > 0) { stop -= delta; if (stop <= 0) scene.physics.resume(); else return; }

  if (state === 'MENU') {
    if (tap('P1_U') || tap('P2_U')) menu = menu ? menu - 1 : 2, snd('zap', .45, 1.2);
    if (tap('P1_D') || tap('P2_D')) menu = (menu + 1) % 3, snd('zap', .45, .85);
    if (tap('P1_L') || tap('P2_L')) dif = dif ? dif - 1 : 3, snd('zap', .45, .8);
    if (tap('P1_R') || tap('P2_R')) dif = (dif + 1) % 4, snd('zap', .45, 1.25);
    ui.opts.forEach((o, i) => o.setColor(i === menu ? '#00f3ff' : '#fff').setScale(i === menu ? 1.14 : 1));
    ui.diff.setText('< DIFFICULTY: ' + DN[dif] + '  BANK x' + DP[dif] + ' >');
    const a = ui.opts[menu]; fx.fillStyle(0x00f3ff, .05); fx.fillRect(a.x - 145, a.y - 19, 290, 38); fx.lineStyle(3, 0xff00b3, .75 + .2 * S(time / 120)); fx.strokeRect(a.x - 145, a.y - 19, 290, 38);
    if (tap('START1') || tap('START2') || tap('P1_1') || tap('P2_1')) menu === 2 ? board() : startGame(menu + 1);
    return;
  }
  if (state === 'BOARD') { if (tap('START1') || tap('START2') || tap('P1_1')) hideBoard(), state = 'MENU', showMenu(true); return; }
  if (state === 'NAME') {
    const code = name[ni].charCodeAt(0);
    if (tap('P1_U')) name[ni] = String.fromCharCode(code === 90 ? 65 : code + 1), snd('zap', .4, 1.2);
    if (tap('P1_D')) name[ni] = String.fromCharCode(code === 65 ? 90 : code - 1), snd('zap', .4, .85);
    if (tap('P1_1')) {
      ni++; snd('cash', .6, 1.4);
      if (ni > 2) { scores.push({ name: name.join(''), score, wave }); scores.sort((a, b) => b.score - a.score); scores = scores.slice(0, 5); store().set('neon-heist-scores', scores); board(); }
    }
    ui.nameChars.forEach((c, i) => { c.setText(name[i]).setColor(i === ni ? '#22ff88' : '#fff'); fx.lineStyle(i === ni ? 3 : 1, i === ni ? GREEN : 0x224466, .9); fx.strokeRect(292 + i * 80, 248, 56, 76); });
    return;
  }

  cashCd -= delta; bonus -= delta; if (filter && ac) filter.frequency.setValueAtTime(players.some(p => p.hp > 0 && p.hp / p.max <= .25) ? 480 : 18000, ac.currentTime);
  if (tap('START1') || tap('START2')) cashout();
  if (stash > 0) { heat = MN(99, heat + delta * .0015 * DS[dif]); if (stash > 2500) fx.fillStyle(0xffea00, .025 + .025 * S(time / 90)), fx.fillRect(0, 0, W, H); }

  players.forEach(p => {
    if (p.hp <= 0) return p.sprite.setVisible(false), p.sprite.body.setVelocity(0, 0);
    p.inv -= delta; p.slash -= delta; p.cd -= delta; p.dash -= delta; p.dashCd -= delta;
    const pid = p.id.toUpperCase(); let dx = 0, dy = 0;
    if (input.held[pid + '_L']) dx--; if (input.held[pid + '_R']) dx++; if (input.held[pid + '_U']) dy--; if (input.held[pid + '_D']) dy++;
    if (dx || dy) p.dx = dx, p.dy = dy, p.sprite.setRotation(Math.atan2(dy, dx));
    if (p.dash > 0) p.sprite.body.setVelocity(p.vx, p.vy); else {
      let sp = 260 + MN(mult * 8, 80) + (bonus > 0 ? 35 : 0); if (dx && dy) sp *= .707; p.sprite.body.setVelocity(dx * sp, dy * sp);
      if (tap(pid + '_2') && p.dashCd <= 0) { const l = SQ(p.dx * p.dx + p.dy * p.dy) || 1; p.dash = 210; p.dashCd = 780; p.vx = p.dx / l * 760; p.vy = p.dy / l * 760; snd('slash', .55, 2); }
    }
    if (tap(pid + '_1') && p.cd <= 0 && p.dash <= 0) p.slash = 155, p.cd = 290, snd('slash', .8, 1 + mult * .02);
    if (p.dash > 0) {
      const e = scene.add.image(p.sprite.x, p.sprite.y, p.id).setAlpha(.35).setRotation(p.sprite.rotation).setTint(p.color); scene.tweens.add({ targets: e, alpha: 0, duration: 260, onComplete: () => e.destroy() });
      enemies.getChildren().forEach(en => { if (!en.mark && Phaser.Geom.Intersects.RectangleToRectangle(p.sprite.getBounds(), en.getBounds())) en.mark = p.id, en.setTint(GOLD), boost(.07), loot(35, 'DASH TAG', en.x, en.y); });
    }
    if (p.slash > 0) {
      const a = p.sprite.rotation, rr = 58; fx.lineStyle(6, p.color, 1); fx.beginPath(); fx.arc(p.sprite.x, p.sprite.y, rr, a - 1.15, a + 1.15); fx.strokePath();
      const hit = new Phaser.Geom.Circle(p.sprite.x + C(a) * rr * .55, p.sprite.y + S(a) * rr * .55, rr * .82);
      enemies.getChildren().forEach(en => {
        if (en.hit || !Phaser.Geom.Intersects.CircleToRectangle(hit, en.getBounds())) return;
        en.hit = 120; en.hp--; en.setTint(0xffffff); stop = 28; scene.physics.pause(); scene.cameras.main.shake(60, .006);
        if (en.hp <= 0) kill(en, p); else snd('hit', .7, 1.1);
      });
      bullets.getChildren().forEach(b => {
        if (b.owner !== 'enemy' || !Phaser.Geom.Intersects.CircleToRectangle(hit, b.getBounds())) return;
        b.owner = p.id; b.setTint(p.color); b.ang = a; b.base = 760; boost(.2); loot(70, 'PARRY', b.x, b.y); snd('zap', .8, 1.5); stop = 18; scene.physics.pause();
      });
      if (boss && !boss.hit && Phaser.Geom.Intersects.CircleToRectangle(hit, boss.getBounds())) {
        boss.hp--; boss.hit = 110; boss.setTint(0xffffff); loot(90, 'VAULT CUT', boss.x, boss.y); boost(.12); snd('hit', 1, .85); if (boss.hp <= 0) defeatBoss();
      }
    }
    fx.fillStyle(0x12030a, .8); fx.fillRect(p.sprite.x - 18, p.sprite.y + 25, 36, 4); fx.fillStyle(p.color, p.inv > 0 && F(time / 80) % 2 ? .35 : .95); fx.fillRect(p.sprite.x - 18, p.sprite.y + 25, 36 * p.hp / p.max, 4);
  });

  if (left > 0) { spawn -= delta; if (spawn <= 0) spawnEnemy(), left--, spawn = MX(170, (720 - wave * 35 - heat * 4) / DS[dif]); }
  else if (!boss && enemies.countActive() === 0) nextWave();
  sparks.getChildren().forEach(s => { s.life -= delta / 1000; s.alpha = s.life; if (s.life <= 0) s.destroy(); });
  cores.getChildren().forEach(c => {
    players.forEach(p => { if (p.hp > 0 && Phaser.Geom.Intersects.RectangleToRectangle(c.getBounds(), p.sprite.getBounds())) loot(c.val || 60, 'LOOT CORE', c.x, c.y), boost(.1), snd('zap', .5, 1.8), c.destroy(); });
  });

  const alive = players.filter(p => p.hp > 0), target = alive[F(R() * alive.length)];
  enemies.getChildren().forEach(e => {
    e.hit -= delta; if (e.hit <= 0) e.clearTint(); if (!target) return;
    const a = Math.atan2(target.sprite.y - e.y, target.sprite.x - e.x), d = Phaser.Math.Distance.Between(e.x, e.y, target.sprite.x, target.sprite.y); e.setRotation(a);
    if (e.type === 'gunner' && d < 285) { e.body.setVelocity(0, 0); e.t -= delta; if (e.t <= 0) e.t = MX(470, (1500 - wave * 45 - heat * 5) / DS[dif]), bullet(e.x, e.y, a, (320 + heat * 2) * DS[dif]), snd('zap', .45, .75); }
    else { const sp = ((e.type === 'mine' ? 245 : 130) + wave * 4 + heat * 1.3) * DS[dif]; e.body.setVelocity(C(a) * sp, S(a) * sp); }
    alive.forEach(p => { if (Phaser.Geom.Intersects.RectangleToRectangle(e.getBounds(), p.sprite.getBounds())) e.type === 'mine' ? (boom(e.x, e.y, RED, 28), e.destroy(), burn(p, 1)) : burn(p, 1); });
  });
  if (mode === 2 && alive.length === 2) {
    const a = alive[0].sprite, b = alive[1].sprite, d = Phaser.Math.Distance.Between(a.x, a.y, b.x, b.y);
    if (d < 315) {
      fx.lineStyle(5, GREEN, .36); fx.beginPath(); fx.moveTo(a.x, a.y); fx.lineTo(b.x, b.y); fx.strokePath(); const line = new Phaser.Geom.Line(a.x, a.y, b.x, b.y);
      enemies.getChildren().forEach(e => { e.beam = (e.beam || 0) - delta; if (e.beam <= 0 && Phaser.Geom.Intersects.LineToRectangle(line, e.getBounds())) { e.beam = 220; e.hp -= .55; if (e.hp <= 0) kill(e, alive[0], true); } });
    }
  }
  bullets.getChildren().forEach(b => {
    if (b.x < -45 || b.x > W + 45 || b.y < -45 || b.y > H + 45) return b.destroy();
    b.body.setVelocity(C(b.ang) * b.base, S(b.ang) * b.base);
    if (b.owner === 'enemy') alive.forEach(p => { if (Phaser.Geom.Intersects.RectangleToRectangle(b.getBounds(), p.sprite.getBounds())) b.destroy(), burn(p, 1); });
    else enemies.getChildren().forEach(e => { if (Phaser.Geom.Intersects.RectangleToRectangle(b.getBounds(), e.getBounds())) b.destroy(), e.hp -= 2, e.hp <= 0 && kill(e, players.find(p => p.id === b.owner) || players[0]); });
  });
  if (boss) {
    boss.hit -= delta; if (boss.hit <= 0) boss.clearTint(); if (bossBar) { bossBar.clear(); bossBar.fillStyle(0x14010a, .8); bossBar.fillRect(250, 58, 300, 11); bossBar.fillStyle(RED, 1); bossBar.fillRect(250, 58, 300 * boss.hp / boss.max, 11); }
    if (target) {
      const a = Math.atan2(target.sprite.y - boss.y, target.sprite.x - boss.x); boss.setRotation(a); boss.t -= delta;
      if (boss.t <= 0) { boss.pat = (boss.pat + 1) % 3; boss.t = (boss.pat === 2 ? 2100 : 1250) / DS[dif]; for (let i = 0; i < (boss.pat === 1 ? 9 + dif : 3); i++) bullet(boss.x, boss.y, boss.pat === 1 ? a + i * P * 2 / (9 + dif) : a + (i - 1) * .28, (boss.pat === 1 ? 275 : 420) * DS[dif]); snd('zap', .7, .7); }
    }
  }
  if (!players.some(p => p.hp > 0) && players.length) gameOver();
}

function defeatBoss() {
  const x = boss.x, y = boss.y; boss.destroy(); boss = null; if (bossBar) bossBar.clear();
  loot(2600 + wave * 200, 'JACKPOT VAULT', x, y); heat = MN(99, heat + 12); boom(x, y, RED, 70); snd('cash', 1.2, .75); scene.cameras.main.flash(180, 255, 0, 85); pop(x, y - 55, 'BANK IT OR LOSE IT!', '#ffea00', 1.25);
}
