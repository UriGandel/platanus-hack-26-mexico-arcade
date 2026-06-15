const W = 800,
  H = 600,
  R = Math.random,
  F = Math.floor,
  S = Math.sin,
  C = Math.cos,
  P = Math.PI,
  SQ = Math.sqrt,
  MN = Math.min,
  MX = Math.max,
  AB = Math.abs;

// CABINET_KEYS maps physical cabinet controls. DO NOT change existing mappings.
const CABINET_KEYS = {
  P1_U: ["w"],
  P1_D: ["s"],
  P1_L: ["a"],
  P1_R: ["d"],
  P1_1: ["u"],
  P1_2: ["i"],
  P1_3: ["o"],
  P1_4: ["j"],
  P1_5: ["k"],
  P1_6: ["l"],
  P2_U: ["ArrowUp"],
  P2_D: ["ArrowDown"],
  P2_L: ["ArrowLeft"],
  P2_R: ["ArrowRight"],
  P2_1: ["r"],
  P2_2: ["t"],
  P2_3: ["y"],
  P2_4: ["f"],
  P2_5: ["g"],
  P2_6: ["h"],
  START1: ["Enter"],
  START2: ["2"],
};

const K = {},
  input = { held: {}, pressed: {} };
for (const [code, keys] of Object.entries(CABINET_KEYS))
  for (const key of keys) K[key.length === 1 ? key.toLowerCase() : key] = code;
addEventListener("keydown", (e) => {
  const k = e.key.length === 1 ? e.key.toLowerCase() : e.key,
    c = K[k];
  if (c && !input.held[c]) input.held[c] = input.pressed[c] = true;
});
addEventListener("keyup", (e) => {
  const k = e.key.length === 1 ? e.key.toLowerCase() : e.key,
    c = K[k];
  if (c) input.held[c] = false;
});
function tap(c) {
  if (input.pressed[c]) return ((input.pressed[c] = false), true);
  return false;
}
function store() {
  return (
    window.platanusArcadeStorage || {
      async get(k) {
        try {
          const v = localStorage.getItem(k);
          return v ? { found: true, value: JSON.parse(v) } : { found: false };
        } catch {
          return { found: false };
        }
      },
      async set(k, v) {
        localStorage.setItem(k, JSON.stringify(v));
      },
    }
  );
}

let scene,
  state = "MENU",
  g,
  fx,
  ui = {},
  players = [],
  enemies,
  bullets,
  cores,
  powerups,
  sparks;
let score = 0,
  stash = 0,
  mult = 1,
  heat = 0,
  wave = 1,
  spawn = 0,
  left = 0,
  stop = 0,
  grid = 0,
  mode = 1,
  menu = 0,
  tut = 1,
  dif = 1,
  boss = null,
  bossBar = null;
let scores = [],
  name = ["A", "A", "A"],
  ni = 0,
  stars = [],
  cashCd = 0,
  bonus = 0,
  extract = 0,
  bestHeist = 0,
  lastCash = 0,
  heist = 0,
  freeze = 0,
  fever = 0,
  hackZone = null,
  hackT = 15000,
  hackP = 0;
let combo = 0,
  comboT = 0,
  bestCombo = 0,
  shopT = 0,
  shopLock = 0,
  shopI = 0,
  shop = [],
  up = {},
  evt = 0,
  evtT = 0,
  evtCd = 0,
  evtUsed = 0,
  evtAt = 0,
  bounty = null,
  flawless = 1,
  parry = 0,
  greedTier = 0,
  chal = 0,
  chalDone = 0,
  maxGreed = 0,
  runCash = 0,
  hi = 0,
  hiBeat = 0,
  taughtCash = 0,
  milestone = 0,
  contract = 0;
let ac,
  gain,
  filter,
  sounds = {},
  beat,
  cdSec = 0,
  step = 0,
  next = 0;
const COL = [0x00f3ff, 0xff00b3],
  RED = 0xff2555,
  GREEN = 0x22ff88,
  GOLD = 0xffea00;
const DN = ["CHILL", "NORMAL", "HARD", "NIGHTMARE"],
  DS = [0.75, 1, 1.25, 1.55],
  DH = [6, 5, 4, 3],
  DP = [0.85, 1, 1.25, 1.6],
  DB = [0.3, 0.45, 0.55, 0.68];
const UP = [
  ["TAJO AMPLIO", 650, "SLASH MÁS GRANDE"],
  ["CASCO EXTRA", 800, "+1 VIDA MÁXIMA"],
  ["EXTRACCIÓN PRO", 700, "COBRÁS MÁS RÁPIDO"],
  ["IMÁN CODICIA", 750, "CORES VAN A VOS"],
  ["SEGURO VAULT", 550, "PERDÉS MENOS LOOT"],
  ["SOBRECARGA", 680, "BOOST AL INICIO"],
  ["PARRY REBOTE", 620, "BALAS BUSCAN BLANCO"],
];
const EV = ["", "LLUVIA DE NÚCLEOS", "DOBLE BOTÍN", "BLANCO DE RECOMPENSA"];
const CH = ["COMBO x10", "PARRY x5", "CASHOUT 5K", "OLA SIN DAÑO"];
// [nombre, lootMul, enemySpeedMul, greedMul, hpDelta]
const CT = [
  ["LIBRE", 1, 1, 1, 0],
  ["RUSH: +RÁPIDOS, +25% LOOT", 1.25, 1.28, 1, 0],
  ["AVARO: GREED SUBE x2", 1.15, 1, 2, 0],
  ["KAMIKAZE: -1 HP MÁX, +45% LOOT", 1.45, 1.08, 1, -1],
];

new Phaser.Game({
  type: Phaser.AUTO,
  width: W,
  height: H,
  parent: "game-root",
  backgroundColor: "#020308",
  antialias: true,
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  physics: { default: "arcade", arcade: { gravity: { y: 0 }, debug: false } },
  scene: { create, update },
});

function tex(n, w, h, fn) {
  const c = document.createElement("canvas"),
    x = c.getContext("2d");
  c.width = w;
  c.height = h;
  x.shadowBlur = 7;
  fn(x, w, h);
  scene.textures.addCanvas(n, c);
}
function makeTex() {
  function ship(n, c) {
    tex(n, 34, 34, (x, w, h) => {
      x.shadowColor = c;
      x.fillStyle = "#06111b";
      x.strokeStyle = c;
      x.lineWidth = 3;
      x.beginPath();
      x.moveTo(w - 4, h / 2);
      x.lineTo(5, h - 6);
      x.lineTo(11, h / 2);
      x.lineTo(5, 6);
      x.closePath();
      x.fill();
      x.stroke();
      x.fillStyle = "#fff";
      x.beginPath();
      x.arc(17, 17, 4, 0, P * 2);
      x.fill();
    });
  }
  ship("p1", "#00f3ff");
  ship("p2", "#ff00b3");
  tex("runner", 24, 24, (x, w, h) => {
    x.shadowColor = "#ff2555";
    x.strokeStyle = "#ff2555";
    x.fillStyle = "#1b0208";
    x.lineWidth = 2;
    x.beginPath();
    x.moveTo(w - 2, h / 2);
    x.lineTo(w / 2, h - 2);
    x.lineTo(3, h / 2);
    x.lineTo(w / 2, 2);
    x.closePath();
    x.fill();
    x.stroke();
  });
  tex("gunner", 28, 28, (x, w, h) => {
    x.shadowColor = "#ff8a00";
    x.strokeStyle = "#ff8a00";
    x.fillStyle = "#1b0901";
    x.lineWidth = 2;
    x.beginPath();
    for (let i = 0; i < 8; i++) {
      const a = (i * P) / 4,
        xx = w / 2 + C(a) * 11,
        yy = h / 2 + S(a) * 11;
      i ? x.lineTo(xx, yy) : x.moveTo(xx, yy);
    }
    x.closePath();
    x.fill();
    x.stroke();
    x.strokeStyle = "#fff";
    x.beginPath();
    x.arc(w / 2, h / 2, 4, 0, P * 2);
    x.stroke();
  });
  tex("splitter", 28, 28, (x, w, h) => {
    x.shadowColor = "#aa66ff";
    x.strokeStyle = "#aa66ff";
    x.fillStyle = "#12081f";
    x.lineWidth = 2;
    x.beginPath();
    x.moveTo(w / 2, 2);
    x.lineTo(w - 3, h / 2);
    x.lineTo(w / 2, h - 3);
    x.lineTo(3, h / 2);
    x.closePath();
    x.fill();
    x.stroke();
    x.strokeStyle = "#fff";
    x.beginPath();
    x.moveTo(8, 8);
    x.lineTo(20, 20);
    x.moveTo(20, 8);
    x.lineTo(8, 20);
    x.stroke();
  });
  tex("mine", 24, 24, (x, w, h) => {
    x.shadowColor = "#ff0055";
    x.strokeStyle = "#ff0055";
    x.fillStyle = "#21020a";
    x.lineWidth = 2;
    x.beginPath();
    for (let i = 0; i < 12; i++) {
      const a = (i * P) / 6,
        d = i % 2 ? 6 : 11,
        xx = w / 2 + C(a) * d,
        yy = h / 2 + S(a) * d;
      i ? x.lineTo(xx, yy) : x.moveTo(xx, yy);
    }
    x.closePath();
    x.fill();
    x.stroke();
  });
  tex("thief", 20, 20, (x, w, h) => {
    x.shadowColor = "#ffea00";
    x.strokeStyle = "#ffea00";
    x.fillStyle = "#1b1a02";
    x.lineWidth = 2;
    x.beginPath();
    x.moveTo(w / 2, 2);
    x.lineTo(w - 2, h - 2);
    x.lineTo(2, h - 2);
    x.closePath();
    x.fill();
    x.stroke();
  });
  tex("core", 18, 18, (x, w, h) => {
    x.shadowColor = "#22ff88";
    x.strokeStyle = "#22ff88";
    x.fillStyle = "#042012";
    x.lineWidth = 2;
    x.beginPath();
    x.moveTo(w / 2, 2);
    x.lineTo(w - 2, h / 2);
    x.lineTo(w / 2, h - 2);
    x.lineTo(2, h / 2);
    x.closePath();
    x.fill();
    x.stroke();
  });
  tex("mega", 38, 38, (x, w, h) => {
    x.shadowColor = "#ffea00";
    x.strokeStyle = "#ffea00";
    x.fillStyle = "#201a00";
    x.lineWidth = 4;
    x.beginPath();
    x.moveTo(w / 2, 2);
    x.lineTo(w - 3, h / 2);
    x.lineTo(w / 2, h - 3);
    x.lineTo(3, h / 2);
    x.closePath();
    x.fill();
    x.stroke();
    x.strokeStyle = "#fff";
    x.lineWidth = 2;
    x.beginPath();
    x.arc(w / 2, h / 2, 8, 0, P * 2);
    x.stroke();
  });
  tex("pwr", 26, 26, (x, w, h) => {
    x.shadowColor = "#fff";
    x.strokeStyle = "#fff";
    x.fillStyle = "#07101a";
    x.lineWidth = 2;
    x.beginPath();
    x.arc(w / 2, h / 2, 10, 0, P * 2);
    x.fill();
    x.stroke();
    x.fillStyle = "#fff";
    x.fillRect(11, 5, 4, 16);
    x.fillRect(5, 11, 16, 4);
  });
  tex("bullet", 14, 6, (x, w, h) => {
    x.shadowColor = "#ffea00";
    x.fillStyle = "#fff";
    x.beginPath();
    x.ellipse(w / 2, h / 2, 6, 2.5, 0, 0, P * 2);
    x.fill();
  });
  tex("boss", 84, 84, (x, w, h) => {
    x.shadowColor = "#ff0055";
    x.strokeStyle = "#ff0055";
    x.fillStyle = "#14010a";
    x.lineWidth = 4;
    x.beginPath();
    for (let i = 0; i < 10; i++) {
      const a = (i * P) / 5,
        d = i % 2 ? 28 : 38,
        xx = w / 2 + C(a) * d,
        yy = h / 2 + S(a) * d;
      i ? x.lineTo(xx, yy) : x.moveTo(xx, yy);
    }
    x.closePath();
    x.fill();
    x.stroke();
    x.shadowColor = "#00f3ff";
    x.strokeStyle = "#00f3ff";
    x.lineWidth = 3;
    x.beginPath();
    x.arc(w / 2, h / 2, 22, 0, P * 2);
    x.stroke();
    x.fillStyle = "#fff";
    x.beginPath();
    x.arc(w / 2, h / 2, 8, 0, P * 2);
    x.fill();
  });
}

function initAudio() {
  ac = scene.sound.context;
  if (!ac) return;
  gain = ac.createGain();
  filter = ac.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 18000;
  gain.gain.value = 0.28;
  filter.connect(gain);
  gain.connect(ac.destination);
  const sr = ac.sampleRate;
  function buf(n, len, fn) {
    const b = ac.createBuffer(1, F(sr * len), sr),
      d = b.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = fn(i / sr, i / d.length);
    sounds[n] = b;
  }
  buf(
    "hit",
    0.28,
    (t, p) =>
      (S(2 * P * (130 - t * 260) * t) * 0.35 + (R() * 2 - 1) * 0.5) * (1 - p),
  );
  buf("zap", 0.14, (t, p) => S(2 * P * (650 + t * 4200) * t) * (1 - p) * 0.35);
  buf(
    "slash",
    0.12,
    (t, p) =>
      (S(2 * P * (1300 - t * 3600) * t) + (R() * 2 - 1) * 0.2) * (1 - p) * 0.35,
  );
  buf(
    "cash",
    0.45,
    (t, p) =>
      (S(2 * P * 220 * t) +
        S(2 * P * 440 * t) * 0.5 +
        S(2 * P * 660 * t) * 0.3) *
      (1 - p) *
      0.28,
  );
  buf(
    "jack",
    0.65,
    (t, p) =>
      (S(2 * P * (180 + t * 900) * t) + S(2 * P * (360 + t * 1500) * t) * 0.6) *
      (1 - p) *
      0.34,
  );
}
function snd(n, v = 1, p = 1) {
  if (!ac || !sounds[n]) return;
  try {
    const s = ac.createBufferSource(),
      g2 = ac.createGain();
    s.buffer = sounds[n];
    s.playbackRate.value = p;
    g2.gain.value = v;
    s.connect(g2);
    g2.connect(filter);
    s.start();
  } catch {}
}
function music(on) {
  if (!ac) return;
  if (beat) (clearInterval(beat), (beat = null));
  if (!on) return;
  if (ac.state === "suspended") ac.resume();
  next = ac.currentTime;
  step = 0;
  beat = setInterval(() => {
    while (next < ac.currentTime + 0.08) {
      const hype = heat / 100 + greed() / 140 + (extract > 0 ? 0.45 : 0) + (fever ? 0.5 : 0) + (boss && boss.p2 ? 0.6 : 0),
        f = [55, 65.4, 73.4, 82.4][step % 4] * (1 + heat / 110);
      try {
        const o = ac.createOscillator(),
          g2 = ac.createGain();
        o.type = step % 2 ? "square" : "sawtooth";
        o.frequency.setValueAtTime(f, next);
        o.connect(g2);
        g2.connect(filter);
        g2.gain.setValueAtTime((step % 4 ? 0.05 : 0.16) + hype * 0.045, next);
        g2.gain.exponentialRampToValueAtTime(0.001, next + 0.12);
        o.start(next);
        o.stop(next + 0.14);
        if ((extract > 0 || greed() > 55) && step % 8 === 0) {
          const b = ac.createOscillator(),
            bg = ac.createGain();
          b.type = "triangle";
          b.frequency.setValueAtTime(f / 2, next);
          b.connect(bg);
          bg.connect(filter);
          bg.gain.setValueAtTime(0.22, next);
          bg.gain.exponentialRampToValueAtTime(0.001, next + 0.2);
          b.start(next);
          b.stop(next + 0.22);
        }
      } catch {}
      next += MX(0.078, 0.13 - hype * 0.024);
      step++;
    }
  }, 25);
}

function create() {
  scene = this;
  makeTex();
  initAudio();
  g = this.add.graphics();
  fx = this.add.graphics().setDepth(20);
  enemies = this.physics.add.group();
  bullets = this.physics.add.group();
  cores = this.physics.add.group();
  powerups = this.physics.add.group();
  sparks = this.add.group();
  for (let i = 0; i < 36; i++)
    stars.push({
      x: R() * W,
      y: R() * H,
      v: 18 + R() * 55,
      a: 0.12 + R() * 0.4,
      s: 1 + R() * 2,
    });
  store()
    .get("neon-heist-scores")
    .then((r) => {
      if (r.found && Array.isArray(r.value))
        scores = r.value
          .filter((x) => x && typeof x.score === "number")
          .map((x) => ({
            name: (x.name || "AAA").slice(0, 3),
            score: x.score,
            wave: x.wave || 0,
            best: x.best || 0,
            combo: x.combo || 0,
          }))
          .slice(0, 5);
    });

  ui.title = this.add
    .text(W / 2, 78, "NEON HEIST", {
      font: "bold 68px Courier New",
      fill: "#00f3ff",
    })
    .setOrigin(0.5);
  ui.sub = this.add
    .text(W / 2, 136, "CORE RUSH", {
      font: "bold 28px Courier New",
      fill: "#ff00b3",
    })
    .setOrigin(0.5);
  ui.opts = ["1 JUGADOR", "2 JUGADORES", "TABLA DE VAULTS"].map((t, i) =>
    this.add
      .text(W / 2, 226 + i * 42, t, {
        font: "bold 25px Courier New",
        fill: "#fff",
      })
      .setOrigin(0.5),
  );
  ui.diff = this.add
    .text(W / 2, 382, "", { font: "bold 21px Courier New", fill: "#ffea00" })
    .setOrigin(0.5);
  ui.how = this.add
    .text(
      W / 2,
      428,
      "LOOP: CORTÁ ENEMIGOS → JUNTÁ LOOT → START PARA DEPOSITAR EN BANK.\nLOOT SIN DEPOSITAR ESTÁ EN RIESGO. MÁS GREED = MÁS PREMIO + MÁS PELIGRO.\nP1 WASD  SLASH U  DASH I  START ENTER  |  P2 FLECHAS  SLASH R  DASH T  START 2",
      { font: "13px monospace", fill: "#b8d7ff", align: "center" },
    )
    .setOrigin(0.5);
  ui.help = this.add
    .text(
      W / 2,
      540,
      "MENÚ: ARRIBA/ABAJO MODO  |  IZQ/DER DIFICULTAD  |  START SELECCIONA",
      { font: "14px monospace", fill: "#88aadd", align: "center" },
    )
    .setOrigin(0.5);
  ui.bank = this.add
    .text(22, 14, "", { font: "bold 22px Courier New", fill: "#fff" })
    .setVisible(false);
  ui.rec = this.add
    .text(22, 40, "", { font: "bold 13px Courier New", fill: "#ffea00" })
    .setVisible(false);
  ui.loot = this.add
    .text(W - 22, 14, "", { font: "bold 22px Courier New", fill: "#22ff88" })
    .setOrigin(1, 0)
    .setVisible(false);
  ui.mid = this.add
    .text(W / 2, 10, "", {
      font: "bold 22px Courier New",
      fill: "#ffea00",
      align: "center",
    })
    .setOrigin(0.5, 0)
    .setVisible(false);
  ui.greed = this.add
    .text(W / 2, 44, "", {
      font: "bold 13px Courier New",
      fill: "#22ff88",
      align: "center",
    })
    .setOrigin(0.5)
    .setVisible(false);
  ui.tip = this.add
    .text(W / 2, H - 26, "", {
      font: "bold 13px Courier New",
      fill: "#b8d7ff",
      align: "center",
    })
    .setOrigin(0.5)
    .setVisible(false);
  ui.goal = this.add
    .text(W / 2, H - 50, "", {
      font: "bold 13px Courier New",
      fill: "#ffea00",
      align: "center",
    })
    .setOrigin(0.5)
    .setVisible(false);
  ui.alert = this.add
    .text(W / 2, H / 2, "", {
      font: "bold 44px Courier New",
      fill: "#ff0055",
      align: "center",
    })
    .setOrigin(0.5)
    .setVisible(false)
    .setDepth(50);
  ui.combo = this.add
    .text(W / 2, 90, "", {
      font: "bold 36px Courier New",
      fill: "#ffea00",
      align: "center",
    })
    .setOrigin(0.5)
    .setVisible(false)
    .setDepth(45);
  ui.shopTitle = this.add
    .text(W / 2, 118, "BONUS SHOP - PICK RÁPIDO", {
      font: "bold 34px Courier New",
      fill: "#ff00b3",
    })
    .setOrigin(0.5)
    .setVisible(false)
    .setDepth(55);
  ui.shopHelp = this.add
    .text(W / 2, 470, "", {
      font: "bold 16px Courier New",
      fill: "#88aadd",
      align: "center",
    })
    .setOrigin(0.5)
    .setVisible(false)
    .setDepth(55);
  ui.cards = [0, 1, 2].map((i) =>
    this.add
      .text(174 + i * 226, 282, "", {
        font: "bold 18px Courier New",
        fill: "#fff",
        align: "center",
      })
      .setOrigin(0.5)
      .setVisible(false)
      .setDepth(55),
  );
  ui.tutTitle = this.add
    .text(W / 2, 96, "GUÍA RÁPIDA", {
      font: "bold 42px Courier New",
      fill: "#00f3ff",
    })
    .setOrigin(0.5)
    .setVisible(false)
    .setDepth(55);
  ui.tutBody = this.add
    .text(
      W / 2,
      284,
      "CORTÁ ENEMIGOS\nJUNTÁ LOOT\nSTART PARA DEPOSITAR EN BANK\nMÁS GREED = MÁS PREMIO + MÁS PELIGRO\n2P: REVIVÍ ACERCÁNDOTE",
      {
        font: "bold 22px Courier New",
        fill: "#fff",
        align: "center",
        lineSpacing: 14,
      },
    )
    .setOrigin(0.5)
    .setVisible(false)
    .setDepth(55);
  ui.tutHelp = this.add
    .text(W / 2, 500, "BUTTON 1 O START: EMPEZAR HEIST", {
      font: "bold 20px Courier New",
      fill: "#ffea00",
      align: "center",
    })
    .setOrigin(0.5)
    .setVisible(false)
    .setDepth(55);
  ui.nameTitle = this.add
    .text(W / 2, 108, "REGISTRAR ROBO", {
      font: "bold 38px Courier New",
      fill: "#00f3ff",
    })
    .setOrigin(0.5)
    .setVisible(false);
  ui.nameHelp = this.add
    .text(W / 2, 168, "ARRIBA/ABAJO CAMBIA LETRA  |  BOTÓN 1 CONFIRMA", {
      font: "16px monospace",
      fill: "#88aadd",
    })
    .setOrigin(0.5)
    .setVisible(false);
  ui.nameChars = [0, 1, 2].map((i) =>
    this.add
      .text(320 + i * 80, 284, "A", {
        font: "bold 52px Courier New",
        fill: "#fff",
      })
      .setOrigin(0.5)
      .setVisible(false),
  );
  ui.retry = this.add
    .text(W / 2, 416, "", {
      font: "bold 24px Courier New",
      fill: "#22ff88",
      align: "center",
    })
    .setOrigin(0.5)
    .setVisible(false)
    .setDepth(55);
  ui.boardTitle = this.add
    .text(W / 2, 116, "TABLA DE VAULTS", {
      font: "bold 34px Courier New",
      fill: "#ff00b3",
    })
    .setOrigin(0.5)
    .setVisible(false);
  ui.boardHead = this.add
    .text(W / 2, 194, "RANK NOMB   BANK   WAVE MÁXIMO CMB", {
      font: "bold 17px Courier New",
      fill: "#00f3ff",
    })
    .setOrigin(0.5)
    .setVisible(false);
  ui.lines = [0, 1, 2, 3, 4].map((i) =>
    this.add
      .text(W / 2, 244 + i * 37, "", {
        font: "bold 17px Courier New",
        fill: "#88aadd",
      })
      .setOrigin(0.5)
      .setVisible(false),
  );
  ui.back = this.add
    .text(W / 2, 492, "PRESIONÁ START PARA VOLVER", {
      font: "bold 16px Courier New",
      fill: "#22ff88",
    })
    .setOrigin(0.5)
    .setVisible(false);

  this.tweens.add({
    targets: ui.title,
    scaleX: 1.04,
    scaleY: 1.04,
    duration: 1400,
    yoyo: true,
    repeat: -1,
  });
}

function showMenu(v) {
  [ui.title, ui.sub, ui.how, ui.help, ui.diff, ...ui.opts].forEach((o) =>
    o.setVisible(v),
  );
}
function hud(v) {
  [ui.bank, ui.rec, ui.loot, ui.mid, ui.tip, ui.goal].forEach((o) => o.setVisible(v));
  if (!v) ui.greed.setVisible(false);
}
function shopUi(v) {
  if (v) (ui.greed.setVisible(false), ui.combo.setVisible(false), ui.goal.setVisible(false), ui.tip.setVisible(false));
  [ui.shopTitle, ui.shopHelp, ...ui.cards].forEach((o) => o.setVisible(v));
}
function tutUi(v) {
  [ui.tutTitle, ui.tutBody, ui.tutHelp].forEach((o) => o.setVisible(v));
}
function clearRun() {
  enemies.clear(true, true);
  bullets.clear(true, true);
  cores.clear(true, true);
  powerups.clear(true, true);
  sparks.clear(true, true);
  shopUi(false);
  tutUi(false);
  ui.combo.setVisible(false);
  if (bossBar) bossBar.clear();
  if (boss) boss.destroy();
  boss = null;
  hackZone = null;
  hackT = 15000;
  hackP = 0;
  fever = 0;
  players.forEach((p) => {
    if (p.sprite) p.sprite.destroy();
    if (p.statusText) p.statusText.destroy();
  });
  players = [];
}
function startGame(n) {
  mode = n;
  state = "PLAY";
  showMenu(false);
  hud(true);
  clearRun();
  score = 0;
  stash = 0;
  mult = 1;
  heat = 0;
  wave = 0;
  bonus = 0;
  cashCd = 0;
  extract = 0;
  bestHeist = 0;
  lastCash = 0;
  heist = 0;
  freeze = 0;
  combo = 0;
  comboT = 0;
  bestCombo = 0;
  parry = 0;
  greedTier = 0;
  chal = 0;
  chalDone = 0;
  maxGreed = 0;
  runCash = 0;
  hi = scores[0] ? scores[0].score : 0;
  hiBeat = 0;
  taughtCash = 0;
  milestone = 5000;
  contract = F(R() * CT.length);
  fever = 0;
  hackZone = null;
  hackT = 15000;
  hackP = 0;
  up = {};
  evt = evtT = evtCd = evtUsed = evtAt = 0;
  bounty = null;
  addPlayer(W / 3, H / 2, "p1", 0);
  if (n === 2) addPlayer((W * 2) / 3, H / 2, "p2", 1);
  music(true);
  nextWave();
  if (contract) medal("CONTRATO · " + CT[contract][0], "#ff00b3");
}
function addPlayer(x, y, id, ix) {
  const p = {
    id,
    ix,
    color: COL[ix],
    sprite: scene.physics.add.sprite(x, y, id),
    hp: MX(1, DH[dif] + (dif < 2 ? 1 : 0) + CT[contract][4]),
    max: MX(1, DH[dif] + (dif < 2 ? 1 : 0) + CT[contract][4]),
    slash: 0,
    cd: 0,
    dash: 0,
    dashCd: 0,
    dx: 1,
    dy: 0,
    inv: 0,
    shield: 0,
    mag: 0,
    over: 0,
    rev: 0,
    statusText: scene.add.text(x, y - 32, "", { font: "bold 11px Courier New", fill: "#ffea00" }).setOrigin(0.5).setDepth(45),
  };
  p.sprite.body.setCollideWorldBounds(true);
  p.sprite.body.setDrag(1200);
  players.push(p);
}
function nextWave() {
  wave++;
  heist = MX(60000, 90000 - wave * 2500);
  extract = 0;
  flawless = 1;
  evt = 0;
  evtT = 0;
  evtCd = 0;
  evtUsed = 0;
  evtAt = 54000 + R() * 17000;
  chal = F(R() * CH.length);
  chalDone = 0;
  bounty = null;
  if (wave > 1) {
    bonus = 3500;
    players.forEach((p) => (p.hp = MN(p.max, p.hp + 1)));
    pop(W / 2, 130, "VAULT SURGE: ¡+HP, BONO CASH!", "#22ff88", 1.2);
  }
  if (up[5]) players.forEach((p) => (p.over = MX(p.over, 2000 + up[5] * 1200)));
  if (wave === 1) pop(W / 2, 118, "JUNTÁ LOOT Y DEPOSITÁ CON START", "#00f3ff", 1.05);
  if (wave === 2 || wave % 3 === 0) spawnMega();
  if (wave % 4 === 0) spawnBoss();
  else {
    const base = wave === 1 ? 6 : 7 + wave * 2 + F(heat / 10);
    left = F(base * DS[dif]);
    spawn = wave === 1 ? 360 : 250;
  }
  hudText();
}
function openShop() {
  if (flawless && chal === 3) goalDone();
  if (flawless) medal("¡OLA PERFECTA!", "#22ff88");
  bullets.clear(true, true);
  ui.greed.setVisible(false);
  ui.combo.setVisible(false);
  state = "SHOP";
  shopT = 2400;
  shopLock = 400;
  shopI = 0;
  ["P1_1", "P2_1", "START1", "START2", "P1_L", "P1_R", "P2_L", "P2_R"].forEach((k) => (input.pressed[k] = false));
  shop = [];
  while (shop.length < 3) {
    const k = F(R() * UP.length);
    if (!shop.includes(k)) shop.push(k);
  }
  shopUi(true);
  hudText();
  snd("jack", 0.65, 1);
  scene.cameras.main.flash(130, 255, 0, 180);
}
function endWave() {
  if (flawless && chal === 3) goalDone();
  if (wave > 1 && wave % 3 === 0) openShop();
  else {
    if (flawless) pop(W / 2, 130, "PERFECTA: RITMO +BANK", "#22ff88", 1.05);
    score += flawless ? 250 + wave * 50 : 0;
    nextWave();
  }
}
function closeShop() {
  shopUi(false);
  state = "PLAY";
  nextWave();
}
function buyShop() {
  const k = shop[shopI],
    cost = F(UP[k][1] * (1 + wave * 0.16));
  if (score < cost)
    return (
      pop(W / 2, 420, "FALTA BANK", "#ff2555", 1.15),
      snd("hit", 0.5, 0.8)
    );
  score -= cost;
  up[k] = (up[k] || 0) + 1;
  if (k === 1)
    players.forEach((p) => {
      p.max++;
      p.hp++;
    });
  if (k === 4) medal("SEGURO COMPRADO", "#00f3ff");
  const b = k === 0 || k === 6 ? "BUILD AGRESIVA" : k === 2 || k === 3 ? "BUILD GREED" : "BUILD TANQUE";
  pop(W / 2, 420, b + ": " + UP[k][0], "#22ff88", 1.08);
  snd("cash", 0.85, 1.25);
  closeShop();
}
function goalDone() {
  if (chalDone) return;
  chalDone = 1;
  const b = 600 + wave * 130;
  score += b;
  medal("OBJETIVO +" + b, "#ffea00");
  snd("cash", 0.9, 1.45);
  hudText();
}
function medal(t, c) {
  scene.tweens.killTweensOf(ui.alert);
  ui.alert.setText(t).setColor(c).setVisible(true).setAlpha(1).setScale(0.65);
  scene.tweens.add({
    targets: ui.alert,
    scaleX: 1.25,
    scaleY: 1.25,
    yoyo: true,
    duration: 190,
  });
  scene.tweens.add({
    targets: ui.alert,
    alpha: 0,
    delay: 850,
    duration: 520,
    onComplete: () => ui.alert.setVisible(false),
  });
  scene.cameras.main.flash(120, 255, 255, 255);
  scene.cameras.main.shake(130, 0.012);
  snd("jack", 0.9, 1.3);
}
function addCombo(x, y) {
  combo++;
  comboT = 1750;
  bestCombo = MX(bestCombo, combo);
  if (combo > 2) {
    const hot = combo >= 15;
    ui.combo
      .setText((hot ? "EN LLAMAS x" : "COMBO x") + combo + "!")
      .setColor(hot ? "#ff2555" : combo >= 8 ? "#ff8a00" : "#ffea00")
      .setVisible(true)
      .setScale(1 + MN(combo / 18, 0.8));
    if (combo % 5 === 0)
      (scene.cameras.main.flash(90, 255, hot ? 60 : 234, 0),
        pop(x, y - 40, (hot ? "EN LLAMAS x" : "COMBO x") + combo, hot ? "#ff2555" : "#ffea00", 1.45 + MN(combo / 40, 0.6)),
        snd("zap", 0.7, MN(1.2 + combo * 0.05, 2.7)));
    if (chal === 0 && combo >= 10) goalDone();
  }
}
function setBounty(e) {
  if (!e || !e.active || e.bounty) return;
  bounty = e;
  e.bounty = 1;
  e.val *= 10;
  e.setTint(GOLD);
  e.setScale(1.25);
  pop(e.x, e.y - 35, "¡RECOMPENSA 10x!", "#ffea00", 1.25);
}
function startEvent() {
  evtUsed = 1;
  evt = 1 + F(R() * 3);
  evtT = evt === 2 || evt === 3 ? 8000 : 5000;
  evtCd = 0;
  medal(EV[evt] + "!", evt === 2 ? "#22ff88" : "#ffea00");
  if (evt === 3)
    setBounty(enemies.getChildren()[F(R() * MX(1, enemies.countActive()))]);
}
function spawnEnemy() {
  const side = R() > .5, x = side ? -30 : W + 30, y = 50 + R() * (H - 100), pool = ['runner', 'runner', 'gunner', wave > 2 ? 'mine' : 'runner', wave > 3 ? 'splitter' : 'runner'];
  let type = pool[F(R() * pool.length)];
  if (R() < 0.08 && stash > 300 && !enemies.getChildren().some(e => e.type === 'thief')) type = 'thief';
  const e = scene.physics.add.sprite(x, y, type);
  const gr = greed(); e.type = type; e.hp = (type === 'gunner' || type === 'splitter' ? 2 + F(wave / 5) : 1 + F(wave / 6)) + F(dif / 2) + (gr > 75 ? 1 : 0); e.t = 350 + R() * 650; e.val = type === 'mine' ? 90 : type === 'gunner' ? 125 : type === 'splitter' ? 145 : type === 'thief' ? 180 : 105; enemies.add(e);
  if (type === 'splitter') e.setTint(0xaa66ff);
  if (type === 'thief') e.setTint(0xffea00);
  e.setAlpha(0.15);
  scene.tweens.add({ targets: e, alpha: 1, duration: 300 });
  pop(side ? 18 : W - 18, y, side ? "»" : "«", "#ff2555", 1.6);
  if (evt === 3 && !bounty) setBounty(e);
}
function spawnMega() {
  const c = scene.physics.add.sprite(
    W / 2 + (R() - 0.5) * 260,
    H / 2 + (R() - 0.5) * 180,
    "mega",
  );
  c.val = 900 + wave * 260;
  c.mega = 1;
  c.body.setDrag(80);
  cores.add(c);
  medal("¡JACKPOT!", "#ffea00");
  pop(c.x, c.y - 48, "MEGA CORE: COBRÁ CON START", "#ffea00", 1.25);
  snd("jack", 0.9, 0.85);
}
function spawnBoss() {
  boss = scene.physics.add.sprite(W / 2, -80, 'boss'); boss.hp = F((22 + wave * 4) * (.8 + dif * .25)); boss.max = boss.hp; boss.t = 1100 - dif * 120; boss.pat = 0;
  scene.tweens.add({ targets: boss, y: 150, duration: 1200, ease: 'Power2' });
  bossBar = scene.add.graphics().setDepth(30); medal('GUARDIÁN DEL VAULT', '#ff0055'); pop(W / 2, 220, 'PARRY Y SLASH PARA JACKPOT', '#ffea00', 1.1); snd('hit', 1, .45);
}
function greed() {
  return MN(
    100,
    F((stash / 140 + (mult - 1) * 9 + heat * 0.38 + (extract > 0 ? 25 : 0)) * CT[contract][3]),
  );
}
function loot(v, why, x = W / 2, y = H / 2) {
  const add = F(
    v *
      mult *
      (1 + greed() / 260) *
      (1 + MN(combo, 35) / 120) *
      (evt === 2 ? 2 : 1) *
      (fever ? 3 : 1) *
      CT[contract][1],
  );
  stash += add;
  heat = MN(99, heat + (2 + mult * 0.45) * DS[dif]);
  pop(
    x,
    y,
    "+" + add + " LOOT",
    evt === 2 ? "#ffea00" : "#22ff88",
    1.05 + MN((mult + combo / 3) / 14, 0.65),
  );
  hudText();
  if (why) pop(x, y - 22, why, "#ffea00", 0.82);
}
function boost(n = 0.25) {
  mult = MN(9.9, +(mult + n).toFixed(2));
  hudText();
}
function cashout() {
  if (stash <= 0 || cashCd > 0) return;
  if (!extract) {
    extract = MX(2100, 3000 - (up[2] || 0) * 300);
    cdSec = 99;
    heat = MN(99, heat + 12);
    pop(
      W / 2,
      H / 2 - 62,
      "EXTRACCIÓN: AGUANTÁ " + (extract / 1000).toFixed(1) + "s",
      "#ffea00",
      1.55,
    );
    snd("zap", 0.9, 0.55);
    hudText();
  }
}
function finishCashout() {
  const gr = greed(),
    take = F(stash * DP[dif] * (1 + gr / 180) * (bonus > 0 ? 1.25 : 1));
  score += take;
  runCash++;
  lastCash = take;
  bestHeist = MX(bestHeist, take);
  stash = 0;
  heat = MX(0, heat - 24);
  mult = MX(1, +(mult * 0.5).toFixed(2));
  cashCd = 1200;
  extract = 0;
  scene.cameras.main.flash(gr > 74 ? 260 : 180, 255, gr > 74 ? 220 : 34, gr > 74 ? 0 : 136);
  scene.cameras.main.shake(gr > 74 ? 260 : 160, gr > 74 ? 0.022 : 0.014);
  const cp = players.find((p) => p.hp > 0) || players[0],
    ex = cp ? cp.sprite.x : W / 2,
    ey = cp ? cp.sprite.y : H / 2;
  enemies.getChildren().forEach((en) => {
    if (!en.active) return;
    en.hp -= 2;
    en.hit = 120;
    en.setTint(0xffffff);
    const ea = Math.atan2(en.y - ey, en.x - ex);
    if (en.body) en.body.setVelocity(C(ea) * 540, S(ea) * 540);
    if (en.hp <= 0) kill(en, cp);
  });
  const ring = scene.add.graphics().setDepth(58);
  scene.tweens.addCounter({
    from: 0,
    to: 1,
    duration: 430,
    onUpdate: (tw) => {
      const v = tw.getValue();
      ring.clear();
      ring.lineStyle(9 * (1 - v), GREEN, 1 - v);
      ring.strokeCircle(ex, ey, v * 560);
    },
    onComplete: () => ring.destroy(),
  });
  boom(ex, ey, GREEN, 24);
  snd("cash", 1.2, 1 + MN(take / 9000, 0.9));
  if (gr > 80 || take > 12000) medal("¡BANK JACKPOT!", "#ffea00");
  if (gr > 74) pop(W / 2, H / 2 - 82, "GREED CASHOUT x" + (1 + gr / 180).toFixed(2), "#ffea00", 1.25);
  if (chal === 2 && take >= 5000) goalDone();
  pop(W / 2, H / 2 - 40, "BANK +" + take, gr > 74 ? "#ffea00" : "#22ff88", 1.8);
  hudText();
}
function burn(p, dmg) {
  if (p.inv > 0 || p.dash > 0) return;
  if (hackZone) hackP = 0;
  if (fever) dmg++;
  if (p.shield > 0) {
    p.shield = 0;
    p.inv = 650;
    pop(p.sprite.x, p.sprite.y - 26, "ESCUDO ROTO", "#00f3ff", 1.05);
    boom(p.sprite.x, p.sprite.y, p.color, 18);
    snd("zap", 0.8, 1.2);
    enemies.getChildren().forEach((en) => {
      const dist = Phaser.Math.Distance.Between(p.sprite.x, p.sprite.y, en.x, en.y);
      if (dist < 130) {
        en.hp -= 2;
        en.hit = 120;
        en.setTint(0xffffff);
        if (en.hp <= 0) kill(en, p);
        else {
          const ang = Math.atan2(en.y - p.sprite.y, en.x - p.sprite.x);
          en.body.setVelocity(C(ang) * 450, S(ang) * 450);
        }
      }
    });
    return;
  }
  p.hp -= dmg;
  p.inv = 900;
  scene.cameras.main.shake(140, 0.017);
  snd("hit", 1, 0.55);
  if (p.hp === 1) {
    pop(p.sprite.x, p.sprite.y - 44, "¡ÚLTIMO ALIENTO!", "#ff2555", 1.35);
    snd("zap", 0.6, 0.4);
    stop = MX(stop, 70);
    scene.physics.pause();
  }
  let lost = F(stash * MN(0.9, DB[dif] + (extract > 0 ? 0.28 : 0)));
  if (lost && up[4] > 0)
    ((lost = F(lost * 0.35)),
      up[4]--,
      pop(p.sprite.x, p.sprite.y - 50, "SEGURO", "#00f3ff", 1.05));
  stash -= lost;
  if (extract > 0)
    ((extract = 0),
      pop(W / 2, H / 2 - 78, "FALLÓ: LOOT EN RIESGO", "#ff2555", 1.45));
  combo = comboT = 0;
  flawless = 0;
  mult = 1;
  heat = MN(99, heat + 5 + dif * 2);
  pop(
    p.sprite.x,
    p.sprite.y - 26,
    lost ? "LOOT PERDIDO -" + lost : "-" + dmg + " HP",
    "#ff2555",
    1.1,
  );
  hudText();
  boom(p.sprite.x, p.sprite.y, RED, 18);
}
function hudText() {
  ui.bank.setText("BANK: $" + score);
  ui.loot.setText("LOOT: $" + stash);
  let midText = DN[dif] + "  •  OLA " + wave + "  •  MULT x" + mult.toFixed(2);
  if (combo > 1) midText += "  •  CMB x" + combo;
  if (extract > 0) midText = "¡EXTRACCIÓN! " + Math.ceil(extract / 1000) + "s   " + midText;
  ui.mid.setText(midText);
  if (!hiBeat && hi > 0 && score > hi) {
    hiBeat = 1;
    medal("¡NUEVO RÉCORD!", "#ffea00");
  }
  ui.rec
    .setText(hiBeat || hi <= 0 ? "¡RÉCORD! $" + score : "RÉCORD $" + hi)
    .setColor(hiBeat || hi <= 0 ? "#22ff88" : "#ffea00");
  if (milestone > 0 && score >= milestone) {
    pop(W / 2, 150, "HITO $" + milestone + " ¡SEGUÍ!", "#ffea00", 1.5);
    snd("cash", 0.8, 1.35);
    scene.cameras.main.flash(90, 255, 234, 0);
    milestone *= 2;
  }
  if (state === "PLAY")
    ui.goal.setText((chalDone ? "OBJETIVO COBRADO: " : "OBJETIVO: ") + CH[chal]).setVisible(true).setColor(chalDone ? "#22ff88" : "#ffea00");
}
function pop(x, y, t, c = "#fff", s = 1) {
  const a = scene.add
    .text(x, y, t, { font: "bold 20px Courier New", fill: c, align: "center" })
    .setOrigin(0.5)
    .setDepth(60);
  a.scale = s;
  scene.tweens.add({
    targets: a,
    y: y - 45,
    alpha: 0,
    duration: 800,
    onComplete: () => a.destroy(),
  });
}
function boom(x, y, c, n) {
  for (let i = 0; i < n; i++) {
    const r = scene.add.rectangle(x, y, 5, 5, c);
    scene.physics.add.existing(r);
    r.body.setVelocity((R() - 0.5) * 380, (R() - 0.5) * 380);
    r.body.setDrag(210);
    r.life = 0.7 + R() * 0.45;
    sparks.add(r);
  }
}
function bullet(x, y, a, sp, owner = "enemy") {
  const b = scene.physics.add.sprite(x, y, "bullet");
  b.owner = owner;
  b.base = sp;
  b.ang = a;
  b.setRotation(a);
  if (owner === "enemy") b.setTint(RED);
  b.body.setVelocity(C(a) * sp, S(a) * sp);
  bullets.add(b);
}
function dropPower(x, y) {
  if (R() > 0.16) return;
  const p = scene.physics.add.sprite(x, y, "pwr"),
    k = F(R() * 4),
    cs = [0x00f3ff, 0xff00b3, 0xffea00, 0x88ccff];
  p.k = k;
  p.life = 9000;
  p.setTint(cs[k]);
  p.body.setVelocity((R() - 0.5) * 150, (R() - 0.5) * 150);
  p.body.setDrag(120);
  powerups.add(p);
}
function takePower(p, u) {
  const t = ["SHIELD", "MAGNET", "OVERDRIVE", "FREEZE"][u.k];
  if (u.k === 0) p.shield = 1;
  else if (u.k === 1) p.mag = 7000;
  else if (u.k === 2) p.over = 7000;
  else freeze = 3600;
  pop(
    p.sprite.x,
    p.sprite.y - 34,
    t + "!",
    u.k === 2 ? "#ffea00" : "#00f3ff",
    1.12,
  );
  snd("jack", 0.55, 1.35);
  u.destroy();
  hudText();
}
function kill(e, p, beam) {
  addCombo(e.x, e.y);
  if (e.type === 'thief' && e.stolen) {
    loot(e.stolen * 3 + 100, "¡BOTÍN RECUPERADO x3!", e.x, e.y);
  }
  const v = F(e.val * (beam ? 0.55 : 1));
  loot(
    v,
    e.bounty ? "¡RECOMPENSA COBRADA!" : beam ? "ROBO ENLACE" : "NÚCLEO ROBADO",
    e.x,
    e.y,
  );
  boost(beam ? 0.08 : 0.18);
  if (R() < 0.45) {
    const c = scene.physics.add.sprite(e.x, e.y, "core");
    c.val = 60;
    c.body.setVelocity((R() - 0.5) * 170, (R() - 0.5) * 170);
    c.body.setDrag(100);
    cores.add(c);
  }
  dropPower(e.x, e.y);
  if (e.type === 'splitter' && !e.mini) for (let i = 0; i < 2; i++) { const m = scene.physics.add.sprite(e.x + (i ? 18 : -18), e.y, 'runner').setScale(.68).setTint(0xaa66ff); m.type = 'mini'; m.mini = 1; m.hp = 1; m.t = 500; m.val = 55; enemies.add(m); }
  boom(e.x, e.y, p.color, 12 + MN(combo, 12));
  snd("hit", 0.8, 1 + MN(combo / 30, 0.6));
  e.destroy();
}
function gameOver() {
  music(false);
  clearRun();
  hud(false);
  const cal = scores.length < 5 || score > (scores[scores.length - 1] ? scores[scores.length - 1].score : 0);
  if (!cal) return showOver();
  state = "NAME";
  name = ["A", "A", "A"];
  ni = 0;
  ui.nameTitle.setText("ROBO $" + score).setVisible(true);
  ui.nameHelp.setText("¡ENTRASTE AL TOP 5!  |  CASH " + runCash + "  |  TOP $" + bestHeist + "  |  CMB x" + bestCombo + "\nARRIBA/ABAJO LETRA  BOTÓN 1 CONFIRMA").setVisible(true);
  ui.nameChars.forEach((c, i) => c.setText(name[i]).setVisible(true));
}
function showOver() {
  state = "OVER";
  hud(false);
  [ui.nameHelp, ...ui.nameChars].forEach((o) => o.setVisible(false));
  const beat = score > hi && hi > 0,
    gap = hi - score,
    close = hi > 0 && !beat && gap <= MX(500, hi * 0.15);
  const rec = beat
    ? "¡NUEVO RÉCORD $" + score + "!"
    : close
      ? "TE FALTARON $" + gap + " PARA EL RÉCORD · ¡UNA MÁS!"
      : "RÉCORD $" + (hi || score);
  ui.nameTitle.setText("ROBO $" + score).setVisible(true).setColor("#00f3ff");
  ui.nameHelp
    .setText(rec + "\nMEJOR COBRO $" + bestHeist + "  ·  CMB x" + bestCombo + "  ·  GREED " + maxGreed + "%  ·  OLA " + wave)
    .setColor(beat ? "#ffea00" : close ? "#ff8a00" : "#88aadd")
    .setVisible(true);
  ui.retry.setText("START = REINTENTAR     BOTÓN 2 = MENÚ").setVisible(true);
}
function hideOver() {
  [ui.nameTitle, ui.nameHelp, ui.retry].forEach((o) => o.setVisible(false));
}
function board() {
  state = "BOARD";
  showMenu(false);
  hud(false);
  [ui.nameTitle, ui.nameHelp, ...ui.nameChars].forEach((o) =>
    o.setVisible(false),
  );
  ui.boardTitle.setVisible(true);
  ui.boardHead.setVisible(true);
  ui.back.setVisible(true);
  for (let i = 0; i < 5; i++) {
    const s = scores[i],
      t = s
        ? `${i + 1}    ${s.name.padEnd(3)} ${(s.score + "").padStart(7)}  ${("" + s.wave).padStart(2)} ${((s.best || 0) + "").padStart(7)} ${((s.combo || 0) + "").padStart(3)}`
        : `${i + 1}    --- 0000000  00 0000000 000`;
    ui.lines[i]
      .setText(t)
      .setColor(["#00f3ff", "#ff00b3", "#ffea00", "#88aadd", "#88aadd"][i])
      .setVisible(true);
  }
}
function hideBoard() {
  [ui.boardTitle, ui.boardHead, ui.back, ...ui.lines].forEach((o) =>
    o.setVisible(false),
  );
}

function update(time, delta) {
  Object.keys(input.pressed).forEach((k) => {
    if (!input.held[k]) input.pressed[k] = false;
  });
  grid = (grid + delta * (0.06 + heat / 1600)) % 40;
  g.clear();
  g.lineStyle(1.3, fever ? 0xff00b3 : 0x081024, fever ? 0.18 : 0.42);
  for (let x = 0; x < W; x += 40) {
    g.moveTo(x, 0);
    g.lineTo(x, H);
  }
  for (let y = -40; y < H; y += 40) {
    g.moveTo(0, y + grid);
    g.lineTo(W, y + grid);
  }
  g.strokePath();
  g.lineStyle(1, 0x000000, 0.09);
  for (let y = 0; y < H; y += 5) {
    g.moveTo(0, y);
    g.lineTo(W, y);
  }
  g.strokePath();
  stars.forEach((s) => {
    s.y += ((s.v * delta) / 1000) * (1 + heat / 70);
    if (s.y > H) ((s.y = 0), (s.x = R() * W));
    g.fillStyle(0xffffff, s.a);
    g.fillRect(s.x, s.y, s.s, s.s);
  });
  fx.clear();
  if (stop > 0) {
    stop -= delta;
    if (stop <= 0) scene.physics.resume();
    else return;
  }

  if (state === "MENU") {
    if (tap("P1_U") || tap("P2_U"))
      ((menu = menu ? menu - 1 : 2), snd("zap", 0.45, 1.2));
    if (tap("P1_D") || tap("P2_D"))
      ((menu = (menu + 1) % 3), snd("zap", 0.45, 0.85));
    if (tap("P1_L") || tap("P2_L"))
      ((dif = dif ? dif - 1 : 3), snd("zap", 0.45, 0.8));
    if (tap("P1_R") || tap("P2_R"))
      ((dif = (dif + 1) % 4), snd("zap", 0.45, 1.25));
    ui.opts.forEach((o, i) =>
      o
        .setColor(i === menu ? "#00f3ff" : "#fff")
        .setScale(i === menu ? 1.14 : 1),
    );
    const colors = ["#22ff88", "#00f3ff", "#ff8a00", "#ff2555"];
    ui.diff.setText("< DIFICULTAD: " + DN[dif] + "  BANK x" + DP[dif] + " >").setColor(colors[dif]);
    const a = ui.opts[menu];
    fx.fillStyle(0x00f3ff, 0.05);
    fx.fillRect(a.x - 145, a.y - 19, 290, 38);
    fx.lineStyle(3, 0xff00b3, 0.75 + 0.2 * S(time / 120));
    fx.strokeRect(a.x - 145, a.y - 19, 290, 38);
    if (tap("START1") || tap("START2") || tap("P1_1") || tap("P2_1"))
      menu === 2
        ? board()
        : ((tut = menu + 1),
          (state = "TUTOR"),
          showMenu(false),
          tutUi(true),
          snd("jack", 0.45, 1.1));
    return;
  }
  if (state === "TUTOR") {
    fx.fillStyle(0x020308, 0.88);
    fx.fillRect(64, 58, 672, 486);
    fx.lineStyle(4, 0x00f3ff, 0.75 + 0.2 * S(time / 120));
    fx.strokeRect(64, 58, 672, 486);
    fx.lineStyle(3, 0xff00b3, 0.85);
    fx.strokeRect(94, 150, 612, 252);
    fx.fillStyle(0x22ff88, 0.85);
    fx.fillRect(143, 244, 22, 22);
    fx.fillRect(635, 244, 22, 22);
    fx.lineStyle(4, GOLD, 0.9);
    fx.beginPath();
    fx.arc(400, 274, 70, -0.95, 0.95);
    fx.strokePath();
    ui.tutHelp.setScale(1 + 0.05 * S(time / 90));
    if (tap("START1") || tap("START2") || tap("P1_1") || tap("P2_1"))
      (tutUi(false), startGame(tut));
    return;
  }
  if (state === "BOARD") {
    if (tap("START1") || tap("START2") || tap("P1_1") || tap("P2_1"))
      (hideBoard(), (state = "MENU"), showMenu(true));
    return;
  }
  if (state === "NAME") {
    const code = name[ni].charCodeAt(0);
    if (tap("P1_U") || tap("P2_U"))
      ((name[ni] = String.fromCharCode(code === 90 ? 65 : code + 1)),
        snd("zap", 0.4, 1.2));
    if (tap("P1_D") || tap("P2_D"))
      ((name[ni] = String.fromCharCode(code === 65 ? 90 : code - 1)),
        snd("zap", 0.4, 0.85));
    if (tap("P1_1") || tap("P2_1") || tap("START1") || tap("START2")) {
      ni++;
      snd("cash", 0.6, 1.4);
      if (ni > 2) {
        scores.push({
          name: name.join(""),
          score,
          wave,
          best: bestHeist,
          combo: bestCombo,
        });
        scores.sort((a, b) => b.score - a.score);
        scores = scores.slice(0, 5);
        store().set("neon-heist-scores", scores);
        showOver();
      }
    }
    ui.nameChars.forEach((c, i) => {
      c.setText(name[i]).setColor(i === ni ? "#22ff88" : "#fff");
      fx.lineStyle(i === ni ? 3 : 1, i === ni ? GREEN : 0x224466, 0.9);
      fx.strokeRect(292 + i * 80, 248, 56, 76);
    });
    return;
  }
  if (state === "OVER") {
    fx.fillStyle(0x050109, 0.86);
    fx.fillRect(110, 76, 580, 388);
    fx.lineStyle(4, 0xff0055, 0.75 + 0.2 * S(time / 120));
    fx.strokeRect(110, 76, 580, 388);
    ui.retry.setScale(1 + 0.06 * S(time / 110));
    if (tap("START1") || tap("START2") || tap("P1_1") || tap("P2_1"))
      (hideOver(), snd("jack", 0.5, 1.1), startGame(mode));
    else if (tap("P1_2") || tap("P2_2"))
      (hideOver(), (state = "MENU"), showMenu(true), snd("zap", 0.5, 0.9));
    return;
  }
  if (state === "SHOP") {
    shopT -= delta;
    shopLock -= delta;
    hudText();
    fx.fillStyle(0x050109, 0.86);
    fx.fillRect(80, 88, 640, 420);
    fx.lineStyle(3, 0xff00b3, 0.8 + 0.2 * S(time / 90));
    fx.strokeRect(80, 88, 640, 420);
    if (shopLock > 0)
      ["P1_1", "P2_1", "START1", "START2", "P1_L", "P1_R", "P2_L", "P2_R"].forEach((k) => (input.pressed[k] = false));
    else {
      if (tap("P1_L") || tap("P2_L"))
        ((shopI = shopI ? shopI - 1 : 2), snd("zap", 0.45, 0.8));
      if (tap("P1_R") || tap("P2_R"))
        ((shopI = (shopI + 1) % 3), snd("zap", 0.45, 1.2));
      if (tap("P1_1") || tap("P2_1")) buyShop();
      if (tap("START1") || tap("START2") || shopT <= 0) closeShop();
    }
    shop.forEach((k, i) => {
      const x = 174 + i * 226,
        cost = F(UP[k][1] * (1 + wave * 0.16)),
        bt = k === 0 || k === 6 ? "AGRESIVA" : k === 2 || k === 3 ? "GREED" : "TANQUE";
      fx.fillStyle(i === shopI ? 0x221034 : 0x07101a, 0.95);
      fx.fillRect(x - 92, 202, 184, 118);
      fx.lineStyle(i === shopI ? 4 : 2, i === shopI ? GOLD : 0x225577, 1);
      fx.strokeRect(x - 92, 202, 184, 118);
      ui.cards[i]
        .setText(bt + "\n" + UP[k][0] + "\n$" + cost)
        .setColor(score >= cost ? "#fff" : "#ff2555")
        .setScale(i === shopI ? 1.08 : 1);
    });
    const sec = Math.ceil(shopT / 1000);
    ui.shopHelp.setText(
      (shopLock > 0 ? "PREPARATE..." : "BOTÓN 1 COMPRA  |  START = SEGUIR") + "  |  " + sec + "s"
    );
    ui.shopHelp.setColor(sec <= 2 && F(time / 150) % 2 === 0 ? "#ff2555" : "#88aadd");
    return;
  }

  cashCd -= delta;
  bonus -= delta;
  freeze -= delta;
  heist -= delta;
  comboT -= delta;
  if (comboT <= 0) ((combo = 0), ui.combo.setVisible(false));
  if (
    !evtUsed &&
    wave > 1 &&
    heist < evtAt &&
    (left > 1 || enemies.countActive() > 1)
  )
    startEvent();
  if (evt) {
    evtT -= delta;
    ui.combo
      .setVisible(combo > 1)
      .setText(combo > 1 ? "COMBO x" + combo + "   " + EV[evt] : EV[evt]);
    if (evt === 1) {
      evtCd -= delta;
      if (evtCd <= 0) {
        const c = scene.physics.add.sprite(60 + R() * (W - 120), -20, "core");
        c.val = 90;
        c.body.setVelocity((R() - 0.5) * 80, 150 + R() * 150);
        c.body.setDrag(40);
        cores.add(c);
        evtCd = 260;
      }
    }
    if (evtT <= 0) evt = 0;
  }
  if (heist <= 0 && state === "PLAY") {
    heat = MN(99, heat + 18);
    left += 4 + dif;
    heist = 14000;
    medal("LOCKDOWN", "#ff2555");
    pop(W / 2, 92, "COBRÁ CON START O PERDELO", "#ffea00", 1.2);
    snd("hit", 1, 0.65);
  }
  if (extract > 0) {
    extract -= delta;
    heat = MN(99, heat + delta * 0.012);
    players.forEach((p) => {
      if (p.hp <= 0) return;
      const bx = p.sprite.x;
      fx.fillStyle(GREEN, 0.1 + 0.09 * AB(S(time / 90)));
      fx.fillRect(bx - 16, 0, 32, p.sprite.y);
      fx.fillStyle(GREEN, 0.3 + 0.16 * AB(S(time / 90)));
      fx.fillRect(bx - 4, 0, 8, p.sprite.y);
    });
    const sec = Math.ceil(extract / 1000);
    if (sec !== cdSec) {
      cdSec = sec;
      if (sec > 0 && sec <= 3 && players[0]) {
        pop(W / 2, H / 2 - 100, "" + sec, "#22ff88", 2.2 + (3 - sec) * 0.3);
        snd("zap", 0.55, 1 + (3 - sec) * 0.3);
      }
    }
    if (extract <= 0) finishCashout();
  }
  if (filter && ac)
    filter.frequency.setValueAtTime(
      players.some((p) => p.hp > 0 && p.hp / p.max <= 0.25) || extract > 0
        ? 480
        : 18000,
      ac.currentTime,
    );
  if (tap("START1") || tap("START2")) cashout();
  if (!taughtCash && wave === 1 && stash > 250 && extract <= 0 && state === "PLAY") {
    taughtCash = 1;
    pop(W / 2, H / 2 - 60, "↓ ¡COBRÁ YA CON START! ↓", "#ffea00", 1.7);
    snd("zap", 0.7, 0.6);
  }
  if (stash > 0) {
    heat = MN(99, heat + delta * (0.0012 + greed() / 90000) * DS[dif]);
    if (stash > 2500 || extract > 0)
      (fx.fillStyle(
        extract > 0 ? 0xff2555 : 0xffea00,
        0.025 + 0.025 * S(time / 90),
      ),
        fx.fillRect(0, 0, W, H));
  }
  
  fever = greed() >= 100;
  if (fever) {
    fx.fillStyle(0xff00b3, 0.07 + 0.05 * AB(S(time / 55)));
    fx.fillRect(0, 0, W, H);
    fx.fillStyle(0xff00b3, 0.2 + 0.12 * AB(S(time / 55)));
    fx.fillRect(0, 0, W, 60);
    fx.fillRect(0, H - 60, W, 60);
    fx.fillRect(0, 0, 60, H);
    fx.fillRect(W - 60, 0, 60, H);
  }
  if (combo >= 10) {
    const ci = MN((combo - 10) / 18, 1);
    fx.lineStyle(4 + 7 * ci, combo >= 15 ? RED : GOLD, 0.35 + 0.3 * AB(S(time / 70)));
    fx.strokeRect(3, 3, W - 6, H - 6);
  }
  if (state === "PLAY" && players.some((p) => p.hp === 1)) {
    fx.fillStyle(RED, 0.1 + 0.12 * AB(S(time / 130)));
    fx.fillRect(0, 0, W, 70);
    fx.fillRect(0, H - 70, W, 70);
    fx.fillRect(0, 0, 70, H);
    fx.fillRect(W - 70, 0, 70, H);
  }

  hudText();
  if (freeze > 0) (fx.fillStyle(0x88ccff, 0.06), fx.fillRect(0, 0, W, H));

  if (state === "PLAY") {
    if (wave > 1) {
      hackT -= delta;
      if (hackT <= 0 && !hackZone) {
        hackZone = { x: 100 + R() * (W - 200), y: 100 + R() * (H - 200) };
        pop(hackZone.x, hackZone.y - 30, "HACK ZONE: QUEDATE ADENTRO", "#00f3ff", 1.15);
      }
      if (hackZone) {
        fx.lineStyle(3, 0x00f3ff, 0.5 + 0.3 * S(time / 100));
        fx.strokeCircle(hackZone.x, hackZone.y, 60);
        let hacking = false;
        players.forEach(p => {
          if (p.hp > 0 && Phaser.Math.Distance.Between(p.sprite.x, p.sprite.y, hackZone.x, hackZone.y) < 60) {
            hacking = true;
          }
        });
        if (hacking) {
          hackP += delta;
          fx.fillStyle(0x00f3ff, 0.3);
          fx.beginPath();
          fx.moveTo(hackZone.x, hackZone.y);
          fx.arc(hackZone.x, hackZone.y, 60, -P / 2, -P / 2 + (hackP / 3000) * P * 2);
          fx.fillPath();
          if (hackP >= 3000) {
            medal("HACK JACKPOT", "#22ff88");
            pop(hackZone.x, hackZone.y, "CORES EXTRA", "#22ff88", 1.4);
            snd("jack", 1, 1.2);
            for (let i = 0; i < 15; i++) {
              const c = scene.physics.add.sprite(hackZone.x, hackZone.y, "core");
              c.val = 150;
              c.body.setVelocity((R() - 0.5) * 400, (R() - 0.5) * 400);
              c.body.setDrag(150);
              cores.add(c);
            }
            hackZone = null;
            hackT = 25000;
            hackP = 0;
          }
        } else {
          hackP = MX(0, hackP - delta * 2);
        }
      }
    }
    const maxH = MX(60000, 90000 - wave * 2500);
    const ratio = MX(0, MN(1, heist / maxH));
    const isLow = heist < 15000;
    const tCol = isLow && F(time / 150) % 2 === 0 ? RED : (isLow ? 0xff8a00 : 0x00f3ff);
    fx.fillStyle(tCol, 0.85);
    fx.fillRect(0, 54, W * ratio, 4);

    const gr = greed();
    maxGreed = MX(maxGreed, gr);
    const tier = gr >= 100 ? 4 : gr >= 75 ? 3 : gr >= 40 ? 2 : gr > 0 ? 1 : 0;
    if (tier > greedTier && tier > 1) {
      const txt = tier === 4 ? "GREED MAX: GOLPES x2" : tier === 3 ? "LOOT EN RIESGO" : "GREED SUBE";
      pop(W / 2, 82, txt, tier > 2 ? "#ff2555" : "#ffea00", tier > 2 ? 1.28 : 1.08);
      snd("zap", 0.55, tier > 2 ? 0.65 : 1.25);
    }
    greedTier = tier;
    const gbx = W / 2 - 92, gby = 31, gbw = 184, gbh = 7;
    fx.fillStyle(0x0b101f, 0.85);
    fx.fillRect(gbx, gby, gbw, gbh);
    const grCol = tier > 2 ? RED : tier > 1 ? GOLD : GREEN;
    fx.fillStyle(grCol, 0.9);
    fx.fillRect(gbx, gby, gbw * (gr / 100), gbh);
    fx.lineStyle(tier > 2 ? 3 : 1.5, grCol, tier > 2 ? 0.9 : 0.55);
    fx.strokeRect(gbx, gby, gbw, gbh);
    fx.lineStyle(1, 0xffffff, 0.3);
    fx.moveTo(gbx + gbw * .4, gby - 2);
    fx.lineTo(gbx + gbw * .4, gby + gbh + 2);
    fx.moveTo(gbx + gbw * .75, gby - 2);
    fx.lineTo(gbx + gbw * .75, gby + gbh + 2);
    fx.strokePath();
    ui.greed
      .setText("GREED " + gr + "% " + (tier === 4 ? "MAX" : tier === 3 ? "RIESGO" : tier === 2 ? "PREMIO" : ""))
      .setVisible(true)
      .setColor(tier > 2 && F(time / 140) % 2 === 0 ? "#ff2555" : tier > 1 ? "#ffea00" : "#22ff88")
      .setScale(tier > 2 ? 1.12 + 0.05 * S(time / 80) : 1);
  }

  players.forEach((p) => {
    if (p.hp <= 0) {
      p.statusText.setPosition(p.sprite.x, p.sprite.y - 32);
      p.statusText.setText("¡REVIVIR!").setColor("#ff2555").setVisible(F(time / 200) % 2 === 0);
      return (
        p.sprite.setVisible(true).setAlpha(0.25),
        p.sprite.body.setVelocity(0, 0),
        fx.lineStyle(2, RED, 0.7 + 0.25 * S(time / 80)),
        fx.strokeCircle(p.sprite.x, p.sprite.y, 28)
      );
    }
    p.sprite.setAlpha(1);
    p.inv -= delta;
    p.slash -= delta;
    p.cd -= delta;
    p.dash -= delta;
    p.dashCd -= delta;
    p.mag -= delta;
    p.over -= delta;

    if (fever) {
      const vx = p.sprite.body.velocity.x,
        vy = p.sprite.body.velocity.y,
        vl = SQ(vx * vx + vy * vy);
      if (vl > 40)
        for (let i = 1; i <= 3; i++) {
          fx.fillStyle(0xff00b3, 0.2 - i * 0.05);
          fx.fillCircle(
            p.sprite.x - (vx / vl) * i * 14,
            p.sprite.y - (vy / vl) * i * 14,
            12 - i * 2,
          );
        }
    }

    p.statusText.setPosition(p.sprite.x, p.sprite.y - 32);
    if (p.over > 0) {
      p.statusText.setText("SOBRECARGA").setColor("#ffea00").setVisible(F(time / 150) % 2 === 0);
      fx.lineStyle(2, GOLD, 0.5 + 0.45 * AB(S(time / 50)));
      fx.strokeCircle(p.sprite.x, p.sprite.y, 20 + 3 * S(time / 30));
      if (R() < 0.1) {
        boom(p.sprite.x + (R() - 0.5) * 32, p.sprite.y + (R() - 0.5) * 32, GOLD, 1);
      }
    } else {
      p.statusText.setVisible(false);
    }

    const pid = p.id.toUpperCase();
    let dx = 0,
      dy = 0;
    if (input.held[pid + "_L"]) dx--;
    if (input.held[pid + "_R"]) dx++;
    if (input.held[pid + "_U"]) dy--;
    if (input.held[pid + "_D"]) dy++;
    if (dx || dy)
      ((p.dx = dx), (p.dy = dy), p.sprite.setRotation(Math.atan2(dy, dx)));
    if (p.dash > 0) p.sprite.body.setVelocity(p.vx, p.vy);
    else {
      let sp = 260 + MN(mult * 8, 80) + (bonus > 0 ? 35 : 0);
      if (dx && dy) sp *= 0.707;
      p.sprite.body.setVelocity(dx * sp, dy * sp);
      if (tap(pid + "_2") && p.dashCd <= 0) {
        const l = SQ(p.dx * p.dx + p.dy * p.dy) || 1;
        p.dash = 210;
        p.dashCd = 780;
        p.vx = (p.dx / l) * 760;
        p.vy = (p.dy / l) * 760;
        snd("slash", 0.55, 2);
      }
    }
    if (tap(pid + "_1") && p.cd <= 0 && p.dash <= 0)
      ((p.slash = p.over > 0 ? 245 : 155),
        (p.cd = p.over > 0 ? 160 : 290),
        snd("slash", 0.8, 1 + mult * 0.02));
    if (p.dash > 0) {
      const e = scene.add
        .image(p.sprite.x, p.sprite.y, p.id)
        .setAlpha(0.35)
        .setRotation(p.sprite.rotation)
        .setTint(p.color);
      scene.tweens.add({
        targets: e,
        alpha: 0,
        duration: 260,
        onComplete: () => e.destroy(),
      });
      enemies.getChildren().forEach((en) => {
        if (
          !en.mark &&
          Phaser.Geom.Intersects.RectangleToRectangle(
            p.sprite.getBounds(),
            en.getBounds(),
          )
        )
          ((en.mark = p.id),
            en.setTint(GOLD),
            boost(0.07),
            loot(35, "MARCA DASH", en.x, en.y));
      });
    }
    if (p.slash > 0) {
      const a = p.sprite.rotation,
        rr = (p.over > 0 || fever ? 78 : 58) + (up[0] || 0) * 10;
      fx.lineStyle(p.over > 0 || fever ? 9 : 6, fever ? 0xff00b3 : p.color, 1);
      fx.beginPath();
      fx.arc(p.sprite.x, p.sprite.y, rr, a - 1.15, a + 1.15);
      fx.strokePath();
      const hit = new Phaser.Geom.Circle(
        p.sprite.x + C(a) * rr * 0.55,
        p.sprite.y + S(a) * rr * 0.55,
        rr * 0.82,
      );
      enemies.getChildren().forEach((en) => {
        if (
          en.hit > 0 ||
          !Phaser.Geom.Intersects.CircleToRectangle(hit, en.getBounds())
        )
          return;
        en.hit = 120;
        let dmg = 1;
        if (en.mark) {
          dmg = 2;
          en.mark = null;
          pop(en.x, en.y - 20, "¡DETONACIÓN!", "#ffea00", 1.25);
          snd("zap", 0.7, 1.4);
          boom(en.x, en.y, GOLD, 8);
          enemies.getChildren().forEach(e2 => {
            if (e2 !== en && e2.active && Phaser.Math.Distance.Between(en.x, en.y, e2.x, e2.y) < 130) {
              e2.hp -= 1;
              e2.mark = p.id;
              e2.setTint(GOLD);
              const a2 = Math.atan2(e2.y - en.y, e2.x - en.x);
              e2.body.setVelocity(C(a2) * 450, S(a2) * 450);
              if (e2.hp <= 0) kill(e2, p);
            }
          });
        }
        en.hp -= dmg;
        en.setTint(0xffffff);
        stop = 28;
        scene.physics.pause();
        scene.cameras.main.shake(60, 0.006);
        if (en.hp <= 0) kill(en, p);
        else snd("hit", 0.7, 1.1);
      });
      bullets.getChildren().forEach((b) => {
        if (
          b.owner !== "enemy" ||
          !Phaser.Geom.Intersects.CircleToRectangle(hit, b.getBounds())
        )
          return;
        b.owner = p.id;
        b.setTint(p.color);
        let closest = null, minDist = 9999;
        enemies.getChildren().forEach(e => {
          if (!e.active) return;
          const d = Phaser.Math.Distance.Between(b.x, b.y, e.x, e.y);
          if (d < minDist) { minDist = d; closest = e; }
        });
        if (boss && boss.active) {
          const d = Phaser.Math.Distance.Between(b.x, b.y, boss.x, boss.y);
          if (d < minDist) { minDist = d; closest = boss; }
        }
        b.ang = closest ? Math.atan2(closest.y - b.y, closest.x - b.x) : a;
        b.base = 1100;
        b.ric = up[6] || 0;
        parry++;
        if (parry === 5) medal("¡ANTIBALAS!", "#00f3ff");
        if (chal === 1 && parry >= 5) goalDone();
        boost(0.2);
        loot(70, "PARRY LETAL", b.x, b.y);
        snd("zap", 0.8, 1.5);
        stop = 18;
        scene.physics.pause();
      });
      if (
        boss &&
        !(boss.hit > 0) &&
        Phaser.Geom.Intersects.CircleToRectangle(hit, boss.getBounds())
      ) {
        boss.hp--;
        boss.hit = 110;
        boss.setTint(0xffffff);
        loot(90, "CORTE GUARDIÁN", boss.x, boss.y);
        boost(0.12);
        snd("hit", 1, 0.85);
        if (boss.hp <= 0) defeatBoss();
      }
    }
    if (p.shield > 0) {
      fx.lineStyle(2, p.color, 0.65 + 0.25 * S(time / 90));
      fx.strokeCircle(p.sprite.x, p.sprite.y, 24);
    }
    if (p.mag > 0) {
      fx.lineStyle(1, GREEN, 0.16);
      fx.strokeCircle(p.sprite.x, p.sprite.y, 92);
    }
    fx.fillStyle(0x12030a, 0.8);
    fx.fillRect(p.sprite.x - 18, p.sprite.y + 25, 36, 4);
    fx.fillStyle(p.color, p.inv > 0 && F(time / 80) % 2 ? 0.35 : 0.95);
    fx.fillRect(p.sprite.x - 18, p.sprite.y + 25, (36 * p.hp) / p.max, 4);
  });

  if (left > 0) {
    spawn -= delta;
    if (spawn <= 0 && enemies.countActive() < 7 + dif * 2 + (players.length - 1) * 4)
      (spawnEnemy(),
        left--,
        (spawn = MX(
          120,
          (720 - wave * 35 - heat * 4) /
            DS[dif] /
            (1 + greed() / 130 + (extract > 0 ? 0.65 : 0)),
        )));
  } else if (state === "PLAY" && !boss && enemies.countActive() === 0) endWave();
  sparks.getChildren().forEach((s) => {
    s.life -= delta / 1000;
    s.alpha = s.life;
    if (s.life <= 0) s.destroy();
  });
  cores.getChildren().forEach((c) => {
    players.forEach((p) => {
      if (p.hp <= 0 || !c.active) return;
      const d = Phaser.Math.Distance.Between(c.x, c.y, p.sprite.x, p.sprite.y);
      if ((p.mag > 0 && d < 125) || (up[3] && d < (80 + up[3] * 18)))
        c.body.setVelocity((p.sprite.x - c.x) * 6, (p.sprite.y - c.y) * 6);
      if (
        Phaser.Geom.Intersects.RectangleToRectangle(
          c.getBounds(),
          p.sprite.getBounds(),
        )
      ) {
        if (c.mega) {
          loot(c.val || 1200, "¡MEGA JACKPOT!", c.x, c.y);
          boost(0.75);
          heat = MN(99, heat + 20);
          scene.cameras.main.flash(160, 255, 234, 0);
          scene.cameras.main.shake(180, 0.017);
          snd("jack", 1.1, 0.9);
        } else
          (loot(c.val || 60, "NÚCLEO LOOT", c.x, c.y),
            boost(0.1),
            snd("zap", 0.5, 1.8));
        c.destroy();
      }
    });
  });
  powerups.getChildren().forEach((u) => {
    u.life -= delta;
    if (u.life <= 0) return u.destroy();
    players.forEach((p) => {
      if (p.hp <= 0 || !u.active) return;
      const d = Phaser.Math.Distance.Between(u.x, u.y, p.sprite.x, p.sprite.y);
      if ((p.mag > 0 && d < 130) || (up[3] && d < (80 + up[3] * 20)))
        u.body.setVelocity((p.sprite.x - u.x) * 6, (p.sprite.y - u.y) * 6);
      if (
        Phaser.Geom.Intersects.RectangleToRectangle(
          u.getBounds(),
          p.sprite.getBounds(),
        )
      )
        takePower(p, u);
    });
  });

  const alive = players.filter(p => p.hp > 0), target = alive.length ? alive[F(R() * alive.length)] : null;
  if (mode === 2)
    players
      .filter((p) => p.hp <= 0)
      .forEach((ded) => {
        const sav = alive.find(
          (p) =>
            Phaser.Math.Distance.Between(
              p.sprite.x,
              p.sprite.y,
              ded.sprite.x,
              ded.sprite.y,
            ) < 46,
        );
        if (sav) {
          ded.rev += delta;
          fx.lineStyle(5, GREEN, 0.85);
          fx.beginPath();
          fx.arc(
            ded.sprite.x,
            ded.sprite.y,
            36,
            -P / 2,
            -P / 2 + P * 2 * MN(1, ded.rev / 3000),
          );
          fx.strokePath();
          if (ded.rev >= 3000)
            ((ded.hp = 1),
              (ded.inv = 1600),
              (ded.rev = 0),
              ded.sprite.setAlpha(1),
              pop(ded.sprite.x, ded.sprite.y - 42, "¡REVIVIDO!", "#22ff88", 1.35),
              snd("jack", 0.9, 1.1));
        } else ded.rev = 0;
      });
  enemies.getChildren().forEach((e) => {
    e.hit -= delta;
    if (e.hit <= 0)
      e.bounty
        ? e.setTint(GOLD)
        : e.type === "splitter" || e.type === "mini"
          ? e.setTint(0xaa66ff)
          : e.clearTint();
    if (!target) return;
    const fr = freeze > 0 ? 0.32 : 1;
    const a = Math.atan2(target.sprite.y - e.y, target.sprite.x - e.x),
      d = Phaser.Math.Distance.Between(
        e.x,
        e.y,
        target.sprite.x,
        target.sprite.y,
      );
    e.setRotation(a);
    if (e.type === "thief") {
      if (e.flee) {
        const aFlee = Math.atan2(e.y - H / 2, e.x - W / 2);
        e.setRotation(aFlee);
        e.body.setVelocity(C(aFlee) * 350 * fr, S(aFlee) * 350 * fr);
        if (e.x < -50 || e.x > W + 50 || e.y < -50 || e.y > H + 50) e.destroy();
      } else {
        e.setRotation(a);
        e.body.setVelocity(C(a) * 280 * fr, S(a) * 280 * fr);
      }
    } else if (e.type === "gunner" && d < 285) {
      e.body.setVelocity(0, 0);
      e.t -= delta * fr;
      if (e.t <= 0)
        ((e.t = MX(
          400,
          (1500 - wave * 45 - heat * 5) / DS[dif] / (1 + greed() / 160),
        )),
          bullet(e.x, e.y, a, (320 + heat * 2 + greed()) * DS[dif]),
          snd("zap", 0.45, 0.75));
    } else {
      const sp =
        ((e.type === "mine" ? 245 : 130) +
          wave * 4 +
          heat * 1.3 +
          greed() * 0.55) *
         DS[dif] *
         fr * CT[contract][2];
      e.body.setVelocity(C(a) * sp, S(a) * sp);
    }
    alive.forEach((p) => {
      if (
        Phaser.Geom.Intersects.RectangleToRectangle(
          e.getBounds(),
          p.sprite.getBounds(),
        )
      ) {
        if (e.type === "thief" && !e.flee) {
          const stole = F(stash * 0.5);
          if (stole > 0 && p.inv <= 0 && p.dash <= 0 && !fever) {
            stash -= stole;
            e.stolen = stole;
            e.flee = 1;
            pop(e.x, e.y - 20, "¡ROBADO -$" + stole + "!", "#ffea00", 1.2);
            snd("hit", 1, 1.5);
            hudText();
          } else burn(p, 1);
        } else if (e.type === "mine") {
          boom(e.x, e.y, RED, 28); e.destroy(); burn(p, 1);
        } else if (e.type !== "thief" || !e.flee) {
          burn(p, 1);
        }
      }
    });
  });
  if (mode === 2 && alive.length === 2) {
    const a = alive[0].sprite,
      b = alive[1].sprite,
      d = Phaser.Math.Distance.Between(a.x, a.y, b.x, b.y);
    if (d < 315) {
      fx.lineStyle(5, GREEN, 0.36);
      fx.beginPath();
      fx.moveTo(a.x, a.y);
      fx.lineTo(b.x, b.y);
      fx.strokePath();
      const line = new Phaser.Geom.Line(a.x, a.y, b.x, b.y);
      enemies.getChildren().forEach((e) => {
        e.beam = (e.beam || 0) - delta;
        if (
          e.beam <= 0 &&
          Phaser.Geom.Intersects.LineToRectangle(line, e.getBounds())
        ) {
          e.beam = 220;
          e.hp -= 0.55;
          e.hit = 120;
          e.setTint(0xffffff);
          if (e.hp <= 0) kill(e, alive[0], true);
        }
      });
    }
  }
  bullets.getChildren().forEach((b) => {
    if (b.x < -45 || b.x > W + 45 || b.y < -45 || b.y > H + 45) {
      if (up[6] && b.owner !== "enemy" && b.ric > 0) {
        b.ric--;
        b.ang = b.x < -45 || b.x > W + 45 ? P - b.ang : -b.ang;
        b.x = Phaser.Math.Clamp(b.x, 8, W - 8);
        b.y = Phaser.Math.Clamp(b.y, 8, H - 8);
        b.setRotation(b.ang);
      } else return b.destroy();
    }
    const fr = b.owner === "enemy" && freeze > 0 ? 0.32 : 1;
    b.body.setVelocity(C(b.ang) * b.base * fr, S(b.ang) * b.base * fr);
    b.setRotation(b.ang);
    if (b.owner === "enemy")
      alive.forEach((p) => {
        if (!b.active) return;
        if (
          Phaser.Geom.Intersects.RectangleToRectangle(
            b.getBounds(),
            p.sprite.getBounds(),
          )
        )
          (b.destroy(), burn(p, 1));
      });
    else {
      enemies.getChildren().forEach((e) => {
        if (!b.active) return;
        if (
          Phaser.Geom.Intersects.RectangleToRectangle(
            b.getBounds(),
            e.getBounds(),
          )
        )
          (b.destroy(),
            (e.hp -= 15),
            e.hp <= 0 &&
              kill(e, players.find((p) => p.id === b.owner) || players[0]));
      });
      if (boss && b.active && b.owner !== "enemy" && Phaser.Geom.Intersects.RectangleToRectangle(b.getBounds(), boss.getBounds())) {
        b.destroy();
        boss.hp -= 10;
        boss.hit = 110;
        boss.setTint(0xffffff);
        loot(100, "PARRY GUARDIÁN", boss.x, boss.y);
        snd("hit", 1, 0.85);
        if (boss.hp <= 0) defeatBoss();
      }
    }
  });
  if (boss) {
    if (!boss.p2 && boss.hp <= boss.max * 0.5) {
      boss.p2 = 1;
      medal("FASE 2: ALERTA ROJA", "#ff2555");
      pop(W / 2, 220, "EL GUARDIÁN SE ENFURECE", "#ff2555", 1.3);
      scene.cameras.main.shake(320, 0.02);
    }
    boss.hit -= delta;
    if (boss.hit <= 0) boss.p2 ? boss.setTint(0xff2555) : boss.clearTint();
    if (bossBar) {
      bossBar.clear();
      bossBar.fillStyle(0x14010a, 0.9);
      bossBar.fillRect(226, 58, 348, 16);
      bossBar.fillStyle(RED, 1);
      bossBar.fillRect(250, 61, (300 * boss.hp) / boss.max, 9);
      bossBar.lineStyle(2, 0xff00b3, 0.85);
      bossBar.strokeRect(226, 58, 348, 16);
    }
    if (target) {
      const a = Math.atan2(target.sprite.y - boss.y, target.sprite.x - boss.x),
        fr = freeze > 0 ? 0.38 : 1;
      boss.setRotation(a);
      boss.t -= delta * fr;
      if (boss.t <= 0) {
        boss.pat = (boss.pat + 1) % 3;
        boss.t = (boss.pat === 2 ? 2100 : 1250) / DS[dif] / (boss.p2 ? 1.7 : 1);
        for (let i = 0; i < (boss.pat === 1 ? 9 + dif : 3); i++)
          bullet(
            boss.x,
            boss.y,
            boss.pat === 1 ? a + (i * P * 2) / (9 + dif) : a + (i - 1) * 0.28,
            (boss.pat === 1 ? 275 : 420) * DS[dif] * (1 + greed() / 180),
          );
        snd("zap", 0.7, 0.7);
      }
    }
  }

  if (state === "PLAY") {
    const dedPlayer = players.find((p) => p.hp <= 0);
    if (dedPlayer) {
      ui.tip.setText("REVIVE: ACERCATE 3s AL COMPAÑERO").setColor("#ff2555").setVisible(F(time / 200) % 2 === 0);
    } else if (extract > 0) {
      ui.tip.setText("EXTRACCIÓN ACTIVA: SI TE PEGAN SE CANCELA").setColor("#ffea00").setVisible(true);
    } else if (greed() >= 75) {
      ui.tip.setText(greed() >= 100 ? "GREED MAX: CADA GOLPE DUELE x2" : "GREED ALTO: START = BANK, GOLPE = LOOT PERDIDO").setColor("#ff2555").setVisible(F(time / 180) % 2 === 0);
    } else if (stash > 2500) {
      ui.tip.setText("LOOT EN RIESGO: START PARA DEPOSITAR").setColor("#22ff88").setVisible(F(time / 250) % 2 === 0);
    } else if (cores.countActive() > 0) {
      const c = cores.getChildren()[0];
      const d1 = players[0] ? Phaser.Math.Distance.Between(c.x, c.y, players[0].sprite.x, players[0].sprite.y) : 999;
      if (d1 > 180) {
        ui.tip.setText("CORES VERDES = LOOT, NO BANK TODAVÍA").setColor("#22ff88").setVisible(true);
      } else {
        ui.tip.setText("JUNTÁ CORES Y DECIDÍ CUÁNDO COBRAR").setColor("#00f3ff").setVisible(true);
      }
    } else {
      const tips = [
        "BANK ES PUNTAJE REAL. LOOT ES APUESTA",
        "DASH MARCA ENEMIGOS Y TE HACE INVULNERABLE",
        "PARRY: CORTÁ BALAS PARA DEVOLVERLAS",
        "COMBO + GREED MULTIPLICAN EL PREMIO",
        "LOCKDOWN: COBRÁ ANTES DE QUEDARTE SIN TIEMPO",
        "2P: EL RAYO VERDE DAÑA ENEMIGOS ENTRE AMBOS",
      ];
      const idx = F(time / 4000) % tips.length;
      ui.tip.setText(tips[idx]).setColor("#88aadd").setVisible(true);
    }
  } else if (state === "SHOP") {
    ui.tip.setText("MERCADO NEGRO: COMPRÁ PODER VISIBLE O START PARA SEGUIR").setColor("#ff00b3").setVisible(true);
  } else {
    ui.tip.setVisible(false);
  }

  if (!players.some(p => p.hp > 0) && players.length) gameOver();
}

function defeatBoss() {
  const x = boss.x,
    y = boss.y;
  boss.destroy();
  boss = null;
  if (bossBar) bossBar.clear();
  medal("VAULT JACKPOT", "#ffea00");
  loot(2600 + wave * 200, "GUARDIÁN DERROTADO", x, y);
  heat = MN(99, heat + 12);
  boom(x, y, RED, 90);
  snd("cash", 1.2, 0.75);
  scene.cameras.main.flash(260, 255, 0, 85);
  scene.cameras.main.shake(260, 0.022);
  stop = 180;
  scene.physics.pause();
  pop(x, y - 55, "START PARA DEPOSITAR", "#ffea00", 1.25);
}
