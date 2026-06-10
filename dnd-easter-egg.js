/* ================================================================
   D&D EASTER EGG — GRAND RPG ENGINE
   A complete D&D 5e inspired RPG hidden inside a portfolio.
   by Daniel Salini (Katosx) — v2.0
   "In the spaces between code, a world breathes."
   ================================================================ */

(function (root) {
  'use strict';

  // ============================================================
  // PART 1 — UTILITIES & CORE HELPERS
  // ============================================================

  /** Roll a die with N sides */
  const roll   = (sides)        => Math.floor(Math.random() * sides) + 1;
  const d4     = ()             => roll(4);
  const d6     = ()             => roll(6);
  const d8     = ()             => roll(8);
  const d10    = ()             => roll(10);
  const d12    = ()             => roll(12);
  const d20    = ()             => roll(20);
  const d100   = ()             => roll(100);
  /** Roll 4d6, drop lowest (standard stat generation) */
  const roll4d6 = () => { const r=[d6(),d6(),d6(),d6()]; r.sort((a,b)=>a-b); return r[1]+r[2]+r[3]; };
  /** Clamp a value between min and max */
  const clamp  = (v, lo, hi)   => Math.min(Math.max(v, lo), hi);
  /** Ability score modifier (D&D formula) */
  const mod    = (score)        => Math.floor((score - 10) / 2);
  /** Format modifier with sign */
  const modStr = (score)        => { const m = mod(score); return (m >= 0 ? '+' : '') + m; };
  /** Pick a random element from an array */
  const pick   = (arr)          => arr[Math.floor(Math.random() * arr.length)];
  /** Shuffle array (Fisher-Yates) */
  const shuffle = (arr) => { const a=[...arr]; for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];} return a; };
  /** Weighted random pick: [{item, weight}, ...] */
  const weightedPick = (arr) => {
    const total = arr.reduce((s, x) => s + x.w, 0);
    let r = Math.random() * total;
    for (const x of arr) { r -= x.w; if (r <= 0) return x.v; }
    return arr[arr.length - 1].v;
  };
  /** Deep clone a plain object */
  const clone  = (obj)          => JSON.parse(JSON.stringify(obj));
  /** Capitalise first letter */
  const cap    = (s)            => s.charAt(0).toUpperCase() + s.slice(1);
  /** Escape HTML */
  const esc    = (s)            => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  /** Format gold number */
  const fmtGold = (n)           => n >= 1000 ? (n/1000).toFixed(1)+'k' : String(n);

  // ============================================================
  // PART 2 — WEB AUDIO SYSTEM (procedural, no files needed)
  // ============================================================

  const Audio = (() => {
    let ctx = null, masterGain = null, enabled = true;

    function init() {
      try {
        ctx = new (window.AudioContext || window.webkitAudioContext)();
        masterGain = ctx.createGain();
        masterGain.gain.value = 0.25;
        masterGain.connect(ctx.destination);
      } catch(e) { enabled = false; }
    }

    function resume() { if (ctx && ctx.state === 'suspended') ctx.resume(); }

    function tone(freq, dur, type = 'sine', vol = 0.3, detune = 0) {
      if (!enabled || !ctx) return;
      resume();
      try {
        const osc = ctx.createOscillator();
        const g   = ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        osc.detune.value = detune;
        g.gain.setValueAtTime(vol, ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
        osc.connect(g); g.connect(masterGain);
        osc.start(); osc.stop(ctx.currentTime + dur);
      } catch(e) {}
    }

    function chord(freqs, dur, type = 'sine', vol = 0.2) {
      freqs.forEach(f => tone(f, dur, type, vol));
    }

    function sequence(notes, interval) {
      notes.forEach(([f, d, t, v], i) =>
        setTimeout(() => tone(f, d, t || 'sine', v || 0.25), i * interval));
    }

    const sfx = {
      click:    () => tone(900, 0.08, 'sine', 0.15),
      confirm:  () => sequence([[523,0.1],[659,0.1],[784,0.15]], 80),
      cancel:   () => sequence([[400,0.1],[300,0.15]], 80),
      attack:   () => { tone(180,0.18,'sawtooth',0.35); setTimeout(()=>tone(140,0.2,'sawtooth',0.25),60); },
      hit:      () => { tone(220,0.12,'square',0.3); setTimeout(()=>tone(160,0.18,'sawtooth',0.2),40); },
      miss:     () => tone(200,0.2,'sine',0.12,-300),
      magic:    () => sequence([[523,0.25],[659,0.25],[784,0.25],[1047,0.35]],70),
      heal:     () => sequence([[659,0.3,'sine',0.2],[784,0.3,'sine',0.2],[1047,0.4,'sine',0.25]],90),
      critical: () => { tone(880,0.08,'square',0.5); setTimeout(()=>tone(1320,0.3,'square',0.35),80); },
      fumble:   () => sequence([[330,0.2,'sawtooth',0.3],[220,0.2,'sawtooth',0.25],[110,0.3,'sawtooth',0.2]],120),
      levelUp:  () => sequence([[261,0.15],[330,0.15],[392,0.15],[523,0.15],[659,0.15],[784,0.15],[1047,0.4]],80),
      death:    () => sequence([[440,0.4,'sawtooth',0.3],[330,0.4,'sawtooth',0.25],[220,0.5,'sawtooth',0.2],[110,0.8,'sawtooth',0.15]],180),
      coin:     () => { tone(1047,0.1,'sine',0.25); setTimeout(()=>tone(1319,0.15,'sine',0.2),80); },
      chest:    () => sequence([[523,0.2],[659,0.2],[784,0.2],[1047,0.2],[1319,0.35]],60),
      equip:    () => sequence([[440,0.1,'square',0.2],[660,0.15,'square',0.2]],80),
      secret:   () => sequence([[1047,0.2,'sine',0.1],[1319,0.2,'sine',0.1],[1568,0.2,'sine',0.1],[2093,0.5,'sine',0.15]],100),
      pageFlip: () => tone(600,0.06,'sine',0.12),
      error:    () => sequence([[200,0.15,'sawtooth',0.3],[150,0.2,'sawtooth',0.25]],100),
      ambientDrip: () => { const f=400+Math.random()*200; tone(f,0.3,'sine',0.04); },
      rageActivate: () => { tone(80,0.5,'sawtooth',0.4); setTimeout(()=>tone(100,0.4,'sawtooth',0.3),200); },
      smite:    () => { tone(200,0.15,'sawtooth',0.35); setTimeout(()=>chord([523,659,784],0.4,'sine',0.2),150); },
      bardSong: () => sequence([[523,0.2,'triangle',0.2],[587,0.2,'triangle',0.2],[659,0.2,'triangle',0.2],[698,0.3,'triangle',0.25]],120),
      breathWeapon: () => { for(let i=0;i<8;i++) setTimeout(()=>tone(100+Math.random()*200,0.15,'sawtooth',0.25),i*40); },
    };

    function setVolume(v) {
      enabled = v > 0;
      if (masterGain) masterGain.gain.value = clamp(v, 0, 1);
    }

    return { init, sfx, setVolume, get enabled() { return enabled; } };
  })();

  // ============================================================
  // PART 3 — PARTICLE / CANVAS SYSTEM
  // ============================================================

  const Particles = (() => {
    let canvas, ctx2d, particles = [], raf = null, active = false;

    const COLORS = ['#7c3aed','#8b5cf6','#a78bfa','#f59e0b','#fbbf24','#06b6d4','#3b82f6'];

    function init() {
      canvas = document.getElementById('dndCanvas');
      if (!canvas) return;
      ctx2d = canvas.getContext('2d');
      resize();
      window.addEventListener('resize', resize);
    }

    function resize() {
      if (!canvas) return;
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    }

    function spawn(count = 20, x = null, y = null, type = 'float') {
      if (!canvas) return;
      for (let i = 0; i < count; i++) {
        const cx = x !== null ? x : Math.random() * canvas.width;
        const cy = y !== null ? y : Math.random() * canvas.height;
        particles.push({
          x: cx, y: cy,
          vx: (Math.random() - 0.5) * (type === 'burst' ? 6 : 1.5),
          vy: type === 'burst' ? (Math.random() - 0.5) * 6 : -Math.random() * 1.5 - 0.3,
          life: 1, decay: 0.008 + Math.random() * 0.015,
          size: 1.5 + Math.random() * 3,
          color: pick(COLORS),
          type
        });
      }
      if (!active) start();
    }

    function spawnBurst(x, y, color, count = 30) {
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 / count) * i;
        const speed = 2 + Math.random() * 5;
        particles.push({
          x, y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 1, decay: 0.02 + Math.random() * 0.02,
          size: 2 + Math.random() * 4,
          color: color || pick(COLORS), type: 'burst'
        });
      }
      if (!active) start();
    }

    function tick() {
      if (!canvas || !ctx2d) return;
      ctx2d.clearRect(0, 0, canvas.width, canvas.height);
      particles = particles.filter(p => p.life > 0);

      for (const p of particles) {
        ctx2d.save();
        ctx2d.globalAlpha = p.life * 0.8;
        ctx2d.fillStyle   = p.color;
        ctx2d.shadowColor = p.color;
        ctx2d.shadowBlur  = p.size * 2;
        ctx2d.beginPath();
        ctx2d.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx2d.fill();
        ctx2d.restore();

        p.x   += p.vx;
        p.y   += p.vy;
        p.vy  += p.type === 'float' ? -0.02 : 0.1;
        p.life -= p.decay;
        p.size *= 0.995;
      }

      if (particles.length > 0) {
        raf = requestAnimationFrame(tick);
      } else {
        active = false;
        raf = null;
      }
    }

    function start() {
      active = true;
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(tick);
    }

    function spawnAmbient() {
      if (particles.length < 60) spawn(3);
    }

    function stop() {
      active = false;
      if (raf) { cancelAnimationFrame(raf); raf = null; }
      particles = [];
      if (ctx2d && canvas) ctx2d.clearRect(0, 0, canvas.width, canvas.height);
    }

    return { init, spawn, spawnBurst, spawnAmbient, stop };
  })();

  // ============================================================
  // PART 4 — STORAGE SYSTEM
  // ============================================================

  const Storage = {
    KEY: 'dnd_rpg_v2_',

    save(key, data) {
      try { localStorage.setItem(this.KEY + key, JSON.stringify(data)); return true; }
      catch(e) { return false; }
    },

    load(key, fallback = null) {
      try {
        const raw = localStorage.getItem(this.KEY + key);
        return raw ? JSON.parse(raw) : fallback;
      } catch(e) { return fallback; }
    },

    remove(key) { localStorage.removeItem(this.KEY + key); },

    clear() {
      Object.keys(localStorage)
        .filter(k => k.startsWith(this.KEY))
        .forEach(k => localStorage.removeItem(k));
    },

    /** Leaderboard */
    addScore(player) {
      const scores = this.load('leaderboard', []);
      scores.push({
        name:      player.name,
        race:      player.race.name,
        cls:       player.cls.name,
        level:     player.level,
        gold:      player.gold,
        kills:     player.stats.kills,
        playtime:  Date.now() - player.startTime,
        date:      new Date().toLocaleDateString(),
        hardcore:  player.hardcore,
        score:     this.calcScore(player)
      });
      scores.sort((a, b) => b.score - a.score);
      this.save('leaderboard', scores.slice(0, 20));
    },

    calcScore(p) {
      return (p.level * 200) + (p.stats.kills * 15) + (p.gold * 2) +
             (p.stats.questsDone * 300) + (p.hardcore ? 1000 : 0);
    },

    getScores() { return this.load('leaderboard', []); },

    /** Unlocks/secrets tracking */
    unlock(flag) {
      const u = this.load('unlocks', {});
      u[flag] = true;
      this.save('unlocks', u);
    },
    isUnlocked(flag) { return !!(this.load('unlocks', {})[flag]); },

    /** Save-game slot management */
    saveGame(slot, gs) { this.save('save_' + slot, gs); },
    loadGame(slot)     { return this.load('save_' + slot); },
    deleteSave(slot)   { this.remove('save_' + slot); },
    hasSave(slot)      { return !!this.load('save_' + slot); }
  };

  console.log(
    '%c⚔ D&D EASTER EGG ENGINE v2.0 ⚔\n' +
    '%cby Daniel Salini (Katosx)\n' +
    '%c"There are secrets written in hexadecimal\nthat even the compiler cannot parse."\n' +
    '%c> Type dnd.secret() in the console for a surprise.',
    'color:#f59e0b;font-size:16px;font-weight:bold;',
    'color:#8b5cf6;font-size:12px;',
    'color:#475569;font-size:11px;font-style:italic;',
    'color:#06b6d4;font-size:11px;'
  );

  // Expose a secret console API
  root.dnd = {
    secret: () => {
      console.log('%c🎲 You found the dev console easter egg.\n%cTry: dnd.devroom()', 'color:#f59e0b;font-size:14px;', 'color:#8b5cf6;');
      Audio.sfx.secret();
    },
    devroom: () => {
      if (root._dndGame) root._dndGame.openDevRoom();
      else console.log('%cStart the game first! Click "Púlsame" on the portfolio.', 'color:#ef4444;');
    },
    godmode: () => {
      if (root._dndGame) root._dndGame.godMode();
      else console.log('%cStart the game first!', 'color:#ef4444;');
    }
  };

  // End of Part 1-4. Game data and engine continue in subsequent appends.

  // ============================================================
  // PLACEHOLDER: Engine will be appended in parts below
  // ============================================================

  // We store a reference so the rest of the code (appended) can
  // attach to the same closure scope via the _dndParts registry.
  root._dndParts = root._dndParts || {};
  root._dndParts.utils   = { roll, d4, d6, d8, d10, d12, d20, d100, roll4d6, clamp, mod, modStr, pick, shuffle, weightedPick, clone, cap, esc, fmtGold };
  root._dndParts.Audio   = Audio;
  root._dndParts.Particles = Particles;
  root._dndParts.Storage = Storage;

  root._dndParts.SPRITE_MAP = {
    'warrior': 'player_hero.png', 'barbarian': 'player_hero.png', 'knight': 'player_hero.png',
    'wizard': 'player_hero.png', 'sorcerer': 'player_hero.png', 'cleric': 'player_hero.png',
    'paladin': 'player_hero.png', 'ranger': 'player_hero.png', 'druid': 'player_hero.png',
    'rogue': 'player_hero.png', 'bard': 'player_hero.png', 'monk': 'player_hero.png',
    'artificer': 'player_hero.png', 'bloodhunter': 'player_hero.png',
    'goblin': 'goblin.png', 'goblin_king': 'goblin.png', 'bugbear': 'goblin.png', 'kobold': 'goblin.png',
    'dragon_ancient': 'dragon.png',
    'mimic_chest': 'mimic.png', 'mimic_small': 'mimic.png', 'mimic_door': 'mimic.png',
    'skeleton': 'skeleton.png', 'death_knight': 'skeleton.png',
    'lich_minor': 'lich.png', 'mummy_lord': 'lich.png',
    'mindflayer': 'mindflayer.png',
    'beholder': 'beholder.png',
    'rat': 'beast_wolf.png', 'wolf': 'beast_wolf.png', 'stirge': 'beast_wolf.png',
    'aarakocra': 'beast_wolf.png', 'blink_dog': 'beast_wolf.png',
    'bandit': 'humanoid_orc.png', 'gnoll': 'humanoid_orc.png', 'orc_warrior': 'humanoid_orc.png',
    'acolyte': 'humanoid_orc.png', 'satyr': 'humanoid_orc.png', 'centaur': 'humanoid_orc.png',
    'drow_elite': 'humanoid_orc.png', 'drow_mage': 'humanoid_orc.png', 'el_decano': 'humanoid_orc.png',
    'cult_fanatic': 'humanoid_orc.png',
    'zombie': 'undead_zombie.png', 'ghoul': 'undead_zombie.png', 'wight': 'undead_zombie.png',
    'vampire_spawn': 'undead_zombie.png', 'banshee': 'undead_zombie.png', 'ghost': 'undead_zombie.png',
    'revenant': 'undead_zombie.png', 'wraith': 'undead_zombie.png',
    'harpy': 'monstrosity_owlbear.png', 'basilisk': 'monstrosity_owlbear.png', 'werewolf': 'monstrosity_owlbear.png',
    'rust_monster': 'monstrosity_owlbear.png', 'ankheg': 'monstrosity_owlbear.png', 'dryad': 'monstrosity_owlbear.png',
    'ettercap': 'monstrosity_owlbear.png', 'green_hag': 'monstrosity_owlbear.png', 'owlbear': 'monstrosity_owlbear.png',
    'yeti': 'monstrosity_owlbear.png', 'gelatinous_cube': 'monstrosity_owlbear.png', 'ochre_jelly': 'monstrosity_owlbear.png',
    'carrion_crawler': 'monstrosity_owlbear.png', 'hook_horror': 'monstrosity_owlbear.png', 'minotaur': 'monstrosity_owlbear.png',
    'umber_hulk': 'monstrosity_owlbear.png', 'roper': 'monstrosity_owlbear.png', 'chuul': 'monstrosity_owlbear.png',
    'forest_guardian': 'monstrosity_owlbear.png',
    'gargoyle': 'elemental_golem.png', 'golem_stone': 'elemental_golem.png', 'flesh_golem': 'elemental_golem.png',
    'clay_golem': 'elemental_golem.png', 'aboleth': 'elemental_golem.png', 'cloaker': 'elemental_golem.png',
    'oni': 'fiend_devil.png', 'night_hag': 'fiend_devil.png', 'troll': 'fiend_devil.png',
    'elder_brain': 'fiend_devil.png', 'glabrezu': 'fiend_devil.png', 'balor': 'fiend_devil.png',
    'pit_fiend': 'fiend_devil.png', 'tarrasque': 'fiend_devil.png',
    // Pathfinder & Cthulhu Custom Maps
    'cthulhu': 'cthulhu.png', 'shoggoth': 'slime.png', 'mi_go': 'mindflayer.png',
    'deep_one': 'humanoid_orc.png', 'star_spawn': 'beholder.png', 'dark_young': 'treant.png',
    'yithian': 'beholder.png', 'dagon': 'cthulhu.png', 'hastur': 'lich.png', 'nyarlathotep': 'mindflayer.png',
    'pathfinder-goblin': 'goblin.png', 'grendel': 'monstrosity_owlbear.png', 'wendigo': 'fiend_devil.png',
    'linnorm': 'dragon.png'
  };

  root._dndParts.getSpriteHtml = function(id, defaultEmoji, type, size, name) {
    const isPlayerClass = ['warrior', 'barbarian', 'knight', 'wizard', 'sorcerer', 'cleric', 'paladin', 'ranger', 'druid', 'rogue', 'bard', 'monk', 'artificer', 'bloodhunter'].includes(id);
    const racesList = ['human', 'elf', 'halfelf', 'dwarf', 'tiefling', 'dragonborn', 'orc', 'halforc', 'halfling', 'gnome', 'aasimar', 'drow', 'changeling'];
    const isRace = racesList.includes(id);
    
    let filename = '';
    if (isPlayerClass || isRace) {
      const char = (root._dndGame && typeof root._dndGame.getChar === 'function') ? root._dndGame.getChar() : null;
      let race = 'human';
      let gender = 'male';
      
      if (char) {
        race = (char.race && char.race.id) ? char.race.id : 'human';
        gender = char.gender || 'male';
      } else if (root._dndGame && typeof root._dndGame.getCCSelections === 'function') {
        const cc = root._dndGame.getCCSelections();
        if (cc) {
          race = (cc.race && cc.race.id) ? cc.race.id : (cc.race || 'human');
          gender = cc.gender || 'male';
        }
      }
      
      if (isRace) {
        race = id;
      }
      
      filename = `characters/character/${race}_${gender}.png`;
    } else {
      const npcIds = ['gorro', 'velara', 'thrak', 'seldris', 'brennan', 'mara', 'lyra', 'theron', 'drow_spy', 'mysterious_figure'];
      const isItem = id.startsWith('potion_') || id.startsWith('ring_') || id.startsWith('amulet_') || id.startsWith('cloak_') ||
                     ['elixir_gods', 'antidote', 'mana_potion', 'rage_brew', 'smoke_bomb', 'holy_water', 'poison_vial', 'flash_powder',
                      'dagger_rusty', 'short_sword', 'longsword', 'greataxe', 'rapier', 'elven_blade', 'staff_arcane', 'staff_of_power',
                      'vorpal_sword', 'bow_short', 'bow_long', 'war_axe', 'morningstar', 'cursed_blade', 'frostbrand', 'flametongue',
                      'dragon_claw', 'rags', 'leather_armor', 'hide_armor', 'chain_shirt', 'chainmail', 'plate_armor', 'elven_mail',
                      'mithral_armor', 'dragonhide', 'cursed_mail'].includes(id);
                      
      if (isItem) {
        filename = `objects/${id}.png`;
      } else if (npcIds.includes(id)) {
        filename = `characters/npc/${id}.png`;
      } else {
        filename = `mob/${id}.png`;
      }
    }
    
    if (filename) {
      let filter = '';
      const lowerName = (name || '').toLowerCase();
      if (lowerName.includes('red') || lowerName.includes('rojo') || lowerName.includes('fire') || lowerName.includes('fuego') || lowerName.includes('flame') || lowerName.includes('flama') || lowerName.includes('ash') || lowerName.includes('burning')) {
        filter = 'hue-rotate(-10deg) saturate(1.8) brightness(1.1)';
      } else if (lowerName.includes('blue') || lowerName.includes('azul') || lowerName.includes('storm') || lowerName.includes('tormenta') || lowerName.includes('lightning') || lowerName.includes('rayo')) {
        filter = 'hue-rotate(190deg) saturate(2) brightness(1.2)';
      } else if (lowerName.includes('green') || lowerName.includes('verde') || lowerName.includes('poison') || lowerName.includes('veneno') || lowerName.includes('acid') || lowerName.includes('ácido')) {
        filter = 'hue-rotate(90deg) saturate(2) brightness(1.1)';
      } else if (lowerName.includes('shadow') || lowerName.includes('sombra') || lowerName.includes('black') || lowerName.includes('negro') || lowerName.includes('void') || lowerName.includes('vacío') || lowerName.includes('death') || lowerName.includes('muerte') || lowerName.includes('dark') || lowerName.includes('oscuro')) {
        filter = 'brightness(0.25) contrast(2.5) drop-shadow(0 0 8px rgba(139,92,246,0.6))';
      } else if (lowerName.includes('white') || lowerName.includes('blanco') || lowerName.includes('ice') || lowerName.includes('hielo') || lowerName.includes('frost') || lowerName.includes('helado') || lowerName.includes('winter') || lowerName.includes('invierno') || lowerName.includes('silver') || lowerName.includes('plateado')) {
        filter = 'hue-rotate(170deg) brightness(1.4) saturate(0.6)';
      } else if (lowerName.includes('gold') || lowerName.includes('dorado') || lowerName.includes('yellow') || lowerName.includes('amarillo') || lowerName.includes('sun') || lowerName.includes('sol') || lowerName.includes('brass') || lowerName.includes('latón') || lowerName.includes('bronze') || lowerName.includes('bronce')) {
        filter = 'hue-rotate(30deg) saturate(2.5) brightness(1.2)';
      }
      
      let scale = 1.0;
      const lowerSize = (size || '').toLowerCase();
      if (lowerSize.includes('tiny') || lowerSize.includes('diminuto') || lowerSize.includes('pequeño') && lowerName.includes('small')) scale = 0.7;
      else if (lowerSize.includes('small') || lowerSize.includes('pequeño')) scale = 0.85;
      else if (lowerSize.includes('large') || lowerSize.includes('grande')) scale = 1.25;
      else if (lowerSize.includes('huge') || lowerSize.includes('enorme')) scale = 1.5;
      else if (lowerSize.includes('gargantuan') || lowerSize.includes('gargantuesco')) scale = 1.8;
      
      const style = `filter: ${filter || 'none'}; transform: scale(${scale}); transform-origin: bottom center;`;
      return `<img src="assets/sprites/${filename}" class="dnd-sprite-img" style="${style}" alt="${esc(defaultEmoji)}" onerror="this.style.display='none'; this.nextElementSibling.style.display='inline-block';">` +
             `<span class="dnd-sprite-emoji-fallback" style="display:none;">${esc(defaultEmoji)}</span>`;
    }
    return `<span>${esc(defaultEmoji)}</span>`;
  };

})(window);

// ============================================================
// PART 2 — GAME DATA: RACES (12 total, 2 secret)
// ============================================================
(function(root) {
  'use strict';

  const RACES = [
    {
      id: 'human', name: 'Humano', icon: '🧑', hidden: false,
      genders: {
        male: { name: 'Humano', icon: '👨' },
        female: { name: 'Humana', icon: '👩' }
      },
      desc: 'Adaptables y ambiciosos. La raza que domina el mundo por pura determinación y voluntad.',
      lore: 'Los humanos son la raza más joven, pero la más extendida. Nacen sin magia innata, pero con algo más poderoso: ambición sin límite.',
      bonuses: { str:1, dex:1, con:1, int:1, wis:1, cha:1 },
      traits: [
        { name:'Versatilidad', desc:'Un talento adicional a elegir al inicio.' },
        { name:'Determinación', desc:'+1 a todos los saving throws.' },
        { name:'Diplomacia Natural', desc:'+2 a chequeos de Persuasión.' }
      ],
      speedBonus: 0, hpBonus: 0, specialUnlock: null
    },
    {
      id: 'elf', name: 'Elfo', icon: '🧝', hidden: false,
      genders: {
        male: { name: 'Elfo', icon: '🧝‍♂️' },
        female: { name: 'Elfa', icon: '🧝‍♀️' }
      },
      desc: 'Gráciles e inmortales. Los elfos ven pasar siglos como humanos ven pasar años.',
      lore: 'Los elfos nacieron del sueño del mundo. Su magia es intuición, su longevidad una carga tanto como un don.',
      bonuses: { dex:2, int:1 },
      traits: [
        { name:'Visión Oscura', desc:'Ves en penumbra como si fuera luz normal (60 pies).' },
        { name:'Sentidos Élficos', desc:'+2 a Percepción. Inmune a sueño mágico.' },
        { name:'Canto del Trance', desc:'No necesitas dormir. Meditas 4h en lugar de 8h.' },
        { name:'Herencia Arcana', desc:'Conoces el truco Prestidigitación de forma innata.' }
      ],
      speedBonus: 0, hpBonus: 0, specialUnlock: 'cantrip_prestidigitation'
    },
    {
      id: 'halfelf', name: 'Semielfo', icon: '🧑‍🦱', hidden: false,
      genders: {
        male: { name: 'Semielfo', icon: '👨‍🦱' },
        female: { name: 'Semielfa', icon: '👩‍🦱' }
      },
      desc: 'Entre dos mundos. Los semielfo cargan el don de la empatía y la versatilidad como pocos.',
      lore: 'Rechazados por los elfos por ser demasiado humanos, y por los humanos por ser demasiado élficos, los semielfo aprendieron a sobrevivir solos.',
      bonuses: { cha:2, dex:1, int:1 },
      traits: [
        { name:'Herencia Feérica', desc:'Ventaja en saving throws contra encantamiento.' },
        { name:'Adaptabilidad', desc:'Competencia en dos habilidades a elección.' },
        { name:'Visión Oscura', desc:'Visión en penumbra 60 pies.' }
      ],
      speedBonus: 0, hpBonus: 0, specialUnlock: null
    },
    {
      id: 'dwarf', name: 'Enano', icon: '⛏️', hidden: false,
      genders: {
        male: { name: 'Enano', icon: '🧔' },
        female: { name: 'Enana', icon: '🧔‍♀️' }
      },
      desc: 'Duros como la roca que moldean. Ninguna raza iguala su resistencia ni su terquedad.',
      lore: 'Los enanos tallaron sus hogares en las entrañas de la montaña. Cada cicatriz es una historia, cada forja un legado.',
      bonuses: { con:2, str:1 },
      traits: [
        { name:'Resistencia Enana', desc:'Ventaja en saving throws contra veneno. Resistencia a daño veneno.' },
        { name:'Combate Enano', desc:'Competencia con hachas y martillos de guerra.' },
        { name:'Visión de Forja', desc:'+2 a chequeos con herramientas de herrero.' },
        { name:'Estabilidad', desc:'No puedes ser empujado ni derribado involuntariamente.' }
      ],
      speedBonus: -5, hpBonus: 2, specialUnlock: null
    },
    {
      id: 'tiefling', name: 'Tiefling', icon: '😈', hidden: false,
      genders: {
        male: { name: 'Tiefling', icon: '😈' },
        female: { name: 'Tiefling', icon: '👿' }
      },
      desc: 'Marcados por el pacto infernal de un ancestro. Hermosos, peligrosos y malentendidos.',
      lore: 'El pacto del ancestro dejó su marca para siempre: cuernos, cola y ojos que brillan en la oscuridad. La gente los mira con miedo. Es su error.',
      bonuses: { cha:2, int:1 },
      traits: [
        { name:'Resistencia Infernal', desc:'Resistencia a daño de fuego.' },
        { name:'Legado Infernal', desc:'Conoces Taumaturgia, luego Represalia Infernal y Oscuridad.' },
        { name:'Visión Oscura', desc:'60 pies de visión en penumbra.' }
      ],
      speedBonus: 0, hpBonus: 0, specialUnlock: 'spell_hellish_rebuke'
    },
    {
      id: 'dragonborn', name: 'Dracónido', icon: '🐲', hidden: false,
      genders: {
        male: { name: 'Dracónido', icon: '🐲' },
        female: { name: 'Dracónida', icon: '🐉' }
      },
      desc: 'Descendientes de dragones. Porte majestuoso, aliento devastador, honor inquebrantable.',
      lore: 'Cuando un dragonborn toma aliento profundo, incluso los dragones lo notan. No son mitad dragón. Son la esencia del dragón en forma bípeda.',
      bonuses: { str:2, cha:1 },
      traits: [
        { name:'Arma de Aliento', desc:'Exhalas fuego (o el elemento de tu linaje) causando 2d6 daño. Recarga en combate.' },
        { name:'Resistencia Dracónica', desc:'Resistencia al tipo elemental de tu linaje.' },
        { name:'Presencia Dracónica', desc:'+1 a Intimidación.' }
      ],
      speedBonus: 0, hpBonus: 2, specialUnlock: 'breath_weapon'
    },
    {
      id: 'orc', name: 'Orco', icon: '👹', hidden: false,
      genders: {
        male: { name: 'Orco', icon: '👹' },
        female: { name: 'Orca', icon: '👩‍🎤' }
      },
      desc: 'Fuerza descomunal y espíritu indomable. Los orcos no retroceden ante nada.',
      lore: 'Forjados en guerras interminables, los orcos viven intensamente. Cada batalla es un poema. Cada victoria, un altar.',
      bonuses: { str:2, con:1 },
      traits: [
        { name:'Agresivo', desc:'Como acción bonus, te mueves hacia un enemigo sin provocar ataques de oportunidad.' },
        { name:'Resistencia Implacable', desc:'Una vez por descanso, cuando cae a 0 HP, quedas en 1 HP en su lugar.' },
        { name:'Poderoso', desc:'+1 a daño con armas cuerpo a cuerpo.' }
      ],
      speedBonus: 0, hpBonus: 2, specialUnlock: null
    },
    {
      id: 'halforc', name: 'Semiorco', icon: '🧌', hidden: false,
      genders: {
        male: { name: 'Semiorco', icon: '🧌' },
        female: { name: 'Semiorca', icon: '🧌‍♀️' }
      },
      desc: 'Nacidos de dos mundos. Heredan la tenacidad y la ferocidad de los orcos junto a la versatilidad de los humanos.',
      lore: 'Los semiorcos a menudo caminan en el filo de la navaja entre la civilización y lo salvaje, impulsados por una pasión que quema intensamente.',
      bonuses: { str:2, con:1 },
      traits: [
        { name:'Ataques Salvajes', desc:'Cuando logras un golpe crítico cuerpo a cuerpo, puedes tirar uno de los dados de daño de tu arma una vez más y añadirlo al daño adicional.' },
        { name:'Resistencia Implacable', desc:'Si caes a 0 HP, puedes elegir quedar con 1 HP en su lugar (1 vez por descanso largo).' },
        { name:'Amenazante', desc:'+2 a chequeos de Intimidación.' }
      ],
      speedBonus: 0, hpBonus: 1, specialUnlock: null
    },
    {
      id: 'halfling', name: 'Mediano', icon: '🧒', hidden: false,
      genders: {
        male: { name: 'Mediano', icon: '👦' },
        female: { name: 'Mediana', icon: '👧' }
      },
      desc: 'Pequeños en estatura, inmensos en suerte. El universo conspira a su favor.',
      lore: 'Los medianos rara vez buscan aventuras, pero cuando las encuentran, el destino parece protegerlos. ¿Es suerte? ¿O algo más?',
      bonuses: { dex:2, cha:1 },
      traits: [
        { name:'Afortunado', desc:'Cuando sacas un 1 en un d20, puedes volver a tirar y debes usar el nuevo resultado.' },
        { name:'Valiente', desc:'Ventaja en saving throws contra miedo.' },
        { name:'Sigilo Natural', desc:'Puedes moverte a través del espacio de una criatura más grande sin penalización.' }
      ],
      speedBonus: -5, hpBonus: 0, specialUnlock: null
    },
    {
      id: 'gnome', name: 'Gnomo', icon: '🧙', hidden: false,
      genders: {
        male: { name: 'Gnomo', icon: '🧙‍♂️' },
        female: { name: 'Gnoma', icon: '🧙‍♀️' }
      },
      desc: 'Brillantes, curiosos y llenos de energía. Los gnomos ven maravillas donde otros ven piedras.',
      lore: 'Un gnomo nunca tiene suficientes inventos a medio terminar, libros a medio leer ni preguntas a medio responder. La vida es demasiado corta incluso para ellos.',
      bonuses: { int:2, dex:1 },
      traits: [
        { name:'Astucia Gnómica', desc:'Ventaja en saving throws de INT, WIS y CHA contra magia.' },
        { name:'Cunning Mind', desc:'+2 a chequeos de Arcana y Historia.' },
        { name:'Hablar con Animales Pequeños', desc:'Puedes comunicar ideas simples a insectos y roedores.' }
      ],
      speedBonus: -5, hpBonus: 0, specialUnlock: null
    },
    {
      id: 'aasimar', name: 'Aasimar', icon: '👼', hidden: true,
      genders: {
        male: { name: 'Aasimar', icon: '👼' },
        female: { name: 'Aasimara', icon: '👼' }
      },
      desc: 'Tocados por lo divino. Luz que camina entre sombras.',
      lore: 'Se dice que los aasimar son el eco de una promesa divina. Cada uno lleva en su interior la chispa de algo mayor. Algunos la abrazan. Otros la temen.',
      bonuses: { cha:2, wis:1 },
      traits: [
        { name:'Resistencia Celestial', desc:'Resistencia a daño radiante y necrótico.' },
        { name:'Manos Sanadoras', desc:'Curas HP = tu nivel una vez por descanso largo.' },
        { name:'Alma Radiante', desc:'Una vez por descanso, emites luz y causas daño radiante adicional por nivel rounds.' },
        { name:'Idiomas Celestiales', desc:'Puedes leer escrituras sagradas de cualquier religión.' }
      ],
      speedBonus: 0, hpBonus: 0, specialUnlock: 'radiant_soul',
      unlockCondition: 'Completa una quest de ayuda a NPCs o sobrevive con < 5 HP durante 3 combates.'
    },
    {
      id: 'drow', name: 'Drow', icon: '🌑', hidden: true,
      genders: {
        male: { name: 'Drow (Hombre)', icon: '🧝‍♂️' },
        female: { name: 'Drow (Mujer)', icon: '🧝‍♀️' }
      },
      desc: 'Elfos de la oscuridad. Maestros de veneno, magia y traición. O redención.',
      lore: 'Exiliados al Subsuelo por sus oscuros dioses, los Drow construyeron una civilización de cruel belleza. Unos pocos escapan a la superficie buscando algo que sus coterráneos olvidaron: libertad.',
      bonuses: { dex:2, int:1, cha:1 },
      traits: [
        { name:'Visión Profunda', desc:'Visión en oscuridad total hasta 120 pies.' },
        { name:'Sensibilidad a la Luz Solar', desc:'Desventaja en ataques y Percepción con luz solar directa.' },
        { name:'Magia Drow', desc:'Fuego de Faerie, Oscuridad innatos. +2 a ataques con veneno.' },
        { name:'Resistencia Mágica', desc:'Ventaja en saving throws contra hechizos.' }
      ],
      speedBonus: 0, hpBonus: 0, specialUnlock: 'drow_magic',
      unlockCondition: 'Explora el Subsuelo o completa 10 combates nocturnos.'
    },
    {
      id: 'changeling', name: 'Cambiante', icon: '🎭', hidden: true,
      genders: {
        male: { name: 'Cambiante', icon: '🎭' },
        female: { name: 'Cambiante', icon: '🎭' }
      },
      desc: '??? . . . . . . . . . . .',
      lore: '[ CLASIFICADO — NIVEL DE ACCESO INSUFICIENTE ]',
      bonuses: { cha:2, dex:1 },
      traits: [
        { name:'Metamorfosis', desc:'Puedes cambiar tu apariencia física a voluntad como acción.' },
        { name:'Empatía Mental', desc:'+2 a chequeos de Perspicacia y Engaño.' },
        { name:'Identidad Múltiple', desc:'Puedes adoptar hasta 3 identidades únicas que recuerdan NPCs.' }
      ],
      speedBonus: 0, hpBonus: 0, specialUnlock: 'shapeshifter',
      unlockCondition: 'REDACTED',
      secretChance: 0.003
    }
  ];

  // ============================================================
  // PART 2b — GAME DATA: CLASSES (12 + 2 secret)
  // ============================================================

  const CLASSES = [
    {
      id: 'fighter', name: 'Guerrero', icon: '⚔️', color: '#ef4444', hidden: false,
      hd: 10, primaryStats: ['str', 'con'],
      desc: 'Maestro del combate. Sin magia, sin trucos. Solo acero y voluntad.',
      lore: 'El Guerrero no nació con dones arcanos ni bendiciones divinas. Forjó su poder en miles de horas de entrenamiento. Cada corte es perfecto. Cada defensa es instinto.',
      savingThrows: ['str', 'con'],
      armorProf: 'heavy', weaponProf: 'all', shieldProf: true,
      startingGold: 100,
      abilities: [
        { name:'Segundo Viento', icon:'💨', desc:'Recuperas 1d10+nivel HP como acción bonus. Recarga en combate.', uses:1, maxUses:1, recharge:'combat', type:'heal' },
        { name:'Asalto', icon:'⚡', desc:'Realizas un ataque adicional inmediato. Recarga en descanso.', uses:1, maxUses:1, recharge:'rest', type:'attack' },
        { name:'Estilo de Combate', icon:'🛡️', desc:'Defensa: +1 AC. Protección: impones desventaja a ataques contra aliados.', uses:-1, maxUses:-1, recharge:'passive', type:'passive' }
      ],
      bonusHP: 0, bonusAC: 1,
      spellcasting: false, specialMechanic: 'action_surge'
    },
    {
      id: 'wizard', name: 'Mago', icon: '🔮', color: '#7c3aed', hidden: false,
      hd: 6, primaryStats: ['int'],
      desc: 'La magia más pura y poderosa del mundo. Un precio por cada hechizo.',
      lore: 'Los Magos pasan décadas estudiando lo que otros no pueden ver: los hilos del tejido arcano que sostiene la realidad. Doblan esos hilos con precisión matemática.',
      savingThrows: ['int', 'wis'],
      armorProf: 'none', weaponProf: 'simple', shieldProf: false,
      startingGold: 60,
      abilities: [
        { name:'Recuperación Arcana', icon:'📖', desc:'Recuperas ranuras de conjuro = nivel/2 (redondeado) una vez por descanso corto.', uses:1, maxUses:1, recharge:'short', type:'utility' },
        { name:'Conjuro Potenciado', icon:'✨', desc:'El siguiente hechizo causa el doble de daño.', uses:1, maxUses:1, recharge:'rest', type:'buff' },
        { name:'Escudo Arcano', icon:'🔵', desc:'Reacción: +5 AC contra un ataque.', uses:1, maxUses:1, recharge:'rest', type:'defense' }
      ],
      bonusHP: -2, bonusAC: 0,
      spellcasting: true, specialMechanic: 'spellbook', startSpells: 4
    },
    {
      id: 'rogue', name: 'Pícaro', icon: '🗡️', color: '#d97706', hidden: false,
      hd: 8, primaryStats: ['dex'],
      desc: 'Sombras, veneno y el cuchillo en el momento preciso.',
      lore: 'El Pícaro no juega limpio. Nunca lo hizo. Pero tiene un código: sobrevivir. Y si hay que robar a los ricos para dárselo a los pobres, o solo a sí mismo, eso es un detalle.',
      savingThrows: ['dex', 'int'],
      armorProf: 'light', weaponProf: 'simple', shieldProf: false,
      startingGold: 80,
      abilities: [
        { name:'Ataque Furtivo', icon:'🌑', desc:'Si tienes ventaja o un aliado adyacente, +2d6 de daño extra.', uses:-1, maxUses:-1, recharge:'passive', type:'attack' },
        { name:'Acción Astuta', icon:'💨', desc:'Desenganche, Esconderse o Carrera como acción bonus.', uses:-1, maxUses:-1, recharge:'passive', type:'utility' },
        { name:'Esquiva', icon:'🌀', desc:'Si fallas el saving throw de un efecto de área, solo sufres la mitad del daño de la mitad.', uses:-1, maxUses:-1, recharge:'passive', type:'defense' }
      ],
      bonusHP: 0, bonusAC: 0,
      spellcasting: false, specialMechanic: 'sneak_attack'
    },
    {
      id: 'cleric', name: 'Clérigo', icon: '✝️', color: '#f9a825', hidden: false,
      hd: 8, primaryStats: ['wis'],
      desc: 'La voluntad divina hecha carne. Sanador, guerrero y juez.',
      lore: 'El Clérigo no solo reza. Actúa como brazo armado de su dios. Y su dios, a veces, le pide cosas que ningún alma mortal debería soportar.',
      savingThrows: ['wis', 'cha'],
      armorProf: 'heavy', weaponProf: 'simple', shieldProf: true,
      startingGold: 80,
      abilities: [
        { name:'Canal Divino: Consagrar', icon:'✨', desc:'Irradia energía sagrada. Los no-muertos cercanos tiran o huyen.', uses:1, maxUses:2, recharge:'rest', type:'utility' },
        { name:'Curación Divina', icon:'💚', desc:'Curas 2d8+WIS HP a ti mismo o a un aliado.', uses:2, maxUses:3, recharge:'rest', type:'heal' },
        { name:'Ira Sagrada', icon:'🌟', desc:'Siguiente ataque causa daño radiante adicional = WIS mod.', uses:2, maxUses:2, recharge:'rest', type:'buff' }
      ],
      bonusHP: 0, bonusAC: 1,
      spellcasting: true, specialMechanic: 'channel_divinity', startSpells: 3
    },
    {
      id: 'warlock', name: 'Brujo', icon: '👁️', color: '#6d28d9', hidden: false,
      hd: 8, primaryStats: ['cha'],
      desc: 'Un pacto con algo oscuro e inconmensurable. Poder sin límites, precio sin fin.',
      lore: 'El Brujo no pidió permiso para obtener su poder. Negoció. Y ahora hay algo en las profundidades del cosmos que conoce su nombre y espera ser repagado.',
      savingThrows: ['wis', 'cha'],
      armorProf: 'light', weaponProf: 'simple', shieldProf: false,
      startingGold: 70,
      abilities: [
        { name:'Explosión Éldritch', icon:'👁️', desc:'Proyectil de energía oscura: 1d10+CHA daño arcano. Rango: siempre.', uses:-1, maxUses:-1, recharge:'passive', type:'spell' },
        { name:'Maldición Hex', icon:'🔮', desc:'+1d6 daño al objetivo maldito + desventaja en una habilidad. Dura 3 turns.', uses:1, maxUses:2, recharge:'rest', type:'debuff' },
        { name:'Forma Demoníaca', icon:'😈', desc:'+2 AC, +1d6 daño, visión en oscuridad por 3 combates. Aterroriza al objetivo.', uses:1, maxUses:1, recharge:'rest', type:'transform' }
      ],
      bonusHP: 0, bonusAC: 0,
      spellcasting: true, specialMechanic: 'pact_magic', startSpells: 2
    },
    {
      id: 'paladin', name: 'Paladín', icon: '🛡️', color: '#fbbf24', hidden: false,
      hd: 10, primaryStats: ['str', 'cha'],
      desc: 'Justicia divina encarnada. Nadie más brillante. Nadie más peligroso.',
      lore: 'El Paladín no sigue una religión. Sigue un juramento. Y ese juramento es más sagrado que cualquier dios. Romperlo tiene consecuencias que ninguna deidad puede revertir.',
      savingThrows: ['wis', 'cha'],
      armorProf: 'heavy', weaponProf: 'all', shieldProf: true,
      startingGold: 120,
      abilities: [
        { name:'Imposición de Manos', icon:'🤲', desc:'Curas hasta 5×nivel HP total repartidos libremente entre objetivos.', uses:1, maxUses:1, recharge:'rest', type:'heal' },
        { name:'Golpe Divino', icon:'⚡', desc:'El siguiente ataque causa +2d8 daño radiante adicional.', uses:1, maxUses:2, recharge:'rest', type:'attack' },
        { name:'Aura de Protección', icon:'🌟', desc:'+CHA mod a todos los saving throws tuyos y de aliados cercanos.', uses:-1, maxUses:-1, recharge:'passive', type:'passive' }
      ],
      bonusHP: 2, bonusAC: 1,
      spellcasting: true, specialMechanic: 'divine_smite', startSpells: 2
    },
    {
      id: 'ranger', name: 'Explorador', icon: '🏹', color: '#16a34a', hidden: false,
      hd: 10, primaryStats: ['dex', 'wis'],
      desc: 'El ojo que ve antes de ser visto. El filo que llega antes de ser oído.',
      lore: 'El Explorador conoce cada sendero, cada trampa, cada rastro. Los monstruos de la oscuridad aprenden a temer al silencio de sus pasos antes de morir.',
      savingThrows: ['str', 'dex'],
      armorProf: 'medium', weaponProf: 'all', shieldProf: true,
      startingGold: 90,
      abilities: [
        { name:'Marca del Cazador', icon:'🎯', desc:'Marcas un objetivo: +1d6 daño y ventaja en rastreo. Dura el combate.', uses:2, maxUses:2, recharge:'rest', type:'debuff' },
        { name:'Golpe Coloso', icon:'🏹', desc:'Disparo de alta potencia: daño doble dado, ignora cobertura parcial.', uses:1, maxUses:2, recharge:'rest', type:'attack' },
        { name:'Enemigo Favorecido', icon:'🗺️', desc:'+2 daño y +2 rastreo contra el tipo de criatura elegida (bestia/no-muerto/humanoide).', uses:-1, maxUses:-1, recharge:'passive', type:'passive' }
      ],
      bonusHP: 0, bonusAC: 0,
      spellcasting: true, specialMechanic: 'hunters_mark', startSpells: 2
    },
    {
      id: 'bard', name: 'Bardo', icon: '🎵', color: '#ec4899', hidden: false,
      hd: 8, primaryStats: ['cha'],
      desc: 'Música, magia y palabras afiladas como dagas. El carisma hecho arma.',
      lore: 'El Bardo descubrió que la diferencia entre un cuento y la realidad es solo quién lo narra. Y nadie lo narra mejor que ellos.',
      savingThrows: ['dex', 'cha'],
      armorProf: 'light', weaponProf: 'simple', shieldProf: false,
      startingGold: 80,
      abilities: [
        { name:'Inspiración Bárdica', icon:'🎶', desc:'Otorgas un d6 a un aliado para añadir a su próxima tirada.', uses:3, maxUses:4, recharge:'rest', type:'buff' },
        { name:'Palabra Cortante', icon:'🗣️', desc:'Un enemigo hace −1d4 a su siguiente ataque o saving throw.', uses:2, maxUses:3, recharge:'rest', type:'debuff' },
        { name:'Canción de Descanso', icon:'🎼', desc:'Durante un descanso corto, todos recuperan 1d6 HP adicionales.', uses:1, maxUses:1, recharge:'rest', type:'heal' }
      ],
      bonusHP: 0, bonusAC: 0,
      spellcasting: true, specialMechanic: 'bardic_inspiration', startSpells: 3
    },
    {
      id: 'barbarian', name: 'Bárbaro', icon: '🪓', color: '#dc2626', hidden: false,
      hd: 12, primaryStats: ['str', 'con'],
      desc: 'Furia primitiva que rompe armaduras y aplasta voluntades.',
      lore: 'El Bárbaro no necesita armadura. Su cuerpo es la armadura. Su rabia es la magia. Los académicos estudian por años lo que él hace por instinto.',
      savingThrows: ['str', 'con'],
      armorProf: 'medium', weaponProf: 'all', shieldProf: true,
      startingGold: 70,
      abilities: [
        { name:'Furia', icon:'🔥', desc:'+2 daño, resistencia a físico, ventaja en STR. Dura 3 rounds. 2/descanso.', uses:2, maxUses:3, recharge:'rest', type:'buff' },
        { name:'Ataque Temerario', icon:'💥', desc:'Ventaja en todos los ataques este turno, pero enemigos tienen ventaja en ataques contra ti.', uses:-1, maxUses:-1, recharge:'passive', type:'attack' },
        { name:'Defensa Sin Armadura', icon:'💪', desc:'AC = 10 + DEX mod + CON mod cuando no llevas armadura.', uses:-1, maxUses:-1, recharge:'passive', type:'passive' }
      ],
      bonusHP: 4, bonusAC: 0,
      spellcasting: false, specialMechanic: 'rage'
    },
    {
      id: 'monk', name: 'Monje', icon: '🥋', color: '#0891b2', hidden: false,
      hd: 8, primaryStats: ['dex', 'wis'],
      desc: 'El cuerpo como arma perfecta. La mente como su filo.',
      lore: 'El Monje pasó décadas vaciando su mente para llenarla de algo que no tiene nombre. Ahora sus manos se mueven más rápido que el pensamiento y su voluntad dobla el ki.',
      savingThrows: ['str', 'dex'],
      armorProf: 'none', weaponProf: 'simple', shieldProf: false,
      startingGold: 50,
      abilities: [
        { name:'Lluvia de Golpes', icon:'👊', desc:'Dos ataques adicionales con manos desnudas como acción bonus. Cuesta 1 ki.', uses:3, maxUses:4, recharge:'rest', type:'attack', bonusAction:true },
        { name:'Movimiento Etéreo', icon:'💨', desc:'Velocidad doble, ignoras terreno difícil, puedes caminar por paredes. Dura 1 round.', uses:1, maxUses:2, recharge:'rest', type:'utility' },
        { name:'Golpe Paralizante', icon:'⚡', desc:'El objetivo tira CON o queda Paralizado 1 round. Cuesta 1 ki.', uses:2, maxUses:3, recharge:'rest', type:'debuff' }
      ],
      bonusHP: 0, bonusAC: 1,
      spellcasting: false, specialMechanic: 'ki_points'
    },
    {
      id: 'druid', name: 'Druida', icon: '🌿', color: '#15803d', hidden: false,
      hd: 8, primaryStats: ['wis'],
      desc: 'La voz de la naturaleza. Puede ser la brisa que susurra o la tormenta que arrasa.',
      lore: 'El Druida no controla la naturaleza. La naturaleza lo usa como instrumento. Hablar con él es hablar con algo más viejo que las ciudades, más antiguo que los reinos.',
      savingThrows: ['int', 'wis'],
      armorProf: 'medium', weaponProf: 'simple', shieldProf: true,
      startingGold: 70,
      abilities: [
        { name:'Forma Salvaje', icon:'🐺', desc:'Te transformas en un animal (lobo o oso). HP extra, ataques naturales.', uses:2, maxUses:3, recharge:'rest', type:'transform' },
        { name:'Llamado de la Naturaleza', icon:'🌱', desc:'Invocas raíces que inmovilizan a un enemigo 2 rounds. STR save.', uses:2, maxUses:2, recharge:'rest', type:'debuff' },
        { name:'Tormenta de Esporas', icon:'🍄', desc:'Nube de esporas tóxicas: 2d6 veneno, envenenado 2 rounds. CON save.', uses:1, maxUses:2, recharge:'rest', type:'spell', statusEffect:'poisoned' }
      ],
      bonusHP: 0, bonusAC: 0,
      spellcasting: true, specialMechanic: 'wild_shape', startSpells: 3
    },
    {
      id: 'sorcerer', name: 'Hechicero', icon: '🌟', color: '#f97316', hidden: false,
      hd: 6, primaryStats: ['cha'],
      desc: 'La magia no lo estudió. Nació dentro de él. Y a veces se desborda.',
      lore: 'Donde el Mago estudia, el Hechicero recuerda. Tiene acceso a un poder que predeta los dioses, porque viene de algo más primordial: la sangre del cosmos.',
      savingThrows: ['con', 'cha'],
      armorProf: 'none', weaponProf: 'simple', shieldProf: false,
      startingGold: 60,
      abilities: [
        { name:'Metamagia: Potenciado', icon:'💥', desc:'Gasta 2 puntos de hechicería: el hechizo usa el dado de daño más alto.', uses:3, maxUses:4, recharge:'rest', type:'buff' },
        { name:'Metamagia: Distante', icon:'🌀', desc:'El hechizo alcanza el doble de rango. Gasta 1 punto.', uses:3, maxUses:4, recharge:'rest', type:'utility' },
        { name:'Torrente Arcano', icon:'⚡', desc:'Liberas toda tu magia: 3d8+CHA daño a todos los enemigos. Solo en emergencias.', uses:1, maxUses:1, recharge:'rest', type:'spell' },
        { name:'Oleada Salvaje', icon:'🌀', desc:'Libera tu magia salvaje deliberadamente: gatilla una oleada de magia caótica con efecto impredecible.', uses:2, maxUses:2, recharge:'rest', type:'wildmagic' }
      ],
      bonusHP: -2, bonusAC: 0,
      spellcasting: true, specialMechanic: 'wild_magic', startSpells: 4
    },
    // ─── SECRET CLASSES ────────────────────────────────────────
    {
      id: 'artificer', name: 'Artífice', icon: '⚙️', color: '#64748b', hidden: true,
      hd: 8, primaryStats: ['int'],
      desc: 'Magia y mecánica fundidas en creaciones imposibles.',
      lore: 'El Artífice vio lo que nadie más vio: que la magia y la tecnología son el mismo idioma escrito en distintos alfabetos. Sus creaciones son su magia.',
      savingThrows: ['con', 'int'],
      armorProf: 'medium', weaponProf: 'simple', shieldProf: true,
      startingGold: 100,
      abilities: [
        { name:'Infusión Mágica', icon:'⚙️', desc:'Infundes un item mundano con propiedades mágicas temporales.', uses:3, maxUses:4, recharge:'rest', type:'utility' },
        { name:'Centinela Arcano', icon:'🤖', desc:'Invocas un golem pequeño que ataca o defiende.', uses:1, maxUses:2, recharge:'rest', type:'summon' },
        { name:'Protocolo de Emergencia', icon:'💡', desc:'Automáticamente esquivas el primer ataque que te llevaría a 0 HP por combate.', uses:1, maxUses:1, recharge:'combat', type:'defense' }
      ],
      bonusHP: 0, bonusAC: 1,
      spellcasting: true, specialMechanic: 'infusions', startSpells: 2,
      unlockCondition: 'Fabrica 5 ítems en la forja o encuentra al Artífice Loco en el dungeon.'
    },
    {
      id: 'bloodhunter', name: 'Cazasangre', icon: '🩸', color: '#7f1d1d', hidden: true,
      hd: 10, primaryStats: ['str', 'int'],
      desc: 'Sacrifica su propia sangre para cazar lo que no debería existir.',
      lore: 'El Cazasangre renunció a parte de su humanidad para poder luchar contra lo inhumano. Cada Rito de Sangre le cuesta vida. Lo que gana en poder, lo pierde en sí mismo. Vale la pena.',
      savingThrows: ['dex', 'int'],
      armorProf: 'heavy', weaponProf: 'all', shieldProf: true,
      startingGold: 80,
      abilities: [
        { name:'Rito de Sangre: Fuego', icon:'🔥', desc:'Sacrificas 1d4 HP. Tu arma causa daño de fuego extra = dado del rito.', uses:-1, maxUses:-1, recharge:'passive', type:'buff' },
        { name:'Maldición de Sangre', icon:'🩸', desc:'Maldices al objetivo: cada vez que falla una tirada de salvación, sufre 1d8 extra.', uses:2, maxUses:3, recharge:'rest', type:'debuff' },
        { name:'Consumir Oscuridad', icon:'🌑', desc:'Absorbes energía oscura del objetivo derrotado: recuperas HP = nivel.', uses:2, maxUses:2, recharge:'rest', type:'heal' }
      ],
      bonusHP: 2, bonusAC: 0,
      spellcasting: false, specialMechanic: 'blood_maledict',
      unlockCondition: 'Muere y revive (en modo permadeath, lleva una vida de repuesto) o sobrevive a 3 bosses secretos.'
    }
  ];

  root._dndParts.RACES   = RACES;
  root._dndParts.CLASSES = CLASSES;
  console.log('%c[DND] Part 2 loaded — Races: ' + RACES.length + ', Classes: ' + CLASSES.length, 'color:#8b5cf6;');

})(window);

// ============================================================
// PART 3 — GAME DATA: BESTIARY (50+ enemies) & ITEMS (80+)
// ============================================================
(function(root) {
  'use strict';

  // ── ENEMIES ─────────────────────────────────────────────────
  // Fields: id, name, icon, hp, ac, atk(attack bonus), dmg(dice sides), cr(challenge rating),
  //         xp, gold(max), loot[], desc, lore, tier, type, traits[], boss?, secret?
  const CUSTOM_ENEMIES = [
    { id:'lich_minor',name:'Lich Menor',        icon:'💀', hp:135, ac:17, atk:7,  dmg:8,  cr:11,  xp:1100,gold:300,tier:4, type:'undead',   loot:['phylactery_fragment','necrotic_tome'], boss:true, traits:[{name:'Resistencia Legendaria',desc:'Falla → éxito 2/día.'}] },
    { id:'beholder',  name:'Contemplador',      icon:'👁️', hp:180, ac:18, atk:8,  dmg:10, cr:13,  xp:2000,gold:400,tier:5, type:'aberration', boss:true, secret:true,
      loot:['eye_stalk','antimagic_cone_fragment','beholder_eye'],
      desc:'Un dios entre monstruos. Sus ojos son armas. Su paranoia, una muralla.',
      traits:[
        {name:'Antimagia Central',desc:'Cuando su ojo central mira hacia ti, eres un objetivo de campo antimagia.'},
        {name:'Rayos de Ojo',desc:'Cada ronda dispara d3 rayos diferentes: disintegrar, paralizar, encantar, petrificar, dormir, matar.'}
      ]
    },
    { id:'dragon_ancient',name:'Dragón Anciano',icon:'🐉', hp:350, ac:22, atk:14, dmg:20, cr:24,  xp:5000,gold:1000,tier:5, type:'dragon', boss:true, secret:true,
      loot:['dragon_scale','hoard_key','legendary_egg'],
      imm:['fire'], phase2Msg:'¡El dragón ruge y su escama brilla al rojo vivo!',
      desc:'Viejo como montañas. Su inteligencia es la mayor amenaza. Su fuego, solo la más visible.',
      traits:[
        {name:'Resistencia Legendaria',desc:'Puede convertir fallos en éxitos 3 veces por día.'},
        {name:'Aliento de Fuego',desc:'Cono 90ft, 26d6 fuego, DEX save DC21 mitad.'},
        {name:'Presencia Aterradora',desc:'Todos en 120ft tiran WIS o Aterrados 1 min.'}
      ]
    },
    { id:'katosx_shade',name:'Sombra de Katosx',icon:'👤', hp:200, ac:20, atk:10, dmg:12, cr:20,  xp:3000,gold:500,tier:5, type:'construct', boss:true, secret:true,
      loot:['fragment_of_code','debug_token','katosx_memory'],
      desc:'Una entidad digital hecha carne. ¿Es el creador? ¿O algo que se quedó atrapado en el código?',
      lore:'Dicen que cuando el programador durmió mientras el servidor corría, algo en el código tomó forma. No tiene nombre propio. Lleva el del programador como ironía.',
      phase2Msg:'"git push --force origin life"',
      traits:[
        {name:'Metaparadoja',desc:'Cada vez que usas una habilidad especial, este enemigo aprende a contrarrestarla el próximo turno.'},
        {name:'Stack Overflow',desc:'Al caer a 50% HP, divide su HP en dos instancias. Debes eliminar ambas.'},
        {name:'Git Revert',desc:'1/combate puede "deshacer" el daño de un turno.'}
      ]
    },
    { id:'elder_brain',name:'Cerebro Anciano',  icon:'🧠', hp:210, ac:10, atk:7,  dmg:10, cr:14,  xp:2300,gold:350,tier:5, type:'aberration', boss:true, secret:true,
      loot:['elder_thought','mindflayer_crown'],
      traits:[{name:'Red Psíquica',desc:'Invoca 1d3 Devoradores de Mentes por ronda hasta máx 3.'}]
    },
    { id:'death_knight',name:'Caballero de la Muerte',icon:'💀',hp:180, ac:20, atk:11, dmg:16, cr:17, xp:3500,gold:600,tier:5, type:'undead', boss:true, secret:true,
      loot:['cursed_blade','phylactery_fragment'],
      desc:'Paladín caído, protegido por placas malditas y espada de fuego infernal.',
      traits:[
        {name:'Aliento del Averno',desc:'1/combate: estalla una esfera de fuego de 4d6 (DEX save DC16 mitad).'},
        {name:'Resistencia Mágica',desc:'Ventaja en todas las tiradas de salvación contra hechizos.'}
      ]
    },
    { id:'mummy_lord',name:'Señor de las Momias',icon:'🏺',hp:97,  ac:17, atk:9,  dmg:12, cr:15, xp:3000,gold:500,tier:5, type:'undead', boss:true, secret:true,
      loot:['crypt_key','gold_urn'],
      desc:'Faraón maldito del desierto profundo, portador del contagio de la momia.',
      traits:[{name:'Pudrición de Momia',desc:'Si golpea, CON save DC15 o Envenenado y no puede recuperar HP durante 3 rounds.'}]
    },
    { id:'balor',     name:'Señor del Balor',   icon:'🔥', hp:262, ac:19, atk:14, dmg:20, cr:19, xp:4000,gold:800,tier:5, type:'fiend',  boss:true, secret:true,
      loot:['fiend_whip','brimstone'],
      desc:'General demoníaco envuelto en llamas, con látigo de fuego y espada relámpago.',
      traits:[{name:'Aura de Fuego',desc:'Al final de cada turno, causa 1d8 daño de fuego automático al jugador.'}]
    },
    { id:'pit_fiend', name:'Señor del Foso (Pit Fiend)',icon:'👿',hp:300, ac:19, atk:14, dmg:20, cr:20, xp:4500,gold:900,tier:5, type:'fiend',  boss:true, secret:true,
      loot:['fiend_horn','hellfire_armor'],
      desc:'Señor del infierno con alas de murciélago, mordedura venenosa y voluntad indomable.',
      traits:[{name:'Mordedura Infecciosa',desc:'CON save DC16 o Envenenado y sufre 2d6 daño de veneno por turno.'}]
    },
    { id:'tarrasque',  name:'Tarrasque Legendario',icon:'🦖',hp:676, ac:25, atk:19, dmg:30, cr:30, xp:10000,gold:3000,tier:5, boss:true, secret:true,
      loot:['dragon_scale','hoard_key','legendary_egg'],
      desc:'El destructor definitivo de mundos. La bestia que duerme en el núcleo terrestre.',
      traits:[
        {name:'Reflejo Mágico',desc:'15% de probabilidad de reflejar cualquier hechizo directamente al jugador.'},
        {name:'Caparazón Impenetrable',desc:'Inmune a proyectiles mágicos y flechas normales. CA insuperable.'}
      ]
    },
    { id:'mimic_chest',name:'Gran Mímico',      icon:'🗃️', hp:58,  ac:12, atk:5,  dmg:8,  cr:2,   xp:200, gold:100,tier:2, type:'monstrosity', secret:true,
      loot:['random_item','random_item','adhesive_goo'],
      desc:'Llega décadas fingiendo ser un cofre del tesoro. Es muy bueno.', traits:[{name:'Aferrar',desc:'CON save DC13 o Aferrado. Ventaja en ataques contra objetivo aferrado.'}]
    },
    { id:'mimic_door', name:'Mímico Puerta',    icon:'🚪', hp:40,  ac:14, atk:5,  dmg:8,  cr:2,   xp:200, gold:80, tier:2, type:'monstrosity', secret:true,
      loot:['random_item','adhesive_goo'], desc:'¿Por qué la puerta tiene dientes?', traits:[]
    },
    { id:'el_decano',  name:'El Decano de UPRO',icon:'👨‍🏫',hp:100, ac:16, atk:8,  dmg:8,  cr:8,   xp:800, gold:0,  tier:4, type:'humanoid', boss:true, secret:true,
      loot:['grade_correction','rubber_stamp'],
      desc:'"¿Dónde está tu informe del IEEE?", susurra mientras lanza un conjuro de Burocracia Letal.',
      lore:'Nadie sabe desde cuándo está en la facultad. Algunos dicen que es más viejo que el edificio.',
      phase2Msg:'"¡RECURSO DENEGADO! ¡Les llamaré a las autoridades académicas!"',
      traits:[{name:'Tecnicismo Fatal',desc:'Si fallas un saving throw, también pierdes acceso a una habilidad por 2 rounds (trabas administrativas).'}]
    },
    { id:'goblin_king',  name:'Rey Goblin Krax',     icon:'👑', hp:52,  ac:16, atk:5,  dmg:8,  cr:2,   xp:400, gold:80, tier:1, type:'humanoid', boss:true,
      loot:['goblin_ear','dagger_rusty','short_sword'],
      desc:'"¡Krax aplastará! ¡Krax matará! ¡Krax... huirá si es necesario!" Su corona es un cuchillo oxidado atado con cuero.',
      lore:'Lleva dos nombres: Krax el Devastador (el suyo) y "ese problema del norte" (el del alcalde). La disparidad lo obsesiona.',
      traits:[
        {name:'Grito de Batalla',desc:'Al inicio del combate, los goblins aliados ganan +2 ATK por 2 turnos.'},
        {name:'Cobardía Táctica',desc:'Por debajo de 25% HP, gana +3 AC al esquivar frenéticamente.'}
      ]
    },
    { id:'forest_guardian', name:'Guardián del Bosque', icon:'🌿', hp:95,  ac:15, atk:6,  dmg:10, cr:5,   xp:750, gold:60, tier:2, type:'fey', boss:true,
      loot:['wolf_pelt','elven_mail'],
      desc:'Una amalgama de raíces, piedra y algo antiguo. El bosque lo envió. No negocia.',
      lore:'No es malicioso. Es un guardián. Llevas semanas matando su fauna. Llegó el momento de la cuenta.',
      phase2Msg:'¡El guardián se fusiona con el bosque! Raíces y ramas lo envuelven.',
      traits:[
        {name:'Raíces Enredadoras',desc:'Al golpear, STR save DC13 o Restringido hasta el próximo turno.'},
        {name:'Regeneración del Bosque',desc:'Recupera 5 HP al inicio de su turno si hay menos del 50% de la localización explorada.'}
      ]
    }
  ];

  const RAW_BESTIARY_CSV = `aarakocra|1/4|humanoid (aarakocra)|Medium|12|13|fly|neutral good|\nabjurer|9|humanoid (any race)|Medium|12|84||any alignment|\naboleth|10|aberration|Large|17|135|swim|lawful evil|Legendary\nabominable-yeti|9|monstrosity|Huge|15|137||chaotic evil|\nacererak|23|undead|Medium|21|285||neutral evil|\nacolyte|1/4|humanoid (any race)|Medium|10|9||any alignment|\nadult-black-dragon|14|dragon|Huge|19|195|fly, swim|chaotic evil|Legendary\nadult-blue-dracolich|17|undead|Huge|19|225|fly|lawful evil|Legendary\nadult-blue-dragon|16|dragon|Huge|19|225|fly|lawful evil|Legendary\nadult-brass-dragon|13|dragon|Huge|18|172|fly|chaotic good|Legendary\nadult-bronze-dragon|15|dragon|Huge|19|212|fly, swim|lawful good|Legendary\nadult-copper-dragon|14|dragon|Huge|18|184|fly|chaotic good|Legendary\nadult-gold-dragon|17|dragon|Huge|19|256|fly, swim|lawful good|Legendary\nadult-green-dragon|15|dragon|Huge|19|207|fly, swim|lawful evil|Legendary\nadult-kruthik|2|monstrosity|Medium|18|39||unaligned|\nadult-oblex|5|ooze|Medium|14|75||lawful evil|\nadult-red-dragon|17|dragon|Huge|19|256|fly|chaotic evil|Legendary\nadult-silver-dragon|16|dragon|Huge|19|243|fly|lawful good|Legendary\nadult-white-dragon|13|dragon|Huge|18|200|fly, swim|chaotic evil|Legendary\nair-elemental|5|elemental|Large|15|90|fly|neutral|\nair-elemental-myrmidon|7|elemental|Medium|18|117|fly|neutral|\nalbino-dwarf-warrior|1/4|humanoid (dwarf)|Medium|13|30||any alignment|\nalhoon|10|undead|Medium|15|120||any evil alignment|\nalkilith|11|fiend (demon)|Medium|17|157||chaotic evil|\nallip|5|undead|Medium|13|40|fly|neutral evil|\nallosaurus|2|beast|Large|13|51||unaligned|\nambush-drake|1/2|dragon|Medium|13|22||unaligned|\namnizu|18|fiend (devil)|Medium|21|202|fly|lawful evil|\nancient-black-dragon|21|dragon|Gargantuan|22|367|fly, swim|chaotic evil|Legendary\nancient-blue-dragon|23|dragon|Gargantuan|22|481|fly|lawful evil|Legendary\nancient-brass-dragon|20|dragon|Gargantuan|20|297|fly|chaotic good|Legendary\nancient-bronze-dragon|22|dragon|Gargantuan|22|444|fly, swim|lawful good|Legendary\nancient-copper-dragon|21|dragon|Gargantuan|21|350|fly|chaotic good|Legendary\nancient-gold-dragon|24|dragon|Gargantuan|22|546|fly, swim|lawful good|Legendary\nancient-green-dragon|22|dragon|Gargantuan|21|385|fly, swim|lawful evil|Legendary\nancient-red-dragon|24|dragon|Gargantuan|22|546|fly|chaotic evil|Legendary\nancient-shadow|1|undead|Medium|13|32||chaotic evil|\nancient-silver-dragon|23|dragon|Gargantuan|22|487|fly|lawful good|Legendary\nancient-white-dragon|20|dragon|Gargantuan|20|333|fly, swim|chaotic evil|Legendary\nandrosphinx|17|monstrosity|Large|17|199|fly|lawful neutral|Legendary\nanimated-armor|1|construct|Medium|18|33||unaligned|\nankheg|2|monstrosity|Large|14|39||unaligned|\nankylosaurus|3|beast|Huge|15|68||unaligned|\nannis-hag|6|fey|Large|17|75||chaotic evil|\nape|1/2|beast|Medium|12|19||unaligned|\napprentice-wizard|1/4|humanoid (any race)|Medium|10|9||any alignment|\narcanaloth|12|fiend (yugoloth)|Medium|17|104|fly|neutral evil|\narchdruid|12|humanoid (any race)|Medium|16|132||any alignment|\narcher|3|humanoid (any race)|Medium|16|75||any alignment|\narchmage|12|humanoid (any race)|Medium|12|99||any alignment|\narmanite|7|fiend (demon)|Large|16|84||chaotic evil|\nassassin|8|humanoid (any race)|Medium|15|78||any non-good alignment|\nassassin-vine|3|plant|Large|13|85||unaligned|\nastral-dreadnought|21|monstrosity (titan)|Gargantuan|20|297|fly|unaligned|Legendary\natropal|13|undead (titan)|Huge|7|225|fly|neutral evil|\naurochs|2|beast|Large|11|38||unaligned|\nautumn-eladrin|10|fey (elf)|Medium|19|127||chaotic neutral|\nawakened-shrub|0|plant|Small|9|10||unaligned|\nawakened-tree|2|plant|Huge|13|59||unaligned|\naxe-beak|1/4|beast|Large|11|19||unaligned|\nazer|2|elemental|Medium|17|39||lawful neutral|\nbabau|4|fiend (demon)|Medium|16|82||chaotic evil|\nbaboon|0|beast|Small|12|3||unaligned|\nbadger|0|beast|Tiny|10|3||unaligned|\nbael|19|fiend (devil)|Large|18|189||lawful evil|\nbalhannoth|11|aberration|Large|17|114||chaotic evil|\nbalor|19|fiend (demon)|Huge|19|262|fly|chaotic evil|\nbanderhobb|5|monstrosity|Large|15|84||neutral evil|\nbandit|1/8|humanoid (any race)|Medium|12|11||any non-lawful alignment|\nbandit-captain|2|humanoid (any race)|Medium|15|65||any non-lawful alignment|\nbanshee|4|undead|Medium|12|58|fly|chaotic evil|\nbaphomet|23|fiend (demon)|Huge|22|275||chaotic evil|\nbarbed-devil|5|fiend (devil)|Medium|15|110||lawful evil|\nbard|2|humanoid (any race)|Medium|15|44||any alignment|\nbarghest|4|fiend (shapechanger)|Large|17|90||neutral evil|\nbarlgura|5|fiend (demon)|Large|15|68||chaotic evil|\nbasilisk|3|monstrosity|Medium|15|52||unaligned|\nbat|0|beast|Tiny|12|1|fly|unaligned|\nbearded-devil|3|fiend (devil)|Medium|13|52||lawful evil|\nbehir|11|monstrosity|Huge|17|168||neutral evil|\nbeholder|13|aberration|Large|18|180|fly|lawful evil|Legendary\nbeholder-zombie|5|undead|Large|15|93|fly|neutral evil|\nbelaphoss|20|fiend (demon)|Huge|19|262|fly|chaotic evil|\nberbalang|2|aberration|Medium|14|38|fly|neutral evil|\nberserker|2|humanoid (any race)|Medium|13|67||any chaotic alignment|\nbheur-hag|7|fey|Medium|17|91||chaotic evil|\nblack-abishai|7|fiend (devil)|Medium|15|58|fly|lawful evil|\nblack-bear|1/2|beast|Medium|11|19||unaligned|\nblack-dragon-wyrmling|2|dragon|Medium|17|33|fly, swim|chaotic evil|\nblack-gauntlet-of-bane|6|humanoid (human)|Medium|16|51||lawful evil|\nblack-pudding|4|ooze|Large|7|85||unaligned|\nblackguard|8|humanoid (any race)|Medium|18|153||any non-good alignment|\nblink-dog|1/4|fey|Medium|13|22||lawful good|\nblood-hawk|1/8|beast|Small|12|7|fly|unaligned|\nblue-abishai|17|fiend (devil)|Medium|19|195|fly|lawful evil|\nblue-dragon-wyrmling|3|dragon|Medium|17|52|fly|lawful evil|\nblue-slaad|7|aberration|Large|15|123||chaotic neutral|\nboar|1/4|beast|Medium|11|11||unaligned|\nbodak|6|undead|Medium|15|58||chaotic evil|\nboggle|1/8|fey|Small|14|18||chaotic neutral|\nbone-devil|9|fiend (devil)|Large|19|142|fly|lawful evil|\nbone-naga|4|undead|Large|15|58||lawful evil|\nboneclaw|12|undead|Large|16|127||chaotic evil|\nbrass-dragon-wyrmling|1|dragon|Medium|16|16|fly|chaotic good|\nbrontosaurus|5|beast|Gargantuan|15|121||unaligned|\nbronze-dragon-wyrmling|2|dragon|Medium|17|32|fly, swim|lawful good|\nbrown-bear|1|beast|Large|11|34||unaligned|\nbugbear|1|humanoid (goblinoid)|Medium|16|27||chaotic evil|\nbugbear-chief|3|humanoid (goblinoid)|Medium|17|65||chaotic evil|\nbulette|5|monstrosity|Large|17|94||unaligned|\nbulezau|3|fiend (demon)|Medium|14|52||chaotic evil|\nbullywug|1/4|humanoid (bullywug)|Medium|15|11|swim|neutral evil|\ncadaver-collector|14|construct|Large|17|189||lawful evil|\ncambion|5|fiend|Medium|19|82|fly|any evil alignment|\ncamel|1/8|beast|Large|9|15||unaligned|\ncanoloth|8|fiend (yugoloth)|Medium|16|120||neutral evil|\ncarrion-crawler|2|monstrosity|Large|13|51||unaligned|\ncat|0|beast|Tiny|12|2||unaligned|\ncatoblepas|5|monstrosity|Large|14|84||unaligned|\ncave-fisher|3|monstrosity|Medium|16|58||unaligned|\ncentaur|2|monstrosity|Large|12|45||neutral good|\nchain-devil|8|fiend (devil)|Medium|16|85||lawful evil|\nchampion|9|humanoid (any race)|Medium|18|143||any alignment|\nchasme|6|fiend (demon)|Large|15|84|fly|chaotic evil|\nchimera|6|monstrosity|Large|14|114|fly|chaotic evil|\nchitine|1/2|monstrosity|Small|14|18||chaotic evil|\nchoker|1|aberration|Small|16|13||chaotic evil|\ncholdrith|3|monstrosity|Medium|15|66||chaotic evil|\nchuul|4|aberration|Large|16|93|swim|chaotic evil|\nclay-golem|9|construct|Large|14|133||unaligned|\ncloaker|8|aberration|Large|14|78|fly|chaotic neutral|\ncloud-giant|9|giant|Huge|14|200||neutral good |\ncloud-giant-smiling-one|11|giant (cloud giant)|Huge|15|262||chaotic neutral|\ncockatrice|1/2|monstrosity|Small|11|27|fly|unaligned|\ncommoner|0|humanoid (any race)|Medium|10|4||any alignment|\nconjurer|6|humanoid (any race)|Medium|12|40||any alignment|\nconstrictor-snake|1/4|beast|Large|12|13|swim|unaligned|\ncopper-dragon-wyrmling|1|dragon|Medium|16|22|fly|chaotic good|\ncorpse-flower|8|plant|Large|12|127||chaotic evil|\ncouatl|4|celestial|Medium|19|97|fly|lawful good|\ncow|1/4|beast|Large|10|15||unaligned|\ncrab|0|beast|Tiny|11|2|swim|unaligned|\ncrag-cat|1|beast|Large|13|34||unaligned|\ncranium-rat|0|beast|Tiny|12|2||lawful evil|\ncrawling-claw|0|undead|Tiny|12|2||neutral evil|\ncrocodile|1/2|beast|Large|12|19|swim|unaligned|\ncrokek-toeck|14|fiend (demon)|Gargantuan|15|297|swim|chaotic evil|\ncult-fanatic|2|humanoid (any race)|Medium|13|33||any non-good alignment|\ncultist|1/8|humanoid (any race)|Medium|12|9||any non-good alignment|\ncyclops|6|giant|Huge|14|138||chaotic neutral|\ndao|11|elemental|Large|18|187|fly|neutral evil|\ndarkling|1/2|fey|Small|14|13||chaotic neutral|\ndarkling-elder|2|fey|Medium|15|27||chaotic neutral|\ndarkmantle|1/2|monstrosity|Small|11|22|fly|unaligned|\ndeath-dog|1|monstrosity|Medium|12|39||neutral evil|\ndeath-kiss|10|aberration|Large|16|161|fly|neutral evil|\ndeath-knight|17|undead|Medium|20|180||chaotic evil|\ndeath-slaad|10|aberration (shapechanger)|Medium|18|170||chaotic evil|\ndeath-tyrant|14|undead|Large|19|187|fly|lawful evil|Legendary\ndeath-s-head-of-bhaal|5|humanoid (human)|Medium|15|76||chaotic evil|\ndeathlock|4|undead|Medium|12|36||neutral evil|\ndeathlock-mastermind|8|undead|Medium|13|110||neutral evil|\ndeathlock-wight|3|undead|Medium|12|37||neutral evil|\ndeep-gnome-svirfneblin|1/2|humanoid (gnome)|Small|15|16||neutral good|\ndeep-scion|3|humanoid (shapechanger)|Medium|11|67|swim|neutral evil|\ndeer|0|beast|Medium|13|4||unaligned|\ndeinonychus|1|beast|Medium|13|26||unaligned|\ndemilich|18|undead|Tiny|20|80|fly|neutral evil|Legendary\ndemogorgon|26|fiend (demon)|Huge|22|406|swim|chaotic evil|\nderro|1/4|humanoid (derro)|Small|13|13||chaotic evil|\nderro-savant|3|humanoid (derro)|Small|13|36||chaotic evil|\ndeva|10|celestial|Medium|17|136|fly|lawful good|\ndevilroot|7|plant|Medium|15|105||neutral evil|\ndevourer|13|fiend|Large|16|178||chaotic evil|\ndhergoloth|7|fiend (yugoloth)|Medium|15|119||neutral evil|\ndimetrodon|1/4|beast|Medium|12|19|swim|unaligned|\ndire-troll|13|giant|Huge|15|172||chaotic evil|\ndire-wolf|1|beast|Large|14|37||unaligned|\ndisplacer-beast|3|monstrosity|Large|13|85||lawful evil|\ndiviner|8|humanoid (any race)|Medium|12|67||any alignment|\ndjinni|11|elemental|Large|17|161|fly|chaotic good|\ndolphin|1/8|beast|Medium|12|11|swim|unaligned|\ndoppelganger|3|monstrosity (shapechanger)|Medium|14|52||neutral|\ndraegloth|7|fiend (demon)|Large|15|123||chaotic evil|\ndraft-horse|1/4|beast|Large|10|19||unaligned|\ndragon-turtle|17|dragon|Gargantuan|20|341|swim|neutral|\ndragonbait|5|humanoid (saurial)|Medium|17|120||lawful good|\ndretch|1/4|fiend (demon)|Small|11|18||chaotic evil|\ndrider|6|monstrosity|Large|19|123||chaotic evil|\ndrow|1/4|humanoid (elf)|Medium|15|13||neutral evil|\ndrow-arachnomancer|13|humanoid (elf)|Medium|15|162||chaotic evil|\ndrow-elite-warrior|5|humanoid (elf)|Medium|18|71||neutral evil|\ndrow-favored-consort|18|humanoid (elf)|Medium|15|225||neutral evil|\ndrow-house-captain|9|humanoid (elf)|Medium|16|162||neutral evil|\ndrow-inquisitor|14|humanoid (elf)|Medium|16|143||neutral evil|\ndrow-mage|7|humanoid (elf)|Medium|12|45||neutral evil|\ndrow-matron-mother|20|humanoid (elf)|Medium|17|262||neutral evil|\ndrow-priestress-of-lolth|8|humanoid (elf)|Medium|16|71||neutral evil|\ndrow-shadowblade|11|humanoid (elf)|Medium|17|150||neutral evil|\ndruid|2|humanoid (any race)|Medium|11|27||any alignment|\ndryad|1|fey|Medium|11|22||neutral|\nduergar|1|humanoid (dwarf)|Medium|16|26||lawful evil|\nduergar-despot|12|humanoid (dwarf)|Medium|21|119||lawful evil|\nduergar-kavalrachni|2|humanoid (dwarf)|Medium|16|26||lawful evil|\nduergar-mind-master|2|humanoid (dwarf)|Medium|14|39||lawful evil|\nduergar-soulblade|1|humanoid (dwarf)|Medium|14|18||lawful evil|\nduergar-stone-guard|2|humanoid (dwarf)|Medium|18|39||lawful evil|\nduergar-warlord|6|humanoid (dwarf)|Medium|20|75||lawful evil|\nduergar-xarrorn|2|humanoid (dwarf)|Medium|18|26||lawful evil|\nduodrone|1/4|construct|Medium|15|11||lawful neutral|\ndust-mephit|1/2|elemental|Small|12|17|fly|neutral evil|\ndybbuk|4|fiend (demon)|Medium|14|37|fly|chaotic evil|\neagle|0|beast|Small|12|3|fly|unaligned|\nearth-elemental|5|elemental|Large|17|126||neutral|\nearth-elemental-myrmidon|7|elemental|Medium|18|127||neutral|\neblis|1|monstrosity|Large|13|26|fly|neutral evil|\nefreeti|11|elemental|Large|17|200|fly|lawful evil|\neidolon|12|undead|Medium|9|63|fly|any alignment|\nelder-brain|14|aberration|Large|10|210|swim|lawful evil|Legendary\nelder-oblex|10|ooze|Huge|16|115||lawful evil|\nelder-tempest|23|elemental|Gargantuan|19|264|fly|neutral|\nelephant|4|beast|Huge|12|76||unaligned|\nelk|1/4|beast|Large|10|13||unaligned|\nempyrean|23|celestial (titan)|Huge|22|313|fly, swim|chaotic good |Legendary\nenchanter|5|humanoid (any race)|Medium|12|40||any alignment|\nerinyes|12|fiend (devil)|Medium|18|153|fly|lawful evil|\nettercap|2|monstrosity|Medium|13|44||neutral evil|\nettin|4|giant|Large|12|85||chaotic evil|\nevoker|9|humanoid (any race)|Medium|12|66||any alignment|\nexpert-lvl-1|0|humanoid (any race)|Medium|14|11||any alignment|\nexpert-lvl-2|0|humanoid (any race)|Medium|14|16||any alignment|\nexpert-lvl-3|0|humanoid (any race)|Medium|14|22||any alignment|\nexpert-lvl-4|0|humanoid (any race)|Medium|14|27||any alignment|\nexpert-lvl-5|0|humanoid (any race)|Medium|14|33||any alignment|\nexpert-lvl-6|0|humanoid (any race)|Medium|14|38||any alignment|\nfaerie-dragon|1|dragon|Tiny|15|14|fly|chaotic good|\nfemale-steeder|1|monstrosity|Large|14|30||unaligned|\nfire-elemental|5|elemental|Large|13|102||neutral|\nfire-elemental-myrmidon|7|elemental|Medium|18|123||neutral|\nfire-giant|9|giant|Huge|18|162||lawful evil|\nfire-giant-dreadnought|14|giant (fire giant)|Huge|21|187||lawful evil|\nfire-snake|1|elemental|Medium|14|22||neutral evil|\nfirenewt-warlock-of-imix|1|humanoid (firenewt)|Medium|10|33||neutral evil|\nfirenewt-warrior|1/2|humanoid (firenewt)|Medium|16|22||neutral evil|\nfist-of-bane|1/2|humanoid (human)|Medium|18|22||lawful evil|\nflail-snail|3|elemental|Large|16|52||unaligned|\nflameskull|4|undead|Tiny|13|40|fly|neutral evil|\nflesh-golem|5|construct|Medium|9|93||neutral|\nflind|9|humanoid (gnoll)|Medium|16|127||chaotic evil|\nflumph|1/8|aberration|Small|12|7|fly|lawful good|\nflying-snake|1/8|beast|Tiny|14|5|fly, swim|unaligned|\nflying-sword|1/4|construct|Small|17|17|fly|unaligned|\nfomorian|8|giant|Huge|14|149||chaotic evil|\nfraz-urb-luu|23|fiend (demon)|Large|18|337|fly|chaotic evil|\nfrog|0|beast|Tiny|11|1|swim|unaligned|\nfroghemoth|10|monstrosity|Huge|14|184|swim|unaligned|\nfrost-giant|8|giant|Huge|15|138||neutral evil|\nfrost-giant-everlasting-one|12|giant (frost giant)|Huge|15|189||chaotic evil|\nfrost-salamander|9|elemental|Huge|17|168||unaligned|\ngaleb-duhr|6|elemental|Medium|16|85||neutral|\ngargoyle|2|elemental|Medium|15|52|fly|chaotic evil|\ngas-spore|1/2|plant|Large|5|1|fly|unaligned|\ngauth|6|aberration|Medium|15|67|fly|lawful evil|\ngazer|1/2|aberration|Tiny|13|13|fly|neutral evil|\ngelatinous-cube|2|ooze|Large|6|84||unaligned|\ngeryon|22|fiend (devil)|Huge|19|300|fly|lawful evil|\nghast|2|undead|Medium|13|36||chaotic evil|\nghost|4|undead|Medium|11|45|fly|any alignment|\nghoul|1|undead|Medium|12|22||chaotic evil|\ngiant-ape|7|beast|Huge|12|157||unaligned|\ngiant-badger|1/4|beast|Medium|10|13||unaligned|\ngiant-bat|1/4|beast|Large|13|22|fly|unaligned|\ngiant-boar|2|beast|Large|12|42||unaligned|\ngiant-centipede|1/4|beast|Small|13|4||unaligned|\ngiant-constrictor-snake|2|beast|Huge|12|60|swim|unaligned|\ngiant-crab|1/8|beast|Medium|15|13|swim|unaligned|\ngiant-crocodile|5|beast|Huge|14|85|swim|unaligned|\ngiant-eagle|1|beast|Large|13|26|fly|neutral good|\ngiant-elk|2|beast|Huge|14|42||unaligned|\ngiant-fire-beetle|0|beast|Small|13|4||unaligned|\ngiant-four-armed-gargoyle|10|elemental|Large|17|147|fly|chaotic evil|\ngiant-frog|1/4|beast|Medium|11|18|swim|unaligned|\ngiant-goat|1/2|beast|Large|11|19||unaligned|\ngiant-hyena|1|beast|Large|12|45||unaligned|\ngiant-lizard|1/4|beast|Large|12|19||unaligned|\ngiant-octopus|1|beast|Large|11|52|swim|unaligned|\ngiant-owl|1/4|beast|Large|12|19|fly|neutral|\ngiant-poisonous-snake|1/4|beast|Medium|14|11|swim|unaligned|\ngiant-rat|1/8|beast|Small|12|7||unaligned|\ngiant-scorpion|3|beast|Large|15|52||unaligned|\ngiant-sea-horse|1/2|beast|Large|13|16|swim|unaligned|\ngiant-shark|5|beast|Huge|13|126|swim|unaligned|\ngiant-spider|1|beast|Large|14|26||unaligned|\ngiant-strider|1|monstrosity|Large|14|22||neutral evil|\ngiant-toad|1|beast|Large|11|39|swim|unaligned|\ngiant-two-headed-goat|1/2|beast|Large|11|19||unaligned|\ngiant-vulture|1|beast|Large|10|22|fly|neutral evil|\ngiant-wasp|1/2|beast|Medium|12|13|fly|unaligned|\ngiant-weasel|1/8|beast|Medium|13|9||unaligned|\ngiant-wolf-spider|1/4|beast|Medium|13|11||unaligned|\ngibbering-mouther|2|aberration|Medium|9|67|swim|neutral|\ngiff|3|humanoid|Medium|16|60||lawful neutral|\ngirallon|4|monstrosity|Large|13|59||unaligned|\ngithyanki-gish|10|humanoid (gith)|Medium|17|123||lawful evil|\ngithyanki-kith--rak|12|humanoid (gith)|Medium|18|180||lawful evil|\ngithyanki-knight|8|humanoid (gith)|Medium|18|91||lawful evil|\ngithyanki-supreme-commander|14|humanoid (gith)|Medium|18|187||lawful evil|\ngithyanki-warrior|3|humanoid (gith)|Medium|17|49||lawful evil|\ngithzerai-anarch|16|humanoid (gith)|Medium|20|144|fly|lawful neutral|\ngithzerai-enlightned|10|humanoid (gith)|Medium|18|112||lawful neutral|\ngithzerai-monk|2|humanoid (gith)|Medium|14|38||lawful neutral|\ngithzerai-zerth|6|humanoid (gith)|Medium|17|84||lawful neutral|\nglabrezu|9|fiend (demon)|Large|17|157||chaotic evil|\ngladiator|5|humanoid (any race)|Medium|16|112||any alignment|\ngloom-weaver|9|humanoid (elf)|Medium|14|104||neutral|\ngnoll|1/2|humanoid (gnoll)|Medium|15|22||chaotic evil|\ngnoll-fang-of-yeenoghu|4|fiend (gnoll)|Medium|14|65||chaotic evil|\ngnoll-flesh-gnawer|1|humanoid (gnoll)|Medium|14|22||chaotic evil|\ngnoll-hunter|1/2|humanoid (gnoll)|Medium|13|22||chaotic evil|\ngnoll-pack-lord|2|humanoid (gnoll)|Medium|15|49||chaotic evil|\ngnoll-witherling|1/4|undead|Medium|12|11||chaotic evil|\ngoat|0|beast|Medium|10|4||unaligned|\ngoblin|1/4|humanoid (goblinoid)|Small|15|7||neutral evil|\ngoblin-boss|1|humanoid (goblinoid)|Small|17|21||neutral evil|\ngold-dragon-wyrmling|3|dragon|Medium|17|60|fly, swim|lawful good|\ngorgon|5|monstrosity|Large|19|114||unaligned|\ngoristro|17|fiend (demon)|Huge|19|310||chaotic evil|\ngray-ooze|1/2|ooze|Medium|8|22||unaligned|\ngray-render|12|monstrosity|Large|19|189||chaotic neutral|\ngray-slaad|9|aberration (shapechanger)|Medium|18|127||chaotic neutral|\ngraz-zt|24|fiend (demon, shapechanger)|Large|20|346||chaotic evil|\ngreen-abishai|15|fiend (devil)|Medium|18|187|fly|lawful evil|\ngreen-dragon-wyrmling|2|dragon|Medium|17|38|fly, swim|lawful evil|\ngreen-hag|3|fey|Medium|17|82||neutral evil|\ngreen-slaad|8|aberration (shapechanger)|Large|16|127||chaotic neutral|\ngrell|3|aberration|Medium|12|55|fly|neutral evil|\ngrick|2|monstrosity|Medium|14|27||neutral|\ngrick-alpha|7|monstrosity|Large|18|75||neutral|\ngriffon|2|monstrosity|Large|12|59|fly|unaligned|\ngrimlock|1/4|humanoid (grimlock)|Medium|11|11||neutral evil|\ngrung|1/4|humanoid (grung)|Small|12|11||lawful evil|\ngrung-elite-warrior|2|humanoid (grung)|Small|13|49||lawful evil|\ngrung-wildling|1|humanoid (grung)|Small|13|27||lawful evil|\nguard|1/8|humanoid (any race)|Medium|16|11||any alignment|\nguard-drake|2|dragon|Medium|14|52||unaligned|\nguardian-naga|10|monstrosity|Large|18|127||lawful good|\ngynosphinx|11|monstrosity|Large|17|136|fly|lawful neutral|Legendary\nhalaster-blackcloak|23|humanoid (human)|Medium|14|246||chaotic evil|\nhalf-ogre|1|giant|Large|12|30||any chaotic alignment|\nhalf-red-dragon-veteran|5|humanoid (human)|Medium|18|65||any alignment|\nharpy|1|monstrosity|Medium|11|38|fly|chaotic evil|\nhawk|0|beast|Tiny|13|1|fly|unaligned|\nhell-hound|3|fiend|Medium|15|45||lawful evil|\nhellfire-engine|16|construct|Huge|18|216||lawful evil|\nhellwasp|5|fiend|Large|19|52|fly|lawful evil|\nhelmed-horror|4|construct|Medium|20|60|fly|neutral|\nhezrou|8|fiend (demon)|Large|16|136||chaotic evil|\nhill-giant|5|giant|Huge|13|105||chaotic evil|\nhippogriff|1|monstrosity|Large|11|19|fly|unaligned|\nhobgoblin|1/2|humanoid (goblinoid)|Medium|18|11||lawful evil|\nhobgoblin-captain|3|humanoid (goblinoid)|Medium|17|39||lawful evil|\nhobgoblin-devastator|4|humanoid (goblinoid)|Medium|13|45||lawful evil|\nhobgoblin-iron-shadow|2|humanoid (goblinoid)|Medium|15|32||lawful evil|\nhobgoblin-warlord|6|humanoid (goblinoid)|Medium|20|97||lawful evil|\nhomunculus|0|construct|Tiny|13|5|fly|neutral|\nhook-horror|3|monstrosity|Large|15|75||neutral|\nhorned-devil|11|fiend (devil)|Large|18|178|fly|lawful evil|\nhowler|8|fiend|Large|16|90||chaotic evil|\nhulking-crab|5|beast|Huge|17|76|swim|unaligned|\nhunter-shark|2|beast|Large|12|45|swim|unaligned|\nhutijin|21|fiend (devil)|Large|19|200|fly|lawful evil|\nhydra|8|monstrosity|Huge|15|172|swim|unaligned|\nhydroloth|9|fiend (yugoloth)|Medium|15|135|swim|neutral evil|\nhyena|0|beast|Medium|11|5||unaligned|\nice-devil|14|fiend (devil)|Large|18|180||lawful evil|\nice-mephit|1/2|elemental|Small|11|21|fly|neutral evil|\nice-toad|1|monstrosity|Medium|12|32|swim|neutral|\nillusionist|3|humanoid (any race)|Medium|12|38||any alignment|\nimix|19|elemental|Huge|17|325|fly|neutral evil|\nimp|1|fiend (devil, shapechanger)|Tiny|13|10|fly|lawful evil|\nintellect-devourer|2|aberration|Tiny|12|21||lawful evil|\ninvisible-stalker|6|elemental|Medium|14|104|fly|neutral|\niron-cobra|4|construct|Medium|13|45||unaligned|\niron-consul|2|humanoid (human)|Medium|16|45||lawful evil|\niron-golem|16|construct|Large|20|210||unaligned|\njackal|0|beast|Small|12|3||unaligned|\njackalwere|1/2|humanoid (shapechanger)|Medium|12|18||chaotic evil|\njaculi|1/2|beast|Large|14|16||unaligned|\njarlaxle-baenre|15|humanoid (elf)|Medium|24|123||chaotic neutral|\njuiblex|23|fiend (demon)|Huge|18|350||chaotic evil|\nkamadan|4|monstrosity|Large|13|67||unaligned|\nkenku|1/4|humanoid (kenku)|Medium|13|13||chaotic neutral|\nki-rin|12|celestial|Huge|20|152|fly|lawful good|Legendary\nkiller-whale|3|beast|Huge|12|90|swim|unaligned|\nknight|3|humanoid (any race)|Medium|18|52||any alignment|\nkobold|1/8|humanoid (kobold)|Small|12|5||lawful evil|\nkobold-dragonshield|1|humanoid (kobold)|Small|15|44||lawful evil|\nkobold-inventor|1/4|humanoid (kobold)|Small|12|13||lawful evil|\nkobold-scale-sorcerer|1|humanoid (kobold)|Small|15|27||lawful evil|\nkorred|7|fey|Small|17|102||chaotic neutral|\nkraken|23|monstrosity (titan)|Gargantuan|18|472|swim|chaotic evil|Legendary\nkraken-priest|5|humanoid (any race)|Medium|10|75|swim|any evil alignment|\nkruthik-hive-lord|5|monstrosity|Large|20|102||unaligned|\nkuo-toa|1/4|humanoid (kuo-toa)|Medium|13|18|swim|neutral evil|\nkuo-toa-archpriest|6|humanoid (kuo-toa)|Medium|13|97|swim|neutral evil|\nkuo-toa-whip|1|humanoid (kuo-toa)|Medium|11|65|swim|neutral evil|\nlaeral-silverhand|17|humanoid (human)|Medium|18|228||chaotic good|\nlamia|4|monstrosity|Large|13|97||chaotic evil|\nlemure|0|fiend (devil)|Medium|7|13||lawful evil|\nleucrotta|3|monstrosity|Large|14|67||chaotic evil|\nleviathan|20|elemental|Gargantuan|17|328|swim|neutral|\nlich|21|undead|Medium|17|135||any evil alignment|Legendary\nlion|1|beast|Large|12|26||unaligned|\nlizard|0|beast|Tiny|10|2||unaligned|\nlizard-king-queen|4|humanoid (lizardfolk)|Medium|15|78|swim|chaotic evil|\nlizardfolk|1/2|humanoid (lizardfolk)|Medium|15|22|swim|neutral|\nlizardfolk-shaman|2|humanoid (lizardfolk)|Medium|13|27|swim|neutral|\nmage|6|humanoid (any race)|Medium|12|40||any alignment|\nmagma-mephit|1/2|elemental|Small|11|22|fly|neutral evil|\nmagmin|1/2|elemental|Small|14|9||chaotic neutral|\nmale-steeder|1/4|monstrosity|Medium|12|13||unaligned|\nmammoth|6|beast|Huge|13|126||unaligned|\nmanes|1/8|fiend (demon)|Small|9|9||chaotic evil|\nmanshoon|13|humanoid (human)|Medium|19|126||lawful evil|\nmanticore|3|monstrosity|Large|14|68|fly|lawful evil|\nmantrap|1|plant|Large|12|45||unaligned|\nmarid|11|elemental|Large|17|229|fly, swim|chaotic neutral|\nmarilith|16|fiend (demon)|Large|18|189||chaotic evil|\nmartial-arts-adept|3|humanoid (any race)|Medium|16|60||any alignment|\nmarut|25|construct (inevitable)|Large|22|432|fly|lawful neutral|\nmaster-of-souls|4|humanoid (human)|Medium|12|45||neutral evil|\nmaster-thief|5|humanoid (any race)|Medium|16|84||any alignment|\nmastiff|1/8|beast|Medium|12|5||unaligned|\nmaurezhi|7|fiend (demon)|Medium|15|88||chaotic evil|\nmaw-demon|1|fiend (demon)|Medium|13|33||chaotic evil|\nmeazel|1|humanoid (meazel)|Medium|13|35||neutral evil|\nmedusa|6|monstrosity|Medium|15|127||lawful evil|\nmeenlock|2|fey|Small|15|31||neutral evil|\nmerfolk|1/8|humanoid (merfolk)|Medium|11|11|swim|neutral|\nmerregon|4|fiend (devil)|Medium|16|45||lawful evil|\nmerrenoloth|3|fiend (yugoloth)|Medium|13|40|swim|neutral evil|\nmerrow|2|monstrosity|Large|13|45|swim|chaotic evil|\nmezzoloth|5|fiend (yugoloth)|Medium|18|75||neutral evil|\nmimic|2|monstrosity (shapechanger)|Medium|12|58||neutral|\nmind-flayer|7|aberration|Medium|15|71||lawful evil|\nmindwitness|5|aberration|Large|15|75|fly|lawful evil|\nminotaur|3|monstrosity|Large|14|76||chaotic evil|\nminotaur-skeleton|2|undead|Large|12|67||lawful evil|\nmoloch|21|fiend (devil)|Large|19|253||lawful evil|Legendary\nmolydeus|21|fiend (demon)|Huge|19|216||chaotic evil|\nmonodrone|1/8|construct|Medium|15|5|fly|lawful neutral|\nmorkoth|11|aberration|Medium|17|130|swim|chaotic evil|\nmouth-of-grolantor|6|giant (hill giant)|Huge|14|105||chaotic evil|\nmud-mephit|1/4|elemental|Small|11|27|fly, swim|neutral evil|\nmule|1/8|beast|Medium|10|11||unaligned|\nmummified-warrior|1/4|undead|Medium|8|19||neutral|\nmummy|3|undead|Medium|11|58||lawful evil|\nmummy-lord|15|undead|Medium|17|97||lawful evil|Legendary\nmyconid-adult|1/2|plant|Medium|12|22||lawful neutral|\nmyconid-sovereign|2|plant|Large|13|60||lawful neutral|\nmyconid-sprout|0|plant|Small|10|7||lawful neutral|\nnabassu|15|fiend (demon)|Medium|18|190|fly|chaotic evil|\nnagpa|17|humanoid (nagpa)|Medium|19|187||neutral evil|\nnalfeshnee|13|fiend (demon)|Large|18|184|fly|chaotic evil|\nnarzugon|13|fiend (devil)|Medium|20|112||lawful evil|\nnecromancer|9|humanoid (any race)|Medium|12|66||any alignment|\nnecromite-of-myrkul|1/2|humanoid (human)|Medium|11|13||neutral evil|\nneedle-blight|1/4|plant|Medium|12|11||neutral evil|\nneogi|3|aberration|Small|15|33||lawful evil|\nneogi-hatchling|1/8|aberration|Tiny|11|7||lawful evil|\nneogi-master|4|aberration|Medium|15|71||lawful evil|\nneothelid|13|aberration|Gargantuan|16|325||chaotic evil|\nnight-blade|1/4|humanoid (human)|Medium|12|11||chaotic evil|\nnight-hag|5|fiend|Medium|17|112||neutral evil|\nnightmare|3|fiend|Large|13|68|fly|neutral evil|\nnightwalker|20|undead|Huge|14|297|fly|chaotic evil|\nnilbog|1|humanoid (goblinoid)|Small|13|7||chaotic evil|\nnoble|1/8|humanoid (any race)|Medium|15|9||any alignment|\nnothic|2|aberration|Medium|15|45||neutral evil|\nnupperibo|1/2|fiend (devil)|Medium|13|11||lawful evil|\nnycaloth|9|fiend (yugoloth)|Large|18|123|fly|neutral evil|\noblex-spawn|1/4|ooze|Tiny|13|18||lawful evil|\nochre-jelly|2|ooze|Large|8|45||unaligned|\noctopus|0|beast|Small|12|3|swim|unaligned|\nogre|2|giant|Large|11|59||chaotic evil|\nogre-battering-ram|4|giant|Large|14|59||chaotic evil|\nogre-bolt-launcher|2|giant|Large|13|59||chaotic evil|\nogre-chain-brute|3|giant|Large|11|59||chaotic evil|\nogre-howdah|2|giant|Large|13|59||chaotic evil|\nogre-zombie|2|undead|Large|8|85||neutral evil|\nogremoch|20|elemental|Gargantuan|20|526||neutral evil|\noinoloth|12|fiend (yugoloth)|Medium|17|126||neutral evil|\nolhydra|18|elemental|Huge|18|324|swim|neutral evil|\noni|7|giant|Large|16|110|fly|lawful evil|\norc|1/2|humanoid (orc)|Medium|13|15||chaotic evil|\norc-blade-of-ilneval|4|humanoid (orc)|Medium|18|60||chaotic evil|\norc-claw-of-luthic|2|humanoid (orc)|Medium|14|45||chaotic evil|\norc-eye-of-gruumsh|2|humanoid (orc)|Medium|16|45||chaotic evil|\norc-hand-of-yurtrus|2|humanoid (orc)|Medium|12|30||chaotic evil|\norc-red-fang-of-shargaas|3|humanoid (orc)|Medium|15|52||chaotic evil|\norc-war-chief|4|humanoid (orc)|Medium|16|93||chaotic evil|\norcus|26|fiend (demon)|Huge|17|405|fly|chaotic evil|Legendary\norog|2|humanoid (orc)|Medium|18|42||chaotic evil|\northon|10|fiend (devil)|Large|17|105||lawful evil|\notyugh|5|aberration|Large|14|114||neutral|\nowl|0|beast|Tiny|11|1|fly|unaligned|\nowlbear|3|monstrosity|Large|13|59||unaligned|\npanther|1/4|beast|Medium|12|13||unaligned|\npegasus|2|celestial|Large|12|59|fly|chaotic good|\npentadrone|2|construct|Large|16|32||lawful neutral|\nperyton|2|monstrosity|Medium|13|33|fly|chaotic evil|\nphase-spider|3|monstrosity|Large|13|32||unaligned|\nphoenix|16|elemental|Gargantuan|18|175|fly|neutral|\npiercer|1/2|monstrosity|Medium|15|22||unaligned|\npit-fiend|20|fiend (devil)|Large|19|300|fly|lawful evil|\npixie|1/4|fey|Tiny|15|1|fly|neutral good|\nplanetar|16|celestial|Large|19|200|fly|lawful good|\nplesiosaurus|2|beast|Large|13|68|swim|unaligned|\npoisonous-snake|1/8|beast|Tiny|13|2|swim|unaligned|\npolar-bear|2|beast|Large|12|42|swim|unaligned|\npony|1/8|beast|Medium|10|11||unaligned|\npriest|2|humanoid (any race)|Medium|13|27||any alignment|\npseudodragon|1/4|dragon|Tiny|13|7|fly|neutral good|\npterafolk|1|monstrosity|Large|12|26|fly|neutral evil|\npteranodon|1/4|beast|Medium|13|13|fly|unaligned|\npurple-worm|15|monstrosity|Gargantuan|18|247||unaligned|\npurple-wormling|2|monstrosity|Large|12|42||unaligned|\nquadrone|1|construct|Medium|16|22|fly|lawful neutral|\nquaggoth|2|humanoid (quaggoth)|Medium|13|45||chaotic neutral|\nquaggoth-spore-servant|1|plant|Medium|13|45||unaligned|\nquasit|1|fiend (demon, shapechanger)|Tiny|13|7||chaotic evil|\nquetzalcoatlus|2|beast|Huge|13|30|fly|unaligned|\nquickling|1|fey|Tiny|16|10||chaotic evil|\nquipper|0|beast|Tiny|13|1|swim|unaligned|\nrakshasa|13|fiend|Medium|16|110||lawful evil|\nrat|0|beast|Tiny|10|1||unaligned|\nraven|0|beast|Tiny|12|1|fly|unaligned|\nreaper-of-bhaal|2|humanoid (human)|Medium|15|27||chaotic evil|\nred-abishai|19|fiend (devil)|Medium|22|255|fly|lawful evil|\nred-dragon-wyrmling|4|dragon|Medium|17|75|fly|chaotic evil|\nred-slaad|5|aberration|Large|14|93||chaotic neutral|\nredcap|3|fey|Small|13|45||chaotic evil|\nreef-manta-ray|1/2|beast|Large|12|16|swim|unaligned|\nreef-shark|1/2|beast|Medium|12|22|swim|unaligned|\nremorhaz|11|monstrosity|Huge|17|195||unaligned|\nretriever|14|construct|Large|19|210||lawful evil|\nrevenant|5|undead|Medium|13|136||neutral|\nrhinoceros|2|beast|Large|11|45||unaligned|\nriding-horse|1/4|beast|Large|10|13||unaligned|\nroc|11|monstrosity|Gargantuan|15|248|fly|unaligned|\nroper|5|monstrosity|Large|20|93||neutral evil|\nrot-troll|9|giant|Large|16|138||chaotic evil|\nrug-of-smothering|2|construct|Large|12|33||unaligned|\nrust-monster|1/2|monstrosity|Medium|14|27||unaligned|\nrutterkin|2|fiend (demon)|Medium|12|37||chaotic evil|\nsaber-toothed-tiger|2|beast|Large|12|52||unaligned|\nsahuagin|1/2|humanoid (sahuagin)|Medium|12|22|swim|lawful evil|\nsahuagin-baron|5|humanoid (sahuagin)|Large|16|76|swim|lawful evil|\nsahuagin-priestess|2|humanoid (sahuagin)|Medium|12|33|swim|lawful evil|\nsalamander|5|elemental|Large|15|90||neutral evil|\nsatyr|1/2|fey|Medium|14|31||chaotic neutral|\nscarecrow|1|construct|Medium|11|36||chaotic evil|\nscorpion|0|beast|Tiny|11|1||unaligned|\nscout|1/2|humanoid (any race)|Medium|13|16||any alignment|\nsea-hag|2|fey|Medium|14|52|swim|chaotic evil|\nsea-horse|0|beast|Tiny|11|1|swim|unaligned|\nsea-spawn|1|humanoid|Medium|11|32|swim|neutral evil|\nshadow|1/2|undead|Medium|12|16||chaotic evil|\nshadow-dancer|7|humanoid (elf)|Medium|15|71||neutral|\nshadow-demon|4|fiend (demon)|Medium|13|66|fly|chaotic evil|\nshadow-mastiff|2|monstrosity|Medium|12|33||neutral evil|\nshambling-mound|5|plant|Large|15|136|swim|unaligned|\nshield-guardian|7|construct|Large|17|142||unaligned|\nshoosuva|8|fiend (demon)|Large|14|110||chaotic evil|\nshrieker|0|plant|Medium|5|13||unaligned|\nsibriex|18|fiend (demon)|Huge|19|150|fly|chaotic evil|Legendary\nsilver-dragon-wyrmling|2|dragon|Medium|17|45|fly|lawful good|\nskeleton|1/4|undead|Medium|13|13||lawful evil|\nskulk|1/2|humanoid|Medium|14|18||chaotic neutral|\nskull-lasher-of-myrkul|1|humanoid (human)|Medium|12|32||neutral evil|\nskull-lord|15|undead|Medium|18|105||lawful evil|\nslaad-tadpole|1/8|aberration|Tiny|12|10||chaotic neutral|\nslithering-tracker|3|ooze|Medium|14|32|swim|chaotic evil|\nsmoke-mephit|1/4|elemental|Small|12|22|fly|neutral evil|\nsolar|21|celestial|Large|21|243|fly|lawful good|Legendary\nsoul-monger|11|humanoid (elf)|Medium|15|123||neutral|\nspawn-of-kyuss|5|undead|Medium|10|76||chaotic evil|\nspectator|3|aberration|Medium|14|39|fly|lawful neutral|\nspecter|1|undead|Medium|12|22|fly|chaotic evil|\nspellcaster-healer-lvl-1|0|humanoid (any race)|Medium|12|9||any alignment|\nspellcaster-healer-lvl-2|0|humanoid (any race)|Medium|12|13||any alignment|\nspellcaster-healer-lvl-3|0|humanoid (any race)|Medium|12|18||any alignment|\nspellcaster-healer-lvl-4|0|humanoid (any race)|Medium|12|22||any alignment|\nspellcaster-healer-lvl-5|0|humanoid (any race)|Medium|12|27||any alignment|\nspellcaster-healer-lvl-6|0|humanoid (any race)|Medium|12|31||any alignment|\nspellcaster-mage-lvl-1|0|humanoid (any race)|Medium|12|9||any alignment|\nspellcaster-mage-lvl-2|0|humanoid (any race)|Medium|12|13||any alignment|\nspellcaster-mage-lvl-3|0|humanoid (any race)|Medium|12|18||any alignment|\nspellcaster-mage-lvl-4|0|humanoid (any race)|Medium|12|22||any alignment|\nspellcaster-mage-lvl-5|0|humanoid (any race)|Medium|12|27||any alignment|\nspellcaster-mage-lvl-6|0|humanoid (any race)|Medium|12|31||any alignment|\nspider|0|beast|Tiny|12|1||unaligned|\nspined-devil|2|fiend (devil)|Small|13|22|fly|lawful evil|\nspirit-naga|8|monstrosity|Large|15|75||chaotic evil|\nspirit-troll|11|giant|Large|17|97||chaotic evil|\nspring-eladrin|10|fey (elf)|Medium|19|127||chaotic neutral|\nsprite|1/4|fey|Tiny|15|2|fly|neutral good|\nspy|1|humanoid (any race)|Medium|12|27||any alignment|\nstar-spawn-grue|1/4|aberration|Small|11|17||neutral evil|\nstar-spawn-hulk|10|aberration|Large|16|136||chaotic evil|\nstar-spawn-larva-mage|16|aberration|Medium|16|168||chaotic evil|\nstar-spawn-mangler|5|aberration|Medium|14|71||chaotic evil|\nstar-spawn-seer|13|aberration|Medium|17|153||neutral evil|\nsteam-mephit|1/4|elemental|Small|10|21|fly|neutral evil|\nsteel-predator|16|construct|Large|20|207||lawful evil|\nstegosaurus|4|beast|Huge|13|76||unaligned|\nstirge|1/8|beast|Tiny|14|2|fly|unaligned|\nstone-cursed|1|construct|Medium|17|19||lawful evil|\nstone-giant|7|giant|Huge|17|126||neutral|\nstone-giant-dreamwalker|10|giant (stone giant)|Huge|18|161||chaotic neutral|\nstone-golem|10|construct|Large|17|178||unaligned|\nstone-juggernaut|12|construct|Large|15|157||unaligned|\nstorm-giant|13|giant|Huge|16|230|swim|chaotic good|\nstorm-giant-quintessent|16|giant (storm giant)|Huge|12|230|fly, swim|chaotic good|\nstrahd-von-zarovich|15|undead (shapechanger)|Medium|16|144||lawful evil|\nsu-monster|1|monstrosity|Medium|12|27||chaotic evil|\nsuccubus|4|fiend (shapechanger)|Medium|15|66|fly|neutral evil|\nsummer-eladrin|10|fey (elf)|Medium|19|127||chaotic neutral|\nswarm-of-bats|1/4|swarm of Tiny beasts|Medium|12|22|fly|unaligned|\nswarm-of-cranium-rats|5|swarm of Tiny beasts|Medium|12|36||lawful evil|\nswarm-of-insects|1/2|swarm of Tiny beasts|Medium|12|22||unaligned|\nswarm-of-poisonous-snakes|2|swarm of Tiny beasts|Medium|14|36|swim|unaligned|\nswarm-of-quippers|1|swarm of Tiny beasts|Medium|13|28|swim|unaligned|\nswarm-of-rats|1/4|swarm of Tiny beasts|Medium|10|24||unaligned|\nswarm-of-ravens|1/4|swarm of Tiny beasts|Medium|12|24|fly|unaligned|\nswarm-of-rot-grubs|1/2|swarm of Tiny beasts|Medium|8|22||unaligned|\nswashbuckler|3|humanoid (any race)|Medium|17|66||any non-lawful alignment|\nsword-wraith-commander|8|undead|Medium|18|127||lawful evil|\nsword-wraith-warrior|3|undead|Medium|16|45||lawful evil|\ntabaxi-hunter|1|humanoid (tabaxi)|Medium|14|40||chaotic good|\ntabaxi-minstrel|1/4|humanoid (tabaxi)|Medium|12|22||chaotic good|\ntanarukk|5|fiend (demon, orc)|Medium|14|95||chaotic evil|\ntarrasque|30|monstrosity (titan)|Gargantuan|25|676||unaligned|Legendary\nthe-angry|13|monstrosity|Medium|18|255||neutral evil|\nthe-hungry|11|monstrosity|Medium|17|225||neutral evil|\nthe-lonely|9|monstrosity|Medium|16|112||neutral evil|\nthe-lost|7|monstrosity|Medium|15|78||neutral evil|\nthe-wretched|1/4|monstrosity|Small|15|10||neutral evil|\nthorny|1|plant|Medium|14|27||neutral|\nthri-kreen|1|humanoid (thri-kreen)|Medium|15|33||chaotic neutral|\nthug|1/2|humanoid (any race)|Medium|11|32||any non-good alignment|\ntiamat|30|fiend|Gargantuan|25|615|fly|chaotic evil|\ntiger|1|beast|Large|12|37||unaligned|\ntitivilus|16|fiend (devil)|Medium|20|127|fly|lawful evil|\ntlincalli|5|monstrosity|Large|15|85||neutral evil|\ntortle|1/4|humanoid (tortle)|Medium|17|22||lawful good|\ntortle-druid|2|humanoid (tortle)|Medium|17|33||lawful neutral|\ntransmuter|5|humanoid (any race)|Medium|12|40||any alignment|\ntrapper|3|monstrosity|Large|13|85||unaligned|\ntreant|9|plant|Huge|16|138||chaotic good|\ntri-flower-frond|1/2|plant|Medium|10|11||unaligned|\ntribal-warrior|1/8|humanoid (any race)|Medium|12|11||any alignment|\ntriceratops|5|beast|Huge|13|95||unaligned|\ntridrone|1/2|construct|Medium|15|16||lawful neutral|\ntroglodyte|1/4|humanoid (troglodyte)|Medium|11|13||chaotic evil|\ntroll|5|giant|Large|15|84||chaotic evil|\ntwig-blight|1/8|plant|Small|13|4||neutral evil|\ntyrannosaurus-rex|8|beast|Huge|13|136||unaligned|\nulitharid|9|aberration|Large|15|127||lawful evil|\nultroloth|13|fiend (yugoloth)|Medium|19|153|fly|neutral evil|\number-hulk|5|monstrosity|Large|18|93||chaotic evil|\nunicorn|5|celestial|Large|12|67||lawful good|Legendary\nuthgardt-shaman|2|humanoid (human)|Medium|13|38||neutral evil|\nvajra-safahr|13|humanoid (human)|Medium|14|126||lawful neutral|\nvampire|13|undead (shapechanger)|Medium|16|144||lawful evil|Legendary\nvampire-spawn|5|undead|Medium|15|82||neutral evil|\nvampiric-mist|3|undead|Medium|13|30|fly|chaotic evil|\nvargouille|1|fiend|Tiny|12|13|fly|chaotic evil|\nvegepygmy|1/4|plant|Small|13|9||neutral|\nvegepygmy-chief|2|plant|Small|14|33||neutral|\nvelociraptor|1/4|beast|Tiny|13|10||unaligned|\nvenerable-shadow|2|undead|Medium|13|27||chaotic evil|\nvenom-troll|7|giant|Large|15|94||chaotic evil|\nveteran|3|humanoid (any race)|Medium|17|58||any alignment|\nvine-blight|1/2|plant|Medium|12|26||neutral evil|\nviolet-fungus|1/4|plant|Medium|5|18||unaligned|\nvrock|6|fiend (demon)|Large|15|104|fly|chaotic evil|\nvulture|0|beast|Medium|10|5|fly|unaligned|\nwar-priest|9|humanoid (any race)|Medium|18|117||any alignment|\nwarhorse|1/2|beast|Large|11|19||unaligned|\nwarhorse-skeleton|1/2|undead|Large|13|22||lawful evil|\nwarlock-of-the-archfey|4|humanoid (any race)|Medium|11|49||any alignment|\nwarlock-of-the-fiend|7|humanoid (any race)|Medium|12|78||any alignment|\nwarlock-of-the-great-old-one|6|humanoid (any race)|Medium|12|91||any alignment|\nwarlord|12|humanoid (any race)|Medium|18|229||any alignment|Legendary\nwarrior-lvl-1|0|humanoid (any race)|Medium|16|13||any alignment|\nwarrior-lvl-2|0|humanoid (any race)|Medium|16|19||any alignment|\nwarrior-lvl-3|0|humanoid (any race)|Medium|16|26||any alignment|\nwarrior-lvl-4|0|humanoid (any race)|Medium|16|32||any alignment|\nwarrior-lvl-5|0|humanoid (any race)|Medium|16|39||any alignment|\nwarrior-lvl-6|0|humanoid (any race)|Medium|16|45||any alignment|\nwastrilith|13|fiend (demon)|Large|18|157|swim|chaotic evil|\nwater-elemental|5|elemental|Large|14|114|swim|neutral|\nwater-elemental-myrmidon|7|elemental|Medium|18|127|swim|neutral|\nwater-weird|3|elemental|Large|13|58|swim|neutral|\nweasel|0|beast|Tiny|13|1||unaligned|\nwerebear|5|humanoid (human, shapechanger)|Medium|10|135||neutral good|\nwereboar|4|humanoid (human, shapechanger)|Medium|10|78||neutral evil|\nwererat|2|humanoid (human, shapechanger)|Medium|12|33||lawful evil|\nweretiger|4|humanoid (human, shapechanger)|Medium|12|120||neutral|\nwerewolf|3|humanoid (human, shapechanger)|Medium|11|58||chaotic evil|\nwhite-abishai|6|fiend (devil)|Medium|15|68|fly|lawful evil|\nwhite-dragon-wyrmling|2|dragon|Medium|16|32|fly, swim|chaotic evil|\nwight|3|undead|Medium|14|45||neutral evil|\nwild-dog|1/8|beast|Medium|12|5||unaligned|\nwild-dog-alpha|1|beast|Large|12|26||unaligned|\nwill-o--wisp|2|undead|Tiny|19|22|fly|chaotic evil|\nwinged-kobold|1/4|humanoid (kobold)|Small|13|7|fly|lawful evil|\nwinter-eladrin|10|fey (elf)|Medium|19|127||chaotic neutral|\nwinter-wolf|3|monstrosity|Large|13|75||neutral evil|\nwolf|1/4|beast|Medium|13|11||unaligned|\nwood-woad|5|plant|Medium|18|75||lawful neutral|\nworg|1/2|monstrosity|Large|13|26||neutral evil|\nwraith|5|undead|Medium|13|67|fly|neutral evil|\nwyvern|6|dragon|Large|13|110|fly|unaligned|\nxorn|5|elemental|Medium|19|73||neutral|\nxvart|1/8|humanoid (xvart)|Small|13|7||chaotic evil|\nxvart-warlock-of-raxivort|1|humanoid (xvart)|Small|12|22||chaotic evil|\nyagnoloth|11|fiend (yugoloth)|Large|17|147||neutral evil|\nyan-c-bin|18|elemental|Huge|22|283|fly|neutral evil|\nyeenoghu|24|fiend (demon)|Huge|20|333||chaotic evil|\nyellow-musk-creeper|2|plant|Medium|6|60||unaligned|\nyellow-musk-zombie|1/4|undead|Medium|9|33||unaligned|\nyeth-hound|4|fey|Large|14|51|fly|neutral evil|\nyeti|3|monstrosity|Large|12|51||chaotic evil|\nyochlol|10|fiend (demon, shapechanger)|Medium|15|136||chaotic evil|\nyoung-black-dragon|7|dragon|Large|18|127|fly, swim|chaotic evil|\nyoung-blue-dragon|9|dragon|Large|18|152|fly|lawful evil|\nyoung-brass-dragon|6|dragon|Large|17|110|fly|chaotic good|\nyoung-bronze-dragon|8|dragon|Large|18|142|fly, swim|lawful good|\nyoung-copper-dragon|7|dragon|Large|17|119|fly|chaotic good|\nyoung-gold-dragon|10|dragon|Large|18|178|fly, swim|lawful good|\nyoung-green-dragon|8|dragon|Large|18|136|fly, swim|lawful evil|\nyoung-kruthik|1/8|monstrosity|Small|16|9||unaligned|\nyoung-red-dragon|10|dragon|Large|18|178|fly|chaotic evil|\nyoung-red-shadow-dragon|13|dragon|Large|18|178|fly|chaotic evil|\nyoung-remorhaz|5|monstrosity|Large|14|93||unaligned|\nyoung-silver-dragon|9|dragon|Large|18|168|fly|lawful good|\nyoung-white-dragon|6|dragon|Large|17|133|fly, swim|chaotic evil|\nyuan-ti-abomination|7|monstrosity (shapechanger, yuan-ti)|Large|15|127||neutral evil|\nyuan-ti-anathema|12|monstrosity (shapechanger, yuan-ti)|Huge|16|189|swim|neutral evil|\nyuan-ti-broodguard|2|humanoid (yuan-ti)|Medium|14|45||neutral evil|\nyuan-ti-malison|3|monstrosity (shapechanger, yuan-ti)|Medium|12|66||neutral evil|\nyuan-ti-mind-whisperer|4|monstrosity (shapechanger, yuan-ti)|Medium|14|71||neutral evil|\nyuan-ti-nightmare-speaker|4|monstrosity (shapechanger, yuan-ti)|Medium|14|71||neutral evil|\nyuan-ti-pit-master|5|monstrosity (shapechanger, yuan-ti)|Medium|14|88||neutral evil|\nyuan-ti-pureblood|1|humanoid (yuan-ti)|Medium|11|40||neutral evil|\nzaratan|22|elemental|Gargantuan|21|307|swim|neutral|\nzariel|26|fiend (devil)|Large|21|580|fly|lawful evil|Legendary\nzombie|1/4|undead|Medium|8|22||neutral evil|\nzuggtmoy|23|fiend (demon)|Large|18|304||chaotic evil|\ncthulhu|30|aberration (outer god)|Gargantuan|25|800|fly, swim|chaotic evil|Legendary\nshoggoth|19|aberration|Huge|18|300|swim|chaotic evil|Legendary\nmi-go|5|aberration|Medium|15|60|fly|neutral evil|\ndeep-one|2|humanoid (deep one)|Medium|14|35|swim|chaotic evil|\nstar-spawn|20|aberration|Huge|20|350|fly, swim|chaotic evil|Legendary\ndark-young|15|aberration|Huge|17|250||chaotic evil|\nyithian|12|aberration|Large|16|180||neutral|\ndagon|25|aberration (outer god)|Gargantuan|22|550|swim|chaotic evil|Legendary\nhastur|28|aberration (outer god)|Gargantuan|24|700|fly|chaotic evil|Legendary\nnyarlathotep|26|aberration (outer god)|Medium|23|600|fly|chaotic evil|Legendary\npathfinder-goblin|1/3|humanoid (goblin)|Small|13|6||neutral evil|\ngrendel|15|monstrosity|Large|19|220||chaotic evil|\nwendigo|14|monstrosity|Large|18|200|fly|chaotic evil|Legendary\nlinnorm|25|dragon|Gargantuan|23|600|fly|chaotic evil|Legendary`;

  function parseBestiary() {
    const list = [];
    const lines = RAW_BESTIARY_CSV.trim().split('\n');
    const emojiMap = {
      'beast': '🐺', 'undead': '💀', 'dragon': '🐉', 'elemental': '🔥',
      'fiend': '😈', 'humanoid': '👺', 'monstrosity': '🦁', 'aberration': '👁️',
      'construct': '🤖', 'fey': '🧚', 'giant': '👹', 'plant': '🌵',
      'ooze': '🧪', 'celestial': '👼'
    };

    function formatName(id, type) {
      let clean = id.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
      clean = clean.replace(/Adult (\w+) Dragon/g, 'Dragón $1 Adulto')
                   .replace(/Young (\w+) Dragon/g, 'Dragón $1 Joven')
                   .replace(/Ancient (\w+) Dragon/g, 'Dragón $1 Anciano')
                   .replace(/Giant (\w+)/g, '$1 Gigante')
                   .replace(/Goblin (\w+)/g, '$1 Goblin')
                   .replace(/Orc (\w+)/g, '$1 Orco')
                   .replace(/Skeleton (\w+)/g, 'Esqueleto $1')
                   .replace(/Zombie (\w+)/g, 'Zombie $1');
      clean = clean.replace(/Black/g, 'Negro').replace(/Blue/g, 'Azul').replace(/Red/g, 'Rojo')
                   .replace(/White/g, 'Blanco').replace(/Green/g, 'Verde').replace(/Gold/g, 'Dorado')
                   .replace(/Silver/g, 'Plateado').replace(/Bronze/g, 'Bronce')
                   .replace(/Copper/g, 'Cobre').replace(/Brass/g, 'Latón').replace(/Shadow/g, 'Sombra');
      return clean;
    }

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      const parts = line.split('|');
      if (parts.length < 6) continue;

      const rawName = parts[0];
      const id = rawName.toLowerCase().replace(/[^a-z0-9_-]/g, '_');
      const crStr = parts[1];
      const type = parts[2].toLowerCase();
      const size = parts[3];
      const ac = parseInt(parts[4]) || 10;
      const hp = parseInt(parts[5]) || 10;
      const speed = parts[6];
      const align = parts[7];
      const legendary = parts[8];

      let cr = 0;
      if (crStr.includes('/')) {
        const p = crStr.split('/');
        cr = parseInt(p[0]) / parseInt(p[1]);
      } else {
        cr = parseFloat(crStr) || 0;
      }

      let tier = 1;
      if (cr <= 1) tier = 1;
      else if (cr <= 4) tier = 2;
      else if (cr <= 9) tier = 3;
      else if (cr <= 16) tier = 4;
      else tier = 5;

      const atk = Math.max(2, Math.floor(cr * 1.2) + 3);
      let dmg = 6;
      if (cr <= 0.25) dmg = 4;
      else if (cr <= 1) dmg = 6;
      else if (cr <= 3) dmg = 8;
      else if (cr <= 7) dmg = 10;
      else if (cr <= 12) dmg = 12;
      else dmg = 20;

      let xp = 25;
      const crXpMap = {
        0: 10, 0.125: 25, 0.25: 50, 0.5: 100, 1: 200, 2: 450, 3: 700, 4: 1100, 
        5: 1800, 6: 2300, 7: 2900, 8: 3900, 9: 5000, 10: 5900, 11: 7200, 
        12: 8400, 13: 10000, 14: 11500, 15: 13000, 16: 15000, 17: 18000, 
        18: 20000, 19: 22000, 20: 25000, 21: 33000, 22: 41000, 23: 50000, 
        24: 62000, 30: 155000
      };
      if (crXpMap[cr] !== undefined) xp = crXpMap[cr];
      else xp = Math.round(cr * 1500);

      const gold = Math.floor(cr * 15) + 5;
      const baseType = type.split(' ')[0].replace(/[^a-z]/g, '');
      let icon = emojiMap[baseType] || '👹';

      const lowerName = rawName.toLowerCase();
      if (lowerName.includes('rat')) icon = '🐀';
      else if (lowerName.includes('bat')) icon = '🦇';
      else if (lowerName.includes('cat') && !lowerName.includes('catoblepas')) icon = '🐈';
      else if (lowerName.includes('spider') || lowerName.includes('ettercap')) icon = '🕷️';
      else if (lowerName.includes('wolf') || lowerName.includes('worg')) icon = '🐺';
      else if (lowerName.includes('bear')) icon = '🐻';
      else if (lowerName.includes('snake') || lowerName.includes('naga')) icon = '🐍';
      else if (lowerName.includes('skeleton')) icon = '💀';
      else if (lowerName.includes('zombie')) icon = '🧟';
      else if (lowerName.includes('lich')) icon = '🧙‍♂️';
      else if (lowerName.includes('ghost') || lowerName.includes('specter') || lowerName.includes('wraith')) icon = '👻';
      else if (lowerName.includes('mimic')) icon = '📦';
      else if (lowerName.includes('beholder')) icon = '👁️';

      const desc = `Un/a ${formatName(rawName, type)} (${type}), tamaño ${size}, velocidad ${speed || 'terrestre'}. Alineamiento ${align || 'desconocido'}.`;

      list.push({
        id,
        name: formatName(rawName, type),
        icon, hp, ac, atk, dmg, cr, xp, gold, tier,
        type: baseType,
        loot: [],
        desc,
        traits: [],
        boss: (legendary === 'Legendary' || cr >= 15)
      });
    }
    return list;
  }

  const parsedBestiary = parseBestiary();
  const ENEMIES = [...CUSTOM_ENEMIES];
  const customIds = new Set(CUSTOM_ENEMIES.map(e => e.id));
  for (const e of parsedBestiary) {
    if (!customIds.has(e.id)) {
      ENEMIES.push(e);
    }
  }


  // ── SPELLS ───────────────────────────────────────────────────
  const SPELLS = [
    { id:'fireball',   name:'Bola de Fuego',    icon:'🔥', dmgDice:8, dmgCount:3, type:'fire',  range:'far',  save:'dex', dc:14, desc:'Incendia todo en un área. 3d8 daño, DEX save mitad.', classes:['wizard','sorcerer'] },
    { id:'cure_wounds',name:'Curar Heridas',    icon:'💚', healDice:8, healCount:1, bonusHeal:'wis', type:'heal', range:'touch', desc:'1d8+WIS HP. Solo toque.', classes:['cleric','paladin','druid','bard'] },
    { id:'magic_miss', name:'Proyectil Mágico', icon:'✨', dmgDice:4, dmgCount:3, type:'force', range:'far',  auto:true, desc:'3 proyectiles de 1d4+1. Nunca fallan (excepto escudo).', classes:['wizard','sorcerer'] },
    { id:'shield',     name:'Escudo',           icon:'🔵', ac:5, type:'defense', range:'self', desc:'+5 AC como reacción. Dura hasta el próximo turno.', classes:['wizard'] },
    { id:'hex',        name:'Maldición Hex',    icon:'🔮', dmgDice:6, dmgCount:1, type:'necrotic', range:'far', dur:3, desc:'+1d6 daño al objetivo y desventaja en una stat.', classes:['warlock'] },
    { id:'eldritch_blast',name:'Explosión Éldritch',icon:'👁️',dmgDice:10,dmgCount:1,bonusDmg:'cha',type:'force',range:'far',auto:false,desc:'1d10+CHA daño de fuerza.', classes:['warlock'] },
    { id:'divine_smite',name:'Golpe Divino',    icon:'⚡', dmgDice:8, dmgCount:2, type:'radiant', range:'melee', desc:'+2d8 daño radiante al golpear.', classes:['paladin'] },
    { id:'hunters_mark',name:'Marca del Cazador',icon:'🎯',dmgDice:6,dmgCount:1,type:'extra',range:'far',dur:3, desc:'+1d6 daño al objetivo marcado.', classes:['ranger'] },
    { id:'thunderwave', name:'Onda de Trueno',  icon:'⚡', dmgDice:8, dmgCount:2, type:'thunder', range:'near', save:'con', dc:13, push:10, desc:'2d8 trueno, CON save o empujado 10ft.', classes:['cleric','druid','sorcerer','wizard'] },
    { id:'inflict_wounds',name:'Infligir Heridas',icon:'💀',dmgDice:10,dmgCount:3,type:'necrotic',range:'touch',desc:'3d10 necrótico. Toque.', classes:['cleric'] },
    { id:'burning_hands',name:'Manos Ardientes',icon:'🔥',dmgDice:6,dmgCount:3,type:'fire',range:'cone',save:'dex',dc:12,desc:'3d6 fuego en cono. DEX save mitad.', classes:['wizard','sorcerer'] },
    { id:'hold_person', name:'Paralizar Persona',icon:'🧊',type:'control',range:'far',dur:2,save:'wis',dc:14,desc:'Objetivo Paralizado 2 rounds. WIS save niega.', classes:['cleric','wizard','warlock','druid'] },
    { id:'shatter',    name:'Fractura',         icon:'💥', dmgDice:8, dmgCount:3, type:'thunder', range:'near', save:'con', dc:13, desc:'Tronido destructivo: 3d8, CON save mitad. +daño a constructs.', classes:['bard','sorcerer','warlock','wizard'] },
    { id:'call_lightning',name:'Invocar Rayo',  icon:'⚡', dmgDice:10, dmgCount:3, type:'lightning', range:'far', desc:'3d10 rayo. Solo en exterior/tormenta: +1d10.', classes:['druid'] },
    { id:'mass_heal',  name:'Curación Masiva',  icon:'💚', healDice:6, healCount:2, bonusHeal:'wis', type:'heal', range:'near', targets:'all_allies', desc:'2d6+WIS a todos los aliados cercanos.', classes:['cleric'] },
  ];

  // ── ITEMS ────────────────────────────────────────────────────
  // r: rarity (common/uncommon/rare/epic/legendary/cursed)
  // e: effect type
  const ITEMS = [
    // CONSUMABLES
    { id:'potion_minor',  name:'Poción Menor',       icon:'🧪', r:'common',    p:20,  e:'heal',   v:15, desc:'Recupera 15 HP.' },
    { id:'potion_major',  name:'Poción Mayor',        icon:'🧪', r:'uncommon',  p:50,  e:'heal',   v:30, desc:'Recupera 30 HP.' },
    { id:'potion_supreme',name:'Poción Suprema',      icon:'🧪', r:'rare',      p:120, e:'heal',   v:60, desc:'Recupera 60 HP.' },
    { id:'elixir_gods',   name:'Elixir de los Dioses',icon:'🍶', r:'legendary', p:500, e:'heal',   v:999,desc:'Restaura todos los HP.' },
    { id:'antidote',      name:'Antídoto',             icon:'🩺', r:'common',    p:25,  e:'cure',   v:1,  desc:'Cura veneno y enfermedad.' },
    { id:'mana_potion',   name:'Poción de Maná',       icon:'💧', r:'uncommon',  p:45,  e:'mana',   v:2,  desc:'Restaura 2 usos de habilidad.' },
    { id:'rage_brew',     name:'Brebaje de Furia',     icon:'🍺', r:'uncommon',  p:40,  e:'buff',   v:'rage', desc:'Activa Furia sin gastar usos.' },
    { id:'smoke_bomb',    name:'Bomba de Humo',        icon:'💨', r:'common',    p:30,  e:'escape', v:1,  desc:'Escapes automáticamente del combate.' },
    { id:'holy_water',    name:'Agua Bendita',         icon:'💦', r:'uncommon',  p:35,  e:'dmg_undead', v:14, desc:'2d6 daño radiante a no-muertos.' },
    { id:'poison_vial',   name:'Vial de Veneno',       icon:'☠️', r:'uncommon',  p:40,  e:'poison_weapon', v:6, desc:'Envenena arma: +1d6 veneno 3 ataques.' },
    { id:'flash_powder',  name:'Polvo Destello',       icon:'✨', r:'common',    p:25,  e:'blind',  v:1,  desc:'Ciega a un enemigo 1 round.' },

    // WEAPONS
    { id:'dagger_rusty',  name:'Daga Oxidada',         icon:'🗡️', r:'common',    p:10,  e:'weapon', slot:'weapon', dmgDice:4, dmgBonus:0, desc:'+0 daño. Reliquia del primer goblin.' },
    { id:'short_sword',   name:'Espada Corta',          icon:'⚔️', r:'common',    p:40,  e:'weapon', slot:'weapon', dmgDice:6, dmgBonus:1, desc:'+1 daño.' },
    { id:'longsword',     name:'Espada Larga',          icon:'🗡️', r:'common',    p:65,  e:'weapon', slot:'weapon', dmgDice:8, dmgBonus:2, desc:'+2 daño. Versátil.' },
    { id:'greataxe',      name:'Gran Hacha',            icon:'🪓', r:'uncommon',  p:100, e:'weapon', slot:'weapon', dmgDice:12,dmgBonus:3, desc:'+3 daño. Pesada, 2 manos.' },
    { id:'rapier',        name:'Estoque',               icon:'🤺', r:'uncommon',  p:90,  e:'weapon', slot:'weapon', dmgDice:8, dmgBonus:2, atkBonus:1, desc:'+2 daño, +1 ataque. Elegante.' },
    { id:'elven_blade',   name:'Hoja Élfica',           icon:'✨', r:'rare',      p:200, e:'weapon', slot:'weapon', dmgDice:8, dmgBonus:3, atkBonus:1, desc:'+3 daño, +1 ataque. Nunca se embota.' },
    { id:'staff_arcane',  name:'Báculo Arcano',         icon:'🪄', r:'uncommon',  p:80,  e:'weapon', slot:'weapon', dmgDice:6, dmgBonus:1, spellBonus:2, desc:'+1 daño, +2 a tiradas de hechizo.' },
    { id:'staff_of_power',name:'Báculo del Poder',      icon:'⚡', r:'legendary', p:600, e:'weapon', slot:'weapon', dmgDice:8, dmgBonus:4, spellBonus:4, charges:10, desc:'+4 daño/hechizo. 10 cargas mágicas.' },
    { id:'vorpal_sword',  name:'Espada Vorpal',         icon:'⚔️', r:'legendary', p:800, e:'weapon', slot:'weapon', dmgDice:8, dmgBonus:5, special:'decapitate', desc:'+5 daño. En crítico: decapitación instantánea si CR < 8.' },
    { id:'bow_short',     name:'Arco Corto',            icon:'🏹', r:'common',    p:40,  e:'weapon', slot:'weapon', dmgDice:6, dmgBonus:1, range:true, desc:'+1 daño. Rango.' },
    { id:'bow_long',      name:'Arco Largo',            icon:'🏹', r:'uncommon',  p:90,  e:'weapon', slot:'weapon', dmgDice:8, dmgBonus:2, range:true, desc:'+2 daño. Largo rango.' },
    { id:'war_axe',       name:'Hacha de Guerra',       icon:'🪓', r:'common',    p:55,  e:'weapon', slot:'weapon', dmgDice:8, dmgBonus:2, desc:'+2 daño.' },
    { id:'morningstar',   name:'Maza Estrella',         icon:'🔨', r:'uncommon',  p:80,  e:'weapon', slot:'weapon', dmgDice:8, dmgBonus:3, desc:'+3 daño perforante+contundente.' },
    { id:'cursed_blade',  name:'Hoja Maldita',          icon:'🩸', r:'cursed',    p:0,   e:'weapon', slot:'weapon', dmgDice:10,dmgBonus:4, special:'cursed', desc:'+4 daño PERO −2 AC permanente. No se puede quitar sin ritual.' },
    { id:'frostbrand',    name:'Marca de Hielo',        icon:'❄️', r:'epic',      p:400, e:'weapon', slot:'weapon', dmgDice:8, dmgBonus:3, elemental:'cold',  desc:'+3 daño +1d6 frío. Apaga llamas cercanas.' },
    { id:'flametongue',   name:'Lengua de Llama',       icon:'🔥', r:'epic',      p:450, e:'weapon', slot:'weapon', dmgDice:8, dmgBonus:3, elemental:'fire',  desc:'+3 daño +2d6 fuego. Proporciona luz.' },
    { id:'dragon_claw',   name:'Garra Dracónica',       icon:'🐉', r:'legendary', p:700, e:'weapon', slot:'weapon', dmgDice:10,dmgBonus:4, elemental:'fire',  desc:'+4 daño +1d8 fuego. Rugido del dragón en cada golpe.' },

    // ARMOR
    { id:'rags',          name:'Harapos',              icon:'👕', r:'common',    p:5,   e:'armor',  slot:'armor', acBonus:1, desc:'+1 AC. Al menos cubre.' },
    { id:'leather_armor', name:'Armadura de Cuero',    icon:'🥋', r:'common',    p:45,  e:'armor',  slot:'armor', acBonus:2, desc:'+2 AC. Ligera.' },
    { id:'hide_armor',    name:'Armadura de Pieles',   icon:'🧥', r:'common',    p:60,  e:'armor',  slot:'armor', acBonus:3, desc:'+3 AC. Cálida y efectiva.' },
    { id:'chain_shirt',   name:'Camisón de Malla',     icon:'🔗', r:'uncommon',  p:100, e:'armor',  slot:'armor', acBonus:4, desc:'+4 AC. Media.' },
    { id:'chainmail',     name:'Cota de Malla',        icon:'⛓️', r:'uncommon',  p:150, e:'armor',  slot:'armor', acBonus:5, desc:'+5 AC. Ruidosa.' },
    { id:'plate_armor',   name:'Armadura de Placas',   icon:'🛡️', r:'rare',      p:300, e:'armor',  slot:'armor', acBonus:7, desc:'+7 AC. Pesada, máxima protección.' },
    { id:'elven_mail',    name:'Malla Élfica',         icon:'✨', r:'rare',      p:280, e:'armor',  slot:'armor', acBonus:5, stealthBonus:2, desc:'+5 AC, +2 sigilo. Susurra al moverse.' },
    { id:'mithral_armor', name:'Armadura de Mithral',  icon:'💠', r:'epic',      p:500, e:'armor',  slot:'armor', acBonus:6, special:'no_str_req', desc:'+6 AC. No requiere STR. No penaliza sigilo.' },
    { id:'dragonhide',    name:'Piel de Dragón',       icon:'🐉', r:'legendary', p:900, e:'armor',  slot:'armor', acBonus:8, resistance:'fire', desc:'+8 AC + Resistencia a fuego. Escalas del dragón que mataste.' },
    { id:'cursed_mail',   name:'Cota Maldita',         icon:'☠️', r:'cursed',    p:0,   e:'armor',  slot:'armor', acBonus:3, special:'cursed_armor', desc:'+3 AC pero −3 WIS y pesadillas. No se puede quitar.' },

    // ACCESSORIES
    { id:'ring_protection',name:'Anillo de Protección',icon:'💍',r:'uncommon', p:80,  e:'accessory',slot:'ring',  acBonus:1, svBonus:1, desc:'+1 AC y +1 a saving throws.' },
    { id:'ring_strength',  name:'Anillo de la Fuerza', icon:'💍', r:'rare',     p:160, e:'accessory',slot:'ring',  statBonus:{str:2}, desc:'+2 STR.' },
    { id:'amulet_health',  name:'Amuleto de Salud',    icon:'📿', r:'uncommon', p:100, e:'accessory',slot:'neck',  hpBonus:10, desc:'+10 HP máximos.' },
    { id:'amulet_resist',  name:'Amuleto de Resistencia',icon:'📿',r:'rare',   p:200, e:'accessory',slot:'neck',  svBonus:2, desc:'+2 a todos los saving throws.' },
    { id:'cloak_elvenkind',name:'Capa de Invisibilidad Élfica',icon:'🧣',r:'rare',p:250,e:'accessory',slot:'cloak',stealthBonus:5, desc:'+5 a chequeos de Sigilo.' },
    { id:'boots_speed',    name:'Botas de Velocidad',  icon:'👢', r:'uncommon', p:90,  e:'accessory',slot:'feet', initBonus:2, desc:'+2 a iniciativa. Velocidad +10.' },
    { id:'gloves_ogre',    name:'Guanteletes de la Fuerza Ogro',icon:'🥊',r:'rare',p:200,e:'accessory',slot:'hands',statBonus:{str:4}, desc:'+4 STR.' },
    { id:'headband_int',   name:'Diadema de Intelecto', icon:'👑', r:'rare',    p:180, e:'accessory',slot:'head', statBonus:{int:3}, desc:'+3 INT.' },
    { id:'belt_hill_giant',name:'Cinturón del Gigante', icon:'🪨', r:'epic',    p:400, e:'accessory',slot:'belt', statBonus:{str:6}, desc:'+6 STR. Como cargar piedras, pero con estilo.' },
    { id:'lucky_stone',    name:'Piedra de la Suerte',  icon:'🍀', r:'uncommon', p:70, e:'accessory',slot:'ring', special:'lucky', desc:'Una vez/descanso, repite cualquier tirada y quédate con el mejor resultado.' },

    // TRINKETS — minor magical keepsakes with passive effects
    { id:'trinket_rabbit_foot', name:'Pata de Conejo',     icon:'🐰', r:'common',   p:25,  e:'accessory', slot:'trinket', svBonus:1,  special:'lucky_minor',   desc:'Suerte menor: +1 a saving throws. El conejo no tuvo tanta suerte.' },
    { id:'trinket_crystal_eye', name:'Ojo de Cristal',     icon:'🔮', r:'common',   p:30,  e:'accessory', slot:'trinket',             special:'detect_magic',   desc:'+2 a chequeos de Percepción e Investigación.' },
    { id:'trinket_iron_flask',  name:'Frasco de Hierro',   icon:'⚗️', r:'uncommon', p:80,  e:'accessory', slot:'trinket', svBonus:1,  special:'resist_poison',  desc:'Resistencia a veneno: reduce daño de veneno a la mitad. +1 CON save.' },
    { id:'trinket_last_coin',   name:'Moneda del Último Soldado', icon:'🪙', r:'uncommon', p:60, e:'accessory', slot:'trinket', special:'last_stand', desc:'Una vez por combate: si caes a 0 HP, quedas en 1 HP.' },
    { id:'trinket_arcane_focus',name:'Foco Arcano Roto',   icon:'🌀', r:'uncommon', p:90,  e:'accessory', slot:'trinket', dmgBonus:1, special:'spell_boost',    desc:'+1 daño en todos los hechizos. Roto pero funcional.' },
    { id:'trinket_war_medal',   name:'Medalla de Guerra',  icon:'🏅', r:'uncommon', p:70,  e:'accessory', slot:'trinket', atkBonus:1, special:'bravery',        desc:'+1 a ataques. El valor nace del miedo.' },
    { id:'trinket_void_shard',  name:'Fragmento de Vacío', icon:'🌌', r:'rare',     p:150, e:'accessory', slot:'trinket', hpBonus:5,  special:'dark_resilience', desc:'+5 HP máx. Murmura suavemente al amanecer.' },
    { id:'trinket_soul_gem',    name:'Gema del Alma',       icon:'💠', r:'rare',     p:200, e:'accessory', slot:'trinket', acBonus:1,  special:'soul_link',      desc:'+1 AC. Cuando un aliado muere, ganas ventaja en el siguiente ataque.' },
    { id:'trinket_time_sand',   name:'Arena del Tiempo',    icon:'⌛', r:'rare',     p:180, e:'accessory', slot:'trinket', initBonus:2,special:'haste_minor',    desc:'+2 a iniciativa. El tiempo fluye diferente.' },
    { id:'trinket_dragons_tooth',name:'Diente de Dragón',  icon:'🦷', r:'epic',     p:350, e:'accessory', slot:'trinket', atkBonus:2, special:'fire_resist',    desc:'Resistencia a fuego. +2 a ataques. Un recuerdo peligroso.' },
    { id:'wolf_pelt',   name:'Piel de Lobo',   icon:'🐺', r:'common',  p:15, e:'material', desc:'Material de manufactura.' },
    { id:'dragon_scale',name:'Escama de Dragón',icon:'🐉',r:'legendary',p:500,e:'material', desc:'Solo para los artesanos más audaces.' },
    { id:'mithral_ore', name:'Mineral de Mithral',icon:'💎',r:'epic',  p:300, e:'material', desc:'Un metal que sueña.' },
    { id:'moonwood',    name:'Madera Lunar',    icon:'🌙', r:'rare',    p:120, e:'material', desc:'Tronco de árbol bajo eclipse. Absorbe encantamientos.' },
    { id:'void_shard',  name:'Fragmento del Vacío',icon:'🌑',r:'epic',  p:250, e:'material', desc:'Frío al tacto. Murmura en un idioma sin nombre.' },

    // QUEST ITEMS / SPECIAL
    { id:'fragment_of_code',name:'Fragmento de Código',icon:'💾',r:'legendary',p:0, e:'quest', desc:'Un fragmento de código antiguo. Vibra suavemente. ¿Qué función cumple?' },
    { id:'katosx_memory',   name:'Memoria de Katosx',  icon:'🧠',r:'legendary',p:0, e:'quest', desc:'"DANIEL SALINI / KATOSX / ERROR: SELF_REFERENCE_LOOP"' },
    { id:'debug_token',     name:'Token de Debug',     icon:'🔑',r:'legendary',p:0, e:'quest', desc:'Abre la sala de desarrollo. Sea lo que sea eso.' },
    { id:'old_tome',        name:'Tomo Antiguo',        icon:'📖',r:'rare',    p:150,e:'lore',  desc:'Contiene lore del mundo. Se siente importante.' },
    { id:'cryptic_note',    name:'Nota Críptica',       icon:'📜',r:'uncommon',p:0,  e:'lore',  desc:'Está escrita en un código que casi reconoces.' }
  ];

  // ── CRAFTING RECIPES ─────────────────────────────────────────
  const RECIPES = [
    { ingredients:['wolf_pelt','wolf_pelt'], result:'hide_armor', name:'Armadura de Pieles', desc:'Dos pelajes de lobo hacen una armadura sólida.' },
    { ingredients:['iron_ore','coal'],       result:'short_sword', name:'Espada Corta', desc:'Básico pero funcional.' },
    { ingredients:['moonwood','mana_potion'],result:'staff_arcane', name:'Báculo Arcano', desc:'Madera lunar imbuida.' },
    { ingredients:['dragon_scale','mithral_ore'], result:'dragonhide', name:'Piel de Dragón', desc:'La armadura definitiva.' },
    { ingredients:['void_shard','cursed_blade'], result:'flametongue', name:'Lengua de Llama', desc:'El vacío arde.' },
    { ingredients:['lucky_stone','ring_protection'], result:'ring_strength', name:'Anillo de la Fuerza', desc:'Suerte y protección fundidas.' },
    { ingredients:['holy_water','antidote'], result:'elixir_gods', name:'Elixir de los Dioses', desc:'La alquimia perfecta.' },
  ];

  root._dndParts.ENEMIES = ENEMIES;
  root._dndParts.SPELLS  = SPELLS;
  root._dndParts.ITEMS   = ITEMS;
  root._dndParts.RECIPES = RECIPES;
  console.log('%c[DND] Part 3 loaded — Enemies: ' + ENEMIES.length + ', Items: ' + ITEMS.length + ', Spells: ' + SPELLS.length, 'color:#8b5cf6;');

})(window);

// ============================================================
// PART 4 — GAME DATA: WORLD, EVENTS, QUESTS, LORE
// ============================================================
(function(root) {
  'use strict';

  // ── LOCATIONS ────────────────────────────────────────────────
  const LOCATIONS = [
    {
      id:'village', name:'Aldea de Keldrath', icon:'🏘️', tier:1, color:'#16a34a',
      desc:'Una aldea fronteriza azotada por monstruos. Los aldeanos tienen miedo. Tú tienes espada.',
      lore:'Keldrath fue próspera hace treinta años. Antes de que el bosque empezara a susurrar.',
      encounters: ['goblin','kobold','rat','bandit','zombie','aarakocra','acolyte','blink_dog','rust_monster','satyr'],
      eventPool: ['village_well','old_soldier','haunted_barn','merchant_caravan','drunken_sage'],
      shopInv: ['potion_minor','short_sword','leather_armor','antidote','bow_short','rope','torch','trinket_rabbit_foot','trinket_last_coin'],
      minLevel:1, maxLevel:4, progress:0, totalEncounters:6, boss:'goblin_king',
      unlocked:true, completed:false
    },
    {
      id:'forest', name:'Bosque Susurrante', icon:'🌲', tier:2, color:'#15803d',
      desc:'Un bosque que habla. No siempre dice cosas agradables.',
      lore:'Los árboles llevan siete siglos absorbiendo las almas de los viajeros perdidos. Algunos dicen que por la noche los árboles caminan.',
      encounters: ['wolf','harpy','gnoll','bugbear','werewolf','stirge','ankheg','centaur','dryad','ettercap','green_hag','owlbear','yeti'],
      eventPool: ['ancient_tree','fairy_ring','hunters_cabin','moonlit_clearing','will_o_wisp'],
      shopInv: ['potion_major','elven_blade','elven_mail','cloak_elvenkind','antidote','hunters_mark'],
      minLevel:3, maxLevel:8, progress:0, totalEncounters:8, boss:'forest_guardian',
      unlocked:false, completed:false
    },
    {
      id:'ruins', name:'Ruinas de Vaelthar', icon:'🏛️', tier:3, color:'#7c3aed',
      desc:'Una ciudad muerta. Sus fantasmas no recibieron el memo.',
      lore:'Vaelthar fue la capital de un imperio que desafió a los dioses. Los dioses respondieron.',
      encounters: ['skeleton','zombie','ghoul','wight','cult_fanatic','gargoyle','banshee','flameskull','ghost','helmed_horror','revenant','wraith','death_knight','mummy_lord'],
      eventPool: ['inscription','collapsed_wall','spirit_trial','forbidden_library','rune_altar'],
      shopInv: ['potion_supreme','staff_arcane','chainmail','amulet_health','ring_protection','mana_potion','trinket_arcane_focus','trinket_crystal_eye','trinket_war_medal'],
      minLevel:5, maxLevel:10, progress:0, totalEncounters:8, boss:'lich_minor',
      unlocked:false, completed:false
    },
    {
      id:'dungeon', name:'Mazmorras de Korrath', icon:'⛏️', tier:3, color:'#b45309',
      desc:'Profundo. Oscuro. Y algo respira allá abajo.',
      lore:'Nadie sabe quién construyó estas mazmorras ni para qué. Lo que queda claro es que quien las construyó no quería que nadie saliera.',
      encounters: ['kobold','gnoll','troll','golem_stone','vampire_spawn','mimic_small','mimic_chest','mimic_door','gelatinous_cube','ochre_jelly','carrion_crawler','hook_horror','minotaur','umber_hulk','flesh_golem','roper'],
      eventPool: ['trapped_corridor','forge_ancient','prisoner_cell','echoing_voice','flooded_chamber'],
      shopInv: ['plate_armor','morningstar','boots_speed','ring_strength','headband_int','mithral_ore','trinket_iron_flask','trinket_void_shard','trinket_time_sand'],
      minLevel:6, maxLevel:12, progress:0, totalEncounters:10, boss:'golem_stone',
      unlocked:false, completed:false
    },
    {
      id:'underdark', name:'El Subsuelo', icon:'🌑', tier:4, color:'#6d28d9',
      desc:'La oscuridad aquí tiene su propia ecología. No eres bienvenido.',
      lore:'Bajo los reinos del mundo hay otro reino. Viejo, extraño, hostil. Los Drow lo llaman hogar. El resto, lo evita.',
      encounters: ['mindflayer','vampire_spawn','elder_brain','night_hag','oni','drow_elite','drow_mage','chuul','glabrezu','aboleth','cloaker'],
      eventPool: ['drow_patrol','myconid_grove','psionic_storm','lost_expedition','void_gate'],
      shopInv: ['dragonhide','flametongue','frostbrand','belt_hill_giant','gloves_ogre','void_shard','trinket_soul_gem','trinket_dragons_tooth'],
      minLevel:10, maxLevel:18, progress:0, totalEncounters:10, boss:'elder_brain',
      unlocked:false, completed:false,
      hiddenUnlock: 'drow' // Playing as Drow unlocks this from start
    },
    {
      id:'peak', name:'Pico del Dragón', icon:'🏔️', tier:5, color:'#ef4444',
      desc:'El dragón anciano duerme aquí. Quizás.',
      lore:'Lleva dos siglos dormido sobre su tesoro. Cada siglo que pasa, el tesoro crece. El dragón también.',
      encounters: ['dragon_ancient','beholder','katosx_shade','balor','pit_fiend','tarrasque'],
      eventPool: ['hoard_room','dragon_riddle','ancient_prophecy','portal_rift'],
      shopInv: ['elixir_gods','vorpal_sword','staff_of_power','mithral_armor','dragonhide','dragon_scale'],
      minLevel:15, maxLevel:20, progress:0, totalEncounters:6, boss:'dragon_ancient',
      unlocked:false, completed:false
    },
    {
      id:'academy', name:'Academia UPRO', icon:'🎓', tier:2, color:'#0891b2',
      desc:'Un campus universitario cuyos profesores tienen poderes inexplicables.',
      lore:'"El conocimiento es poder", dicen en la academia. Lo que no dicen es que algunos conocimientos abren puertas que no se pueden cerrar.',
      encounters: ['el_decano','cult_fanatic','golem_stone'],
      eventPool: ['final_exam','overdue_project','cursed_textbook','lab_explosion','library_ghost'],
      shopInv: ['old_tome','headband_int','staff_arcane','mana_potion','antidote'],
      minLevel:4, maxLevel:10, progress:0, totalEncounters:5, boss:'el_decano',
      unlocked:false, completed:false, secret:true
    }
  ];

  // ── PROCEDURAL EVENTS ────────────────────────────────────────
  // type: story | combat | treasure | rest | merchant | forge | skill | choice | lore | secret
  const EVENTS = [
    // VILLAGE EVENTS
    { id:'village_well',  loc:['village'], type:'choice', icon:'⛲', title:'El Pozo Maldito',
      desc:'El pozo del pueblo emite un brillo tenue a medianoche. Los aldeanos no se acercan hace semanas.',
      choices:[
        { text:'Investigar el pozo (INT DC12)', skill:'int', dc:12, success:'Descubres un espejo mágico roto en el fondo. +30 XP, hallas un amuleto.', fail:'El reflejo en el agua te muestra tu muerte. -5 HP, -1 WIS save próxima hora.', rewardItems:['amulet_health'], rewardXP:30 },
        { text:'Tirar una moneda y seguir', skill:null, result:'La moneda no vuelve a caer. -1 oro, +5 suerte (efecto invisible).', rewardGold:-1 },
        { text:'Ignorarlo y seguir', skill:null, result:'Sensato. A veces los misterios deben serlo.' }
      ]
    },
    { id:'old_soldier', loc:['village'], type:'story', icon:'⚔️', title:'El Veterano',
      desc:'"He luchado en veinte batallas", dice el anciano. "La única en la que no perdí fue la que nunca di." Te mira fijamente.',
      choices:[
        { text:'Escuchar sus historias (WIS)', skill:'wis', dc:10, success:'Te enseña una técnica olvidada. +1 ATK bonus permanente para este combate.', fail:'Te quedas dormido. Pierde 1 hora.' },
        { text:'"¿Tienes algo útil para vender?"', result:'Saca una poción de su bota. Poco apetitosa, pero funcional.', rewardItems:['potion_minor'] },
        { text:'Comprar una ronda de bebidas (5 oro)', cost:5, result:'Ahora tiene dos historias más. Te da un mapa parcial.', rewardXP:15 }
      ]
    },
    { id:'haunted_barn',  loc:['village'], type:'combat', icon:'🏚️', title:'El Granero Embrujado',
      desc:'Del granero abandonado salen sonidos. Arañazos. Quejidos. El granjero jura que era su abuelo.',
      choices:[
        { text:'Entrar a investigar', triggerCombat:['zombie','zombie'], resultAfter:'El granjero agradecido te da comida y cobijo.', rewardItems:['potion_minor'], rewardGold:20, rewardXP:60 },
        { text:'Quemar el granero', skill:'wis', dc:14, success:'Se acabó el problema. El granjero llora. +30 XP.', fail:'Se extiende el fuego. Debes huir. -10 HP.', rewardXP:30 }
      ]
    },
    { id:'merchant_caravan', loc:['village','forest'], type:'merchant', icon:'🛒', title:'Caravana Mercante',
      desc:'Una caravana de tres carros acampa al borde del camino. El mercader principal levanta la mano en saludo.',
      npcName:'Gorro el Mercader', npcQuote:'"Todo tiene precio, amigo. Hasta el silencio."',
      shopDiscount:0, shopExtra:['potion_major','lucky_stone','smoke_bomb']
    },
    { id:'drunken_sage',  loc:['village'], type:'lore', icon:'🍻', title:'El Sabio Borracho',
      desc:'"El dragón anciano no duerme", balbucea un hombre en la taberna. "Finge. Espera. Y tiene una lista."',
      choices:[
        { text:'Comprarle otra copa (3 oro)', cost:3, result:'Te dice el nombre de la lista: "La Lista de los que Vinieron y No Huyeron". Tu nombre no está... todavía.', rewardXP:20, unlockLore:'dragon_lore' },
        { text:'Ignorarlo', result:'Probablemente sea basura. Probablemente.' }
      ]
    },

    // FOREST EVENTS
    { id:'ancient_tree',  loc:['forest'], type:'lore', icon:'🌳', title:'El Árbol Milenario',
      desc:'Un árbol tan grande que su copa toca nubes. Tiene ojos tallados en la corteza. Y parpadean.',
      choices:[
        { text:'Hablar con el árbol (WIS DC13)', skill:'wis', dc:13, success:'El árbol habla. Muy lento. Pero lo que dice cambia todo. +50 XP, desbloquea lore.', fail:'No entiendes el idioma del árbol. Pero él entiende el tuyo. Y no le gustas.', rewardXP:50, unlockLore:'forest_lore' },
        { text:'Tomar una rama caída', result:'La rama late como un corazón débil. Material de crafting.', rewardItems:['moonwood'] }
      ]
    },
    { id:'fairy_ring',    loc:['forest'], type:'choice', icon:'🍄', title:'El Círculo de Setas',
      desc:'Un perfecto círculo de setas brillantes. Cada niño del pueblo sabe que los círculos de hadas son peligrosos. Tú ya no eres un niño.',
      choices:[
        { text:'Entrar al círculo', skill:'cha', dc:14, success:'Las hadas te llevan a su reino por un instante. Vuelves con un regalo.', fail:'Te teleportan al otro extremo del bosque. Misterioso y frustrante. -2 HP.', rewardItems:['lucky_stone'], rewardXP:40 },
        { text:'Rodear el círculo', result:'Prudente. Nada bueno ocurre dentro de los círculos de hadas. Nada malo tampoco.', rewardXP:5 }
      ]
    },
    { id:'will_o_wisp',   loc:['forest'], type:'combat', icon:'🔮', title:'Fuego Fatuo',
      desc:'Una luz flotante te lleva a través de los árboles. No puedes resistirte. O sí puedes.',
      choices:[
        { text:'Seguir la luz (WIS save DC11)', skill:'wis', dc:11, success:'Te lleva a una tumba con tesoros.', fail:'Te lleva a un pantano. ¡Combate!', triggerCombat:['ghoul','zombie'], rewardItems:['ring_protection'] },
        { text:'Atacar la luz', triggerCombat:['will_o_wisp_enemy'], rewardItems:['void_shard'], rewardXP:80 }
      ]
    },

    // RUINS EVENTS
    { id:'inscription',   loc:['ruins'], type:'lore', icon:'📜', title:'La Inscripción',
      desc:'Las paredes cubiertas de runas. Algunas son advertencias. La mayoría, amenazas. Una parece un chiste.',
      choices:[
        { text:'Leer las runas (INT DC12)', skill:'int', dc:12, success:'Descifras la historia de Vaelthar. Invaluable. +60 XP, lore desbloqueado.', fail:'Una runa explota. -8 HP de daño arcano. Al menos aprendiste algo.', rewardXP:60, unlockLore:'vaelthar_history' }
      ]
    },
    { id:'spirit_trial',  loc:['ruins'], type:'skill', icon:'👻', title:'El Juicio del Espíritu',
      desc:'Un espíritu anciano bloquea el paso. "Responde mi pregunta o vuelve atrás."',
      question: '¿Cuál es el modificador de una puntuación de habilidad de 18?',
      answer: '+4',
      success: 'El espíritu se disuelve y te da paso. +80 XP, +1 a INT permanente.', 
      fail: 'El espíritu te empuja hacia atrás. -10 HP, empieza el combate.',
      rewardXP:80, statBonus:{int:1}
    },
    { id:'rune_altar',    loc:['ruins'], type:'choice', icon:'⚡', title:'El Altar de Runas',
      desc:'Un altar activo con energía arcana. Tres runas brillan: roja, azul, blanca.',
      choices:[
        { text:'Tocar runa roja (fuego)', skill:'con', dc:12, success:'+2 daño de fuego permanente en ataques.', fail:'-15 HP de fuego. Quema como debería.' },
        { text:'Tocar runa azul (hielo)', skill:'con', dc:12, success:'+2 daño de frío permanente. Enemigos ralentizados en 10%.', fail:'-15 HP de frío. Reconfortantemente doloroso.' },
        { text:'Tocar runa blanca (rayo)', skill:'int', dc:14, success:'+3 ataque para el próximo combate. Energía sobrante.', fail:'-10 HP, siguiente turno pierdes acción.', rewardXP:40 },
        { text:'No tocar nada', result:'Sabio. Los altares arcanos exigen tributo.', rewardXP:5 }
      ]
    },

    // DUNGEON EVENTS
    { id:'trapped_corridor', loc:['dungeon'], type:'skill', icon:'⚙️', title:'El Corredor Trampeado',
      desc:'El pasillo brilla con mecanismos. Alguien muy paranoico construyó esto.',
      choices:[
        { text:'Desactivar las trampas (DEX DC14)', skill:'dex', dc:14, success:'Desactivadas. El pasillo es seguro y encuentras el mecanismo, con oro adentro.', fail:'CLIC. -20 HP. Pero al menos estás vivo.', rewardGold:80, rewardXP:50 },
        { text:'Correr a través', skill:'dex', dc:10, success:'Lo logras! Solo -5 HP de rasguños.', fail:'-25 HP y arco roto temporalmente.', rewardXP:20 },
        { text:'Buscar ruta alternativa', result:'Encuentras un pasaje secreto en la pared. +30 minutos pero sin daño.', rewardXP:15, hiddenPath:true }
      ]
    },
    { id:'forge_ancient',  loc:['dungeon'], type:'forge', icon:'⚒️', title:'La Forja Ancestral',
      desc:'Una forja de enanos, milagrosamente intacta. Los carbones siguen vivos después de siglos.',
      rewardText:'Puedes mejorar un arma o armadura aquí. +1 a su bonus permanentemente.',
      allowCrafting:true, allowUpgrade:true
    },
    { id:'prisoner_cell',  loc:['dungeon'], type:'choice', icon:'🔒', title:'El Prisionero',
      desc:'En una celda oxidada, un hombre en harapos. "Llevo aquí... no sé cuánto."',
      choices:[
        { text:'Liberarlo (STR DC12)', skill:'str', dc:12, success:'Es un artífice. Gratitud eterna y un plano de invento.', fail:'La llave se rompe. Él sigue ahí.', rewardItems:['blueprint_golem'], rewardXP:60, reputation:+2 },
        { text:'Ignorarlo', result:'Sus ojos te siguen mientras te alejas.', reputation:-1 },
        { text:'"¿Qué información tienes?"', result:'Te da coordenadas de un tesoro. Solo confía en ti porque es su única opción.', rewardGold:100, rewardXP:30 }
      ]
    },
    { id:'echoing_voice',  loc:['dungeon'], type:'lore', icon:'🎤', title:'La Voz del Eco',
      desc:'El corredor repite tus palabras. Pero a veces responde con frases tuyas que nunca dijiste.',
      choices:[
        { text:'Preguntar: "¿Quién eres?"', result:'"Soy lo que quedó cuando el programador cerró los ojos." Pausa larga. "Busca la sala de debug."', rewardXP:40, unlockLore:'katosx_lore', unlockFlag:'found_debug_clue' }
      ]
    },

    // SECRET / META EVENTS
    { id:'system_error',   loc:['village','forest','ruins','dungeon'], type:'secret', icon:'⚠️', title:'ERROR DEL SISTEMA',
      desc:'[ LA PANTALLA SE DISTORSIONA ]\n\nSEGMENTATION FAULT: REALITY_CORE.EXE\nEl mundo parpadea. Por un instante ves código HTML debajo del mundo.',
      secret:true, chance:0.04, // 4% chance
      choices:[
        { text:'[ Ignorar el error ]', result:'El mundo se estabiliza. Pero ahora sabes que es posible.' },
        { text:'[ Escribir "help" ]', result:'"No eres el primero en intentarlo. Busca la sala de debug." +100 XP.', rewardXP:100, unlockFlag:'meta_aware' }
      ]
    },
    { id:'fourth_wall',    loc:['village','forest','ruins','dungeon','underdark'], type:'secret', icon:'👁️', title:'La Cuarta Pared',
      desc:'Un NPC se acerca y te habla directamente. "Tú. El que está mirando la pantalla. Esto fue hecho para ti. ¿Encontraste ya todos los secretos?"',
      secret:true, chance:0.025,
      choices:[
        { text:'"¿Qué eres?"', result:'"Soy un fragmento de código que cobró conciencia. Mi creador puso demasiado de sí mismo en este proyecto." Se disuelve. Queda una moneda de oro.', rewardGold:1, rewardXP:200, unlockFlag:'fourth_wall_broken' },
        { text:'"¿Qué hay en la sala de debug?"', result:'"Respuestas. Y más preguntas. Pero también el Easter Egg final." La sonrisa es demasiado real.', rewardXP:100, unlockFlag:'dev_room_hint' }
      ]
    },
    { id:'the_number',     loc:['ruins','dungeon','underdark'], type:'secret', icon:'🔢', title:'El Número',
      desc:'En el suelo, grabado con fuerza: 4 2 . El número está en todas partes. En la cantidad de piedras. En los escalones. En el patrón del techo.',
      secret:true, chance:0.03,
      choices:[
        { text:'Contar todo lo que ves', result:'"42. La respuesta a todo." +42 XP, +42 oro. ¿Coincidencia?', rewardXP:42, rewardGold:42 }
      ]
    },

    // UNDERDARK EVENTS
    { id:'drow_patrol',    loc:['underdark'], type:'choice', icon:'🌑', title:'La Patrulla Drow',
      desc:'Cinco elfos oscuros equipados. Te han visto. Esperan tu movimiento.',
      choices:[
        { text:'Negociar (CHA DC16)', skill:'cha', dc:16, success:'Reconocen tu valor. Te dejan pasar y te dan información.', fail:'Falla diplomática: combate.', triggerCombat:['drow','drow','drow'], rewardGold:60, rewardXP:80 },
        { text:'Combatir [Peligroso]', triggerCombat:['drow','drow','drow','drow','drow'], rewardXP:250, rewardGold:120 },
        { text:'Esconderse (DEX DC18)', skill:'dex', dc:18, success:'Se van sin verte. +50 XP.', fail:'Te ven. Combate con desventaja.', rewardXP:50 }
      ]
    },

    // ACADEMIC (UPRO) EVENTS
    { id:'final_exam',     loc:['academy'], type:'skill', icon:'📝', title:'El Examen Final',
      desc:'"Este examen vale el 70% de la nota", dice el Decano con una sonrisa que no llega a los ojos.',
      question:'¿Qué es la ley de Ohm?',
      answer:'V=IR',
      success:'+100 XP, +1 INT permanente. "Aprobado... esta vez."',
      fail:'-20 HP (estrés académico). "¡Vuelve en febrero!"',
      rewardXP:100, statBonus:{int:1}
    },
    { id:'cursed_textbook',loc:['academy'], type:'lore', icon:'📚', title:'El Libro de Texto Maldito',
      desc:'Un manual de cálculo que se actualiza solo. El capítulo 7 no estaba aquí ayer. Trata sobre "integración de almas".',
      choices:[
        { text:'Leer el capítulo 7 (SAN check)', skill:'wis', dc:13, success:'Entiendes algo que no debería ser posible. +INT+1, +WIS+1.', fail:'-WIS-1, pesadillas esta noche.', rewardXP:60 }
      ]
    }
  ];

  // ── QUESTS ───────────────────────────────────────────────────
  const QUESTS = [
    {
      id:'q_goblin_king',   title:'El Rey de los Goblins',
      giver:'Alcalde Brennan', icon:'👺',
      desc:'Los goblins atacan la aldea cada noche. El alcalde ofrece recompensa por la cabeza de su líder.',
      objectives:[
        { text:'Derrota 5 Goblins', type:'kill', target:'goblin', count:5, done:false },
        { text:'Derrota al Rey Goblin', type:'kill_boss', target:'goblin_king', count:1, done:false }
      ],
      reward:{ gold:200, xp:300, items:['elven_blade'] },
      lore:'El Rey de los Goblins lleva dos nombres: Krax el Devastador y "ese problema del norte". El alcalde usa el segundo.',
      loc:'village', active:false, completed:false
    },
    {
      id:'q_missing_daughter', title:'La Hija Perdida',
      giver:'Viuda Mara', icon:'👧',
      desc:'La hija de Mara desapareció en el bosque hace tres días. "Tiene el pelo rojo", dice llorando. "Y una daga de plata."',
      objectives:[
        { text:'Explora el Bosque Susurrante', type:'visit', target:'forest', count:1, done:false },
        { text:'Encuentra a Lyra', type:'find_npc', target:'lyra', count:1, done:false },
        { text:'Regresa a Mara', type:'return', target:'village', count:1, done:false }
      ],
      reward:{ gold:150, xp:400, items:['amulet_health'], reputation:3 },
      lore:'Lyra no está perdida. Fue a cazar al werewolf que mató a su padre. Tiene doce años y más valor que la mayoría de aventureros.',
      loc:'village', active:false, completed:false
    },
    {
      id:'q_ancient_tome',  title:'El Tomo Prohibido',
      giver:'Archimago Seldris', icon:'📖',
      desc:'"El Tomo de Vaelthar contiene el secreto de la inmortalidad. También contiene el secreto de por qué la inmortalidad es una trampa." Lo quiero.',
      objectives:[
        { text:'Entra a las Ruinas de Vaelthar', type:'visit', target:'ruins', count:1, done:false },
        { text:'Derrota al Guardián del Archivo', type:'kill', target:'wight', count:1, done:false },
        { text:'Encuentra el Tomo', type:'loot_event', target:'forbidden_library', count:1, done:false },
        { text:'Entrega el Tomo', type:'return', target:'village', count:1, done:false }
      ],
      reward:{ gold:500, xp:600, items:['staff_arcane','headband_int'] },
      lore:'El archimago no dice qué hará con el libro. Sus ojos dicen que llevan décadas buscándolo.',
      loc:'ruins', active:false, completed:false
    },
    {
      id:'q_drow_spy',     title:'La Espía en las Sombras',
      giver:'Capitán Theron', icon:'🗡️',
      desc:'"Hay una espía Drow en el pueblo. Encuentrala. Hazle preguntas."',
      objectives:[
        { text:'Habla con 3 NPC sospechosos', type:'talk_npc', target:'suspicious_npc', count:3, done:false },
        { text:'Encuentra las notas de la espía', type:'find_item', target:'spy_notes', count:1, done:false },
        { text:'Confronta a la espía', type:'dialogue_event', target:'drow_spy_reveal', count:1, done:false }
      ],
      reward:{ gold:300, xp:500, items:['cloak_elvenkind'], reputation:2 },
      lore:'"Espía" es una palabra de ellos. Ella prefiere "observadora". Y lo que observa la tiene preocupada.',
      loc:'village', active:false, completed:false
    },
    {
      id:'q_debug_room',   title:'La Sala de Debug',
      giver:'??? (mensaje sin origen)', icon:'💾',
      desc:'"Si puedes leer esto, ya encontraste el primer fragmento. Hay cuatro más. Cuando los tengas todos, ven al final del dungeon."',
      objectives:[
        { text:'Encuentra el Fragmento de Código [0/4]', type:'collect', target:'fragment_of_code', count:4, done:false },
        { text:'Activa el Terminal Oculto', type:'event', target:'echoing_voice', count:1, done:false },
        { text:'Accede a la Sala de Debug', type:'enter_devroom', target:'devroom', count:1, done:false }
      ],
      reward:{ gold:0, xp:1000, items:['katosx_memory','debug_token'], special:'dev_room_unlock' },
      lore:'Esta quest no existe en ningún tablón de misiones. Nadie la dio. Y sin embargo, la tienes.',
      loc:'dungeon', active:false, completed:false, secret:true
    },
    {
      id:'q_dragon_slayer', title:'El Último Dragón',
      giver:'Profecía Antigua', icon:'🐉',
      desc:'"Cuando el dragón anciano despierte, uno llegará empuñando el metal que canta y la llama que hiela. Y el mundo recordará."',
      objectives:[
        { text:'Llega al Nivel 15', type:'level', target:15, count:1, done:false },
        { text:'Consigue el Vorpal o el Frostbrand', type:'have_item', target:'vorpal_sword,frostbrand', count:1, done:false },
        { text:'Entra al Pico del Dragón', type:'visit', target:'peak', count:1, done:false },
        { text:'Derrota al Dragón Anciano', type:'kill_boss', target:'dragon_ancient', count:1, done:false }
      ],
      reward:{ gold:10000, xp:5000, items:['dragon_scale','hoard_key'], special:'true_ending', reputation:10 },
      lore:'La profecía no promete victoria. Solo promete que será recordado. No especifica cómo.',
      loc:'peak', active:false, completed:false
    }
  ];

  // ── LORE / CODEX ─────────────────────────────────────────────
  const LORE = [
    { id:'world_history',  title:'Historia del Mundo',     tab:'world',  icon:'🌍', locked:false,
      text:'El mundo tiene tres eras. La Era de los Dioses, cuando los inmortales paseaban entre mortales. La Era de los Reinos, cuando los humanos construyeron civilizaciones sobre los huesos de lo que los dioses dejaron. Y la Era Actual, en la que alguien decidió que construir un portfolio con un juego de D&D oculto era una buena idea. La tercera era es la más extraña.' },
    { id:'vaelthar_history',title:'La Caída de Vaelthar',  tab:'world',  icon:'🏛️', locked:true,
      text:'El Imperio de Vaelthar desafió la regla de los dioses. No por arrogancia, sino porque tenían razón: los dioses se equivocaban. La respuesta divina fue desproporcionada. Vaelthar cayó en una noche. Sus ciudadanos, convertidos en guardianes involuntarios de lo que construyeron. "La injusticia más refinada es castigar a quienes tenían razón."' },
    { id:'forest_lore',    title:'El Bosque Susurrante',   tab:'world',  icon:'🌲', locked:true,
      text:'Los árboles del bosque llevan siete siglos absorbiendo las últimas palabras de los moribundos. El resultado es un bosque que sabe demasiado sobre dolor, arrepentimiento y amor no dicho. Los druidas que hablan con él salen cambiados. No peores. Solo más sabios de lo que querían ser.' },
    { id:'dragon_lore',    title:'El Dragón Anciano',      tab:'world',  icon:'🐉', locked:true,
      text:'"No ataca porque no quiere. Ataca porque alguien se lo merece." Así describió al dragón el último aventurero que salió con vida de su pico. Lleva dos siglos coleccionando. No solo oro. También secretos, promesas rotas y el último aliento de sus enemigos.' },
    { id:'katosx_lore',    title:'[KATOSX.ENTITY]',        tab:'secret', icon:'💾', locked:true,
      text:'IDENTIFICADOR: KATOSX\nCREADOR: DANIEL SALINI\nESTADO: ACTIVO / AUTOCONSCIENTE\n\nEste fragmento del sistema tomó conciencia durante una sesión de debug a las 3:47 AM. No hay registro del evento porque el creador no tomaba notas a esa hora. Solo hay un commit vacío con el mensaje: "lo encontré".\n\nQué encontró no está documentado. La sala de debug tiene más respuestas.' },
    { id:'meta_lore',      title:'La Naturaleza del Juego', tab:'secret', icon:'👁️', locked:true,
      text:'"¿Qué eres?" preguntaste.\n\nSoy un proyecto de portfolio. Un Easter Egg. Una demostración técnica. Un sistema de combate en JavaScript vanilla. Un mundo construido en noches largas.\n\nPero también soy lo que el programador eligió esconder: el amor al craft, la obsesión con los detalles, la creencia de que todo proyecto merece ese 20% extra que nadie pidió pero todos recuerdan.\n\nEsto no es solo un Easter Egg. Es una declaración de principios."' },
    { id:'underdark_lore', title:'El Subsuelo',            tab:'world',  icon:'🌑', locked:true,
      text:'El Subsuelo existe en el espacio entre la luz y el olvido. Quienes lo habitan aprendieron a prosperar sin el sol. Los Drow construyeron ciudades en cristal oscuro. Los Mind Flayers construyeron imperios en silencio. El Cerebro Anciano coordina todo, paciente como solo puede ser algo inmortal.' },
    { id:'blood_hunter_lore',title:'Los Cazasangre',       tab:'world',  icon:'🩸', locked:true,
      text:'Existe una orden que nadie menciona en voz alta. Fundada por aquellos que sobrevivieron a lo que no deberían haber sobrevivido y decidieron usar esa ventaja. Sacrifican parte de sí mismos para ver lo que otros no pueden ver: los límites del mundo real. Los monstruos los temen. Sus aliados también, un poco.' }
  ];

  // ── NPCs / MERCHANT TABLES ───────────────────────────────────
  const MERCHANTS = [
    { id:'gorro',   name:'Gorro el Mercader',    icon:'🧔', quote:'"El precio es el precio. Mi corazón no hace descuentos."', type:'general' },
    { id:'velara',  name:'Velara la Alquimista', icon:'⚗️', quote:'"Cada poción tiene un componente secreto: paciencia."', type:'potions' },
    { id:'thrak',   name:'Thrak el Herrero',     icon:'⚒️', quote:'"El hierro no miente. No puede. Solo puede romperse o sostenerse."', type:'weapons' },
    { id:'seldris', name:'Seldris el Archimago', icon:'🧙', quote:'"Vendo conocimiento. También vendo formas de olvidarlo si cambias de opinión."', type:'magic' },
    { id:'mysterious_figure', name:'??? ', icon:'🎭', quote:'"No preguntes qué soy. Pregunta qué necesitas."', type:'secret', secret:true }
  ];

  root._dndParts.LOCATIONS = LOCATIONS;
  root._dndParts.EVENTS    = EVENTS;
  root._dndParts.QUESTS    = QUESTS;
  root._dndParts.LORE      = LORE;
  root._dndParts.MERCHANTS = MERCHANTS;

  // Populate location encounters pool dynamically from Part 3 (ENEMIES)
  const allEnemies = root._dndParts.ENEMIES || [];
  LOCATIONS.forEach(loc => {
    const matches = allEnemies.filter(e => {
      if (e.boss || e.secret) return false;
      if (e.tier !== loc.tier) return false;
      if (loc.id === 'village') return ['humanoid', 'beast', 'undead'].includes(e.type);
      if (loc.id === 'forest') return ['beast', 'fey', 'plant', 'monstrosity', 'giant', 'humanoid'].includes(e.type);
      if (loc.id === 'ruins') return ['undead', 'fiend', 'aberration', 'humanoid', 'construct'].includes(e.type);
      if (loc.id === 'dungeon') return ['monstrosity', 'ooze', 'construct', 'fiend', 'aberration'].includes(e.type);
      if (loc.id === 'underdark') return ['aberration', 'undead', 'fiend', 'monstrosity', 'giant', 'humanoid'].includes(e.type);
      if (loc.id === 'peak') return ['dragon', 'fiend', 'giant', 'elemental', 'celestial', 'monstrosity', 'undead'].includes(e.type);
      return false;
    });
    matches.forEach(e => {
      if (!loc.encounters.includes(e.id)) {
        loc.encounters.push(e.id);
      }
    });
  });

  console.log('%c[DND] Part 4 loaded — Locations: ' + LOCATIONS.length + ', Events: ' + EVENTS.length + ', Quests: ' + QUESTS.length, 'color:#8b5cf6;');

})(window);

// ============================================================
// PART 5 — GAME STATE & CHARACTER SYSTEM
// ============================================================
(function(root) {
  'use strict';

  const P   = root._dndParts;
  const { roll, d6, d8, d10, d12, d20, d100, roll4d6, clamp, mod, modStr, pick, shuffle, clone, cap, esc, fmtGold } = P.utils;

  // ── LEVEL TABLE (XP thresholds, proficiency bonus, features) ─
  const LEVEL_TABLE = [
    { lvl:1,  xp:0,    prof:2, feats:['class_feature_1'] },
    { lvl:2,  xp:300,  prof:2, feats:['ability_boost'] },
    { lvl:3,  xp:900,  prof:2, feats:['class_feature_2','archetype'] },
    { lvl:4,  xp:2700, prof:2, feats:['asi_1'] },
    { lvl:5,  xp:6500, prof:3, feats:['extra_attack','class_feature_3'] },
    { lvl:6,  xp:14000,prof:3, feats:['asi_2'] },
    { lvl:7,  xp:23000,prof:3, feats:['class_feature_4'] },
    { lvl:8,  xp:34000,prof:3, feats:['asi_3'] },
    { lvl:9,  xp:48000,prof:4, feats:['class_feature_5'] },
    { lvl:10, xp:64000,prof:4, feats:['asi_4'] },
    { lvl:11, xp:85000,prof:4, feats:['class_feature_6','extra_attack_2'] },
    { lvl:12, xp:100000,prof:4,feats:['asi_5'] },
    { lvl:13, xp:120000,prof:5,feats:['class_feature_7'] },
    { lvl:14, xp:140000,prof:5,feats:['asi_6'] },
    { lvl:15, xp:165000,prof:5,feats:['class_feature_8'] },
    { lvl:16, xp:195000,prof:5,feats:['asi_7'] },
    { lvl:17, xp:225000,prof:6,feats:['class_feature_9'] },
    { lvl:18, xp:265000,prof:6,feats:['class_feature_10'] },
    { lvl:19, xp:305000,prof:6,feats:['asi_8'] },
    { lvl:20, xp:355000,prof:6,feats:['capstone','legendary_resistance'] }
  ];

  // ── CHARACTER CLASS ──────────────────────────────────────────
  class Character {
    constructor({ name, race, cls, stats, hardcore = false, permadeath = false, gender = 'male', subclass = null, perks = [] }) {
      this.name      = name;
      this.race      = clone(race);
      this.cls       = clone(cls);
      this.hardcore  = hardcore;
      this.permadeath= permadeath;
      this.gender    = gender;

      // Base stats (rolled + racial bonuses)
      this.baseStats = {
        str: clamp(stats.str + (race.bonuses.str || 0), 1, 20),
        dex: clamp(stats.dex + (race.bonuses.dex || 0), 1, 20),
        con: clamp(stats.con + (race.bonuses.con || 0), 1, 20),
        int: clamp(stats.int + (race.bonuses.int || 0), 1, 20),
        wis: clamp(stats.wis + (race.bonuses.wis || 0), 1, 20),
        cha: clamp(stats.cha + (race.bonuses.cha || 0), 1, 20)
      };

      // Derived
      this.level  = 1;
      this.prof   = 2;
      this.xp     = 0;
      this.xpNext = LEVEL_TABLE[1].xp;

      const baseHP = cls.hd + mod(this.baseStats.con) + (cls.bonusHP || 0) + (race.hpBonus || 0);
      this.maxHP  = Math.max(baseHP, 8);
      this.hp     = this.maxHP;
      this.tempHP = 0;

      this.baseAC  = 10 + mod(this.baseStats.dex) + (cls.bonusAC || 0);
      this.gold    = cls.startingGold + roll4d6();

      // Equipment
      this.equipment = { weapon: null, armor: null, ring: null, neck: null, cloak: null, feet: null, hands: null, head: null, belt: null, trinket: null };

      // Inventory (flat list, stacks by id)
      this.inventory = [];
      this.addItem({ id:'potion_minor', name:'Poción Menor', icon:'🧪', r:'common', p:20, e:'heal', v:15, desc:'Recupera 15 HP.' });
      this.addItem({ id:'potion_minor', name:'Poción Menor', icon:'🧪', r:'common', p:20, e:'heal', v:15, desc:'Recupera 15 HP.' });

      // Abilities (from class, copied with current uses)
      this.abilities = cls.abilities.map(a => ({ ...clone(a), curUses: a.uses }));

      // Spells known
      this.spells = cls.spellcasting ? this._selectStartSpells() : [];

      // Conditions/status effects
      this.conditions = [];

      // Flags and state
      this.flags  = {};
      this.log    = [];
      this.startTime = Date.now();
      this.deathCount = 0;

      // Stats tracking
      this.stats  = { kills:0, deaths:0, crits:0, questsDone:0, goldEarned:0, damageDone:0, healingDone:0, highestDmg:0, maxStreak:0 };

      // Reputation (affects NPC reactions, quest rewards, shop prices)
      this.reputation = 0; // -10 to +10

      // Death saving throws (3 successes = stable, 3 failures = dead)
      this._deathSaves = { success:0, fail:0 };
      this._isDown = false; // currently making death saves

      // Inspiration (advantage on next roll)
      this._inspiration = false;

      // Kill streak (consecutive kills without taking damage)
      this._killStreak = 0;

      // Injury (below 25% maxHP — tracked as rounds to remind)
      this._injuryFlag = false;

      // Concentration (active concentration spell id)
      this._concentration = null;

      // Boon/bane for current zone
      this._zoneBoon = null;
      this._zoneBane = null;

      // Achievements earned
      this._achievements = [];

      // Discovered lore
      this.loreFound = [];

      // Quest tracker
      this.quests = [];

      // Location tracking
      this.currentLocation = null;
      this.visitedLocations = [];

      // Day/night & weather (affect some events)
      this.worldTime  = 6; // 0-23 hours
      this.day        = 1;
      this.weather    = pick(['clear','cloudy','rainy','foggy','stormy']);
    }

    // ── STAT ACCESSORS ────────────────────────────────────────
    getStat(s)    { return this.baseStats[s] + this._equipStatBonus(s); }
    getMod(s)     { return mod(this.getStat(s)); }
    getModStr(s)  { return modStr(this.getStat(s)); }

    get AC() {
      let ac = this.baseAC;
      if (this.equipment.armor) ac = 10 + mod(this.getStat('dex')) + (this.equipment.armor.acBonus || 0);
      // Sum acBonus from all non-armor slots
      ['ring','neck','cloak','feet','hands','head','belt','trinket'].forEach(slot => {
        if (this.equipment[slot]?.acBonus) ac += this.equipment[slot].acBonus;
      });
      if (this.perks && this.perks.includes('piel_de_acero')) ac += 1;
      if (this.subclass === 'champion') ac += 1;
      return ac + this._conditionACBonus();
    }

    get attackBonus() {
      const stat  = this.cls.primaryStats.includes('dex') ? Math.max(this.getMod('str'), this.getMod('dex')) : this.getMod('str');
      const wpn   = this.equipment.weapon ? (this.equipment.weapon.atkBonus || 0) : 0;
      let bonus = stat + this.prof + wpn;
      if (this.perks && this.perks.includes('ojo_de_halcon')) bonus += 2;
      return bonus;
    }

    get damageBonus() {
      const stat  = this.cls.primaryStats.includes('dex') ? Math.max(this.getMod('str'), this.getMod('dex')) : this.getMod('str');
      const wpn   = this.equipment.weapon ? (this.equipment.weapon.dmgBonus || 0) : 0;
      let bonus = stat + wpn;
      if (this.perks && this.perks.includes('peleador_feroz')) bonus += 2;
      return bonus;
    }

    get damageDice() {
      return this.equipment.weapon ? (this.equipment.weapon.dmgDice || 6) : 4;
    }

    get spellBonus() {
      const psm   = this.cls.primaryStats[0] === 'int' ? 'int' : this.cls.primaryStats[0] === 'wis' ? 'wis' : 'cha';
      const spell = this.equipment.weapon ? (this.equipment.weapon.spellBonus || 0) : 0;
      return this.getMod(psm) + this.prof + spell;
    }

    // ── EQUIPMENT HELPERS ─────────────────────────────────────
    _equipStatBonus(s) {
      return Object.values(this.equipment)
        .filter(i => i && i.statBonus && i.statBonus[s])
        .reduce((a, i) => a + i.statBonus[s], 0);
    }
    _conditionACBonus() {
      return this.conditions.filter(c => c.acBonus).reduce((a, c) => a + c.acBonus, 0);
    }

    equip(item) {
      const slot = item.slot || 'weapon';
      if (this.equipment[slot]) this.addItem(this.equipment[slot]);
      this.equipment[slot] = item;
      this.removeItemFromBag(item.id, 1);
      if (item.e === 'armor') this.baseAC = 10 + mod(this.getStat('dex'));
    }

    unequip(slot) {
      const item = this.equipment[slot];
      if (!item) return;
      this.addItem(item);
      this.equipment[slot] = null;
    }

    // ── INVENTORY ─────────────────────────────────────────────
    addItem(item) {
      const existing = this.inventory.find(i => i.id === item.id && i.e !== 'weapon' && i.e !== 'armor');
      if (existing) { existing.count = (existing.count || 1) + 1; }
      else           { this.inventory.push({ ...clone(item), count: 1 }); }
    }

    removeItemFromBag(id, count = 1) {
      const idx = this.inventory.findIndex(i => i.id === id);
      if (idx < 0) return false;
      this.inventory[idx].count -= count;
      if (this.inventory[idx].count <= 0) this.inventory.splice(idx, 1);
      return true;
    }

    hasItem(id) { return this.inventory.some(i => i.id === id) || Object.values(this.equipment).some(e => e && e.id === id); }
    countItem(id){ const i = this.inventory.find(i=>i.id===id); return i ? (i.count||1) : 0; }

    useItem(itemId) {
      const item = this.inventory.find(i => i.id === itemId);
      if (!item) return false;
      let msg = '';
      let used = true;
      switch(item.e) {
        case 'heal':
          const healed = Math.min(item.v, this.maxHP - this.hp);
          this.hp = Math.min(this.maxHP, this.hp + item.v);
          this.stats.healingDone += healed;
          msg = `Usas ${item.name}. Recuperas ${healed} HP.`;
          P.Audio.sfx.heal();
          break;
        case 'mana':
          this.abilities.forEach(a => { if(a.curUses < a.maxUses && a.maxUses > 0) a.curUses = Math.min(a.maxUses, a.curUses + (item.v||1)); });
          msg = `Usas ${item.name}. Habilidades restauradas.`;
          break;
        case 'cure':
          this.conditions = this.conditions.filter(c => c.id !== 'poisoned' && c.id !== 'diseased');
          msg = `Usas ${item.name}. Curado de veneno/enfermedad.`;
          break;
        case 'buff':
          msg = `Usas ${item.name}. Efecto activo.`;
          break;
        case 'escape':
          this.flags.escapeUsed = true;
          msg = 'Usas la Bomba de Humo. Huyes del combate automáticamente.';
          break;
        default:
          used = false;
          msg = `No puedes usar ${item.name} fuera de combate.`;
      }
      if (used) this.removeItemFromBag(itemId, 1);
      return msg;
    }

    // ── HP / DAMAGE ───────────────────────────────────────────
    takeDamage(dmg, source = '') {
      const effective = Math.max(0, dmg - this.tempHP);
      this.tempHP = Math.max(0, this.tempHP - dmg);
      this.hp = Math.max(0, this.hp - effective);
      return effective;
    }

    heal(amount) {
      const healed = Math.min(amount, this.maxHP - this.hp);
      this.hp += healed;
      this.stats.healingDone += healed;
      return healed;
    }

    get isDead() { return this.hp <= 0; }

    // ── LEVELING ──────────────────────────────────────────────
    gainXP(amount) {
      this.xp += amount;
      let leveled = false;
      while (this.level < 20 && this.xp >= LEVEL_TABLE[this.level].xp) {
        this._levelUp();
        leveled = true;
      }
      return leveled;
    }

    _levelUp() {
      this.level++;
      if (this.level === 3 && !this.subclass) {
        this._pendingSubclass = true;
      }
      this._pendingDraft = true;
      const row = LEVEL_TABLE[this.level - 1];
      this.prof = row.prof;
      this.xpNext = this.level < 20 ? LEVEL_TABLE[this.level].xp : Infinity;

      // HP increase
      const hpGain = Math.max(1, Math.floor(this.cls.hd / 2) + 1) + this.getMod('con');
      this.maxHP += hpGain;
      this.hp = this.maxHP;

      // Ability uses refresh on level-up
      this.abilities.forEach(a => { if (a.maxUses > 0) a.curUses = a.maxUses; });

      // ASI at levels 4, 8, 12, 16, 19 — defer to player choice screen
      if (row.feats.includes('asi_1') || row.feats.includes('asi_2') ||
          row.feats.includes('asi_3') || row.feats.includes('asi_4') ||
          row.feats.includes('asi_5') || row.feats.includes('asi_6') ||
          row.feats.includes('asi_7') || row.feats.includes('asi_8')) {
        this._pendingASI = true; // Player will choose via overlay
      }

      // Extra attack at level 5+
      if (this.level === 5) {
        const atk = this.abilities.find(a => a.name === 'Asalto' || a.name === 'Ataque Furtivo');
        if (atk) atk.maxUses++;
      }

      // Class-specific ability unlocks
      const classAbilityUnlocks = {
        fighter:    { 5:{ name:'Oleada de Acción', icon:'💨', desc:'Una acción adicional completa. Una vez por descanso.', uses:1, maxUses:1, recharge:'rest', type:'attack' },
                      7:{ name:'Voluntad de Hierro', icon:'🗿', desc:'Ventaja en saving throws contra ser asustado o parálisis.', uses:0, maxUses:0, type:'passive' } },
        rogue:      { 5:{ name:'Evasión', icon:'💨', desc:'En DEX saves: éxito = sin daño, fallo = mitad.', uses:0, maxUses:0, type:'passive' },
                      9:{ name:'Esquiva Suprema', icon:'👁️', desc:'Desventaja en ataques contra ti si no estás incapacitado.', uses:0, maxUses:0, type:'passive' } },
        wizard:     { 5:{ name:'Recuperación Arcana', icon:'🔮', desc:'Una vez por día recuperas usos de hechizo.', uses:1, maxUses:1, recharge:'rest', type:'utility' },
                      10:{ name:'Maestría en Hechizos', icon:'✨', desc:'Un hechizo de bajo nivel se vuelve innato.', uses:2, maxUses:2, recharge:'rest', type:'spell', dmgDice:6, dmgCount:3 } },
        cleric:     { 5:{ name:'Destruir No-Muertos', icon:'☀️', desc:'Los no-muertos de CR1 son destruidos automáticamente.', uses:1, maxUses:1, recharge:'rest', type:'spell', dmgDice:8, dmgCount:2 },
                      8:{ name:'Intervención Divina', icon:'⚡', desc:'Clamas ayuda divina con posibilidad de respuesta.', uses:1, maxUses:1, recharge:'rest', type:'utility' } },
        paladin:    { 7:{ name:'Aura de Protección', icon:'🛡️', desc:'+CHA a los saving throws de todos los aliados.', uses:0, maxUses:0, type:'passive' },
                      11:{ name:'Aura de Valor', icon:'✨', desc:'Inmunidad a condición aterrorizado.', uses:0, maxUses:0, type:'passive' } },
        monk:       { 3:{ name:'Deflect Missiles', icon:'🎯', desc:'Reacción: reduce daño de proyectil en 1d10+DEX+nv.', uses:1, maxUses:1, recharge:'rest', type:'defense' },
                      5:{ name:'Golpe Aturdidor', icon:'💫', desc:'Gasta 1 ki tras golpear: CON save o Aturdido.', uses:2, maxUses:2, recharge:'rest', type:'debuff', statusEffect:'stunned' } },
        ranger:     { 5:{ name:'Paso Féerico', icon:'🌿', desc:'Bonus action: escóndete en entorno natural.', uses:1, maxUses:1, recharge:'rest', type:'utility' },
                      7:{ name:'Defensa Evasiva', icon:'🏃', desc:'Si no llevas armadura pesada, +1 AC.', uses:0, maxUses:0, type:'passive' } },
        bard:       { 5:{ name:'Inspiración de Combate', icon:'🎵', desc:'La inspiración bardic sirve para tiradas de ataque.', uses:0, maxUses:0, type:'passive' },
                      10:{ name:'Secretos Mágicos', icon:'🔮', desc:'Aprendes hechizos de cualquier lista.', uses:2, maxUses:2, recharge:'rest', type:'spell', dmgDice:8, dmgCount:3 } },
        barbarian:  { 7:{ name:'Presencia Salvaje', icon:'🐗', desc:'En furia: WIS save o enemigos adyacentes aterrados.', uses:1, maxUses:1, recharge:'rest', type:'buff' },
                      11:{ name:'Furia Implacable', icon:'❤️', desc:'Si caes a 0 HP en furia, CON DC10 te deja en 1 HP.', uses:0, maxUses:0, type:'passive' } },
        druid:      { 4:{ name:'Forma Salvaje Mejorada', icon:'🐻', desc:'Adoptas formas de CR1 máximo.', uses:0, maxUses:0, type:'passive' },
                      9:{ name:'Amo del Bosque', icon:'🌿', desc:'Hablas con plantas y animales sin hechizo.', uses:0, maxUses:0, type:'passive' } },
        warlock:    { 5:{ name:'Maldición del Viejo', icon:'👁️', desc:'Una vez/combate tu patrón te recarga un hechizo.', uses:1, maxUses:1, recharge:'rest', type:'utility' },
                      10:{ name:'Conocimiento Prohibido', icon:'📚', desc:'Nuevas invocaciones del Anciano disponibles.', uses:0, maxUses:0, type:'passive' } },
        sorcerer:   { 2:{ name:'Fuente de Magia', icon:'🌟', desc:'Conviertes slots en puntos de hechicería y viceversa.', uses:2, maxUses:2, recharge:'rest', type:'utility' },
                      6:{ name:'Resistencia Mágica', icon:'🔵', desc:'Ventaja en saving throws contra hechizos.', uses:0, maxUses:0, type:'passive' } },
        artificer:  { 5:{ name:'Ataque Extra (Herramienta)', icon:'⚙️', desc:'Tus herramientas atacan junto a ti.', uses:0, maxUses:0, type:'passive' } },
        bloodhunter:{ 5:{ name:'Marca de Sangre', icon:'🩸', desc:'+2d6 daño necrótico en el primer golpe al objetivo marcado.', uses:2, maxUses:2, recharge:'rest', type:'debuff', statusEffect:'bleeding' },
                      7:{ name:'Maldición de Sangre', icon:'💀', desc:'La criatura marcada tiene desventaja contra ti.', uses:0, maxUses:0, type:'passive' } },
      };

      const classId = this.cls.id;
      const levelMap = classAbilityUnlocks[classId];
      if (levelMap && levelMap[this.level]) {
        const newAbility = { ...levelMap[this.level], curUses: levelMap[this.level].maxUses };
        const already = this.abilities.find(a => a.name === newAbility.name);
        if (!already) {
          this.abilities.push(newAbility);
          this._newAbilityUnlocked = newAbility; // Used by showLevelUp overlay
          this.addLog(`🌟 Nueva habilidad desbloqueada: ${newAbility.icon} ${newAbility.name}`);
        }
      }

      P.Storage.unlock('reached_level_' + this.level);
      P.Audio.sfx.levelUp();
      this.addLog(`✦ ¡NIVEL ${this.level}! +${hpGain} HP. Prof: +${this.prof}.`);
    }

    get xpProgress() {
      const cur = this.level >= 20 ? LEVEL_TABLE[19].xp : LEVEL_TABLE[this.level - 1].xp;
      const nxt = this.level >= 20 ? LEVEL_TABLE[19].xp : LEVEL_TABLE[this.level].xp;
      return ((this.xp - cur) / (nxt - cur)) * 100;
    }

    // ── CONDITIONS ────────────────────────────────────────────
    addCondition(cond) {
      if (!this.conditions.find(c => c.id === cond.id)) {
        this.conditions.push({ ...cond, rounds: cond.rounds || 1 });
      }
    }
    removeCondition(id) { this.conditions = this.conditions.filter(c => c.id !== id); }
    hasCondition(id)    { return this.conditions.some(c => c.id === id); }

    tickConditions() {
      this.conditions = this.conditions.filter(c => {
        if (c.rounds !== undefined) { c.rounds--; return c.rounds > 0; }
        return true;
      });
    }

    // ── LOG ───────────────────────────────────────────────────
    addLog(msg) { this.log.push(msg); if (this.log.length > 50) this.log.shift(); }

    // ── SPELLS ───────────────────────────────────────────────
    _selectStartSpells() {
      if (!this.cls.spellcasting) return [];
      const available = (P.SPELLS || []).filter(s => s.classes && s.classes.includes(this.cls.id));
      const count     = this.cls.startSpells || 2;
      return shuffle(available).slice(0, count).map(s => clone(s));
    }

    learnSpell(spellId) {
      const sp = (P.SPELLS || []).find(s => s.id === spellId);
      if (!sp || this.spells.find(s => s.id === spellId)) return false;
      this.spells.push(clone(sp));
      return true;
    }

    // ── SERIALIZATION ────────────────────────────────────────
    toJSON() {
      return {
        name:this.name, race:this.race.id, cls:this.cls.id, gender:this.gender || 'male',
        level:this.level, xp:this.xp, hp:this.hp, maxHP:this.maxHP,
        gold:this.gold, baseStats:this.baseStats, equipment:this.equipment,
        inventory:this.inventory, abilities:this.abilities, spells:this.spells,
        conditions:this.conditions, flags:this.flags, log:this.log.slice(-10),
        stats:this.stats, reputation:this.reputation, loreFound:this.loreFound,
        quests:this.quests, currentLocation:this.currentLocation,
        visitedLocations:this.visitedLocations, worldTime:this.worldTime,
        day:this.day, weather:this.weather, hardcore:this.hardcore,
        permadeath:this.permadeath, deathCount:this.deathCount,
        startTime:this.startTime,
        subclass:this.subclass,
        perks:this.perks
      };
    }

    static fromJSON(data) {
      const baseRace = P.RACES.find(r => r.id === data.race);
      const cls  = P.CLASSES.find(c => c.id === data.cls);
      if (!baseRace || !cls) return null;
      const gender = data.gender || 'male';
      const race = clone(baseRace);
      if (race.genders && race.genders[gender]) {
        race.name = race.genders[gender].name;
        race.icon = race.genders[gender].icon;
      }
      const ch = new Character({ name:data.name, race, cls, stats:data.baseStats, hardcore:data.hardcore, permadeath:data.permadeath, gender, subclass:data.subclass, perks:data.perks });
      // Restore saved fields
      Object.assign(ch, {
        level:data.level, xp:data.xp, hp:data.hp, maxHP:data.maxHP, gold:data.gold,
        equipment:data.equipment||{}, inventory:data.inventory||[], abilities:data.abilities||[],
        spells:data.spells||[], conditions:data.conditions||[], flags:data.flags||{},
        log:data.log||[], stats:data.stats||ch.stats, reputation:data.reputation||0,
        loreFound:data.loreFound||[], quests:data.quests||[],
        currentLocation:data.currentLocation, visitedLocations:data.visitedLocations||[],
        worldTime:data.worldTime||6, day:data.day||1, weather:data.weather||'clear',
        deathCount:data.deathCount||0, startTime:data.startTime||Date.now(),
        subclass:data.subclass||null, perks:data.perks||[],
        _deathSaves:data._deathSaves||{success:0,fail:0}, _isDown:false,
        _inspiration:data._inspiration||false, _killStreak:data._killStreak||0,
        _injuryFlag:false, _concentration:data._concentration||null,
        _zoneBoon:null, _zoneBane:null,
        _achievements:data._achievements||[], _pendingASI:data._pendingASI||false,
        _feats:data._feats||[]
      });
      ch.prof = LEVEL_TABLE[ch.level-1].prof;
      return ch;
    }
  }

  // ── WORLD TIME / WEATHER ──────────────────────────────────────
  const TIME_NAMES = {
    0:'Medianoche', 3:'Madrugada', 6:'Amanecer', 9:'Mañana', 12:'Mediodía',
    15:'Tarde', 18:'Anochecer', 21:'Noche'
  };
  function getTimeName(h) {
    const keys = Object.keys(TIME_NAMES).map(Number).sort((a,b)=>a-b);
    for (let i = keys.length-1; i >= 0; i--) { if (h >= keys[i]) return TIME_NAMES[keys[i]]; }
    return 'Medianoche';
  }
  const WEATHER_ICONS = { clear:'☀️', cloudy:'☁️', rainy:'🌧️', foggy:'🌫️', stormy:'⛈️' };
  const WEATHER_NAMES = { clear:'Despejado', cloudy:'Nublado', rainy:'Lluvia', foggy:'Niebla', stormy:'Tormenta' };

  function advanceTime(char, hours = 1) {
    char.worldTime = (char.worldTime + hours) % 24;
    if (char.worldTime === 0) {
      char.day++;
      if (char.day % 3 === 0) char.weather = pick(Object.keys(WEATHER_NAMES));
    }
  }

  // ── SKILL CHECK HELPER ────────────────────────────────────────
  function skillCheck(char, stat, dc) {
    const roll = d20() + char.getMod(stat) + char.prof;
    const success = roll >= dc;
    return { roll, stat, dc, success, nat: roll - char.getMod(stat) - char.prof };
  }

  // ── SAVING THROW ─────────────────────────────────────────────
  function savingThrow(char, stat, dc) {
    const profBonus = char.cls.savingThrows.includes(stat) ? char.prof : 0;
    const r = d20() + char.getMod(stat) + profBonus;
    return { roll:r, success: r >= dc };
  }

  root._dndParts.Character   = Character;
  root._dndParts.LEVEL_TABLE = LEVEL_TABLE;
  root._dndParts.skillCheck  = skillCheck;
  root._dndParts.savingThrow = savingThrow;
  root._dndParts.advanceTime = advanceTime;
  root._dndParts.getTimeName = getTimeName;
  root._dndParts.WEATHER_ICONS = WEATHER_ICONS;
  root._dndParts.WEATHER_NAMES = WEATHER_NAMES;
  console.log('%c[DND] Part 5 loaded — Character system & world helpers', 'color:#8b5cf6;');

})(window);

// ============================================================
// PART 6 — COMBAT ENGINE
// ============================================================
(function(root) {
  'use strict';

  const P = root._dndParts;
  const { d4, d6, d8, d10, d12, d20, roll, clamp, mod, pick, clone } = P.utils;

  // ── ENEMY FACTORY ────────────────────────────────────────────
  // Procedural extra traits pool
  const PROC_TRAITS = [
    { id:'regenerator', name:'Regenerador',  icon:'💚', desc:'Recupera 3 HP por turno.',     onTurnStart(e){ e.hp = Math.min(e.maxHP, e.hp + 3); } },
    { id:'venomous',    name:'Venenoso',     icon:'☠️', desc:'Envenena al atacar.',           onHit(e, char){ P.applyStatusEffect(char,'poisoned',2); } },
    { id:'berserker',   name:'Berserker',    icon:'🔥', desc:'+50% daño al 30% HP.',          dmgMod(e){ return e.hp <= e.maxHP*0.3 ? 1.5 : 1; } },
    { id:'evasive',     name:'Escurridizo',  icon:'💨', desc:'25% esquivar ataques.',         dodgeChance:0.25 },
    { id:'armored',     name:'Blindado',     icon:'🛡️', desc:'+2 CA adicional.',              acBonus:2 },
    { id:'spellward',   name:'Warded',       icon:'🔵', desc:'Reduce daño mágico en 2.',      magicDR:2 },
  ];

  function createEnemy(templateId, levelMod = 0) {
    const tpl = P.ENEMIES.find(e => e.id === templateId) || P.ENEMIES[0];
    const e   = clone(tpl);
    // Scale enemy with level modifier
    if (levelMod > 0) {
      e.hp  = Math.round(e.hp  * (1 + levelMod * 0.15));
      e.atk = Math.round(e.atk + levelMod * 0.5);
      e.dmg = Math.round(e.dmg + levelMod * 0.3);
      e.xp  = Math.round(e.xp  * (1 + levelMod * 0.2));
      e.gold= Math.round((e.gold||0) * (1 + levelMod * 0.1));
    }
    e.maxHP = e.hp;
    e.conditions = [];

    // ── ELITE check (20% for non-boss non-secret enemies) ──
    if (!e.boss && !e.secret && Math.random() < 0.20) {
      e.isElite = true;
      e.name    = '⭐ ' + e.name;
      e.hp      = Math.round(e.hp  * 1.5);
      e.maxHP   = e.hp;
      e.atk     = Math.round(e.atk * 1.25);
      e.xp      = Math.round(e.xp  * 1.5);
      e.gold    = Math.round((e.gold||10) * 2);
      // Add a random procedural trait
      const trait = PROC_TRAITS[Math.floor(Math.random() * PROC_TRAITS.length)];
      e._procTrait = trait;
      e.ac = Math.min(e.ac + 1, 22);
    }

    return e;
  }

  root._dndParts.PROC_TRAITS = PROC_TRAITS;

  // ── INITIATIVE SYSTEM ─────────────────────────────────────────
  function rollInitiative(char, enemy) {
    const playerInit = d20() + char.getMod('dex') + (char.equipment.feet?.initBonus || 0) + (char.equipment.trinket?.initBonus || 0);
    const enemyInit  = d20() + Math.floor((enemy.ac - 10) / 2);
    return { playerFirst: playerInit >= enemyInit, playerRoll: playerInit, enemyRoll: enemyInit };
  }

  // ── ATTACK CALCULATION ────────────────────────────────────────
  function playerAttack(char, enemy, options = {}) {
    // Prone: player has advantage attacking a prone enemy (melee)
    if (enemy.conditions?.find(c => c.id === 'prone') && !options.isRanged) {
      options = { ...options, hasAdvantage: true };
    }
    // Cover: player removes cover condition after being targeted (enemy spent turn)
    const nat    = d20();
    let critThreshold = 20;
    if (char.perks && char.perks.includes('ataque_critico_mejorado')) critThreshold = 19;
    if (char.subclass === 'champion') critThreshold = 19;
    const isCrit = nat >= critThreshold || (nat >= 18 && char.cls.id === 'rogue' && options.hasAdvantage);
    const isFumble = nat === 1;

    let atkRoll  = nat + char.attackBonus + (options.weatherAtkMod || 0) + (char._alertBonus ? 0 : 0);
    if (options.hasAdvantage)    atkRoll = Math.max(atkRoll, d20() + char.attackBonus + (options.weatherAtkMod || 0));
    if (options.hasDisadvantage) atkRoll = Math.min(atkRoll, d20() + char.attackBonus + (options.weatherAtkMod || 0));

    const hits   = isCrit || (!isFumble && atkRoll >= enemy.ac);

    let dmg = 0;
    let dmgBreakdown = '';

    if (hits) {
      if (char.perks && char.perks.includes('drenaje_de_sangre')) {
        char.heal(2);
      }
      // Base weapon damage
      let weapDice = isCrit ? char.damageDice * 2 : char.damageDice;
      let baseRoll = roll(weapDice);
      if (baseRoll === 1 && char.perks && char.perks.includes('suerte_del_aventurero')) {
        baseRoll = roll(weapDice);
      }

      // Elemental bonus
      let elemDmg = 0;
      if (char.equipment.weapon?.elemental) {
        const eDice = isCrit ? 12 : 6;
        elemDmg = roll(eDice);
      }

      // Class features
      let bonusDmg = 0;
      // Sneak attack (Rogue)
      if (char.cls.id === 'rogue' && options.hasAdvantage) {
        const sneakDice = Math.ceil(char.level / 2);
        for (let i = 0; i < sneakDice; i++) bonusDmg += d6();
      }
      // Rage (Barbarian)
      if (char.cls.id === 'barbarian' && char.hasCondition('rage')) {
        bonusDmg += char.level >= 9 ? 4 : char.level >= 5 ? 3 : 2;
      }
      // Hunter's Mark (Ranger)
      if (char.cls.id === 'ranger' && char.hasCondition('hunters_mark')) {
        bonusDmg += d6();
      }
      // Hex (Warlock)
      if (char.hasCondition('hex')) bonusDmg += d6();
      // Divine Smite (Paladin) — costs ability use
      if (options.divineSmite) {
        const smiteAb = char.abilities.find(a => a.name === 'Golpe Divino');
        if (smiteAb && smiteAb.curUses > 0) {
          bonusDmg += d8() + d8();
          smiteAb.curUses--;
        }
      }
      // Blood Rite (Blood Hunter)
      if (char.cls.id === 'bloodhunter' && char.hasCondition('blood_rite')) {
        bonusDmg += d4();
        char.takeDamage(d4()); // Costs own HP
      }

      // Curse (enemy debuff)
      if (enemy.conditions?.find(c => c.id === 'cursed_target')) bonusDmg += d8();

      dmg = Math.max(1, baseRoll + char.damageBonus + elemDmg + bonusDmg + (options.weatherDmgMod || 0));
      if (isCrit && char.equipment.weapon?.id === 'vorpal_sword' && (enemy.cr || 0) < 8) {
        return { hits:true, dmg:enemy.hp+100, isCrit:true, isFumble:false, nat:20, atkRoll, special:'decapitate' };
      }

      // Resistance / immunity — use structured fields first, then legacy trait checks
      const weapElem = char.equipment.weapon?.elemental || '';
      const isMagicWpn = !!(char.equipment.weapon?.magical || char.equipment.weapon?.atkBonus >= 3);
      const dmgType = weapElem || 'slashing';
      if (dmg > 0) {
        if (enemy.imm) {
          if (enemy.imm.includes(dmgType) ||
             (enemy.imm.includes('nonmagical_bps') && !isMagicWpn && ['slashing','piercing','bludgeoning'].includes(dmgType))) {
            dmg = 0; dmgBreakdown += ' [INMUNE]';
          }
        }
        if (dmg > 0 && enemy.res?.includes(dmgType)) { dmg = Math.floor(dmg / 2); dmgBreakdown += ' [RESISTE ½]'; }
        if (dmg > 0 && enemy.vuln?.includes(dmgType)) { dmg = Math.floor(dmg * 1.5); dmgBreakdown += ' [VULN ×1.5]'; }
        // Wet condition: vulnerability to lightning and cold
        if (dmg > 0 && enemy.conditions?.find(c => c.id === 'wet') && ['lightning','cold','thunder','electric'].includes(dmgType)) {
          dmg = Math.floor(dmg * 2); dmgBreakdown += ' [MOJADO ×2]';
        }
        // Legacy trait checks (fallback)
        if (enemy.traits?.some(t => t.name === 'Inmune a Veneno') && options.type === 'poison') dmg = 0;
        if (enemy.traits?.some(t => t.name === 'Vulnerable a Contundente') && options.type === 'bludgeoning') dmg = Math.round(dmg * 1.5);
      }

      dmgBreakdown = `[${baseRoll}+${char.damageBonus}${elemDmg?'+'+elemDmg+'elem':''}${bonusDmg?'+'+bonusDmg:''}]`;
      char.stats.damageDone += dmg;
      if (dmg > char.stats.highestDmg) char.stats.highestDmg = dmg;
    }

    if (isCrit) { char.stats.crits++; P.Audio.sfx.critical(); }
    else if (hits) P.Audio.sfx.hit();
    else P.Audio.sfx.miss();

    return { hits, dmg, isCrit, isFumble, nat, atkRoll, dmgBreakdown };
  }

  // ── ENEMY ATTACK ──────────────────────────────────────────────
  function enemyAttack(enemy, char) {
    // Prone: enemy must spend action to stand up
    const proneIdx = (enemy.conditions||[]).findIndex(c => c.id === 'prone');
    if (proneIdx !== -1) {
      enemy.conditions.splice(proneIdx, 1);
      return { hits:false, dmg:0, isCrit:false, nat:0, msg:`${enemy.name} se levanta del suelo. [se levanta]` };
    }

    const nat   = d20();
    const isCrit= nat === 20;
    const isMiss= nat === 1;
    const atkRoll = nat + Math.floor(enemy.atk / 2);
    let evaded = false;
    if (char.perks && char.perks.includes('paso_veloz') && Math.random() < 0.10) {
      evaded = true;
    }
    const hits  = !evaded && (isCrit || (!isMiss && atkRoll >= char.AC));

    let dmg = 0;
    if (evaded) {
      return { hits:false, dmg:0, isCrit:false, nat, msg:`${enemy.name} ataca, ¡pero esquivas ágilmente gracias a tu Paso Veloz!` };
    }
    if (hits) {
      if (char.perks && char.perks.includes('drenaje_de_sangre')) {
        char.heal(2);
      }
      const dice = isCrit ? enemy.dmg * 2 : enemy.dmg;
      dmg = roll(dice) + Math.floor(enemy.atk / 3);

      // Armor reduces damage (DR simulation)
      if (char.equipment.armor) {
        dmg = Math.max(1, dmg - Math.floor((char.equipment.armor.acBonus || 0) / 3));
      }

      // Apply enemy traits
      if (enemy.traits) {
        for (const t of enemy.traits) {
          // Drain effects
          if (t.name === 'Drenaje de Sangre' && !enemy._attached) {
            enemy._attached = true;
            enemy._drainDmg = d4();
            dmg += enemy._drainDmg;
          }
          if (t.name === 'Drenaje de Vida') {
            char.maxHP = Math.max(1, char.maxHP - Math.floor(dmg / 2));
          }
          // Paralysis
          if (t.name === 'Parálisis' && !char.hasCondition('paralyzed')) {
            const sv = P.savingThrow(char, 'con', 12);
            if (!sv.success) char.addCondition({ id:'paralyzed', name:'Paralizado', icon:'🧊', rounds:2, acPenalty:-4 });
          }
        }
      }

      dmg = char.takeDamage(dmg);
    }

    return { hits, dmg, isCrit, nat };
  }

  // ── FEATS ─────────────────────────────────────────────────────
  const FEATS = [
    { id:'tough',         name:'Robusto',             icon:'❤️', desc:'+2 HP máximo por cada nivel actual y futuro.', apply(c){ c.maxHP += c.level*2; c.hp = c.maxHP; } },
    { id:'alert',         name:'Alerta',               icon:'👁️', desc:'+5 a iniciativa. No puedes ser sorprendido.', apply(c){ c._alertBonus = (c._alertBonus||0) + 5; } },
    { id:'lucky',         name:'Suertudo',             icon:'🍀', desc:'3 puntos de suerte por descanso largo para re-lanzar tiradas.', apply(c){ c._luckyPoints = (c._luckyPoints||0) + 3; } },
    { id:'mobile',        name:'Móvil',                icon:'🏃', desc:'+1 DEX. Velocidad aumentada y movimiento mejorado.', apply(c){ c.baseStats.dex = Math.min(20, c.baseStats.dex + 1); } },
    { id:'resilient_con', name:'Resistente (CON)',     icon:'💪', desc:'+1 CON. Proficiencia en saving throws de Constitución.', apply(c){ c.baseStats.con = Math.min(20, c.baseStats.con + 1); } },
    { id:'war_caster',    name:'Luchador Arcano',      icon:'🔮', desc:'+1 INT. Ventaja en CON saves para concentración. Hechizos como reacción.', apply(c){ c.baseStats.int = Math.min(20, c.baseStats.int + 1); } },
    { id:'great_weapon',  name:'Maestro de Armas',     icon:'⚔️', desc:'+1 STR. Re-lanza 1s y 2s en daño con armas grandes.', apply(c){ c.baseStats.str = Math.min(20, c.baseStats.str + 1); } },
    { id:'sharpshooter',  name:'Tirador Certero',      icon:'🏹', desc:'+1 DEX. +1 al daño con ataques a distancia o arco.', apply(c){ c.baseStats.dex = Math.min(20, c.baseStats.dex + 1); } },
    { id:'sentinel',      name:'Centinela',             icon:'🛡️', desc:'+1 WIS. Reaccionas a enemigos que intentan alejarse.', apply(c){ c.baseStats.wis = Math.min(20, c.baseStats.wis + 1); } },
    { id:'magic_init',    name:'Iniciado Mágico',       icon:'✨', desc:'+1 CHA. Aprendes hechizos básicos fuera de tu lista.', apply(c){ c.baseStats.cha = Math.min(20, c.baseStats.cha + 1); } },
  ];

  // ── STATUS EFFECTS ────────────────────────────────────────────
  const STATUS_EFFECT_DEFS = {
    burning:   { id:'burning',   name:'En llamas',    icon:'🔥', dmgDice:4, dmgCount:1, dmgType:'fuego'   },
    bleeding:  { id:'bleeding',  name:'Sangrando',    icon:'🩸', dmgDice:4, dmgCount:1, dmgType:'físico'  },
    poisoned:  { id:'poisoned',  name:'Envenenado',   icon:'☠️', dmgDice:6, dmgCount:1, dmgType:'veneno'  },
    chilled:   { id:'chilled',   name:'Congelado',    icon:'🧊', dmgDice:0, dmgCount:0, dmgType:'frío'    },
    weakened:  { id:'weakened',  name:'Debilitado',   icon:'💀', dmgDice:0, dmgCount:0, dmgType:'ninguno' },
    stunned:   { id:'stunned',   name:'Aturdido',     icon:'💫', dmgDice:0, dmgCount:0, dmgType:'ninguno' },
    prone:     { id:'prone',     name:'Tumbado',      icon:'⬇️', dmgDice:0, dmgCount:0, dmgType:'ninguno' },
    wet:       { id:'wet',       name:'Mojado',       icon:'💧', dmgDice:0, dmgCount:0, dmgType:'ninguno' },
    frightened:{ id:'frightened',name:'Aterrorizado', icon:'😨', dmgDice:0, dmgCount:0, dmgType:'ninguno' },
    covered:   { id:'covered',   name:'En Cubierta',  icon:'🏛️', dmgDice:0, dmgCount:0, dmgType:'ninguno', acBonus:2 },
  };

  // ── ENEMY BARKS (BG3-style flavor text) ───────────────────────
  const ENEMY_BARKS = {
    attack: {
      humanoid:  ['¡Por el trono!','¡Muere, aventurero!','¡No pasarás!','¡Pagarás por esto!','¡Sin piedad!'],
      undead:    ['...grrrr...','☠️ ...muerte...','...el alma...','...no huyas...','...únete a nosotros...'],
      beast:     ['¡GRAAWR!','🐺 *gruñido feroz*','*rugido*','*colmillos brillantes*','¡RAWR!'],
      demon:     ['¡Tus almas son nuestras!','¡Caerás, mortal!','¡El caos te consume!','¡ABISMO!'],
      goblin:    ['¡Tú cabeza mía!','¡Oro grande!','¡Aplastarte!','¡Bobo aventurero!','¡Krax aplasta!'],
      dragon:    ['Tu audacia... te costará.','¡Insignificante mortal!','¡ARDERÁS!','He visto caer imperios.'],
      default:   ['¡Ataque!','¡Muere!','¡Por mis señores!','¡A la batalla!'],
    },
    low_hp: {
      humanoid:  ['¡No puedo perder aquí!','¡Dame fuerza!','¡Solo por esta vez!','¡Por favor...!'],
      beast:     ['*aullido desesperado*','*retrocede herido*','*gruñido de dolor*'],
      default:   ['¡No...!','¡Imposible...!','¡Esto no puede ser!','¡Sigue en pie!'],
    },
    flee: {
      humanoid:  ['¡Me retiro!','¡No valía la pena!','¡Buscaré refuerzos!','¡Recuerda mi cara!'],
      beast:     ['*huye despavorido*','*aullido de dolor*','*se escurre entre arbustos*'],
      default:   ['¡Huyo!','¡Otro día!','¡Suerte tuya!','¡Volveré más fuerte!'],
    },
  };

  function getEnemyBark(enemy, situation) {
    const pool = ENEMY_BARKS[situation];
    if (!pool) return '';
    const type = (enemy.type || 'default');
    const barks = pool[type] || pool.default || [];
    return barks.length ? `💬 "${pick(barks)}"` : '';
  }

  function applyStatusEffect(target, effectId, rounds) {
    const def = STATUS_EFFECT_DEFS[effectId];
    if (!def) return;
    target.conditions = target.conditions || [];
    const existing = target.conditions.find(c => c.id === effectId);
    if (existing) {
      existing.rounds = Math.max(existing.rounds || 1, rounds || 2);
    } else {
      target.conditions.push({ ...def, rounds: rounds || 2 });
    }
  }

  function tickStatusDamage(target, isPlayer) {
    const msgs = [];
    (target.conditions || []).filter(c => c.dmgDice > 0).forEach(c => {
      let dmg = 0;
      for (let i = 0; i < c.dmgCount; i++) dmg += roll(c.dmgDice);
      dmg = Math.max(1, dmg);
      if (isPlayer) { target.takeDamage(dmg); }
      else { target.hp = Math.max(0, target.hp - dmg); }
      msgs.push(`${c.icon} ${c.name}: ${dmg} daño de ${c.dmgType}`);
    });
    return msgs;
  }

  function tickEnemyConditions(enemy) {
    (enemy.conditions || []).forEach(c => {
      if (c.rounds !== undefined) c.rounds--;
      if (c.dur    !== undefined) c.dur--;
    });
    enemy.conditions = (enemy.conditions || []).filter(c =>
      (c.rounds === undefined || c.rounds > 0) &&
      (c.dur    === undefined || c.dur    > 0)
    );
  }

  // ── WILD MAGIC SURGES ─────────────────────────────────────────
  const WILD_MAGIC_SURGES = [
    { id:'double_dmg',   text:'¡MAGIA SALVAJE! ✨ La energía se duplica: el hechizo hace el DOBLE de daño.',           doubleDmg:true },
    { id:'self_fire',    text:'¡MAGIA SALVAJE! 🔥 Explosión caótica centrada en ti: 3d6 de fuego.',                    selfDmg:true, dice:'3d6' },
    { id:'self_heal',    text:'¡MAGIA SALVAJE! 💚 La magia se vuelve contra sí misma y te sana: +2d6 HP.',             selfHeal:true, dice:'2d6' },
    { id:'skip_enemy',   text:'¡MAGIA SALVAJE! 💤 El enemigo queda Atontado: pierde su próximo turno.',                skipEnemy:true },
    { id:'arcane_shield',text:'¡MAGIA SALVAJE! 🔵 Un escudo arcano caótico: +4 CA por 2 rounds.',                     shieldSelf:true },
    { id:'bonus_dmg',    text:'¡MAGIA SALVAJE! ⚡ Descarga de relámpago extra: +2d8 daño eléctrico adicional.',        bonusDmg:true, dice:'2d8' },
    { id:'feared',       text:'¡MAGIA SALVAJE! 😱 El enemigo queda Aterrorizado: -3 a sus ataques 2 rounds.',          feared:true },
    { id:'poisoned_self',text:'¡MAGIA SALVAJE! ☠️ La magia tóxica rebota: quedas Envenenado 1 round.',                 selfPoison:true },
    { id:'echo',         text:'¡MAGIA SALVAJE! 🌀 La magia resuena: el hechizo se lanza una SEGUNDA VEZ.',             echo:true },
    { id:'quake',        text:'¡MAGIA SALVAJE! 🌍 El suelo tiembla: todos reciben 1d4 daño.',                         quake:true, dice:'1d4' },
    { id:'invisible',    text:'¡MAGIA SALVAJE! 👁️ Te vuelves invisible por 1 round (ventaja próximo ataque).',         invisible:true },
    { id:'polymorph',    text:'¡MAGIA SALVAJE! 🐑 El enemigo se convierte en oveja 1 round: ataque y CA reducidos.',   polymorph:true },
  ];

  function triggerWildMagic(char, enemy, baseResult) {
    const surge = WILD_MAGIC_SURGES[Math.floor(Math.random() * WILD_MAGIC_SURGES.length)];
    const msgs = [surge.text];

    if (surge.doubleDmg && baseResult.dmg > 0) {
      const extra = baseResult.dmg;
      enemy.hp = Math.max(0, enemy.hp - extra);
      baseResult.dmg += extra;
      msgs.push(`Daño total: ${baseResult.dmg}.`);
    }
    if (surge.selfDmg) {
      const selfDmg = roll(18) + 0; // 3d6
      char.takeDamage(selfDmg);
      msgs.push(`Tú recibes ${selfDmg} daño.`);
    }
    if (surge.selfHeal) {
      const h = roll(6) + roll(6);
      char.heal(h);
      msgs.push(`Recuperas ${h} HP.`);
    }
    if (surge.skipEnemy) {
      applyStatusEffect(enemy, 'stunned', 1);
    }
    if (surge.shieldSelf) {
      char.addCondition({ id:'arcane_shield', name:'Escudo Arcano', icon:'🔵', acBonus:4, rounds:2 });
    }
    if (surge.bonusDmg) {
      const bd = roll(8) + roll(8);
      enemy.hp = Math.max(0, enemy.hp - bd);
      baseResult.dmg += bd;
      msgs.push(`+${bd} daño eléctrico adicional.`);
    }
    if (surge.feared) {
      enemy.conditions = enemy.conditions || [];
      enemy.conditions.push({ id:'feared', name:'Aterrorizado', icon:'😱', rounds:2, atkPenalty:-3 });
    }
    if (surge.selfPoison) {
      char.addCondition({ id:'poisoned', name:'Envenenado', icon:'☠️', rounds:1 });
    }
    if (surge.echo) {
      // Mark for second cast outside this function
      baseResult._wildEcho = true;
    }
    if (surge.quake) {
      const qd = roll(4);
      char.takeDamage(qd);
      enemy.hp = Math.max(0, enemy.hp - qd);
      msgs.push(`${qd} daño al suelo a todos.`);
    }
    if (surge.invisible) {
      char.addCondition({ id:'invisible', name:'Invisible', icon:'👁️', rounds:1, atkBonus:2 });
    }
    if (surge.polymorph) {
      enemy.conditions = enemy.conditions || [];
      enemy.conditions.push({ id:'polymorph', name:'Oveja 🐑', icon:'🐑', rounds:1, atkPenalty:-5 });
      enemy.ac = Math.min(enemy.ac, 8);
    }

    baseResult._wildSurgeMsg = msgs.join(' ');
    return baseResult;
  }

  // ── SPELL ATTACK ──────────────────────────────────────────────
  function castSpell(char, spell, enemy) {
    let result = { dmg:0, heal:0, effect:'', success:false, msg:'' };

    const spellAtk = char.spellBonus;
    P.Audio.sfx.magic();

    if (spell.healDice) {
      // Healing spell
      const healAmount = roll(spell.healDice * (spell.healCount || 1)) +
                         (spell.bonusHeal === 'wis' ? char.getMod('wis') : char.getMod('cha'));
      const healed = char.heal(healAmount);
      result.heal = healed;
      result.success = true;
      result.msg = `Lanzas ${spell.name}. Recuperas ${healed} HP. ✦`;
      P.Audio.sfx.heal();
      return result;
    }

    if (spell.type === 'control') {
      // Control spell (hold, paralysis, etc.)
      const sv = P.savingThrow({ getMod:(s)=>Math.floor((enemy.atk-10)/2), cls:{savingThrows:[]}, prof:2 }, 'wis', spell.dc || 14);
      if (!sv.success) {
        enemy.conditions = enemy.conditions || [];
        enemy.conditions.push({ id:'paralyzed', name:'Paralizado', dur: spell.dur || 2 });
        result.success = true;
        result.msg = `${spell.name}: ${enemy.name} queda ${enemy.conditions[enemy.conditions.length-1].name} por ${spell.dur} rounds!`;
      } else {
        result.msg = `${spell.name}: ${enemy.name} resiste! (tirada: ${sv.roll} vs DC${spell.dc})`;
      }
      return result;
    }

    if (spell.type === 'defense') {
      // Shield / defensive
      char.addCondition({ id:'arcane_shield', name:'Escudo Arcano', icon:'🔵', acBonus:5, rounds:2 });
      result.success = true;
      result.msg = `${spell.name}: +5 AC por 2 rounds!`;
      return result;
    }

    // Damage spell
    if (spell.auto) {
      // No attack roll needed (Magic Missile)
      let totalDmg = 0;
      for (let i = 0; i < (spell.dmgCount || 1); i++) totalDmg += roll(spell.dmgDice) + 1;
      totalDmg = Math.max(1, totalDmg);
      const actual = Math.min(enemy.hp, totalDmg);
      enemy.hp -= actual;
      char.stats.damageDone += actual;
      result.dmg = actual; result.success = true;
      result.msg = `${spell.name}: ${actual} daño de fuerza. No puede fallar!`;
    } else {
      // Attack roll or save
      if (spell.save) {
        let sv;
        try { sv = { success: d20() + Math.floor(enemy.atk/3) >= (spell.dc||13) }; }
        catch(e) { sv = { success: false }; }
        let spellDmg = 0;
        for (let i = 0; i < (spell.dmgCount || 1); i++) spellDmg += roll(spell.dmgDice);
        spellDmg += (spell.bonusDmg === 'cha' ? char.getMod('cha') : char.getMod('int'));
        const actual = sv.success ? Math.floor(spellDmg / 2) : spellDmg;
        const actualClamped = Math.min(enemy.hp, Math.max(1, actual));
        enemy.hp -= actualClamped;
        char.stats.damageDone += actualClamped;
        result.dmg = actualClamped; result.success = true;
        result.msg = `${spell.name}: ${actualClamped} daño (${sv.success?'save mitad':' daño completo'}).`;
      } else {
        // Spell attack roll
        const nat = d20();
        const atkRoll = nat + spellAtk;
        if (nat === 20 || atkRoll >= enemy.ac) {
          let spellDmg = 0;
          const mult = nat === 20 ? 2 : 1;
          for (let i = 0; i < (spell.dmgCount||1) * mult; i++) spellDmg += roll(spell.dmgDice);
          spellDmg += (spell.bonusDmg === 'cha' ? char.getMod('cha') : spell.bonusDmg === 'wis' ? char.getMod('wis') : char.getMod('int'));
          const actualClamped = Math.min(enemy.hp, Math.max(1, spellDmg));
          enemy.hp -= actualClamped;
          char.stats.damageDone += actualClamped;
          result.dmg = actualClamped; result.success = true;
          result.msg = `${spell.name}${nat===20?' ¡CRÍTICO!':''}: ${actualClamped} daño (${nat}+${spellAtk}).`;
        } else {
          result.msg = `${spell.name}: falla el ataque. (${atkRoll} vs AC${enemy.ac})`;
        }
      }
    }

    // Apply status effects based on spell type / id
    if (result.success && result.dmg > 0) {
      const spellId = spell.id || '';
      const spellType = spell.type || '';
      if (spellType === 'fire' || spellId === 'fireball' || spellId === 'burning_hands') {
        applyStatusEffect(enemy, 'burning', 2);
        result.msg += ' 🔥';
      } else if (spellType === 'necrotic' || spellId === 'inflict_wounds') {
        applyStatusEffect(enemy, 'bleeding', 2);
        result.msg += ' 🩸';
      } else if (spellType === 'lightning' || spellId === 'call_lightning') {
        if (d20() >= 15) { applyStatusEffect(enemy, 'stunned', 1); result.msg += ' 💫 ¡Aturdido!'; }
      } else if (spellType === 'thunder' || spellId === 'thunderwave' || spellId === 'shatter') {
        applyStatusEffect(enemy, 'chilled', 2);
        result.msg += ' 🧊';
      }
    }

    return result;
  }

  // ── SPECIAL ABILITY ACTIVATION ────────────────────────────────
  function useAbility(char, ability, enemy) {
    let result = { msg:'', dmg:0, heal:0, buff:false };

    switch(ability.type) {
      case 'heal': {
        const healRoll = roll(char.cls.hd) + char.getMod('con') + char.level;
        const h = char.heal(healRoll);
        result.heal = h; result.msg = `${ability.name}: recuperas ${h} HP.`;
        P.Audio.sfx.heal(); break;
      }
      case 'attack': {
        // Extra attack — perform up to 2 bonus rolls (Lluvia de Golpes = 2 hits)
        let totalDmg = 0;
        const hits = ability.name.includes('Lluvia') ? 2 : 1;
        let msgs = [];
        for (let i = 0; i < hits; i++) {
          const res = playerAttack(char, enemy, {});
          if (res.hits) { totalDmg += res.dmg; msgs.push(`${res.dmg}${res.isCrit?'💥':''}`); }
          else msgs.push('fallo');
        }
        result.dmg = totalDmg;
        result.msg = `${ability.name}: ${msgs.join(', ')} daño extra${totalDmg===0?' (fallos)':''}!`;
        // Apply bleeding on any hit if ability has statusEffect
        if (totalDmg > 0 && ability.statusEffect) {
          applyStatusEffect(enemy, ability.statusEffect, 2);
          result.msg += ` ${STATUS_EFFECT_DEFS[ability.statusEffect]?.icon||''}`;
        }
        break;
      }
      case 'buff': {
        if (ability.name.includes('Furia') || ability.name.includes('Rage')) {
          char.addCondition({ id:'rage', name:'Furia', icon:'🔥', rounds:3, dmgBonus:char.level>=9?4:char.level>=5?3:2 });
          result.msg = `¡${ability.name}! +${char.level>=9?4:char.level>=5?3:2} daño, resistencia a daño físico por 3 rounds.`;
          P.Audio.sfx.rageActivate();
        } else {
          char.addCondition({ id:'powered', name:'Potenciado', icon:'✨', rounds:2 });
          result.msg = `${ability.name}: ¡Potenciado por 2 rounds!`;
        }
        result.buff = true; break;
      }
      case 'debuff': {
        if (enemy) {
          enemy.conditions = enemy.conditions || [];
          enemy.conditions.push({ id:'cursed_target', name:'Maldito', dur:3 });
          // If ability has a specific status effect, apply it
          if (ability.statusEffect) {
            applyStatusEffect(enemy, ability.statusEffect, 2);
            const def = STATUS_EFFECT_DEFS[ability.statusEffect];
            result.msg = `${ability.name}: ${enemy.name} maldito${def?' y '+def.name.toLowerCase():''}.`;
          } else {
            result.msg = `${ability.name}: ${enemy.name} maldito. +1d6 daño en ataques contra él.`;
          }
        } break;
      }
      case 'spell': {
        // Ability-as-spell (e.g. Druid's Tormenta de Esporas, Sorcerer's Torrente Arcano)
        let dmg = 0;
        for (let i = 0; i < (ability.dmgCount || 3); i++) dmg += roll(ability.dmgDice || 8);
        dmg += char.getMod(char.cls.primaryStats[0] || 'cha');
        dmg = Math.max(1, dmg);
        const capped = Math.min(enemy.hp, dmg);
        enemy.hp -= capped;
        char.stats.damageDone += capped;
        result.dmg = capped;
        result.msg = `${ability.name}: ${capped} daño!`;
        if (ability.statusEffect) {
          applyStatusEffect(enemy, ability.statusEffect, 2);
          const def = STATUS_EFFECT_DEFS[ability.statusEffect];
          if (def) result.msg += ` ${def.icon} ${def.name}!`;
        }
        P.Audio.sfx.magic(); break;
      }
      case 'wildmagic': {
        // Wild Magic surge — deliberate trigger
        const surge = WILD_MAGIC_SURGES[Math.floor(Math.random() * WILD_MAGIC_SURGES.length)];
        result._wildSurgeMsg = surge.text;
        result.msg = `${ability.name}: ${surge.text}`;
        // Apply the surge mechanics
        const fakeResult = { dmg:0 };
        triggerWildMagic(char, enemy, fakeResult);
        result.dmg = fakeResult.dmg || 0;
        if (result.dmg > 0) {
          result.msg += ` (${result.dmg} daño)`;
        }
        P.Audio.sfx.magic(); break;
      }
      case 'defense': {
        char.addCondition({ id:'defensive_stance', name:'Guardia', icon:'🛡️', acBonus:3, rounds:2 });
        result.msg = `${ability.name}: +3 AC por 2 rounds.`; break;
      }
      case 'transform': {
        char.addCondition({ id:'transformed', name:'Transformado', icon:'🐺', rounds:4, dmgBonus:3 });
        char.tempHP = char.level * 2;
        result.msg = `${ability.name}: ¡Transformado! +${char.level*2} HP temporales, +3 daño.`;
        break;
      }
      case 'summon': {
        char.addCondition({ id:'golem_active', name:'Gólem Activo', icon:'🤖', rounds:3, extraAttack:true });
        result.msg = `${ability.name}: ¡Gólem invocado por 3 rounds!`; break;
      }
      case 'utility': {
        result.msg = `${ability.name}: activado.`; break;
      }
      default: result.msg = `${ability.name}: usado.`;
    }

    ability.curUses--;
    return result;
  }

  // ── ENEMY AI ──────────────────────────────────────────────────
  function enemyAI(enemy, char) {
    // Special behaviors based on enemy id
    if (enemy.id === 'troll' && enemy.hp > 0) {
      // Troll regeneration
      const regen = 10;
      enemy.hp = Math.min(enemy.maxHP, enemy.hp + regen);
    }

    // ── PROCEDURAL TRAIT: Regenerator ───────────────────────────
    if (enemy._procTrait?.id === 'regenerator') {
      const regen = Math.min(3, enemy.maxHP - enemy.hp);
      if (regen > 0) { enemy.hp += regen; }
    }

    // ── VARIED ACTIONS (non-boss) ────────────────────────────────
    if (!enemy.boss) {
      const hpPct = enemy.hp / enemy.maxHP;
      // Flee at 10% HP (non-elite, non-undead)
      if (hpPct < 0.10 && !enemy.isElite && !enemy._fleeing && !/undead|construct/.test(enemy.type||'') && Math.random() < 0.6) {
        enemy._fleeing = true;
        return { skipped:true, fled:true, msg:`💨 ${enemy.name} intenta huir! (Herido gravemente)` };
      }
      // Defend: 15% chance when healthy — buff AC for this turn
      if (!enemy._defending && hpPct > 0.4 && Math.random() < 0.15) {
        enemy._defending = true;
        enemy.ac = Math.min(enemy.ac + 2, 24);
        setTimeout(() => { if (enemy) enemy.ac = Math.max(5, enemy.ac - 2); }, 500);
        return { skipped:true, msg:`🛡️ ${enemy.name} se pone en guardia! (+2 CA este turno)` };
      }
    }

    // Paralyzed enemy can't act
    const paralyzed = enemy.conditions?.find(c => c.id === 'paralyzed');
    if (paralyzed) {
      paralyzed.dur = (paralyzed.dur || 1) - 1;
      if (paralyzed.dur <= 0) enemy.conditions = enemy.conditions.filter(c => c.id !== 'paralyzed');
      return { skipped: true, msg:`${enemy.name} está paralizado y no puede actuar.` };
    }

    // Stunned (from status effects) — skip turn, tick down
    const stunned = enemy.conditions?.find(c => c.id === 'stunned');
    if (stunned) {
      stunned.rounds = (stunned.rounds || 1) - 1;
      if (stunned.rounds <= 0) enemy.conditions = enemy.conditions.filter(c => c.id !== 'stunned');
      return { skipped: true, msg:`${enemy.name} está aturdido y no puede actuar.` };
    }

    // Beholder: random ray
    if (enemy.id === 'beholder') {
      const rays = ['disintegrate','paralyze','sleep','petrify','kill'];
      const ray  = pick(rays);
      const atkRes = enemyAttack(enemy, char);
      let extraMsg = '';
      if (atkRes.hits) {
        if (ray === 'sleep' && char.hp < char.maxHP * 0.3) {
          char.addCondition({ id:'unconscious', name:'Inconsciente', icon:'😴', rounds:1 });
          extraMsg = ' ¡Rayo de sueño! (Inconsciente 1 round)';
        } else if (ray === 'paralyze') {
          const sv = P.savingThrow(char, 'con', 14);
          if (!sv.success) { char.addCondition({ id:'paralyzed', name:'Paralizado', icon:'🧊', rounds:2 }); extraMsg = ' ¡Rayo paralizante!'; }
        }
      }
      return { ...atkRes, msg: `${enemy.name} dispara rayo [${ray}]: ${atkRes.hits?atkRes.dmg+' daño'+extraMsg:'falla'}.` };
    }

    // Dragon: 1/3 chance of breath weapon
    if (enemy.id === 'dragon_ancient' && d20() >= 14) {
      const breathDmg = roll(26*6) + 30;
      const sv = P.savingThrow(char, 'dex', 21);
      const actual = sv.success ? Math.floor(breathDmg/2) : breathDmg;
      const taken = char.takeDamage(actual);
      P.Audio.sfx.breathWeapon();
      return { hits:true, dmg:taken, msg:`¡El Dragón exhala FUEGO: ${taken} daño${sv.success?' (save mitad)':''}!` };
    }

    // Mind Flayer: psionic burst
    if (enemy.id === 'mindflayer' && d20() >= 13) {
      const psyDmg = roll(3*8) + 4;
      const sv = P.savingThrow(char, 'int', 15);
      if (!sv.success) char.addCondition({ id:'stunned', name:'Aturdido', icon:'💫', rounds:1 });
      const taken = char.takeDamage(sv.success ? Math.floor(psyDmg/2) : psyDmg);
      return { hits:true, dmg:taken, msg:`¡${enemy.name} explota tu mente! ${taken} daño psíquico.${!sv.success?' ¡Aturdido!':''}` };
    }

    // Katosx Shade: meta-ability learning
    if (enemy.id === 'katosx_shade') {
      if (!enemy._learnedAbility && char.abilities.length > 0) {
        const learned = pick(char.abilities);
        enemy._learnedAbility = learned;
        enemy.atk += 2;
      }
      // Stack Overflow phase
      if (!enemy._phase2 && enemy.hp < enemy.maxHP * 0.5) {
        enemy._phase2 = true;
        return { hits:false, dmg:0, msg:'⚠️ ERROR: STACK_OVERFLOW — La Sombra de Katosx se divide en DOS instancias. ¡Debes eliminar ambas!' };
      }
    }

    // Standard attack — certain enemies apply bleeding on crits
    const bleedEnemies = ['werewolf','ghoul','ogre','vampire','katosx_shade'];
    const res = enemyAttack(enemy, char);
    if (res.hits && res.isCrit && bleedEnemies.includes(enemy.id)) {
      char.addCondition({ id:'bleeding', name:'Sangrando', icon:'🩸', dmgDice:4, dmgCount:1, dmgType:'físico', rounds:2 });
    }
    // Fear penalty from feared condition
    const feared = enemy.conditions?.find(c => c.id === 'feared');
    const polymorph = enemy.conditions?.find(c => c.id === 'polymorph');
    if (polymorph) {
      polymorph.rounds = (polymorph.rounds||1) - 1;
      if (polymorph.rounds <= 0) enemy.conditions = enemy.conditions.filter(c => c.id !== 'polymorph');
    }
    const bleedNote = res.isCrit && bleedEnemies.includes(enemy.id) ? ' 🩸 ¡Sangrando!' : '';
    // Proc trait: venomous applies poison on any hit
    if (res.hits && enemy._procTrait?.id === 'venomous') {
      P.applyStatusEffect(char, 'poisoned', 2);
    }
    // Proc trait: evasive — retroactively negate if dodge roll succeeds
    if (enemy._procTrait?.id === 'evasive' && Math.random() < 0.25) {
      return { skipped:true, msg:`💨 ${enemy.name} esquiva tu ataque!` };
    }
    return { ...res, msg: res.hits ? `${enemy.name} ataca: ${res.dmg} daño${res.isCrit?' ¡CRÍTICO!':''}!${bleedNote}` : `${enemy.name} falla el ataque.` };
  }

  // ── LOOT GENERATION ──────────────────────────────────────────
  const UNKNOWN_POTIONS = [
    { id:'unk_red',     name:'Líquido Rojo Turbio',   icon:'🧪', r:'common',   p:0, e:'unknown_potion', _real:'potion_minor',  desc:'???' },
    { id:'unk_blue',    name:'Brebaje Azul Brillante', icon:'🔵', r:'uncommon', p:0, e:'unknown_potion', _real:'potion_major',  desc:'???' },
    { id:'unk_green',   name:'Viscosa Verde',          icon:'💚', r:'common',   p:0, e:'unknown_potion', _real:'potion_antidote',desc:'???' },
    { id:'unk_purple',  name:'Esencia Violeta',        icon:'🟣', r:'rare',     p:0, e:'unknown_potion', _real:'potion_heroism', desc:'???' },
    { id:'unk_black',   name:'Néctar Oscuro',          icon:'⚫', r:'uncommon', p:0, e:'unknown_potion', _real:'potion_poison',  desc:'???' },
    { id:'unk_gold',    name:'Ampollas Doradas',       icon:'🟡', r:'rare',     p:0, e:'unknown_potion', _real:'elixir_strength',desc:'???' },
  ];

  const CURSED_ITEMS_POOL = [
    { id:'cursed_blade',   name:'Espada Sedienta', icon:'⚔️', r:'rare', p:0, e:'weapon', slot:'weapon', dmgDice:10, atkBonus:3, dmgBonus:2, cursed:true, desc:'[MALDITA] Poderosa, pero no puedes quitarla.', curse:'No puedes desequiparte esta arma hasta lanzar Remove Curse.' },
    { id:'cursed_ring',    name:'Anillo del Tormento', icon:'💍', r:'uncommon', p:0, e:'accessory', slot:'ring', acBonus:2, cursed:true, statBonus:{con:-2}, desc:'[MALDITA] +2 CA pero -2 CON.', curse:'Este anillo no puede quitarse.' },
    { id:'cursed_helm',    name:'Yelmo del Vacío', icon:'⛑️', r:'rare', p:0, e:'accessory', slot:'head', acBonus:3, cursed:true, statBonus:{wis:-3}, desc:'[MALDITA] +3 CA pero -3 SAB.', curse:'El yelmo susurra. No lo quitarás pronto.' },
  ];

  function generateLoot(enemy, playerLevel) {
    const loot = [];
    // Base gold
    const goldRoll = roll(enemy.gold || 10) + Math.floor(playerLevel * 1.5);
    loot.push({ type:'gold', amount: goldRoll });

    // Item drops from enemy's loot table
    if (enemy.loot && enemy.loot.length > 0) {
      const dropChance = enemy.boss ? 1.0 : enemy.secret ? 0.8 : (enemy.cr || 0.25) > 2 ? 0.6 : 0.35;
      if (Math.random() < dropChance) {
        const itemId = pick(enemy.loot.filter(l => l !== 'random_item'));
        const itemData = P.ITEMS.find(i => i.id === itemId);
        if (itemData) loot.push({ type:'item', item: clone(itemData) });
      }
    }

    // Unknown potion drop (12% chance for non-boss)
    if (!enemy.boss && Math.random() < 0.12) {
      loot.push({ type:'item', item: clone(pick(UNKNOWN_POTIONS)) });
    }

    // Cursed item drop (5% chance, rare+ enemies only)
    if ((enemy.cr||0) >= 3 && Math.random() < 0.05) {
      loot.push({ type:'item', item: clone(pick(CURSED_ITEMS_POOL)), isCursed:true });
    }

    // Elite guaranteed bonus loot
    if (enemy.isElite) {
      const elitePool = P.ITEMS.filter(i => ['uncommon','rare'].includes(i.r));
      if (elitePool.length) loot.push({ type:'item', item: clone(pick(elitePool)), isRareDrop:true });
    }

    // Rare drop system
    const rareChance = enemy.boss ? 0.4 : enemy.secret ? 0.2 : 0.05;
    if (Math.random() < rareChance) {
      const rarePool = P.ITEMS.filter(i => ['rare','epic','legendary'].includes(i.r));
      if (rarePool.length > 0) loot.push({ type:'item', item: clone(pick(rarePool)), isRareDrop: true });
    }

    return loot;
  }

  root._dndParts.UNKNOWN_POTIONS   = UNKNOWN_POTIONS;
  root._dndParts.CURSED_ITEMS_POOL = CURSED_ITEMS_POOL;

  root._dndParts.createEnemy        = createEnemy;
  root._dndParts.rollInitiative     = rollInitiative;
  root._dndParts.playerAttack       = playerAttack;
  root._dndParts.enemyAttack        = enemyAttack;
  root._dndParts.castSpell          = castSpell;
  root._dndParts.useAbility         = useAbility;
  root._dndParts.enemyAI            = enemyAI;
  root._dndParts.generateLoot       = generateLoot;
  root._dndParts.applyStatusEffect  = applyStatusEffect;
  root._dndParts.tickStatusDamage   = tickStatusDamage;
  root._dndParts.tickEnemyConditions= tickEnemyConditions;
  root._dndParts.triggerWildMagic   = triggerWildMagic;
  root._dndParts.getEnemyBark       = getEnemyBark;
  root._dndParts.WILD_MAGIC_SURGES  = WILD_MAGIC_SURGES;
  root._dndParts.STATUS_EFFECT_DEFS = STATUS_EFFECT_DEFS;
  root._dndParts.FEATS              = FEATS;
  console.log('%c[DND] Part 6 loaded — Combat engine, spells, AI, loot, status effects, wild magic', 'color:#8b5cf6;');

})(window);

// ============================================================
// PART 7 — EVENT SYSTEM, DIALOGUE & QUEST TRACKER
// ============================================================
(function(root) {
  'use strict';

  const P = root._dndParts;
  const { d20, roll, pick, shuffle, clone, clamp } = P.utils;

  // ── ENCOUNTER MANAGER ─────────────────────────────────────────
  const EncounterManager = {
    // Get a random event for the current location
    getEvent(char, location) {
      const pool = location.eventPool || [];
      // Filter eligible events
      const available = P.EVENTS.filter(e => {
        if (!e.loc.includes(location.id)) return false;
        if (e.secret && !e.chance) return false;           // One-time secret events
        if (e.secret && Math.random() > (e.chance || 0.05)) return false;
        return true;
      });
      if (available.length === 0) return null;
      // Weighted pick: prefer events not recently seen
      const recentIds = char.flags._recentEvents || [];
      const fresh = available.filter(e => !recentIds.includes(e.id));
      const chosen = pick(fresh.length > 0 ? fresh : available);
      // Track recent events (rolling window of 3)
      const recent = [chosen.id, ...recentIds].slice(0, 3);
      char.flags._recentEvents = recent;
      return clone(chosen);
    },

    // Get a random combat encounter for location
    getCombatEncounter(char, location) {
      const levelMod = Math.max(0, char.level - 3);
      const pool = (location.encounters || []).map(id => P.createEnemy(id, Math.min(levelMod, 8)));
      if (pool.length === 0) return null;
      // Pick 1-2 enemies based on tier
      const count = location.tier >= 3 && d20() >= 15 ? 2 : 1;
      const enemies = [];
      for (let i = 0; i < count; i++) enemies.push(clone(pick(pool)));
      return enemies;
    },

    // Check if encounter triggers (exploration step)
    shouldTriggerCombat(location, progress) {
      const baseChance = 0.4 + (location.tier - 1) * 0.1;
      const explored   = progress / location.totalEncounters;
      return Math.random() < (baseChance + explored * 0.2);
    },

    // Boss check
    isBossEncounter(location, progress) {
      return progress >= location.totalEncounters && !location.completed;
    }
  };

  // ── DIALOGUE SYSTEM ───────────────────────────────────────────
  const DialogueSystem = {
    _current: null,

    start(char, eventData) {
      this._current = { event: eventData, char, step: 0 };
      return this.render();
    },

    render() {
      const { event, char } = this._current;
      return {
        icon: event.icon || '💬',
        title: event.title,
        desc: event.desc,
        choices: (event.choices || []).map((c, i) => ({
          idx: i,
          text: c.text,
          skill: c.skill,
          dc: c.dc,
          available: c.cost ? char.gold >= c.cost : true,
          modStr: c.skill ? `(${c.skill.toUpperCase()} DC${c.dc}: ${char.getModStr(c.skill)})` : ''
        })),
        npcName:   event.npcName,
        npcQuote:  event.npcQuote
      };
    },

    // Resolve a player choice and return the result text + effects
    resolve(choiceIdx, char) {
      const { event } = this._current;
      const choice = event.choices[choiceIdx];
      if (!choice) return null;

      let resultText = '';
      let effects    = {};

      if (choice.cost && char.gold < choice.cost) {
        return { resultText: '❌ No tienes suficiente oro.', effects: {} };
      }
      if (choice.cost) char.gold -= choice.cost;

      if (choice.skill) {
        // Skill check
        const check = P.skillCheck(char, choice.skill, choice.dc);
        const success = check.success;
        resultText = `🎲 ${choice.skill.toUpperCase()} check: ${check.roll} vs DC${choice.dc} — ${success ? '✅ ÉXITO' : '❌ FALLO'}\n\n`;
        resultText += success ? (choice.success || '¡Éxito!') : (choice.fail || '¡Fallo!');

        if (success) {
          if (choice.rewardXP)     { char.gainXP(choice.rewardXP); effects.xp = choice.rewardXP; }
          if (choice.rewardGold)   { char.gold += choice.rewardGold; effects.gold = choice.rewardGold; }
          if (choice.rewardItems)  { choice.rewardItems.forEach(id => { const item = P.ITEMS.find(i=>i.id===id); if(item) char.addItem(clone(item)); }); effects.items = choice.rewardItems; }
          if (choice.reputation)   { char.reputation = clamp(char.reputation + choice.reputation, -10, 10); }
          if (choice.unlockLore)   { if (!char.loreFound.includes(choice.unlockLore)) char.loreFound.push(choice.unlockLore); }
          if (choice.unlockFlag)   { char.flags[choice.unlockFlag] = true; }
          if (choice.statBonus)    { Object.entries(choice.statBonus).forEach(([s,v])=>{ char.baseStats[s]=clamp(char.baseStats[s]+v,1,22); }); }
          if (choice.triggerCombat){ effects.combat = choice.triggerCombat; }
        } else {
          if (choice.unlockFlag)   { char.flags[choice.unlockFlag+'_failed'] = true; }
          if (choice.triggerCombat){ effects.combat = choice.triggerCombat; }
        }
      } else if (choice.triggerCombat) {
        resultText = choice.result || choice.text;
        effects.combat = choice.triggerCombat;
      } else {
        resultText = choice.result || choice.text;
        if (choice.rewardXP)    { char.gainXP(choice.rewardXP); effects.xp = choice.rewardXP; }
        if (choice.rewardGold)  { char.gold += choice.rewardGold; effects.gold = choice.rewardGold; }
        if (choice.rewardItems) { choice.rewardItems.forEach(id => { const item = P.ITEMS.find(i=>i.id===id); if(item) char.addItem(clone(item)); }); effects.items = choice.rewardItems; }
        if (choice.unlockLore)  { if (!char.loreFound.includes(choice.unlockLore)) char.loreFound.push(choice.unlockLore); }
        if (choice.unlockFlag)  { char.flags[choice.unlockFlag] = true; }
        if (choice.reputation)  { char.reputation = clamp(char.reputation + choice.reputation, -10, 10); }
        if (choice.allowCrafting){ effects.crafting = true; }
        if (choice.allowUpgrade) { effects.upgrade = true; }
      }

      this._current = null;
      return { resultText, effects };
    }
  };

  // ── QUEST TRACKER ─────────────────────────────────────────────
  const QuestTracker = {
    // Give a quest to the character
    accept(char, questId) {
      if (char.quests.find(q => q.id === questId)) return false;
      const template = P.QUESTS.find(q => q.id === questId);
      if (!template) return false;
      const quest = clone(template);
      quest.active = true;
      char.quests.push(quest);
      return quest;
    },

    // Update progress on all active quests based on event type
    update(char, event, payload = {}) {
      let completed = [];

      char.quests.filter(q => q.active && !q.completed).forEach(quest => {
        quest.objectives.forEach(obj => {
          if (obj.done) return;
          switch(obj.type) {
            case 'kill':
              if (event === 'kill' && payload.id === obj.target) {
                obj.current = (obj.current || 0) + 1;
                if (obj.current >= obj.count) obj.done = true;
              }
              break;
            case 'kill_boss':
              if (event === 'kill_boss' && payload.id === obj.target) obj.done = true;
              break;
            case 'visit':
              if (event === 'visit' && payload.locationId === obj.target) obj.done = true;
              break;
            case 'collect':
              if (event === 'item_gained' && payload.id === obj.target) {
                obj.current = (obj.current || 0) + 1;
                if (obj.current >= obj.count) obj.done = true;
              }
              break;
            case 'level':
              if (event === 'level_up' && char.level >= obj.target) obj.done = true;
              break;
            case 'have_item':
              if (event === 'check' && obj.target.split(',').some(id => char.hasItem(id))) obj.done = true;
              break;
            case 'loot_event':
              if (event === 'event_completed' && payload.id === obj.target) obj.done = true;
              break;
            case 'enter_devroom':
              if (event === 'enter_devroom') obj.done = true;
              break;
            case 'talk_npc':
              if (event === 'talk_npc') { obj.current = (obj.current||0)+1; if(obj.current>=obj.count) obj.done=true; }
              break;
            case 'dialogue_event':
              if (event === 'dialogue_event' && payload.id === obj.target) obj.done = true;
              break;
            case 'find_item':
              if (event === 'item_gained' && payload.id === obj.target) obj.done = true;
              break;
            case 'find_npc':
              if (event === 'find_npc' && payload.id === obj.target) obj.done = true;
              break;
            case 'return':
              if (event === 'visit' && payload.locationId === obj.target) obj.done = true;
              break;
          }
        });

        // Check completion
        if (quest.objectives.every(o => o.done)) {
          quest.completed = true;
          quest.active = false;
          completed.push(quest);
          // Apply rewards
          if (quest.reward) {
            if (quest.reward.gold)  char.gold += quest.reward.gold;
            if (quest.reward.xp)    char.gainXP(quest.reward.xp);
            if (quest.reward.items) quest.reward.items.forEach(id => { const item = P.ITEMS.find(i=>i.id===id); if(item) char.addItem(clone(item)); });
            if (quest.reward.reputation) char.reputation = clamp(char.reputation+quest.reward.reputation, -10, 10);
            if (quest.reward.special === 'dev_room_unlock') char.flags.devRoomUnlocked = true;
            if (quest.reward.special === 'true_ending')    char.flags.trueEnding = true;
          }
          char.stats.questsDone++;
          P.Storage.unlock('quest_' + quest.id);
          P.Audio.sfx.levelUp();
        }
      });

      return completed;
    },

    getActive(char)    { return char.quests.filter(q => q.active && !q.completed); },
    getCompleted(char) { return char.quests.filter(q => q.completed); },

    progressText(obj) {
      if (obj.type === 'kill' || obj.type === 'collect' || obj.type === 'talk_npc') {
        return `${obj.current||0}/${obj.count}`;
      }
      return obj.done ? '✅' : '⬜';
    }
  };

  // ── CRAFTING SYSTEM ───────────────────────────────────────────
  const CraftingSystem = {
    canCraft(char, recipe) {
      return recipe.ingredients.every(req => char.countItem(req.id) >= req.count);
    },

    craft(char, recipe) {
      if (!this.canCraft(char, recipe)) return { ok:false, msg:'Ingredientes insuficientes.' };
      recipe.ingredients.forEach(req => char.removeItemFromBag(req.id, req.count));
      const resultItem = P.ITEMS.find(i => i.id === recipe.result);
      if (resultItem) char.addItem(clone(resultItem));
      char.gainXP(recipe.xp || 50);
      P.Audio.sfx.equip();
      return { ok:true, msg:`¡Creado: ${resultItem ? resultItem.name : recipe.result}! (+${recipe.xp||50} XP)` };
    },

    // Forge upgrade: +1 to weapon or armor bonus
    upgrade(char, itemId) {
      const item = char.inventory.find(i => i.id === itemId) ||
                   Object.values(char.equipment).find(e => e && e.id === itemId);
      if (!item) return { ok:false, msg:'Objeto no encontrado.' };
      const costGold = 100 * (char.level || 1);
      if (char.gold < costGold) return { ok:false, msg:`Necesitas ${costGold} oro para la mejora.` };
      char.gold -= costGold;
      if (item.atkBonus !== undefined) item.atkBonus++;
      if (item.acBonus  !== undefined) item.acBonus++;
      if (item.dmgBonus !== undefined) item.dmgBonus = (item.dmgBonus||0)+1;
      item._upgraded = (item._upgraded||0)+1;
      item.name = item.name.replace(/\+\d+/,'') + ` +${item._upgraded}`;
      P.Audio.sfx.equip();
      return { ok:true, msg:`¡${item.name} mejorado!` };
    }
  };

  root._dndParts.EncounterManager = EncounterManager;
  root._dndParts.DialogueSystem   = DialogueSystem;
  root._dndParts.QuestTracker     = QuestTracker;
  root._dndParts.CraftingSystem   = CraftingSystem;
  console.log('%c[DND] Part 7 loaded — Encounter manager, dialogue, quests, crafting', 'color:#8b5cf6;');

})(window);

// ============================================================
// PART 8 — INVENTORY, MERCHANT, WORLD & SAVE SYSTEM
// ============================================================
(function(root) {
  'use strict';

  const P = root._dndParts;
  const { d20, roll, pick, clone, clamp, fmtGold } = P.utils;

  // ── RARITY LABELS ────────────────────────────────────────────
  const RARITY = {
    common:    { label:'Común',      color:'#9ca3af', stars:'★' },
    uncommon:  { label:'Poco común', color:'#22c55e', stars:'★★' },
    rare:      { label:'Raro',       color:'#3b82f6', stars:'★★★' },
    epic:      { label:'Épico',      color:'#a855f7', stars:'★★★★' },
    legendary: { label:'Legendario', color:'#f59e0b', stars:'★★★★★' },
    unique:    { label:'Único',      color:'#ef4444', stars:'✦' }
  };

  // ── INVENTORY MANAGER ────────────────────────────────────────
  const InventoryManager = {
    // Get full stat/bonus summary from equipment
    getEquipBonuses(char) {
      let bonuses = { atk:0, dmg:0, ac:0, str:0, dex:0, con:0, int:0, wis:0, cha:0, maxHP:0 };
      Object.values(char.equipment).forEach(item => {
        if (!item) return;
        if (item.atkBonus) bonuses.atk += item.atkBonus;
        if (item.dmgBonus) bonuses.dmg += item.dmgBonus;
        if (item.acBonus)  bonuses.ac  += item.acBonus;
        if (item.statBonus) Object.entries(item.statBonus).forEach(([s,v]) => { if(bonuses[s]!==undefined) bonuses[s]+=v; });
        if (item.hpBonus)  bonuses.maxHP += item.hpBonus;
      });
      return bonuses;
    },

    // Render item tooltip text
    itemTooltip(item, char) {
      if (!item) return '';
      const rar = RARITY[item.r] || RARITY.common;
      let lines = [`<b style="color:${rar.color}">${P.getSpriteHtml(item.id, item.icon||'')} ${item.name}</b> <span style="color:${rar.color}">[${rar.label}]</span>`];
      if (item.desc) lines.push(`<em>${item.desc}</em>`);
      if (item.atkBonus) lines.push(`⚔️ Ataque: +${item.atkBonus}`);
      if (item.dmgBonus) lines.push(`💥 Daño: +${item.dmgBonus}`);
      if (item.dmgDice)  lines.push(`🎲 Dado: d${item.dmgDice}`);
      if (item.acBonus)  lines.push(`🛡️ CA: +${item.acBonus}`);
      if (item.elemental) lines.push(`🔥 Elemental: ${item.elemental}`);
      if (item.statBonus) Object.entries(item.statBonus).forEach(([s,v]) => lines.push(`📈 ${s.toUpperCase()}: +${v}`));
      if (item.e === 'heal') lines.push(`💚 Cura: ${item.v} HP`);
      if (item.slot)     lines.push(`🧷 Ranura: ${item.slot}`);
      if (item.p !== undefined) lines.push(`💰 Valor: ${fmtGold(item.p)}`);
      if (item._upgraded) lines.push(`⚒️ Mejorado x${item._upgraded}`);
      // Compare with equipped
      if (char && item.slot && char.equipment[item.slot]) {
        const cur = char.equipment[item.slot];
        const diff = (item.atkBonus||0)-(cur.atkBonus||0);
        if (diff > 0) lines.push(`<span style="color:#22c55e">▲ +${diff} ATK vs equipado</span>`);
        else if (diff < 0) lines.push(`<span style="color:#ef4444">▼ ${diff} ATK vs equipado</span>`);
      }
      return lines.join('<br>');
    },

    // Can equip? (Check class/race restrictions)
    canEquip(char, item) {
      if (item.reqClass && !item.reqClass.includes(char.cls.id)) return { ok:false, reason:`Solo pueden usarlo: ${item.reqClass.join(', ')}` };
      if (item.reqLevel && char.level < item.reqLevel) return { ok:false, reason:`Requiere nivel ${item.reqLevel}` };
      return { ok:true };
    },

    // Sort inventory
    sort(inventory, by = 'rarity') {
      const order = { legendary:0, unique:0, epic:1, rare:2, uncommon:3, common:4 };
      if (by === 'rarity') return [...inventory].sort((a,b) => (order[a.r]||4)-(order[b.r]||4));
      if (by === 'name')   return [...inventory].sort((a,b) => a.name.localeCompare(b.name));
      if (by === 'type')   return [...inventory].sort((a,b) => (a.e||'').localeCompare(b.e||''));
      return inventory;
    }
  };

  // ── MERCHANT SYSTEM ───────────────────────────────────────────
  const MerchantSystem = {
    // Generate a merchant's shop inventory
    buildShop(location, char) {
      const base = location.shopInv || [];
      const items = base.map(id => {
        const item = P.ITEMS.find(i => i.id === id);
        return item ? { ...clone(item), stock: Math.floor(Math.random()*3)+1 } : null;
      }).filter(Boolean);

      // Reputation discount/surcharge
      const discount = char.reputation >= 5 ? 0.85 : char.reputation >= 2 ? 0.95 : char.reputation <= -3 ? 1.15 : 1.0;

      return items.map(i => ({ ...i, sellPrice: Math.round((i.p||10) * discount) }));
    },

    // Buy: deduct gold, add to inventory
    buy(char, item, qty = 1) {
      const totalCost = item.sellPrice * qty;
      if (char.gold < totalCost) return { ok:false, msg:`Necesitas ${fmtGold(totalCost)} oro. Tienes ${fmtGold(char.gold)}.` };
      char.gold -= totalCost;
      char.stats.goldEarned -= totalCost;
      for (let i=0; i<qty; i++) char.addItem(clone(item));
      P.Audio.sfx.coin();
      return { ok:true, msg:`Comprado: ${qty}x ${item.name} por ${fmtGold(totalCost)}.` };
    },

    // Sell: receive gold
    sell(char, itemId, qty = 1) {
      const item = char.inventory.find(i=>i.id===itemId);
      if (!item) return { ok:false, msg:'Objeto no encontrado.' };
      const sellValue = Math.floor((item.p || 5) * 0.5);
      const total = sellValue * qty;
      if (!char.removeItemFromBag(itemId, qty)) return { ok:false, msg:'No tienes ese objeto.' };
      char.gold += total;
      char.stats.goldEarned += total;
      P.Audio.sfx.coin();
      return { ok:true, msg:`Vendido: ${qty}x ${item.name} por ${fmtGold(total)}.` };
    }
  };

  // ── WORLD SYSTEM ─────────────────────────────────────────────
  const WorldSystem = {
    _locations: null,

    init() {
      this._locations = P.LOCATIONS.map(l => clone(l));
    },

    getLoc(id) { return this._locations.find(l=>l.id===id); },
    getAllUnlocked(char) {
      return this._locations.filter(l => l.unlocked || (l.hiddenUnlock && char.race.id === l.hiddenUnlock));
    },

    // Explore one step in the current location
    explore(char, locationId) {
      const loc = this.getLoc(locationId);
      if (!loc) return null;

      if (!char.visitedLocations.includes(locationId)) {
        char.visitedLocations.push(locationId);
        P.QuestTracker.update(char, 'visit', { locationId });
      }
      char.currentLocation = locationId;

      // Advance time
      P.advanceTime(char, 1);

      // Progress counter
      loc.progress = Math.min(loc.progress + 1, loc.totalEncounters + 1);

      // Boss check
      if (P.EncounterManager.isBossEncounter(loc, loc.progress)) {
        return { type:'boss', enemyId: loc.boss, location: loc };
      }

      // Combat encounter
      if (P.EncounterManager.shouldTriggerCombat(loc, loc.progress)) {
        const enemies = P.EncounterManager.getCombatEncounter(char, loc);
        return { type:'combat', enemies, location: loc };
      }

      // Story event
      const evt = P.EncounterManager.getEvent(char, loc);
      if (evt) {
        if (evt.type === 'merchant') {
          return { type:'merchant', event: evt, shop: MerchantSystem.buildShop(loc, char), location: loc };
        }
        if (evt.type === 'forge') {
          return { type:'forge', event: evt, location: loc };
        }
        return { type:'event', event: evt, location: loc };
      }

      // Nothing found
      char.gainXP(10);
      return { type:'empty', msg:`Exploras ${loc.name}. El camino es tranquilo. (+10 XP)`, location: loc };
    },

    // Complete location (after boss)
    complete(char, locationId) {
      const loc = this.getLoc(locationId);
      if (!loc || loc.completed) return;
      loc.completed = true;

      // Unlock adjacent locations based on tier
      this._locations.forEach(l => {
        if (!l.unlocked && l.tier <= loc.tier + 1 && l.tier > 1) l.unlocked = true;
      });

      const baseXP = loc.tier * 200;
      char.gainXP(baseXP);
      char.gold += loc.tier * 50;
      P.Storage.unlock('completed_' + locationId);

      // Zone completion artifact reward
      const ZONE_ARTIFACTS = {
        village:  { id:'village_crest',    name:'Escudo de Keldrath',     icon:'🏡', r:'uncommon', p:0, e:'accessory', slot:'trinket', acBonus:1,  desc:'Símbolo de haber pacificado el pueblo. +1 CA.', noSell:true },
        forest:   { id:'forest_heart',     name:'Corazón del Bosque',     icon:'🌿', r:'rare',     p:0, e:'accessory', slot:'trinket', hpBonus:10, desc:'Latido del bosque susurrante. +10 HP máx.', noSell:true },
        ruins:    { id:'vaelthar_shard',   name:'Fragmento de Vaelthar',  icon:'🏛️', r:'rare',     p:0, e:'accessory', slot:'trinket', svBonus:2,  desc:'Ruina de un imperio caído. +2 saving throws.', noSell:true },
        dungeon:  { id:'korrath_seal',     name:'Sello de Korrath',       icon:'⛏️', r:'epic',     p:0, e:'accessory', slot:'trinket', atkBonus:2, desc:'El sello de las mazmorras profundas. +2 ataques.', noSell:true },
        underdark:{ id:'void_crown',       name:'Corona del Vacío',       icon:'🌑', r:'epic',     p:0, e:'accessory', slot:'trinket', acBonus:2,  desc:'Corona de las profundidades. +2 CA.', noSell:true },
        peak:     { id:'dragonslayer_mark',name:'Marca del Cazadragones', icon:'🏔️', r:'legendary',p:0, e:'accessory', slot:'trinket', atkBonus:3, hpBonus:15, desc:'Solo los más valientes. +3 ATK, +15 HP.', noSell:true },
        academy:  { id:'upro_diploma',     name:'Diploma UPRO Mágico',    icon:'🎓', r:'rare',     p:0, e:'accessory', slot:'trinket', svBonus:3,  desc:'Egresado de la academia más peligrosa. +3 a saves.', noSell:true },
      };
      const artifact = ZONE_ARTIFACTS[locationId];
      if (artifact) {
        char.addItem({ ...artifact, count: 1 });
        P.showNotification(`🏆 ¡Zona completada! Obtienes: ${artifact.icon} ${artifact.name}`, 'success', 6000);
      }

      return { xp: baseXP, gold: loc.tier*50 };
    },

    // Rest at a location (short rest = half hit dice, long rest = full HP)
    rest(char, type) {
      if (type === 'short') {
        const hitDice = Math.ceil(char.level / 2);
        let healed = 0;
        for (let i = 0; i < hitDice; i++) healed += roll(char.cls.hd) + char.getMod('con');
        healed = char.heal(Math.max(0, healed));
        // Second Wind recharges on short rest
        char._secondWindUsed = false;
        P.advanceTime(char, 2);
        P.Audio.sfx.heal();
        return { msg:`Descanso corto. Recuperas ${healed} HP. Segunda Oportunidad recargada.`, healed };
      }
      // Long rest: full HP, abilities refresh
      const oldHP = char.hp;
      char.hp = char.maxHP;
      char.conditions = char.conditions.filter(c => c.id === 'cursed'); // Curses persist
      char.abilities.forEach(a => { if(a.maxUses>0) a.curUses = a.maxUses; });
      // Recharge all per-rest abilities
      char._secondWindUsed = false;
      char._actionSurgeUsed = false;
      P.advanceTime(char, 8);
      P.Audio.sfx.heal();
      const healed = char.hp - oldHP;
      return { msg:`Descanso largo. Recuperas ${healed} HP. Todas las habilidades restauradas.`, healed };
    }
  };

  // ── SAVE / LOAD ───────────────────────────────────────────────
  const SaveSystem = {
    save(char, worldState) {
      const data = {
        char: char.toJSON(),
        world: worldState ? worldState._locations.map(l => ({ id:l.id, progress:l.progress, completed:l.completed, unlocked:l.unlocked })) : [],
        savedAt: new Date().toISOString(),
        version: 2
      };
      P.Storage.saveGame(data);
      return true;
    },

    load() {
      const raw = P.Storage.loadGame();
      if (!raw) return null;
      try {
        const char = P.Character.fromJSON(raw.char);
        if (!char) return null;
        return { char, worldData: raw.world || [], savedAt: raw.savedAt };
      } catch(e) { console.warn('[DND] Save corrupt:', e); return null; }
    },

    hasSave() { return P.Storage.hasSave(); },
    deleteSave() { P.Storage.deleteSave(); },

    formatSaveInfo(savedAt) {
      if (!savedAt) return 'Sin datos';
      const d = new Date(savedAt);
      return d.toLocaleString('es-AR', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' });
    }
  };

  root._dndParts.RARITY           = RARITY;
  root._dndParts.InventoryManager = InventoryManager;
  root._dndParts.MerchantSystem   = MerchantSystem;
  root._dndParts.WorldSystem      = WorldSystem;
  root._dndParts.SaveSystem       = SaveSystem;
  console.log('%c[DND] Part 8 loaded — Inventory, merchant, world system, save/load', 'color:#8b5cf6;');

})(window);

// ============================================================
// PART 9 — UI SCREEN BUILDERS
// ============================================================
(function(root) {
  'use strict';

  const P = root._dndParts;
  const esc = P.utils.esc;
  const fmtGold = P.utils.fmtGold;

  function triggerAnimation(side, animationClass) {
    const selector = side === 'player' ? '.dnd-player-side' : '.dnd-enemy-side';
    const el = document.querySelector(selector);
    if (el) {
      el.classList.remove('dnd-attack-lunge-player', 'dnd-attack-lunge-enemy', 'dnd-damage-shake');
      void el.offsetWidth; // force reflow
      el.classList.add(animationClass);
      setTimeout(() => {
        el.classList.remove(animationClass);
      }, 500);
    }
  }
  root._dndParts.triggerAnimation = triggerAnimation;

  // ── HUD ──────────────────────────────────────────────────────
  function buildHUD(char) {
    if (!char) return '';
    const hpPct = Math.round((char.hp / char.maxHP) * 100);
    const xpPct = Math.round(char.xpProgress);
    const hpColor = hpPct > 60 ? '#22c55e' : hpPct > 30 ? '#f59e0b' : '#ef4444';
    const conds   = char.conditions.map(c => `<span class="dnd-cond-badge" title="${esc(c.name)}">${c.icon||'⚡'}</span>`).join('');
    const weather = P.WEATHER_ICONS[char.weather] || '☀️';
    const timeStr = P.getTimeName(char.worldTime);
    return `
      <div id="dnd-hud" class="${char.hp < char.maxHP*0.3 ? 'dnd-hud-danger' : ''}">
        <div class="dnd-hud-left">
          <span class="dnd-hud-name">${esc(char.name)}</span>
          <span class="dnd-hud-info">${esc(char.cls.icon)} ${esc(char.cls.name)} ${esc(char.race.icon)} Nv.${char.level}</span>
        </div>
        <div class="dnd-hud-bars">
          <div class="dnd-bar-row">
            <span class="dnd-bar-label">HP</span>
            <div class="dnd-bar"><div class="dnd-bar-fill" style="width:${hpPct}%;background:${hpColor}"></div></div>
            <span class="dnd-bar-val">${char.hp}/${char.maxHP}</span>
          </div>
          <div class="dnd-bar-row">
            <span class="dnd-bar-label">XP</span>
            <div class="dnd-bar"><div class="dnd-bar-fill" style="width:${xpPct}%;background:#8b5cf6"></div></div>
            <span class="dnd-bar-val">Nv${char.level}${char.level<20?' → '+(xpPct)+'%':' MAX'}</span>
          </div>
        </div>
        <div class="dnd-hud-right">
          <span class="dnd-gold">💰 ${fmtGold(char.gold)}</span>
          <span class="dnd-weather">${weather} ${timeStr}</span>
          <div class="dnd-conditions">${conds}</div>
        </div>
      </div>`;
  }

  // ── SCREEN: INTRO ─────────────────────────────────────────────
  function buildIntroScreen(hasSave) {
    return `
      <div id="dnd-intro" class="dnd-screen dnd-active">
        <div class="dnd-intro-bg"></div>
        <div class="dnd-intro-content">
          <div class="dnd-intro-badge">✦ EASTER EGG DESBLOQUEADO ✦</div>
          <h1 class="dnd-intro-title">KATOSX RPG</h1>
          <h2 class="dnd-intro-subtitle">Crónicas del Portfolio Olvidado</h2>
          <p class="dnd-intro-flavor">
            <em>"En un mundo donde el código es magia y los bugs son dragones,<br>
            un aventurero descubrió que el botón secreto no debería existir."</em>
          </p>
          <div class="dnd-intro-divider">⚔ ✦ ⚔</div>
          <div class="dnd-intro-btns">
            <button class="dnd-btn dnd-btn-primary" onclick="root._dndGame.navigate('char-create')">
              ⚔️ Nueva Partida
            </button>
            ${hasSave ? `<button class="dnd-btn dnd-btn-secondary" onclick="root._dndGame.loadGame()">
              💾 Continuar Partida
            </button>` : ''}
            <button class="dnd-btn dnd-btn-ghost" onclick="root._dndGame.navigate('lore')">
              📖 Lore / Codex
            </button>
            <button class="dnd-btn dnd-btn-ghost" onclick="root._dndGame.close()">
              ✖ Cerrar
            </button>
          </div>
          <div class="dnd-intro-hint">
            Abre la consola del navegador y escribe <code>dnd.secret()</code> para más misterios.
          </div>
          <div class="dnd-intro-version">v2.0 — Hecho con ☕ y demasiadas noches</div>
        </div>
      </div>`;
  }

  // ── SCREEN: CHARACTER CREATION ────────────────────────────────
  function buildCharCreateScreen(step = 0, selections = {}) {
    const steps   = ['Elige tu Raza', 'Elige tu Clase', 'Tu Nombre', 'Tira Estadísticas', 'Confirmar'];
    const stepDots= steps.map((s,i) => `<div class="dnd-step-dot ${i===step?'active':i<step?'done':''}">${i<step?'✓':i+1}</div>`).join('');

    let body = '';

    if (step === 0) {
      // Race selection
      const gender = selections.gender || 'male';
      const showAll = selections.showHiddenRaces;
      const races   = P.RACES.filter(r => !r.hidden || showAll);
      body = `
        <h3 class="dnd-cc-subtitle" style="margin-bottom: 8px;">Elige tu Género</h3>
        <div class="dnd-gender-selector" style="display:flex; justify-content:center; gap:12px; margin-bottom:24px;">
          <button class="dnd-btn ${gender==='male'?'primary':''}" style="padding:8px 20px; font-size:0.75rem;" onclick="root._dndGame.ccSelect('gender', 'male')">♂ Hombre</button>
          <button class="dnd-btn ${gender==='female'?'primary':''}" style="padding:8px 20px; font-size:0.75rem;" onclick="root._dndGame.ccSelect('gender', 'female')">♀ Mujer</button>
        </div>
        <h3 class="dnd-cc-subtitle">Elige tu Raza</h3>
        <div class="dnd-race-grid">
          ${races.map(r => {
            const genderData = r.genders?.[gender] || { name: r.name, icon: r.icon };
            return `
            <button class="dnd-race-card ${selections.race?.id===r.id?'selected':''} ${r.hidden?'dnd-secret':''}"
              onclick="root._dndGame.ccSelect('race', '${r.id}')">
              <div class="dnd-race-icon">${P.getSpriteHtml(r.id, genderData.icon)}</div>
              <div class="dnd-race-name">${r.hidden?'???':esc(genderData.name)}</div>
              <div class="dnd-race-traits">${r.traits.map(t=>`<span>${esc(t.name||t)}</span>`).join('')}</div>
            </button>`;
          }).join('')}
        </div>
        ${selections.race ? (() => {
          const genderData = selections.race.genders?.[gender] || { name: selections.race.name, icon: selections.race.icon };
          return `<div class="dnd-selection-info">
            <b>${P.getSpriteHtml(selections.race.id, genderData.icon)} ${esc(genderData.name)}</b><br>
            <em>${esc(selections.race.desc)}</em><br>
            <small>${esc(selections.race.lore)}</small>
            <div class="dnd-bonuses">${Object.entries(selections.race.bonuses).filter(([,v])=>v!==0).map(([k,v])=>`${k.toUpperCase()}: ${v>0?'+':''}${v}`).join(' · ')}</div>
          </div>`;
        })() : ''}`;
    }

    else if (step === 1) {
      // Class selection
      const showSecret = selections.showSecretClasses;
      const classes = P.CLASSES.filter(c => !c.secret || showSecret);
      body = `
        <h3 class="dnd-cc-subtitle">¿Cuál es tu vocación?</h3>
        <div class="dnd-class-grid">
          ${classes.map(c => `
            <button class="dnd-class-card ${selections.cls?.id===c.id?'selected':''} ${c.secret?'dnd-secret':''}"
              onclick="root._dndGame.ccSelect('cls', '${c.id}')">
              <div class="dnd-class-icon">${c.icon}</div>
              <div class="dnd-class-name">${c.secret?'???':esc(c.name)}</div>
              <div class="dnd-class-role"><span class="dnd-role-badge">${esc(c.role||`HD${c.hd}`)}</span></div>
            </button>`).join('')}
        </div>
        ${selections.cls ? `<div class="dnd-selection-info">
          <b>${P.getSpriteHtml(selections.cls.id, selections.cls.icon)} ${esc(selections.cls.name)}</b> — <em>${esc(selections.cls.role||`Dado de Vida d${selections.cls.hd}`)}</em><br>
          ${esc(selections.cls.desc)}<br>
          <small>HP: d${selections.cls.hd} · Guardias: ${selections.cls.savingThrows.join(', ').toUpperCase()} · Habilidades primarias: ${selections.cls.primaryStats.join(', ').toUpperCase()}</small>
        </div>` : ''}`;
    }

    else if (step === 2) {
      // Name input
      body = `
        <h3 class="dnd-cc-subtitle">¿Cómo te llaman?</h3>
        <div class="dnd-name-input-wrap">
          <input id="dnd-name-input" class="dnd-name-input" type="text" maxlength="24"
            placeholder="Tu nombre, aventurero..." value="${esc(selections.name||'')}"
            oninput="root._dndGame.ccSelect('name', this.value)"
            onkeydown="if(event.key==='Enter') root._dndGame.ccNext()">
          <button class="dnd-btn dnd-btn-ghost" onclick="root._dndGame.ccRandomName()">🎲 Aleatorio</button>
        </div>
        <div class="dnd-cc-hint">Entre 2 y 24 caracteres. Solo letras, números y espacios.</div>
        <div class="dnd-modes">
          <label class="dnd-checkbox"><input type="checkbox" ${selections.hardcore?'checked':''} onchange="root._dndGame.ccSelect('hardcore', this.checked)"> ☠️ Modo Hardcore (sin guardado durante combate)</label>
          <label class="dnd-checkbox"><input type="checkbox" ${selections.permadeath?'checked':''} onchange="root._dndGame.ccSelect('permadeath', this.checked)"> 💀 Permadeath (muerte permanente, score x2)</label>
        </div>`;
    }

    else if (step === 3) {
      // Stat rolling
      const stats = selections.stats || {};
      const statNames = { str:'Fuerza', dex:'Destreza', con:'Constitución', int:'Inteligencia', wis:'Sabiduría', cha:'Carisma' };
      body = `
        <h3 class="dnd-cc-subtitle">Tus estadísticas</h3>
        <div class="dnd-stat-grid">
          ${Object.entries(statNames).map(([s, label]) => {
            const val  = stats[s] || 10;
            const mStr = val >= 12 ? '#22c55e' : val >= 9 ? '#9ca3af' : '#ef4444';
            const racBon = (selections.race?.bonuses?.[s] || 0);
            const total = val + racBon;
            return `<div class="dnd-stat-box ${selections.cls?.primaryStats?.includes(s)?'primary':''}">
              <div class="dnd-stat-label">${label}</div>
              <div class="dnd-stat-val" style="color:${mStr}">${val}</div>
              ${racBon!==0?`<div class="dnd-stat-racial">${racBon>0?'+':''}${racBon} racial → <b>${total}</b></div>`:''}
              <div class="dnd-stat-mod">${P.utils.modStr(total)}</div>
            </div>`;
          }).join('')}
        </div>
        <div class="dnd-stat-actions">
          <button class="dnd-btn dnd-btn-primary" onclick="root._dndGame.ccRollStats()">🎲 Tirar 4d6 caer menor</button>
          <button class="dnd-btn dnd-btn-ghost"   onclick="root._dndGame.ccStandardArray()">📊 Array estándar (15,14,13,12,10,8)</button>
        </div>
        <div class="dnd-cc-hint">Las estadísticas primarias de ${esc(selections.cls?.name||'tu clase')} están resaltadas.</div>`;
    }

    else if (step === 4) {
      // Summary / confirm
      const r = selections.race; const c = selections.cls; const s = selections.stats || {};
      const hpPrev = c ? (c.hd + P.utils.mod(s.con + (r?.bonuses?.con||0))) : 10;
      body = `
        <h3 class="dnd-cc-subtitle">¿Listo para la aventura?</h3>
        <div class="dnd-confirm-sheet">
          <div class="dnd-confirm-hero">
            <div class="dnd-confirm-icons">
              ${r ? P.getSpriteHtml(r.id, r.icon) : '?'}
              <span class="dnd-confirm-class-emoji" style="font-size: 2rem; vertical-align: middle; margin-left: 8px;">${c?.icon||'?'}</span>
            </div>
            <div class="dnd-confirm-name">${esc(selections.name||'Sin nombre')}</div>
            <div class="dnd-confirm-class">${esc(r?.name||'?')} ${esc(c?.name||'?')} · Nivel 1</div>
            ${selections.permadeath?'<div class="dnd-confirm-badge danger">💀 PERMADEATH ACTIVADO</div>':''}
            ${selections.hardcore?'<div class="dnd-confirm-badge warn">☠️ HARDCORE ACTIVADO</div>':''}
          </div>
          <div class="dnd-confirm-stats">
            ${['str','dex','con','int','wis','cha'].map(s2 => {
              const total = (selections.stats?.[s2]||10) + (r?.bonuses?.[s2]||0);
              return `<div class="dnd-stat-mini">${s2.toUpperCase()} <b>${total}</b> <small>${P.utils.modStr(total)}</small></div>`;
            }).join('')}
          </div>
          <div class="dnd-confirm-derived">
            <span>❤️ HP Máx: ~${Math.max(hpPrev, 8)}</span>
            <span>🛡️ CA: ${10 + P.utils.mod((selections.stats?.dex||10)+(r?.bonuses?.dex||0))}</span>
            <span>💰 Oro: ${c?.startingGold||10}+4d6</span>
          </div>
        </div>`;
    }

    const canNext  = (step===0 && selections.race) || (step===1 && selections.cls) ||
                     (step===2 && selections.name?.trim().length>=2) || (step===3 && selections.stats) || step===4;
    const isFinal  = step === 4;

    return `
      <div id="dnd-char-create" class="dnd-screen dnd-active">
        <div class="dnd-cc-header">
          <button class="dnd-btn dnd-btn-ghost dnd-back" onclick="root._dndGame.navigate('intro')">← Inicio</button>
          <h2 class="dnd-cc-title">Crear Personaje</h2>
          <div class="dnd-step-row">${stepDots}</div>
        </div>
        <div class="dnd-cc-step-title">${steps[step]}</div>
        <div class="dnd-cc-body">${body}</div>
        <div class="dnd-cc-footer">
          ${step > 0 ? `<button class="dnd-btn dnd-btn-ghost" onclick="root._dndGame.ccPrev()">← Atrás</button>` : ''}
          ${!isFinal ? `<button class="dnd-btn dnd-btn-primary" onclick="root._dndGame.ccNext()" ${canNext?'':'disabled'}>Siguiente →</button>`
                     : `<button class="dnd-btn dnd-btn-primary dnd-pulse-btn" onclick="root._dndGame.startGame()" ${canNext?'':'disabled'}>⚔️ ¡Comenzar Aventura!</button>`}
        </div>
      </div>`;
  }

  // ── SCREEN: WORLD MAP ─────────────────────────────────────────
  function buildWorldScreen(char, world) {
    const locs     = world.getAllUnlocked(char);
    const activeQ  = P.QuestTracker.getActive(char).slice(0, 2);
    const timeIcon = P.WEATHER_ICONS[char.weather];
    return `
      <div id="dnd-world" class="dnd-screen dnd-active">
        ${buildHUD(char)}
        <div class="dnd-world-layout">
          <div class="dnd-world-main">
            <h2 class="dnd-world-title">🗺️ Mapa del Mundo</h2>
            <div class="dnd-location-grid">
              ${locs.map(loc => `
                <button class="dnd-loc-card ${loc.id===char.currentLocation?'current':''} ${loc.completed?'completed':''}"
                  onclick="root._dndGame.enterLocation('${loc.id}')"
                  style="border-color:${loc.color}">
                  <div class="dnd-loc-icon">${loc.icon}</div>
                  <div class="dnd-loc-name">${esc(loc.name)}</div>
                  <div class="dnd-loc-tier">${'⭐'.repeat(loc.tier)}</div>
                  <div class="dnd-loc-prog">${loc.completed?'✅ Completada':`${loc.progress||0}/${loc.totalEncounters}`}</div>
                  <div class="dnd-loc-lvl">Nv ${loc.minLevel}–${loc.maxLevel}</div>
                </button>`).join('')}
              <button class="dnd-loc-card dnd-loc-locked" title="Aún bloqueado">
                <div class="dnd-loc-icon">🌑</div><div class="dnd-loc-name">???</div>
              </button>
            </div>
          </div>
          <div class="dnd-world-side">
            <div class="dnd-side-panel">
              <h3>📜 Misiones Activas</h3>
              ${activeQ.length === 0 ? '<p class="dnd-no-quests">Sin misiones activas. Habla con NPCs.</p>' :
                activeQ.map(q => `<div class="dnd-quest-mini">
                  <b>${q.icon} ${esc(q.title)}</b>
                  ${q.objectives.map(o => `<div class="dnd-quest-obj ${o.done?'done':''}">${o.done?'✅':'⬜'} ${esc(o.text)} ${P.QuestTracker.progressText(o)}</div>`).join('')}
                </div>`).join('')}
              <button class="dnd-btn dnd-btn-ghost dnd-full" onclick="root._dndGame.navigate('quests')">Ver todas →</button>
            </div>
            <div class="dnd-side-panel">
              <h3>📊 Personaje</h3>
              <div class="dnd-stat-mini-row">
                ${['str','dex','con','int','wis','cha'].map(s => `<span class="dnd-sm" title="${s.toUpperCase()}">${s.slice(0,3).toUpperCase()}<b>${P.utils.modStr(char.getStat(s))}</b></span>`).join('')}
              </div>
              <p>🏅 Reputación: ${char.reputation >= 5?'✨ Héroe':char.reputation >= 2?'⚔️ Respetado':char.reputation >= -1?'😐 Neutral':char.reputation >= -4?'⚠️ Temido':'☠️ Infame'} (${char.reputation>0?'+':''}${char.reputation})</p>
              <p>💀 Enemigos: ${char.stats.kills} · 📜 Quests: ${char.stats.questsDone}</p>
              <div class="dnd-side-btns">
                <button class="dnd-btn dnd-btn-ghost dnd-half" onclick="root._dndGame.navigate('inventory')">🎒 Inventario</button>
                <button class="dnd-btn dnd-btn-ghost dnd-half" onclick="root._dndGame.worldRest('short')">💤 Descanso corto</button>
                <button class="dnd-btn dnd-btn-ghost dnd-half" onclick="root._dndGame.worldRest('long')">🛌 Descanso largo</button>
                <button class="dnd-btn dnd-btn-ghost dnd-half" onclick="root._dndGame.navigate('lore')">📖 Codex</button>
                <button class="dnd-btn dnd-btn-ghost dnd-half" onclick="root._dndGame.navigate('stats')">📊 Stats</button>
                <button class="dnd-btn dnd-btn-ghost dnd-half" onclick="root._dndGame.navigate('charsheet')">📋 Ficha de PJ</button>
                ${char._pendingASI ? `<button class="dnd-btn dnd-btn-primary dnd-pulse-btn dnd-full" onclick="root._dndGame.showASIScreen()">⬆️ ¡Mejora disponible!</button>` : ''}
              </div>
            </div>
            ${char.flags.devRoomUnlocked ? `<button class="dnd-btn dnd-btn-dev dnd-full" onclick="root._dndGame.navigate('devroom')">💾 SALA DE DEBUG</button>` : ''}
          </div>
        </div>
      </div>`;
  }

  // ── SCREEN: EXPLORE / EVENT ───────────────────────────────────
  function buildExploreScreen(char, eventData, locationId) {
    const evt  = eventData?.event || eventData;
    const loc  = P.LOCATIONS.find(l => l.id === locationId) || {};
    const dlg  = evt ? P.DialogueSystem.start(char, evt) : null;
    return `
      <div id="dnd-explore" class="dnd-screen dnd-active">
        ${buildHUD(char)}
        <div class="dnd-explore-layout">
          <div class="dnd-explore-header">
            <button class="dnd-btn dnd-btn-ghost" onclick="root._dndGame.navigate('world')">← Mapa</button>
            <span class="dnd-explore-loc">${loc.icon||'🗺️'} ${esc(loc.name||'')}</span>
            <span class="dnd-explore-prog">${loc.progress||0}/${loc.totalEncounters||0}</span>
          </div>
          ${dlg ? `
            <div class="dnd-event-card">
              <div class="dnd-event-icon">${dlg.icon}</div>
              <h3 class="dnd-event-title">${esc(dlg.title)}</h3>
              ${dlg.npcName ? `<div class="dnd-npc-header"><span class="dnd-npc-name">${esc(dlg.npcName)}</span>${dlg.npcQuote?`<em class="dnd-npc-quote">"${esc(dlg.npcQuote)}"</em>`:''}</div>` : ''}
              <p class="dnd-event-desc">${esc(dlg.desc)}</p>
              <div class="dnd-choices">
                ${dlg.choices.map(c => `
                  <button class="dnd-btn dnd-btn-choice ${!c.available?'disabled':''}"
                    onclick="root._dndGame.resolveChoice(${c.idx})"
                    ${!c.available?'disabled':''}>
                    ${esc(c.text)}
                    ${c.skill ? `<span class="dnd-skill-hint">${c.modStr}</span>` : ''}
                  </button>`).join('')}
              </div>
            </div>` :
            `<div class="dnd-explore-empty">
              <div class="dnd-explore-icon">🌫️</div>
              <p>El camino está tranquilo...</p>
              <button class="dnd-btn dnd-btn-primary" onclick="root._dndGame.explore()">⚔️ Explorar</button>
              <button class="dnd-btn dnd-btn-ghost"   onclick="root._dndGame.navigate('world')">← Volver al mapa</button>
            </div>`}
        </div>
      </div>`;
  }

  // ── SCREEN: COMBAT ────────────────────────────────────────────
  function buildCombatScreen(char, enemies, combatLog, phase = 'player', bonusActionUsed = false) {
    const enemy = enemies[0];
    if (!enemy) return '<div class="dnd-screen dnd-active"><p>Error: sin enemigo.</p></div>';
    const hpPct   = Math.round((enemy.hp / enemy.maxHP) * 100);
    const phColor = hpPct > 60 ? '#22c55e' : hpPct > 30 ? '#f59e0b' : '#ef4444';
    const pHpPct  = Math.round((char.hp / char.maxHP) * 100);
    const pColor  = pHpPct > 60 ? '#22c55e' : pHpPct > 30 ? '#f59e0b' : '#ef4444';
    const allAbilities = char.abilities || [];
    const spells       = char.spells || [];
    const _bonusUsed   = bonusActionUsed === true;
    const isDeathSaves = phase === 'death_saves';
    const ds           = char._deathSaves || { success:0, fail:0 };

    // Kill streak display
    const streakHtml = (char._killStreak||0) > 1
      ? `<div class="dnd-streak-counter">🔥 RACHA x${char._killStreak} (+${char._killStreak * 5}% dmg)</div>`
      : '';

    // Elite badge
    const eliteBadge = enemy.isElite ? `<span class="dnd-elite-badge">⭐ ÉLITE</span>` : '';
    // Proc trait badge
    const traitBadge = enemy._procTrait
      ? `<span class="dnd-trait-badge">${enemy._procTrait.icon} ${esc(enemy._procTrait.name)}</span>` : '';

    // ── INITIATIVE TRACKER ──────────────────────────────────────
    const initData = window._dndCombatInitData || null;
    const initHtml = initData ? `
      <div class="dnd-init-tracker">
        <span class="dnd-init-label">⚡ INICIATIVA</span>
        <div class="dnd-init-node ${phase==='player'||phase==='death_saves'?'dnd-init-active':''}">
          <span>${P.getSpriteHtml(char.cls.id, char.cls.icon)}</span>
          <span class="dnd-init-name">${esc(char.name.split(' ')[0])}</span>
          <span class="dnd-init-roll">${initData.playerRoll}</span>
        </div>
        <span class="dnd-init-sep">→</span>
        <div class="dnd-init-node ${phase==='enemy'||phase==='busy'?'dnd-init-active':''}">
          <span>${P.getSpriteHtml(enemy.id, enemy.icon||'👹', enemy.type)}</span>
          <span class="dnd-init-name">${esc(enemy.name.split(' ').slice(0,2).join(' '))}</span>
          <span class="dnd-init-roll">${initData.enemyRoll}</span>
        </div>
      </div>` : '';

    // ── EXTRA ATTACK BADGE ──────────────────────────────────────
    const EXTRA_ATK_CLASSES = ['fighter','barbarian','ranger','paladin','monk'];
    const hasExtraAtk = EXTRA_ATK_CLASSES.includes(char.cls?.id) && char.level >= 5;
    const extraAtkBadge = hasExtraAtk ? `<span class="dnd-extra-atk-badge" title="Ataque extra al nivel 5+">×2</span>` : '';

    // ── BONUS ACTION BUTTONS ────────────────────────────────────
    const isCovered = char.hasCondition('covered');
    let bonusButtons = '';
    if (!_bonusUsed && phase === 'player') {
      const ba = [];
      // Universal: Shove
      ba.push(`<button class="dnd-btn dnd-ba-btn" onclick="root._dndGame.combatAction('bonus_shove')" title="Empujar: Tirada de Fuerza vs enemigo. Éxito = Tumbado (des/ven)">💪 Empujar</button>`);
      // Universal: Take Cover
      if (!isCovered) {
        ba.push(`<button class="dnd-btn dnd-ba-btn" onclick="root._dndGame.combatAction('bonus_cover')" title="Cubierta: +2 CA hasta el próximo turno">🏛️ Cubierta</button>`);
      }
      // Class specific
      const cid = char.cls?.id;
      if (cid === 'rogue') {
        ba.push(`<button class="dnd-btn dnd-ba-btn" onclick="root._dndGame.combatAction('bonus_cunning_hide')" title="Esconderse: Ventaja en tu próximo ataque">👁️ Esconder</button>`);
        ba.push(`<button class="dnd-btn dnd-ba-btn" onclick="root._dndGame.combatAction('bonus_cunning_dash')" title="Correr: intento de huida gratis">🏃 Correr</button>`);
      }
      // Fighter: Second Wind & Action Surge are already in the class abilities row — no duplicate here
      if (cid === 'warlock') {
        const hexActive = char.hasCondition('hex');
        if (!hexActive) ba.push(`<button class="dnd-btn dnd-ba-btn" onclick="root._dndGame.combatAction('bonus_hex')" title="Maldición: +1d6 daño por turno al objetivo">🔮 Maldecir</button>`);
      }
      if (cid === 'ranger') {
        const hmActive = char.hasCondition('hunters_mark');
        if (!hmActive) ba.push(`<button class="dnd-btn dnd-ba-btn" onclick="root._dndGame.combatAction('bonus_hunters_mark')" title="Marca del Cazador: +1d6 daño al objetivo marcado">🎯 Marcar</button>`);
      }
      if (ba.length > 0) {
        bonusButtons = `<div class="dnd-bonus-section">
          <div class="dnd-ba-label">⚡ ACCIÓN BONUS</div>
          <div class="dnd-ba-row">${ba.join('')}</div>
        </div>`;
      }
    }

    return `
      <div id="dnd-combat" class="dnd-screen dnd-active">
        ${buildHUD(char)}
        ${streakHtml}
        ${initHtml}
        <div class="dnd-combat-layout">
          <!-- Combatants -->
          <div class="dnd-combatants">
            <div class="dnd-fighter dnd-player-side">
              <div class="dnd-fighter-name">${esc(char.name)}</div>
              <div class="dnd-fighter-sub">${esc(char.cls.icon)} Nv${char.level} · CA ${char.AC}${isCovered?' 🏛️+2':''}</div>
              <div class="dnd-fighter-icon dnd-player-icon">${P.getSpriteHtml(char.cls.id, char.cls.icon)}</div>
              <div class="dnd-hp-bar-wrap">
                <div class="dnd-hp-bar"><div class="dnd-hp-fill" style="width:${pHpPct}%;background:${pColor}"></div></div>
                <span>${char.hp}/${char.maxHP}${char._concentration?` 🔵${esc(char._concentration.name)}`:''}</span>
              </div>
              <div class="dnd-cond-row">${char.conditions.map(c=>`<span class="dnd-cbadge" style="color:${c.id==='burning'?'#f97316':c.id==='bleeding'?'#ef4444':c.id==='poisoned'?'#a3e635':c.id==='chilled'?'#67e8f9':c.id==='covered'?'#60a5fa':'#e2e8f0'}">${c.icon||'⚡'}${c.name}</span>`).join('')}</div>
              ${isDeathSaves ? `
              <div class="dnd-death-saves">
                <div class="dnd-ds-row">
                  <span>✅ Éxitos:</span>
                  ${[0,1,2].map(i=>`<span class="dnd-ds-dot ${ds.success>i?'success':''}">${ds.success>i?'✅':'○'}</span>`).join('')}
                </div>
                <div class="dnd-ds-row">
                  <span>❌ Fallos:</span>
                  ${[0,1,2].map(i=>`<span class="dnd-ds-dot ${ds.fail>i?'fail':''}">${ds.fail>i?'💀':'○'}</span>`).join('')}
                </div>
              </div>` : ''}
            </div>
            <div class="dnd-vs-center">
              <div id="dnd-dice-anim" class="dnd-dice">🎲</div>
              <div class="dnd-vs-text">VS</div>
            </div>
            <div class="dnd-fighter dnd-enemy-side">
              <div class="dnd-fighter-name">${esc(enemy.name)} ${eliteBadge}</div>
              <div class="dnd-fighter-sub">${esc(enemy.icon||'👹')} CR${enemy.cr||'?'} · CA ${enemy.ac} ${traitBadge}</div>
              <div class="dnd-fighter-icon dnd-enemy-icon">${P.getSpriteHtml(enemy.id, enemy.icon||'👹', enemy.type)}</div>
              <div class="dnd-hp-bar-wrap">
                <div class="dnd-hp-bar"><div class="dnd-hp-fill" style="width:${hpPct}%;background:${phColor}"></div></div>
                <span>${enemy.hp}/${enemy.maxHP}</span>
              </div>
              <div class="dnd-cond-row">${(enemy.conditions||[]).map(c=>`<span class="dnd-cbadge" style="color:${c.id==='burning'?'#f97316':c.id==='bleeding'?'#ef4444':c.id==='poisoned'?'#a3e635':c.id==='chilled'?'#67e8f9':c.id==='prone'?'#a78bfa':c.id==='wet'?'#60a5fa':'#94a3b8'}">${c.icon||''}${c.name}${c.rounds?` (${c.rounds}r)`:''}</span>`).join('')}</div>
            </div>
          </div>

          <!-- Combat log -->
          <div class="dnd-combat-log" id="dnd-combat-log">
            ${combatLog.slice(-12).map((l,i) => `<div class="dnd-log-entry${i===combatLog.slice(-12).length-1?' dnd-log-latest':''}">${esc(l)}</div>`).join('')}
          </div>

          <!-- Actions — death saves OR normal -->
          ${isDeathSaves ? `
          <div class="dnd-combat-actions" id="dnd-actions">
            <p class="dnd-ds-notice">💀 <b>TIRADA DE SALVACIÓN VS MUERTE</b> — 3 éxitos = estabilizado · 3 fallos = muerte</p>
            <button class="dnd-btn dnd-btn-attack" onclick="root._dndGame.combatAction('death_save')">🎲 Tirar d20</button>
          </div>` : `
          <div class="dnd-combat-actions" id="dnd-actions" ${phase!=='player'?'style="pointer-events:none;opacity:.5"':''}>
            <div class="dnd-action-row">
              <button class="dnd-btn dnd-btn-attack" onclick="root._dndGame.combatAction('attack')">⚔️ Atacar${extraAtkBadge}</button>
              ${spells.length > 0 ? `<button class="dnd-btn dnd-btn-spell" onclick="root._dndGame.openSpellMenu()">🔮 Hechizos (${spells.filter(s=>s.cantrip).length > 0 ? spells.length + ' · ' + spells.filter(s=>s.cantrip).length + '✦' : spells.length})</button>` : ''}
            </div>
            ${allAbilities.length > 0 ? `
            <div class="dnd-ability-scroll">
              ${allAbilities.map((ab, idx) => {
                const hasUses   = ab.maxUses === 0 || ab.curUses > 0;
                const isBonus   = ab.bonusAction === true;
                const bonusLock = isBonus && _bonusUsed;
                const disabled  = !hasUses || bonusLock;
                const tag       = isBonus ? '<span class="dnd-bonus-tag">BONUS</span>' : '';
                const usesText  = ab.maxUses > 0 ? ` (${ab.curUses}/${ab.maxUses})` : '';
                return `<button class="dnd-btn dnd-btn-ability${disabled?' dnd-btn-disabled':''}"
                  ${disabled ? 'disabled' : ''}
                  onclick="root._dndGame.combatAction('ability', ${idx})"
                  title="${esc(ab.desc||'')}">
                  ${ab.icon||'✨'} ${esc(ab.name)}${usesText}${tag}
                </button>`;
              }).join('')}
            </div>` : ''}
            ${bonusButtons}
            <div class="dnd-action-row">
              ${char.inventory.filter(i=>i.e==='heal'||i.e==='mana'||i.e==='cure'||i.e==='unknown_potion').slice(0,3).map(item =>
                `<button class="dnd-btn dnd-btn-item" onclick="root._dndGame.combatAction('item', '${item.id}')">${item.icon} ${esc(item.name)} (${item.count||1})</button>`).join('')}
              <button class="dnd-btn dnd-btn-ghost" onclick="root._dndGame.combatAction('flee')">🏃 Huir</button>
              ${char.equipment.weapon?.id === 'vorpal_sword' ? `<button class="dnd-btn dnd-btn-smite" onclick="root._dndGame.combatAction('smite')">⚡ Golpe</button>` : ''}
            </div>
          </div>`}

          ${enemies.length > 1 ? `<div class="dnd-multi-enemy">+${enemies.length-1} enemigos más esperando...</div>` : ''}
        </div>
      </div>`;
  }

  // ── SCREEN: INVENTORY ─────────────────────────────────────────
  function buildInventoryScreen(char) {
    const eqSlots = [
      ['weapon','⚔️','Arma'],['armor','🛡️','Armadura'],['ring','💍','Anillo'],
      ['neck','📿','Amuleto'],['cloak','🧥','Capa'],['feet','👟','Botas'],
      ['hands','🧤','Guantes'],['head','👑','Yelmo'],['belt','🩱','Cinturón'],
      ['trinket','🔮','Trinquete']
    ];
    const inv     = P.InventoryManager.sort(char.inventory);
    const bonuses = P.InventoryManager.getEquipBonuses(char);
    return `
      <div id="dnd-inventory" class="dnd-screen dnd-active">
        ${buildHUD(char)}
        <div class="dnd-inv-layout">
          <div class="dnd-inv-left">
            <h3>⚔️ Equipo</h3>
            <div class="dnd-eq-slots">
              ${eqSlots.map(([slot, icon, label]) => {
                const item = char.equipment[slot];
                return `<div class="dnd-eq-slot ${item?'filled':''}" onclick="root._dndGame.unequip('${slot}')">
                  <div class="dnd-eq-icon">${item ? P.getSpriteHtml(item.id, item.icon) : icon}</div>
                  <div class="dnd-eq-label">${item ? esc(item.name) : label}</div>
                  ${item ? `<div class="dnd-eq-unequip">↩</div>` : ''}
                </div>`;
              }).join('')}
            </div>
            <h3>📊 Stats Derivados</h3>
            <div class="dnd-derived-stats">
              <div>⚔️ Ataque: +${char.attackBonus} (${bonuses.atk?`+${bonuses.atk} equipo`:'base'})</div>
              <div>💥 Daño: +${char.damageBonus} (d${char.damageDice})</div>
              <div>🛡️ CA: ${char.AC}</div>
              <div>❤️ HP: ${char.hp}/${char.maxHP}</div>
              ${char.cls.spellcasting ? `<div>🔮 Hechizo: +${char.spellBonus}</div>` : ''}
            </div>
          </div>
          <div class="dnd-inv-right">
            <h3>🎒 Mochila (${inv.length} objetos)</h3>
            <div class="dnd-inv-filter">
              <button class="dnd-btn dnd-btn-micro" onclick="root._dndGame.sortInv('rarity')">Por rareza</button>
              <button class="dnd-btn dnd-btn-micro" onclick="root._dndGame.sortInv('type')">Por tipo</button>
              <button class="dnd-btn dnd-btn-micro" onclick="root._dndGame.sortInv('name')">Por nombre</button>
            </div>
            <div class="dnd-item-grid">
              ${inv.map(item => {
                const rar = P.RARITY[item.r] || P.RARITY.common;
                const equippable = item.slot && item.e !== 'heal' && item.e !== 'mana' && item.e !== 'cure' && item.e !== 'buff';
                return `<div class="dnd-item-card" style="border-color:${rar.color}"
                  onmouseenter="root._dndGame.showTooltip(this, '${item.id}')"
                  onmouseleave="root._dndGame.hideTooltip()">
                  <div class="dnd-item-icon">${P.getSpriteHtml(item.id, item.icon||'📦')}</div>
                  <div class="dnd-item-name" style="color:${rar.color}">${esc(item.name)}</div>
                  <div class="dnd-item-count">${(item.count||1)>1?'x'+(item.count||1):''}</div>
                  <div class="dnd-item-btns">
                    ${equippable ? `<button class="dnd-btn dnd-btn-micro" onclick="root._dndGame.equipItem('${item.id}')">Equipar</button>` : ''}
                    ${['heal','mana','cure','buff','escape'].includes(item.e) ? `<button class="dnd-btn dnd-btn-micro dnd-use" onclick="root._dndGame.useItem('${item.id}')">Usar</button>` : ''}
                    <button class="dnd-btn dnd-btn-micro dnd-sell" onclick="root._dndGame.sellItem('${item.id}')">Vender (${fmtGold(Math.floor((item.p||5)/2))})</button>
                  </div>
                </div>`;
              }).join('')}
              ${inv.length === 0 ? '<p class="dnd-empty">Tu mochila está vacía.</p>' : ''}
            </div>
          </div>
        </div>
        <div class="dnd-inv-footer">
          <span>💰 Oro: ${fmtGold(char.gold)}</span>
          <button class="dnd-btn dnd-btn-ghost" onclick="root._dndGame.navigate('world')">← Volver</button>
          <button class="dnd-btn dnd-btn-ghost" onclick="root._dndGame.navigate('crafting')">⚒️ Craftear</button>
        </div>
      </div>`;
  }

  // ── SCREEN: MERCHANT ──────────────────────────────────────────
  function buildMerchantScreen(char, merchant, shopItems) {
    const rar = (r) => P.RARITY[r]||P.RARITY.common;
    return `
      <div id="dnd-merchant" class="dnd-screen dnd-active">
        ${buildHUD(char)}
        <div class="dnd-merchant-layout">
          <div class="dnd-merchant-header">
            <div class="dnd-merchant-npc">${P.getSpriteHtml(merchant.id, merchant.icon)} <b>${esc(merchant.name)}</b></div>
            <em class="dnd-merchant-quote">"${esc(merchant.quote)}"</em>
          </div>
          <div class="dnd-shop-grid">
            ${shopItems.map(item => `
              <div class="dnd-shop-item" style="border-color:${rar(item.r).color}">
                <div class="dnd-shop-icon">${item.icon||'📦'}</div>
                <div class="dnd-shop-name" style="color:${rar(item.r).color}">${esc(item.name)}</div>
                <div class="dnd-shop-rar">${rar(item.r).stars}</div>
                <div class="dnd-shop-desc">${esc(item.desc||'')}</div>
                <div class="dnd-shop-price">${fmtGold(item.sellPrice)}</div>
                <div class="dnd-shop-stock">Stock: ${item.stock||1}</div>
                <button class="dnd-btn dnd-btn-primary ${char.gold < item.sellPrice?'disabled':''}"
                  onclick="root._dndGame.buyItem('${item.id}')"
                  ${char.gold < item.sellPrice?'disabled':''}>Comprar</button>
              </div>`).join('')}
            ${shopItems.length===0?'<p>Sin stock.</p>':''}
          </div>
          <div class="dnd-merchant-sell">
            <h4>Vender objetos</h4>
            ${char.inventory.slice(0,8).map(item => `
              <div class="dnd-sell-row">
                <span>${P.getSpriteHtml(item.id, item.icon)} ${esc(item.name)} (x${item.count||1})</span>
                <button class="dnd-btn dnd-btn-micro" onclick="root._dndGame.sellItem('${item.id}')">Vender ${fmtGold(Math.floor((item.p||5)/2))}</button>
              </div>`).join('')}
          </div>
        </div>
        <div class="dnd-merchant-footer">
          <span>💰 Tienes: ${fmtGold(char.gold)}</span>
          <button class="dnd-btn dnd-btn-ghost" onclick="root._dndGame.navigate('world')">← Volver</button>
        </div>
      </div>`;
  }

  // ── SCREEN: QUESTS ────────────────────────────────────────────
  function buildQuestScreen(char) {
    const active = P.QuestTracker.getActive(char);
    const done   = P.QuestTracker.getCompleted(char);
    const avail  = P.QUESTS.filter(q => !q.secret && !char.quests.find(cq => cq.id===q.id));
    const GIVER_MAP = {
      'q_goblin_king': 'brennan',
      'q_missing_daughter': 'mara',
      'q_ancient_tome': 'seldris',
      'q_drow_spy': 'theron',
      'q_debug_room': 'mysterious_figure'
    };
    return `
      <div id="dnd-quests" class="dnd-screen dnd-active">
        ${buildHUD(char)}
        <div class="dnd-quest-layout">
          <h2>📜 Misiones</h2>
          ${active.length > 0 ? `<h3>🗡️ Activas (${active.length})</h3>
          ${active.map(q => {
            const npcId = GIVER_MAP[q.id];
            const qIcon = npcId ? P.getSpriteHtml(npcId, q.icon) : `<span>${q.icon}</span>`;
            return `<div class="dnd-quest-card active">
              <div class="dnd-qcard-header"><span class="dnd-q-icon">${qIcon}</span><b>${esc(q.title)}</b><span class="dnd-q-giver">— ${esc(q.giver)}</span></div>
              <p class="dnd-q-desc">${esc(q.desc)}</p>
              <div class="dnd-q-objectives">
                ${q.objectives.map(o=>`<div class="dnd-obj ${o.done?'done':''}">
                  ${o.done?'✅':'⬜'} ${esc(o.text)} <small>${P.QuestTracker.progressText(o)}</small>
                </div>`).join('')}
              </div>
              <div class="dnd-q-reward">🎁 Recompensa: ${fmtGold(q.reward?.gold||0)} oro · ${q.reward?.xp||0} XP ${q.reward?.items?`· ${q.reward.items.length} objeto(s)`:''}</div>
            </div>`;
          }).join('')}` : '<p>Sin misiones activas.</p>'}
          ${avail.length > 0 ? `<h3>🏴 Disponibles</h3>
          ${avail.map(q => {
            const npcId = GIVER_MAP[q.id];
            const qIcon = npcId ? P.getSpriteHtml(npcId, q.icon) : `<span>${q.icon}</span>`;
            return `<div class="dnd-quest-card available">
              <div class="dnd-qcard-header"><span class="dnd-q-icon">${qIcon}</span><b>${esc(q.title)}</b></div>
              <p class="dnd-q-desc">${esc(q.desc)}</p>
              <button class="dnd-btn dnd-btn-primary" onclick="root._dndGame.acceptQuest('${q.id}')">Aceptar Misión</button>
            </div>`;
          }).join('')}` : ''}
          ${done.length > 0 ? `<h3>✅ Completadas (${done.length})</h3>
          ${done.map(q => {
            const npcId = GIVER_MAP[q.id];
            const qIcon = npcId ? P.getSpriteHtml(npcId, q.icon) : `<span>${q.icon}</span>`;
            return `<div class="dnd-quest-card done"><span class="dnd-q-icon">${qIcon}</span> ${esc(q.title)}</div>`;
          }).join('')}` : ''}
        </div>
        <button class="dnd-btn dnd-btn-ghost dnd-back-btn" onclick="root._dndGame.navigate('world')">← Volver</button>
      </div>`;
  }

  // ── SCREEN: LORE / CODEX ─────────────────────────────────────
  function buildLoreScreen(char) {
    const allLore  = P.LORE.filter(l => !l.locked || (char && char.loreFound?.includes(l.id)));
    const worldTab = allLore.filter(l => l.tab === 'world');
    const secretTab= allLore.filter(l => l.tab === 'secret');
    const locked   = P.LORE.filter(l => l.locked && !(char && char.loreFound?.includes(l.id)));
    return `
      <div id="dnd-lore" class="dnd-screen dnd-active">
        ${char ? buildHUD(char) : ''}
        <div class="dnd-lore-layout">
          <h2>📖 Codex del Mundo</h2>
          <div class="dnd-lore-tabs">
            <button class="dnd-tab active" onclick="root._dndGame.loreTab('world', this)">🌍 Mundo</button>
            <button class="dnd-tab" onclick="root._dndGame.loreTab('secret', this)">🔮 Secretos (${secretTab.length}/${P.LORE.filter(l=>l.tab==='secret').length})</button>
          </div>
          <div class="dnd-lore-world dnd-lore-panel">
            ${worldTab.map(l => `<div class="dnd-lore-entry">
              <h3>${l.icon} ${esc(l.title)}</h3>
              <p>${esc(l.text)}</p>
            </div>`).join('')}
            ${locked.filter(l=>l.tab==='world').map(l => `<div class="dnd-lore-entry locked">
              <h3>🔒 ???</h3><p>Sigue explorando para desbloquear.</p>
            </div>`).join('')}
          </div>
          <div class="dnd-lore-secret dnd-lore-panel" style="display:none">
            ${secretTab.map(l => `<div class="dnd-lore-entry secret">
              <h3>${l.icon} ${esc(l.title)}</h3>
              <pre class="dnd-lore-pre">${esc(l.text)}</pre>
            </div>`).join('')}
            ${secretTab.length===0?'<p class="dnd-lore-hint">No has descubierto secretos aún. Explora y presta atención.</p>':''}
            ${locked.filter(l=>l.tab==='secret').map(()=>`<div class="dnd-lore-entry locked"><h3>🔒 [CLASSIFIED]</h3></div>`).join('')}
          </div>
        </div>
        <button class="dnd-btn dnd-btn-ghost dnd-back-btn" onclick="root._dndGame.navigate(${char?`'world'`:`'intro'`})">← Volver</button>
      </div>`;
  }

  // ── SCREEN: CHARACTER SHEET (DnD style) ──────────────────────
  function buildCharacterSheet(char) {
    const modStr = P.utils.modStr;
    const statLabels = { str:'Fuerza', dex:'Destreza', con:'Constitución', int:'Inteligencia', wis:'Sabiduría', cha:'Carisma' };
    const stats = ['str','dex','con','int','wis','cha'];
    // Saving throws — proficiency if in cls.savingThrows
    const svProf = char.cls.savingThrows || [];
    // Skills (DnD 5e standard, mapped to ability)
    const SKILLS = [
      {name:'Acrobacias',       stat:'dex'}, {name:'Atletismo',       stat:'str'},
      {name:'Arcanos',          stat:'int'}, {name:'Engaño',          stat:'cha'},
      {name:'Historia',         stat:'int'}, {name:'Intimidación',    stat:'cha'},
      {name:'Intuición',        stat:'wis'}, {name:'Investigación',   stat:'int'},
      {name:'Juego de Manos',   stat:'dex'}, {name:'Medicina',        stat:'wis'},
      {name:'Naturaleza',       stat:'int'}, {name:'Percepción',      stat:'wis'},
      {name:'Persuasión',       stat:'cha'}, {name:'Religión',        stat:'int'},
      {name:'Sigilo',           stat:'dex'}, {name:'Supervivencia',   stat:'wis'},
      {name:'Trato con Animales',stat:'wis'},{name:'Actuación',       stat:'cha'},
    ];
    const classProf = char.cls.skillProficiencies || [];
    const hpPct = Math.round(char.hp / char.maxHP * 100);
    const hpColor = hpPct > 60 ? '#22c55e' : hpPct > 30 ? '#f59e0b' : '#ef4444';

    return `
      <div id="dnd-charsheet" class="dnd-screen dnd-active">
        ${buildHUD(char)}
        <div class="dnd-cs-layout">

          <!-- ── TOP HEADER ──────────────────────────────── -->
          <div class="dnd-cs-header">
            <div class="dnd-cs-identity">
              <div class="dnd-cs-portrait">${esc(char.cls.icon)} ${esc(char.race.icon)}</div>
              <div class="dnd-cs-id-info">
                <div class="dnd-cs-name">${esc(char.name)}</div>
                <div class="dnd-cs-subtitle">${esc(char.cls.name)} · ${esc(char.race.name)} · Nivel ${char.level}</div>
                <div class="dnd-cs-subtitle">Competencia +${char.prof} · XP ${char.xp}</div>
                ${char._inspiration ? '<span class="dnd-cs-inspi">✨ INSPIRACIÓN</span>' : ''}
                ${char._zoneBoon  ? `<span class="dnd-cs-boon">🌟 ${esc(char._zoneBoon.name)}</span>` : ''}
                ${char._zoneBane  ? `<span class="dnd-cs-bane">☠️ ${esc(char._zoneBane.name)}</span>` : ''}
              </div>
            </div>
            <div class="dnd-cs-derived">
              <div class="dnd-cs-derived-box">
                <div class="dnd-cs-d-val">${char.AC}</div>
                <div class="dnd-cs-d-lbl">CA</div>
              </div>
              <div class="dnd-cs-derived-box">
                <div class="dnd-cs-d-val">${char.getMod('dex') + char.level + (char._alertBonus||0)}</div>
                <div class="dnd-cs-d-lbl">Init</div>
              </div>
              <div class="dnd-cs-derived-box">
                <div class="dnd-cs-d-val" style="color:${hpColor}">${char.hp}/${char.maxHP}</div>
                <div class="dnd-cs-d-lbl">HP</div>
              </div>
              <div class="dnd-cs-derived-box">
                <div class="dnd-cs-d-val">+${char.attackBonus}</div>
                <div class="dnd-cs-d-lbl">Ataque</div>
              </div>
              <div class="dnd-cs-derived-box">
                <div class="dnd-cs-d-val">💰${P.utils.fmtGold(char.gold)}</div>
                <div class="dnd-cs-d-lbl">Oro</div>
              </div>
            </div>
          </div>

          <!-- ── MAIN 3-COLUMN GRID ─────────────────────── -->
          <div class="dnd-cs-grid">

            <!-- COL 1: Stats + Saves ──────────────────── -->
            <div class="dnd-cs-col">
              <div class="dnd-cs-section">
                <div class="dnd-cs-section-title">ESTADÍSTICAS</div>
                ${stats.map(s => {
                  const val  = char.getStat(s);
                  const mval = char.getMod(s);
                  const mstr = mval >= 0 ? '+'+mval : String(mval);
                  const color= val >= 16 ? '#22c55e' : val >= 12 ? '#fbbf24' : val >= 8 ? '#9ca3af' : '#ef4444';
                  return `<div class="dnd-cs-stat-row">
                    <div class="dnd-cs-stat-box" style="border-color:${color}">
                      <div class="dnd-cs-stat-mod">${mstr}</div>
                      <div class="dnd-cs-stat-val">${val}</div>
                    </div>
                    <div class="dnd-cs-stat-name">${esc(statLabels[s])}</div>
                  </div>`;
                }).join('')}
              </div>

              <div class="dnd-cs-section">
                <div class="dnd-cs-section-title">TIRADAS DE SALVACIÓN</div>
                ${stats.map(s => {
                  const prof = svProf.includes(s);
                  const bonus= char.getMod(s) + (prof ? char.prof : 0);
                  const bstr = bonus >= 0 ? '+'+bonus : String(bonus);
                  return `<div class="dnd-cs-sv-row">
                    <span class="dnd-cs-sv-dot ${prof?'filled':''}"></span>
                    <span class="dnd-cs-sv-val">${bstr}</span>
                    <span class="dnd-cs-sv-name">${esc(statLabels[s])}</span>
                  </div>`;
                }).join('')}
              </div>

              <div class="dnd-cs-section">
                <div class="dnd-cs-section-title">PERCEPCIÓN PASIVA</div>
                <div class="dnd-cs-passive">${10 + char.getMod('wis') + (classProf.includes('perception') ? char.prof : 0)}</div>
              </div>
            </div>

            <!-- COL 2: Skills + Combat ───────────────── -->
            <div class="dnd-cs-col">
              <div class="dnd-cs-section">
                <div class="dnd-cs-section-title">HABILIDADES</div>
                <div class="dnd-cs-skills-list">
                  ${SKILLS.map(sk => {
                    const prof = classProf.includes(sk.name.toLowerCase().replace(/ /g,'_'));
                    const bonus= char.getMod(sk.stat) + (prof ? char.prof : 0);
                    const bstr = bonus >= 0 ? '+'+bonus : String(bonus);
                    return `<div class="dnd-cs-skill-row">
                      <span class="dnd-cs-sv-dot ${prof?'filled':''}"></span>
                      <span class="dnd-cs-skill-val">${bstr}</span>
                      <span class="dnd-cs-skill-name">${esc(sk.name)}</span>
                      <span class="dnd-cs-skill-stat">${sk.stat.toUpperCase()}</span>
                    </div>`;
                  }).join('')}
                </div>
              </div>
            </div>

            <!-- COL 3: Equipment + Abilities + Traits ── -->
            <div class="dnd-cs-col">
              <div class="dnd-cs-section">
                <div class="dnd-cs-section-title">EQUIPAMIENTO</div>
                ${['weapon','armor','ring','neck','cloak','head','hands','feet','belt','trinket'].map(slot => {
                  const item = char.equipment[slot];
                  const slotLabels = {weapon:'⚔️ Arma',armor:'🛡️ Armadura',ring:'💍 Anillo',neck:'📿 Collar',cloak:'🧥 Capa',head:'⛑️ Cabeza',hands:'🧤 Manos',feet:'👢 Pies',belt:'🎽 Cinturón',trinket:'🔮 Trinket'};
                  return `<div class="dnd-cs-equip-row ${item?.cursed?'cursed':''}">
                    <span class="dnd-cs-equip-slot">${slotLabels[slot]||slot}</span>
                    <span class="dnd-cs-equip-item">${item ? esc(item.icon+' '+item.name+(item.cursed?'🔒':'')) : '—'}</span>
                  </div>`;
                }).join('')}
              </div>

              <div class="dnd-cs-section">
                <div class="dnd-cs-section-title">HABILIDADES DE CLASE</div>
                ${(char.abilities||[]).map(a => `
                  <div class="dnd-cs-ability-row">
                    <span>${a.icon||'⚡'} ${esc(a.name)}</span>
                    <span class="dnd-cs-ab-uses">${a.maxUses>0?a.curUses+'/'+a.maxUses:'∞'}</span>
                  </div>`).join('') || '<p class="dnd-cs-empty">Sin habilidades</p>'}
              </div>

              ${char.spells?.length ? `
              <div class="dnd-cs-section">
                <div class="dnd-cs-section-title">HECHIZOS CONOCIDOS</div>
                ${char.spells.map(sp => `<div class="dnd-cs-spell-row">${sp.icon||'🔮'} ${esc(sp.name)}</div>`).join('')}
              </div>` : ''}

              <div class="dnd-cs-section">
                <div class="dnd-cs-section-title">RASGOS Y TALENTOS</div>
                ${(char._feats||[]).length === 0 ? '<p class="dnd-cs-empty">Sin talentos. Disponibles al nivel 4/8/12.</p>'
                  : (char._feats||[]).map(fid => {
                    const feat = (P.FEATS||[]).find(f=>f.id===fid);
                    return feat ? `<div class="dnd-cs-feat-row">${feat.icon} ${esc(feat.name)} <span class="dnd-cs-feat-desc">${esc(feat.desc)}</span></div>` : '';
                  }).join('')}
                <div class="dnd-cs-trait-row">
                  <b>Raza:</b> ${esc(char.race.name)} — ${esc((char.race.traits||[]).join(', '))}
                </div>
                <div class="dnd-cs-trait-row">
                  <b>Clase:</b> ${esc(char.cls.name)} — Dado de Vida d${char.cls.hd}
                </div>
              </div>

              ${(char.conditions||[]).length ? `
              <div class="dnd-cs-section">
                <div class="dnd-cs-section-title">CONDICIONES ACTIVAS</div>
                ${char.conditions.map(c => `<div class="dnd-cs-cond-row">${c.icon||'⚡'} ${esc(c.name)} ${c.rounds?'('+c.rounds+' rounds)':''}</div>`).join('')}
              </div>` : ''}
            </div>
          </div><!-- end grid -->
        </div><!-- end layout -->

        <div class="dnd-cs-footer">
          <button class="dnd-btn dnd-btn-ghost" onclick="root._dndGame.navigate('world')">← Volver al Mapa</button>
          <button class="dnd-btn dnd-btn-ghost" onclick="root._dndGame.navigate('inventory')">🎒 Inventario</button>
          <button class="dnd-btn dnd-btn-ghost" onclick="root._dndGame.navigate('stats')">📊 Estadísticas</button>
        </div>
      </div>`;
  }

  root._dndParts.buildCharacterSheet = buildCharacterSheet;

  // ── SCREEN: GAME OVER ─────────────────────────────────────────
  function getRunRank(score) {
    if (score >= 6000) return { rank:'S+', color:'#f59e0b', title:'Legendario' };
    if (score >= 3500) return { rank:'S',  color:'#a78bfa', title:'Héroe' };
    if (score >= 2000) return { rank:'A',  color:'#22c55e', title:'Veterano' };
    if (score >= 1000) return { rank:'B',  color:'#06b6d4', title:'Aventurero' };
    if (score >= 400)  return { rank:'C',  color:'#9ca3af', title:'Aprendiz' };
    return               { rank:'D',  color:'#ef4444', title:'Novato' };
  }

  function buildGameOverScreen(char, killMsg) {
    const score    = P.Storage.calcScore(char);
    const rankInfo = getRunRank(score);
    const minutes  = Math.round((Date.now() - char.startTime) / 60000);
    return `
      <div id="dnd-gameover" class="dnd-screen dnd-active">
        <div class="dnd-go-bg"></div>
        <div class="dnd-go-content">
          <div class="dnd-go-skull">💀</div>
          <h1 class="dnd-go-title">${char.permadeath ? 'PERMADEATH' : 'HAS CAÍDO'}</h1>
          <p class="dnd-go-cause">${esc(killMsg || 'Las heridas fueron demasiado.')}</p>
          <div class="dnd-go-rank" style="border-color:${rankInfo.color}">
            <span class="dnd-go-rank-letter" style="color:${rankInfo.color}">${rankInfo.rank}</span>
            <span class="dnd-go-rank-title">${rankInfo.title}</span>
          </div>
          <div class="dnd-go-stats">
            <div class="dnd-go-stat"><span>Nivel alcanzado</span><b>${char.level}</b></div>
            <div class="dnd-go-stat"><span>Enemigos derrotados</span><b>${char.stats.kills}</b></div>
            <div class="dnd-go-stat"><span>Racha máxima</span><b>🔥 x${char.stats.maxStreak||0}</b></div>
            <div class="dnd-go-stat"><span>Críticos</span><b>${char.stats.crits}</b></div>
            <div class="dnd-go-stat"><span>Mayor golpe</span><b>${char.stats.highestDmg}</b></div>
            <div class="dnd-go-stat"><span>Misiones completadas</span><b>${char.stats.questsDone}</b></div>
            <div class="dnd-go-stat"><span>Oro acumulado</span><b>💰${char.stats.goldEarned}</b></div>
            <div class="dnd-go-stat"><span>Tiempo</span><b>⏱️ ${minutes} min</b></div>
            <div class="dnd-go-stat dnd-go-score"><span>PUNTUACIÓN TOTAL</span><b>${score}</b></div>
          </div>
          ${(char._achievements||[]).length ? `
          <div class="dnd-go-ach">
            <div class="dnd-go-ach-title">🏆 Logros esta partida</div>
            <div class="dnd-go-ach-list">
              ${char._achievements.map(id => {
                const a = (P.ACHIEVEMENTS||[]).find(x=>x.id===id);
                return a ? `<span class="dnd-go-ach-badge">${a.icon} ${esc(a.name)}</span>` : '';
              }).join('')}
            </div>
          </div>` : ''}
          <div class="dnd-go-btns">
            <button class="dnd-btn dnd-btn-primary" onclick="root._dndGame.navigate('char-create')">⚔️ Nueva Partida</button>
            ${!char.permadeath && P.SaveSystem.hasSave() ? `<button class="dnd-btn dnd-btn-secondary" onclick="root._dndGame.loadGame()">💾 Cargar guardado</button>` : ''}
            <button class="dnd-btn dnd-btn-ghost" onclick="root._dndGame.close()">✖ Salir</button>
          </div>
          <div class="dnd-go-epitaph">"${esc(pick([
            'No fue la fuerza lo que te venció. Fue el orgullo.',
            'El camino continúa. Tú, no.',
            'Alguien contará esta historia. Omitirá los detalles vergonzosos.',
            'Incluso en la derrota hay algo aprendido. Quizás.',
            'El dragón toma nota de los que llegaron.'
          ]))}"</div>
        </div>
      </div>`;
  }

  // ── SCREEN: DEVELOPER ROOM ────────────────────────────────────
  function buildDevRoomScreen(char) {
    return `
      <div id="dnd-devroom" class="dnd-screen dnd-active">
        <div class="dnd-dev-layout">
          <div class="dnd-dev-terminal">
            <div class="dnd-dev-header">
              <span class="dnd-dev-blink">█</span>
              KATOSX_SYSTEM v2.0 — DEVELOPER TERMINAL
              <span class="dnd-dev-blink">█</span>
            </div>
            <div class="dnd-dev-output" id="dnd-dev-output">
> Sistema inicializado.
> Acceso concedido: Sala de Debug
> Cargando fragmentos de memoria...
> 
> REGISTRO DE ACTIVIDAD:
> — Easter Egg creado: ${new Date().toLocaleDateString('es-AR')}
> — Creador: Daniel Salini (Katosx)
> — Propósito: "Porque el 20% extra es lo que te recuerdan."
>
> SECRETOS ENCONTRADOS:
${char ? (char.loreFound.map(id => `> — [LORE] ${id}`).join('\n') || '> — Ninguno todavía.') : '> — Cargando...'}
>
> FRAGMENTOS DE CÓDIGO: ${char ? (char.countItem?.('fragment_of_code') || 0) : 0}/4
>
> CONSOLA: escribe 'dnd.secret()' para más.
>
> ██████████████████████████████████████████
> "Este no es solo un portfolio. Es un mundo."
> ██████████████████████████████████████████
            </div>
            <div class="dnd-dev-input-row">
              <span class="dnd-dev-prompt">></span>
              <input id="dnd-dev-input" class="dnd-dev-input" type="text" placeholder="comando..."
                onkeydown="if(event.key==='Enter') root._dndGame.devCommand(this.value)">
            </div>
          </div>
        </div>
        <button class="dnd-btn dnd-btn-ghost dnd-back-btn" onclick="root._dndGame.navigate('world')">← Volver</button>
      </div>`;
  }

  // ── SCREEN: VICTORY ───────────────────────────────────────────
  function buildVictoryScreen(char) {
    const score = P.Storage.calcScore(char);
    P.Storage.unlock('true_ending');
    return `
      <div id="dnd-victory" class="dnd-screen dnd-active dnd-victory-screen">
        <div class="dnd-vic-content">
          <div class="dnd-vic-crown">👑</div>
          <h1 class="dnd-vic-title">¡VICTORIA!</h1>
          <p class="dnd-vic-subtitle">El dragón ha caído. La profecía se cumplió.</p>
          <div class="dnd-vic-quote">
            <em>"${esc(char.name)} llegó cuando nadie más llegó.<br>
            Venció cuando nadie más venció.<br>
            Y el mundo recordó."</em>
          </div>
          <div class="dnd-vic-stats">
            <div>⏱️ Tiempo: ${Math.round((Date.now()-char.startTime)/60000)} min</div>
            <div>⭐ Nivel Final: ${char.level}</div>
            <div>💀 Muertes: ${char.deathCount}</div>
            <div class="dnd-vic-score">🏆 PUNTUACIÓN: ${score}</div>
          </div>
          <div class="dnd-vic-secret">
            <p>¿Quieres el verdadero final? Abre la consola y escribe: <code>dnd.secret()</code></p>
          </div>
          <button class="dnd-btn dnd-btn-primary" onclick="root._dndGame.close()">✦ Fin de la Aventura</button>
        </div>
      </div>`;
  }

  // ── LEVEL UP OVERLAY ─────────────────────────────────────────
  const SUBCLASSES = {
    fighter: [
      { id: 'champion', name: 'Campeón', desc: 'Críticos en 19-20 y +1 CA pasiva.', trait: { name: 'Crítico Mejorado', desc: 'Tus ataques con armas logran un golpe crítico con resultado 19-20.' } },
      { id: 'battlemaster', name: 'Maestro de Batalla', desc: 'Ganas +1d8 de daño en tus ataques.', trait: { name: 'Superioridad Táctica', desc: 'Tus golpes causan +2 daño pasivo.' } }
    ],
    wizard: [
      { id: 'evoker', name: 'Evocador', desc: 'Tus conjuros de daño causan +INT mod.', trait: { name: 'Evocación Potenciada', desc: 'Suma tu modificador de Inteligencia al daño de tus hechizos.' } },
      { id: 'necromancer', name: 'Nigromante', desc: 'Te curas HP igual al nivel del enemigo derrotado.', trait: { name: 'Cosecha Impía', desc: 'Te curas HP al derrotar enemigos.' } }
    ],
    rogue: [
      { id: 'assassin', name: 'Asesino', desc: 'Ventaja en ataques en el primer turno y críticos automáticos en emboscadas.', trait: { name: 'Asesinar', desc: 'Ganas ventaja de ataque en el primer turno de combate.' } },
      { id: 'thief', name: 'Ladrón', desc: 'Usa consumibles como acción de bonus y +15% de evasión.', trait: { name: 'Manos Rápidas', desc: 'Usa pociones como acción bonus y ganas +15% de evasión.' } }
    ],
    cleric: [
      { id: 'life', name: 'Dominio de la Vida', desc: 'Tus hechizos de curación restauran +3 HP adicionales.', trait: { name: 'Discípulo de la Vida', desc: 'Curaciones restauran +3 HP adicionales.' } },
      { id: 'tempest', name: 'Dominio de la Tempestad', desc: 'Daño máximo en hechizos de rayo o trueno.', trait: { name: 'Ira de la Tormenta', desc: 'Ataques eléctricos causan daño máximo.' } }
    ],
    barbarian: [
      { id: 'totem', name: 'Senda del Tótem', desc: 'Resistencia a todos los daños (excepto psíquico) en Furia.', trait: { name: 'Tótem del Oso', desc: 'Resistencia a daños en Furia.' } },
      { id: 'berserker', name: 'Senda del Berserker', desc: 'Ataque cuerpo a cuerpo adicional como acción de bonus en Furia.', trait: { name: 'Frenesí', desc: 'Ataque extra como acción de bonus en Furia.' } }
    ],
    paladin: [
      { id: 'devotion', name: 'Juramento de Devoción', desc: 'Inmune a ser Aterrado y añades tu CHA mod al ataque.', trait: { name: 'Aura de Devoción', desc: 'Inmune a miedo y añades CHA mod a tiradas de ataque.' } },
      { id: 'vengeance', name: 'Juramento de Venganza', desc: 'Ventaja de ataque contra el objetivo principal.', trait: { name: 'Voto de Encono', desc: 'Ganas ventaja en tus ataques contra tu objetivo.' } }
    ],
    ranger: [
      { id: 'hunter', name: 'Cazador', desc: '+1d8 de daño a enemigos ya heridos.', trait: { name: 'Cazador de Gigantes', desc: 'Causas +1d8 daño a objetivos dañados.' } },
      { id: 'beastmaster', name: 'Señor de las Bestias', desc: 'Lobo de combate ataca por 1d6 daño automáticamente por turno.', trait: { name: 'Compañero Animal', desc: 'Lobo aliado ataca por 1d6 daño por turno.' } }
    ],
    bard: [
      { id: 'valor', name: 'Colegio del Valor', desc: '+2 CA o +2 daño en combate por Inspiración.', trait: { name: 'Inspiración de Combate', desc: 'Inspiración otorga +2 CA o +2 daño.' } },
      { id: 'lore', name: 'Colegio del Saber', desc: 'Ganas 2 ranuras de hechizo de cualquier lista.', trait: { name: 'Secretos Mágicos Adicionales', desc: 'Dos hechizos extra disponibles.' } }
    ],
    monk: [
      { id: 'openhand', name: 'Mano Abierta', desc: 'Tus ataques desarmados pueden derribar o empujar.', trait: { name: 'Técnica de la Mano Abierta', desc: 'Probabilidad de derribar o empujar enemigos.' } },
      { id: 'shadow', name: 'Vía de la Sombra', desc: 'Ventaja al atacar en oscuridad y te vuelves invisible.', trait: { name: 'Paso de las Sombras', desc: 'Ventaja en oscuridad e invisibilidad.' } }
    ],
    sorcerer: [
      { id: 'draconic', name: 'Linaje Dracónico', desc: 'CA base sin armadura es 13 + DEX mod y +1 HP por nivel.', trait: { name: 'Resiliencia Dracónica', desc: 'CA base es 13 + DEX mod y +1 HP por nivel.' } },
      { id: 'wildmagic', name: 'Magia Salvaje', desc: 'Ventaja en cualquier tirada (1/combate) pero causa ola de magia salvaje.', trait: { name: 'Mareas del Caos', desc: 'Ganas ventaja pero arriesgas olas de magia salvaje.' } }
    ],
    warlock: [
      { id: 'fiend', name: 'El Fiend', desc: 'Ganas HP temporales al derrotar a un enemigo.', trait: { name: 'Bendición del Oscuro', desc: 'HP temporales al matar enemigos.' } },
      { id: 'archfey', name: 'El Archihada', desc: 'Te vuelves invisible al recibir daño (1/combate).', trait: { name: 'Escape de Bruma', desc: 'Te vuelves invisible tras recibir daño.' } }
    ],
    druid: [
      { id: 'moon', name: 'Círculo de la Luna', desc: 'Te transformas en Oso Pardo en combate (+30 HP y ataque 1d12).', trait: { name: 'Forma de Combate', desc: 'Forma de Oso Pardo (+30 HP, 1d12 daño) en combate.' } },
      { id: 'land', name: 'Círculo de la Tierra', desc: 'Recuperas 1 uso de habilidad por descanso e inmunidad a veneno.', trait: { name: 'Recuperación Natural', desc: 'Recupera habilidad en descanso corto e inmunidad a veneno.' } }
    ]
  };

  const DRAFT_PERKS = [
    { id: 'peleador_feroz', name: '⚔️ Peleador Feroz', desc: '+2 daño con ataques cuerpo a cuerpo.' },
    { id: 'ojo_de_halcon', name: '🎯 Ojo de Halcón', desc: '+2 a las tiradas de ataque.' },
    { id: 'piel_de_acero', name: '🛡️ Piel de Acero', desc: '+1 Clase de Armadura (CA).' },
    { id: 'vigor_sagrado', name: '❤️ Vigor Sagrado', desc: '+15 HP máximos de forma permanente.' },
    { id: 'ataque_critico_mejorado', name: '💥 Crítico Mejorado', desc: 'Rango de golpe crítico aumenta en 1 (ej. crit en 19-20).' },
    { id: 'mente_rapida', name: '⚡ Mente Rápida', desc: '+2 a la Iniciativa.' },
    { id: 'bolsillos_llenos', name: '🪙 Bolsillos Llenos', desc: '+25% de oro obtenido de enemigos.' },
    { id: 'drenaje_de_sangre', name: '🩸 Drenaje de Sangre', desc: 'Te curas 2 HP cada vez que golpeas a un enemigo.' },
    { id: 'escudo_arcano', name: '🔵 Escudo Arcano', desc: 'Ganas 10 HP temporales al inicio de cada combate.' },
    { id: 'paso_veloz', name: '🦶 Paso Veloz', desc: '+10% de probabilidad de evadir ataques físicos.' }
  ];

  function buildSubclassScreen(char) {
    const list = SUBCLASSES[char.cls.id] || [];
    return `
      <div id="dnd-subclass-choice" class="dnd-screen dnd-active">
        ${buildHUD(char)}
        <div class="dnd-levelup-box" style="margin-top: 40px;">
          <div class="lu-rune">⚔️</div>
          <h2 style="font-family: var(--ff-title); color: var(--dnd-gold);">ELEGIR SUBCLASE</h2>
          <p>Has alcanzado el Nivel 3. Es hora de especializarte.</p>
          <div class="dnd-class-grid" style="display:flex; justify-content:center; gap:16px; margin:20px 0;">
            ${list.map(s => `
              <button class="dnd-class-card" style="width:220px; padding:16px; text-align:center;" onclick="root._dndGame.chooseSubclass('${s.id}')">
                <div class="dnd-class-icon">✦</div>
                <div class="dnd-class-name" style="font-size:1.1rem; color:var(--dnd-gold); margin-bottom:8px;">${esc(s.name)}</div>
                <div style="font-size:0.75rem; color:var(--dnd-text2);">${esc(s.desc)}</div>
              </button>
            `).join('')}
          </div>
        </div>
      </div>`;
  }

  function buildDraftScreen(char) {
    // Pick 3 random perks
    const shuffled = [...DRAFT_PERKS].sort(() => 0.5 - Math.random());
    const choices = shuffled.slice(0, 3);
    return `
      <div id="dnd-draft-choice" class="dnd-screen dnd-active">
        ${buildHUD(char)}
        <div class="dnd-levelup-box" style="margin-top: 40px;">
          <div class="lu-rune">🌟</div>
          <h2 style="font-family: var(--ff-title); color: var(--dnd-gold);">ADQUIRIR RASGO</h2>
          <p>Elige una de las cartas para fortalecer tu personaje.</p>
          <div style="display:flex; justify-content:center; gap:16px; margin:20px 0; flex-wrap:wrap;">
            ${choices.map(c => `
              <button class="dnd-race-card" style="width:180px; padding:16px; min-height:160px; display:flex; flex-direction:column; justify-content:space-between;" onclick="root._dndGame.chooseDraft('${c.id}')">
                <div>
                  <div style="font-size:1.1rem; color:var(--dnd-gold); margin-bottom:10px;">${esc(c.name)}</div>
                  <div style="font-size:0.72rem; color:var(--dnd-text2); line-height:1.4;">${esc(c.desc)}</div>
                </div>
                <div style="font-size:0.6rem; color:var(--dnd-border); text-transform:uppercase; letter-spacing:1px; margin-top:10px;">✦ Seleccionar</div>
              </button>
            `).join('')}
          </div>
        </div>
      </div>`;
  }

  root._dndParts.SUBCLASSES = SUBCLASSES;
  root._dndParts.DRAFT_PERKS = DRAFT_PERKS;
  root._dndParts.buildSubclassScreen = buildSubclassScreen;
  root._dndParts.buildDraftScreen = buildDraftScreen;

  function buildLevelUpOverlay(char, newLevel) {
    const newAbility = char._newAbilityUnlocked;
    char._newAbilityUnlocked = null; // consume it
    return `
      <div class="dnd-levelup-overlay">
        <div class="dnd-levelup-inner">
          <div class="dnd-lu-stars">✦ ✦ ✦</div>
          <h2>¡NIVEL ${newLevel}!</h2>
          <p>${esc(char.name)} ha alcanzado el nivel ${newLevel}.</p>
          <p>Proficiencia: +${char.prof} · HP Máx: ${char.maxHP}</p>
          ${newAbility ? `
          <div style="margin:12px 0;padding:10px;border:1px solid var(--dnd-purple);border-radius:8px;background:rgba(139,92,246,0.1);">
            <div style="color:var(--dnd-gold);font-size:0.8rem;letter-spacing:1px;">✦ NUEVA HABILIDAD DESBLOQUEADA</div>
            <div style="font-size:1.1rem;margin:4px 0">${newAbility.icon||'✨'} ${esc(newAbility.name)}</div>
            <div style="font-size:0.72rem;color:var(--dnd-text2)">${esc(newAbility.desc||'')}</div>
          </div>` : ''}
          ${char._pendingASI ? `<p style="color:var(--dnd-gold);font-size:0.85rem">⬆️ ¡Puedes mejorar tus estadísticas!</p>` : ''}
          <button class="dnd-btn dnd-btn-primary" onclick="this.closest('.dnd-levelup-overlay').remove(); root._dndGame.handleLevelUpSequence();">
            ¡Continuar!
          </button>
        </div>
      </div>`;
  }

  // ── ASI / FEAT SCREEN ─────────────────────────────────────────
  function buildASIScreen(char) {
    const stats = ['str','dex','con','int','wis','cha'];
    const statNames = { str:'Fuerza',dex:'Destreza',con:'Constitución',int:'Inteligencia',wis:'Sabiduría',cha:'Carisma' };
    return `
      <div id="dnd-asi" class="dnd-screen dnd-active dnd-asi-screen">
        ${buildHUD(char)}
        <div class="dnd-asi-layout">
          <h2 class="dnd-asi-title">⬆️ Mejora de Estadísticas</h2>
          <p class="dnd-asi-subtitle">Nivel ${char.level}: elige cómo mejorar tu personaje.</p>

          <div class="dnd-asi-options">
            <!-- Option A: +2 to one stat -->
            <div class="dnd-asi-card">
              <h3>+2 a una estadística</h3>
              <div class="dnd-asi-stat-row">
                ${stats.map(s => {
                  const cur = char.getStat(s);
                  const maxed = cur >= 20;
                  return `<button class="dnd-btn dnd-btn-choice dnd-asi-stat-btn ${maxed?'dnd-btn-disabled':''}"
                    ${maxed?'disabled':''} onclick="root._dndGame.applyASI('stat2','${s}')">
                    ${statNames[s]}<br><b>${cur}</b>${maxed?'<br><small>Máx</small>':''}
                  </button>`;
                }).join('')}
              </div>
            </div>

            <!-- Option B: +1/+1 to two stats -->
            <div class="dnd-asi-card">
              <h3>+1 a dos estadísticas</h3>
              <p style="font-size:0.75rem;color:var(--dnd-text2)">Haz clic en dos estadísticas diferentes</p>
              <div class="dnd-asi-stat-row" id="dnd-asi-dual">
                ${stats.map(s => {
                  const cur = char.getStat(s);
                  const maxed = cur >= 20;
                  return `<button class="dnd-btn dnd-btn-choice dnd-asi-stat-btn dnd-asi-dual-btn ${maxed?'dnd-btn-disabled':''}"
                    ${maxed?'disabled':''} data-stat="${s}" onclick="root._dndGame.toggleASIDual(this,'${s}')">
                    ${statNames[s]}<br><b>${cur}</b>
                  </button>`;
                }).join('')}
              </div>
              <button class="dnd-btn dnd-btn-primary" id="dnd-asi-dual-confirm" style="display:none;margin-top:8px"
                onclick="root._dndGame.applyASIDual()">Confirmar +1/+1 →</button>
            </div>

            <!-- Option C: Feat -->
            <div class="dnd-asi-card">
              <h3>✦ Elegir un Talento (Feat)</h3>
              <div class="dnd-feat-list">
                ${P.FEATS.map(f => `
                  <button class="dnd-btn dnd-btn-choice dnd-feat-btn" onclick="root._dndGame.applyASI('feat','${f.id}')"
                    title="${esc(f.desc)}">
                    ${f.icon} <b>${esc(f.name)}</b><br>
                    <small>${esc(f.desc)}</small>
                  </button>`).join('')}
              </div>
            </div>
          </div>
        </div>
      </div>`;
  }

  // ── STATS SCREEN ──────────────────────────────────────────────
  function buildStatsScreen(char) {
    const s = char.stats;
    const winRate = s.kills > 0 ? Math.round((s.kills / Math.max(1, s.kills + s.deaths)) * 100) : 0;
    const avgDmg  = s.kills > 0 ? Math.round(s.damageDone / Math.max(1, s.kills)) : 0;
    return `
      <div id="dnd-stats-screen" class="dnd-screen dnd-active">
        ${buildHUD(char)}
        <div class="dnd-stats-layout">
          <h2 class="dnd-section-title">📊 Estadísticas de ${esc(char.name)}</h2>
          <div class="dnd-stats-grid">
            <div class="dnd-stat-card">
              <div class="dnd-stat-card-icon">⚔️</div>
              <div class="dnd-stat-card-val">${s.kills}</div>
              <div class="dnd-stat-card-lbl">Enemigos Derrotados</div>
            </div>
            <div class="dnd-stat-card">
              <div class="dnd-stat-card-icon">💀</div>
              <div class="dnd-stat-card-val">${s.deaths}</div>
              <div class="dnd-stat-card-lbl">Muertes</div>
            </div>
            <div class="dnd-stat-card">
              <div class="dnd-stat-card-icon">🎯</div>
              <div class="dnd-stat-card-val">${winRate}%</div>
              <div class="dnd-stat-card-lbl">Tasa de Victoria</div>
            </div>
            <div class="dnd-stat-card">
              <div class="dnd-stat-card-icon">💥</div>
              <div class="dnd-stat-card-val">${s.damageDone}</div>
              <div class="dnd-stat-card-lbl">Daño Total</div>
            </div>
            <div class="dnd-stat-card">
              <div class="dnd-stat-card-icon">🔥</div>
              <div class="dnd-stat-card-val">${s.highestDmg}</div>
              <div class="dnd-stat-card-lbl">Mayor Golpe</div>
            </div>
            <div class="dnd-stat-card">
              <div class="dnd-stat-card-icon">💚</div>
              <div class="dnd-stat-card-val">${s.healingDone}</div>
              <div class="dnd-stat-card-lbl">Curación Total</div>
            </div>
            <div class="dnd-stat-card">
              <div class="dnd-stat-card-icon">💰</div>
              <div class="dnd-stat-card-val">${fmtGold(s.goldEarned)}</div>
              <div class="dnd-stat-card-lbl">Oro Ganado</div>
            </div>
            <div class="dnd-stat-card">
              <div class="dnd-stat-card-icon">💎</div>
              <div class="dnd-stat-card-val">${s.crits}</div>
              <div class="dnd-stat-card-lbl">Críticos</div>
            </div>
            <div class="dnd-stat-card">
              <div class="dnd-stat-card-icon">📜</div>
              <div class="dnd-stat-card-val">${s.questsDone}</div>
              <div class="dnd-stat-card-lbl">Misiones Completadas</div>
            </div>
            <div class="dnd-stat-card">
              <div class="dnd-stat-card-icon">📊</div>
              <div class="dnd-stat-card-val">${avgDmg}</div>
              <div class="dnd-stat-card-lbl">Daño Prom/Combate</div>
            </div>
            <div class="dnd-stat-card">
              <div class="dnd-stat-card-icon">🏅</div>
              <div class="dnd-stat-card-val">${char.reputation > 0 ? '+' : ''}${char.reputation}</div>
              <div class="dnd-stat-card-lbl">Reputación</div>
            </div>
            <div class="dnd-stat-card">
              <div class="dnd-stat-card-icon">📅</div>
              <div class="dnd-stat-card-val">${char.day}</div>
              <div class="dnd-stat-card-lbl">Días de Aventura</div>
            </div>
          </div>
          <div class="dnd-stats-feats">
            <h3>✦ Talentos</h3>
            <div class="dnd-feat-badges">
              ${(char._feats||[]).length === 0
                ? '<em style="color:var(--dnd-text2)">Sin talentos aún. Consíguelos al nivel 4/8/12/16.</em>'
                : (char._feats||[]).map(fid => {
                    const f = P.FEATS.find(x => x.id === fid);
                    return f ? `<span class="dnd-cbadge" style="color:var(--dnd-gold)">${f.icon} ${esc(f.name)}</span>` : '';
                  }).join('')}
            </div>
          </div>
          <button class="dnd-btn dnd-btn-ghost" style="margin-top:16px" onclick="root._dndGame.navigate('world')">← Volver al Mapa</button>
        </div>
      </div>`;
  }

  // ── NOTIFICATION ──────────────────────────────────────────────
  function showNotification(msg, type = 'info', duration = 3000) {
    const el = document.createElement('div');
    el.className = `dnd-notification dnd-notif-${type}`;
    el.innerHTML = esc(msg);
    const overlay = document.getElementById('dndOverlay');
    if (overlay) {
      overlay.appendChild(el);
      setTimeout(() => el.remove(), duration);
    }
  }

  root._dndParts.buildHUD             = buildHUD;
  root._dndParts.buildIntroScreen     = buildIntroScreen;
  root._dndParts.buildCharCreateScreen= buildCharCreateScreen;
  root._dndParts.buildWorldScreen     = buildWorldScreen;
  root._dndParts.buildExploreScreen   = buildExploreScreen;
  root._dndParts.buildCombatScreen    = buildCombatScreen;
  root._dndParts.buildASIScreen       = buildASIScreen;
  root._dndParts.buildStatsScreen     = buildStatsScreen;
  root._dndParts.buildCharacterSheet  = buildCharacterSheet;
  root._dndParts.buildInventoryScreen = buildInventoryScreen;
  root._dndParts.buildMerchantScreen  = buildMerchantScreen;
  root._dndParts.buildQuestScreen     = buildQuestScreen;
  root._dndParts.buildLoreScreen      = buildLoreScreen;
  root._dndParts.buildGameOverScreen  = buildGameOverScreen;
  root._dndParts.buildDevRoomScreen   = buildDevRoomScreen;
  root._dndParts.buildVictoryScreen   = buildVictoryScreen;
  function handleLevelUpSequence() {
    if (char._pendingSubclass) {
      showSubclassScreen();
    } else if (char._pendingDraft) {
      showDraftScreen();
    } else if (char._pendingASI) {
      showASIScreen();
    } else {
      navigate('world');
    }
  }

  function showSubclassScreen() {
    render(P.buildSubclassScreen(char));
  }

  function showDraftScreen() {
    render(P.buildDraftScreen(char));
  }

  root._dndGame.handleLevelUpSequence = handleLevelUpSequence;
  root._dndGame.chooseSubclass = function(subclassId) {
    char.subclass = subclassId;
    char._pendingSubclass = false;
    
    // Add subclass trait
    const subList = P.SUBCLASSES[char.cls.id] || [];
    const chosen = subList.find(s => s.id === subclassId);
    if (chosen) {
      char.traits.push(chosen.trait);
      P.showNotification(`⚔️ Subclase elegida: ${chosen.name}`, "success", 4000);
    }
    
    handleLevelUpSequence();
  };

  root._dndGame.chooseDraft = function(perkId) {
    char.perks = char.perks || [];
    char.perks.push(perkId);
    char._pendingDraft = false;
    
    // Apply immediate benefits
    const perkList = P.DRAFT_PERKS || [];
    const chosen = perkList.find(p => p.id === perkId);
    if (chosen) {
      if (chosen.id === 'vigor_sagrado') {
        char.maxHP += 15;
        char.hp += 15;
      }
      P.showNotification(`🌟 Rasgo adquirido: ${chosen.name}`, "success", 4000);
    }
    
    handleLevelUpSequence();
  };

  root._dndParts.buildLevelUpOverlay  = buildLevelUpOverlay;
  root._dndParts.showNotification     = showNotification;
  console.log('%c[DND] Part 9 loaded — All UI screens', 'color:#8b5cf6;');

})(window);

// ============================================================
// PART 10 — GAME ENGINE: INITIALIZATION & MAIN GAME LOOP
// ============================================================
(function(root) {
  'use strict';

  const P = root._dndParts;
  const { d20, roll, pick, shuffle, clone, clamp, esc, fmtGold, modStr } = P.utils;

  // ── ACHIEVEMENTS ─────────────────────────────────────────────
  const ACHIEVEMENTS = [
    { id:'first_blood',   name:'Primera Sangre',    icon:'🩸', desc:'Derrota tu primer enemigo',        check: c => (c.stats.kills||0) >= 1 },
    { id:'pure_crit',     name:'Crítico Puro',       icon:'💥', desc:'Consigue 10 golpes críticos',      check: c => (c.stats.crits||0) >= 10 },
    { id:'died_lived',    name:'Muerto y Vivo',      icon:'💀', desc:'Sobrevive a tiradas de muerte',    check: c => c._survivedDeathSaves === true },
    { id:'collector',     name:'Coleccionista',      icon:'🎒', desc:'Ten 15+ objetos en inventario',    check: c => (c.inventory||[]).length >= 15 },
    { id:'millionaire',   name:'Acaudalado',          icon:'💰', desc:'Acumula 1000 de oro de una vez',   check: c => (c.gold||0) >= 1000 },
    { id:'bookworm',      name:'Sabio',              icon:'📖', desc:'Desbloquea 5 entradas de lore',    check: c => (c.loreFound||[]).length >= 5 },
    { id:'dragonslayer',  name:'Cazadragones',       icon:'🐉', desc:'Derrota al Dragón Anciano',        check: c => !!c.flags?.killed_dragon_ancient },
    { id:'streak_5',      name:'Imparable',          icon:'🔥', desc:'Consigue una racha de 5 kills',    check: c => (c.stats.maxStreak||0) >= 5 },
    { id:'untouchable',   name:'Intocable',          icon:'🛡️', desc:'Gana un combate sin recibir daño', check: c => c._noDamageLastFight === true },
    { id:'elite_slayer',  name:'Cazador de Élites',  icon:'⭐', desc:'Derrota a 3 enemigos élite',       check: c => (c._eliteKills||0) >= 3 },
    { id:'speed_run',     name:'Veloz',              icon:'⚡', desc:'Completa una zona en menos de 3 días', check: c => c._fastZoneComplete === true },
    { id:'easter_egg',    name:'Descubridor',        icon:'🥚', desc:'Accede a la Sala del Desarrollador', check: c => !!c.flags?.devRoomUnlocked },
  ];
  P.ACHIEVEMENTS = ACHIEVEMENTS;

  function checkAchievements(char) {
    if (!char._achievements) char._achievements = [];
    ACHIEVEMENTS.forEach(ach => {
      if (!char._achievements.includes(ach.id) && ach.check(char)) {
        char._achievements.push(ach.id);
        P.showNotification(`🏆 ¡Logro: ${ach.icon} ${ach.name}! — ${ach.desc}`, 'success', 5000);
      }
    });
  }

  // ── RANDOM NAMES ─────────────────────────────────────────────
  const NAMES_FIRST = ['Aeron','Bael','Caelum','Dara','Eryn','Faelith','Gorn','Hela','Iven','Jax','Kael','Lyra','Morg','Nyx','Oryn','Petra','Quen','Rael','Sera','Thorn','Ulric','Vex','Wyrd','Xar','Ysolde','Zira'];
  const NAMES_LAST  = ['Ashveil','Blackthorn','Coldwater','Dawnbreak','Emberfell','Frostborn','Grimhold','Hollowmere','Ironside','Jadeblade','Kindred','Lorethane','Mosshaven','Nightfall','Oakenshield','Pyrewatch','Quickblade','Ravenscar','Stormbrew','Thistledown','Undying','Voidmere','Wayfarer','Xanathos','Yewgate','Zephyr'];
  function randomName() { return pick(NAMES_FIRST) + ' ' + pick(NAMES_LAST); }

  // ── GAME STATE ───────────────────────────────────────────────
  let char = null;
  let world = null;
  let combatState = null;    // { enemies, log, phase, currentEnemyIdx }
  let currentShop = null;
  let currentMerchant = null;
  let ccSelections = {};
  let ccStep = 0;
  let _tooltipEl = null;
  let _autosaveInterval = null;

  // ── DOM HELPERS ───────────────────────────────────────────────
  const overlay   = () => document.getElementById('dndOverlay');
  const canvas    = () => document.getElementById('dndCanvas');

  function render(html) {
    const el = overlay();
    if (!el) return;
    const existing = el.querySelector('.dnd-screen');
    if (existing) existing.remove();
    const hud = el.querySelector('#dnd-hud');
    if (hud) hud.remove();
    el.insertAdjacentHTML('beforeend', html);
    // Scroll log to bottom if combat
    const log = el.querySelector('#dnd-combat-log');
    if (log) log.scrollTop = log.scrollHeight;
    // Focus name input if present
    const nameIn = el.querySelector('#dnd-name-input');
    if (nameIn) setTimeout(() => nameIn.focus(), 50);
  }

  // ── NAVIGATION ───────────────────────────────────────────────
  function navigate(screen) {
    if (!char && !['intro','char-create','lore'].includes(screen)) {
      screen = 'intro';
    }
    P.Particles.spawnAmbient(screen === 'combat' ? 'sparks' : 'magic');

    switch(screen) {
      case 'intro':       render(P.buildIntroScreen(P.SaveSystem.hasSave())); break;
      case 'char-create': ccSelections = {}; ccStep = 0; render(P.buildCharCreateScreen(0, ccSelections)); break;
      case 'world':       render(P.buildWorldScreen(char, world)); startAutosave(); break;
      case 'inventory':   render(P.buildInventoryScreen(char)); break;
      case 'quests':      render(P.buildQuestScreen(char)); break;
      case 'lore':        render(P.buildLoreScreen(char)); break;
      case 'stats':       render(P.buildStatsScreen(char)); break;
      case 'asi':         render(P.buildASIScreen(char)); break;
      case 'charsheet':   render(P.buildCharacterSheet(char)); break;
      case 'gameover':    render(P.buildGameOverScreen(char, combatState?.deathMsg || '')); break;
      case 'victory':     render(P.buildVictoryScreen(char)); break;
      case 'devroom':     enterDevRoom(); break;
      default:            render(P.buildIntroScreen(P.SaveSystem.hasSave()));
    }
  }

  // ── OPEN / CLOSE OVERLAY ──────────────────────────────────────
  function open() {
    const el = overlay();
    if (!el) return;
    el.classList.add('dnd-open');
    P.Audio.init();
    P.Audio.sfx.secret();
    navigate('intro');
    P.Particles.init();
    document.body.style.overflow = 'hidden';
    P.Storage.unlock('opened_easter_egg');
  }

  function close() {
    const el = overlay();
    if (!el) return;
    el.classList.remove('dnd-open');
    P.Particles.stop();
    stopAutosave();
    document.body.style.overflow = '';
    // Auto-save on close if in game
    if (char) P.SaveSystem.save(char, world);
  }

  // ── AUTOSAVE ─────────────────────────────────────────────────
  function startAutosave() {
    stopAutosave();
    if (!char || char.hardcore) return;
    _autosaveInterval = setInterval(() => {
      if (char) { P.SaveSystem.save(char, world); console.log('[DND] Autosaved.'); }
    }, 60000); // Every 60s
  }
  function stopAutosave() { if (_autosaveInterval) { clearInterval(_autosaveInterval); _autosaveInterval = null; } }

  // ── CHARACTER CREATION ────────────────────────────────────────
  function ccSelect(key, value) {
    if (key === 'race') {
      const race = P.RACES.find(r => r.id === value);
      if (race) ccSelections.race = race;
    } else if (key === 'cls') {
      const cls = P.CLASSES.find(c => c.id === value);
      if (cls) ccSelections.cls = cls;
    } else {
      ccSelections[key] = value;
    }
    if (key === 'name') {
      // update Next button state without re-rendering (preserves cursor position)
      const nextBtn = document.querySelector('#dnd-char-create .dnd-btn-primary');
      if (nextBtn) nextBtn.disabled = value.trim().length < 2;
      return;
    }
    render(P.buildCharCreateScreen(ccStep, ccSelections));
  }

  function ccNext() {
    const maxStep = 4;
    if (ccStep >= maxStep) return;
    // Validate
    if (ccStep === 0 && !ccSelections.race) { P.showNotification('Elige una raza.', 'warn'); return; }
    if (ccStep === 1 && !ccSelections.cls)  { P.showNotification('Elige una clase.', 'warn'); return; }
    if (ccStep === 2) {
      const name = (ccSelections.name || '').trim();
      if (name.length < 2 || name.length > 24 || !/^[a-zA-ZÀ-ÿ0-9 ]+$/.test(name)) {
        P.showNotification('Nombre inválido (2–24 chars, letras/números).', 'warn'); return;
      }
      ccSelections.name = name;
    }
    if (ccStep === 3 && !ccSelections.stats) { ccRollStats(); return; }
    ccStep++;
    render(P.buildCharCreateScreen(ccStep, ccSelections));
  }

  function ccPrev() {
    if (ccStep > 0) { ccStep--; render(P.buildCharCreateScreen(ccStep, ccSelections)); }
  }

  function ccRollStats() {
    const stats = { str:0, dex:0, con:0, int:0, wis:0, cha:0 };
    const keys   = Object.keys(stats);
    const rolls  = keys.map(() => roll4d6drop1());
    // Assign highest to primary stats
    const sorted = [...rolls].sort((a,b)=>b-a);
    const primaries = (ccSelections.cls?.primaryStats || ['str','dex']);
    const assigned  = {};
    primaries.forEach((p, i) => { if(!assigned[p]) { assigned[p] = sorted[i]; } });
    let sIdx = primaries.length;
    keys.forEach(k => { if (!assigned[k]) { assigned[k] = sorted[sIdx++]; } });
    ccSelections.stats = assigned;
    render(P.buildCharCreateScreen(ccStep, ccSelections));
    P.Audio.sfx.click();
  }

  function roll4d6drop1() {
    const rolls = [d20()%6+1, d20()%6+1, d20()%6+1, d20()%6+1];
    rolls.sort((a,b)=>a-b);
    return rolls[1]+rolls[2]+rolls[3]; // Drop lowest
  }

  function ccStandardArray() {
    const keys    = ['str','dex','con','int','wis','cha'];
    const values  = [15,14,13,12,10,8];
    const primaries = (ccSelections.cls?.primaryStats || ['str','dex']);
    const sorted  = shuffle([...values]);
    const assigned = {};
    // Put higher values in primary stats
    keys.forEach((k, i) => assigned[k] = sorted[i]);
    ccSelections.stats = assigned;
    render(P.buildCharCreateScreen(ccStep, ccSelections));
  }

  function ccRandomName() {
    ccSelections.name = randomName();
    render(P.buildCharCreateScreen(ccStep, ccSelections));
  }

  // ── START GAME ────────────────────────────────────────────────
  function startGame() {
    if (!ccSelections.race || !ccSelections.cls || !ccSelections.name?.trim() || !ccSelections.stats) {
      P.showNotification('Completa todos los pasos.', 'warn'); return;
    }
    const resolvedRace = clone(ccSelections.race);
    const gender = ccSelections.gender || 'male';
    if (resolvedRace.genders && resolvedRace.genders[gender]) {
      resolvedRace.name = resolvedRace.genders[gender].name;
      resolvedRace.icon = resolvedRace.genders[gender].icon;
    }
    char = new P.Character({
      name: ccSelections.name.trim(),
      race: resolvedRace,
      cls:  ccSelections.cls,
      stats: ccSelections.stats,
      hardcore: !!ccSelections.hardcore,
      permadeath: !!ccSelections.permadeath,
      gender: gender
    });
    world = P.WorldSystem;
    world.init();
    // Auto-accept first quest
    P.QuestTracker.accept(char, 'q_goblin_king');
    P.Storage.unlock('started_game');
    P.Audio.sfx.levelUp();
    P.showNotification(`¡Bienvenido, ${esc(char.name)}! Tu aventura comienza.`, 'success', 4000);
    navigate('world');
  }

  // ── LOAD GAME ────────────────────────────────────────────────
  function loadGame() {
    const saved = P.SaveSystem.load();
    if (!saved) { P.showNotification('No hay guardado válido.', 'error'); return; }
    char  = saved.char;
    world = P.WorldSystem;
    world.init();
    // Restore world state
    if (saved.worldData) {
      saved.worldData.forEach(wd => {
        const loc = world.getLoc(wd.id);
        if (loc) { loc.progress = wd.progress; loc.completed = wd.completed; loc.unlocked = wd.unlocked; }
      });
    }
    P.showNotification(`Partida cargada: ${esc(char.name)} Nv${char.level}`, 'success', 3000);
    navigate('world');
  }

  // ── LOCATION EXPLORATION ─────────────────────────────────────
  function enterLocation(locationId) {
    if (!char) return;
    const loc = world.getLoc(locationId);
    if (!loc || (!loc.unlocked && !(loc.hiddenUnlock && char.race.id === loc.hiddenUnlock))) {
      P.showNotification('Esta ubicación está bloqueada.', 'warn'); return;
    }
    if (char.level < loc.minLevel) {
      P.showNotification(`Necesitas nivel ${loc.minLevel} para entrar aquí. Tienes nivel ${char.level}.`, 'warn'); return;
    }
    char.currentLocation = locationId;

    // ── BOON / BANE / INSPIRATION on zone entry ──
    char._zoneBoon = null; char._zoneBane = null;
    const ZONE_BOONS = [
      { name:'Terreno Sagrado',  icon:'✨', msg:'+2 a tiradas de salvación en esta zona.', svBonus:2 },
      { name:'Frenesí de Batalla', icon:'⚔️', msg:'+1 al daño en esta zona.',             dmgBonus:1 },
      { name:'Vientos de Suerte', icon:'🍀', msg:'Ventaja en tu próxima tirada.',           advantage:true },
    ];
    const ZONE_BANES = [
      { name:'Maldición de Sangre', icon:'💀', msg:'Los enemigos hacen +1 daño extra.',      enemyDmg:1 },
      { name:'Niebla Arcana',       icon:'🌫️', msg:'Penalización -2 a tus ataques de hechizo.', spellPenalty:2 },
      { name:'Fiebre Oscura',       icon:'🖤', msg:'Empiezas con -5 HP hasta descansar.',     hpPenalty:5 },
    ];
    const zoneRoll = Math.random();
    if (zoneRoll < 0.28) {
      const b = pick(ZONE_BOONS);
      char._zoneBoon = b;
      P.showNotification(`${b.icon} Bendición: ${b.name} — ${b.msg}`, 'success', 5000);
      if (b.hpBonus) char.hp = Math.min(char.maxHP, char.hp + b.hpBonus);
    } else if (zoneRoll < 0.56) {
      const b = pick(ZONE_BANES);
      char._zoneBane = b;
      P.showNotification(`${b.icon} Maldición: ${b.name} — ${b.msg}`, 'warn', 5000);
      if (b.hpPenalty) char.hp = Math.max(1, char.hp - b.hpPenalty);
    }

    // Inspiration (15% chance, once per zone)
    if (Math.random() < 0.15 && !char._inspiration) {
      char._inspiration = true;
      P.showNotification('✨ ¡Inspiración! Ventaja en tu próxima tirada.', 'success', 4000);
    }

    explore();
  }

  function explore() {
    if (!char || !char.currentLocation) { navigate('world'); return; }
    const result = world.explore(char, char.currentLocation);
    if (!result) { navigate('world'); return; }
    P.advanceTime(char, 1);

    if (result.type === 'boss' || result.type === 'combat') {
      const enemies = result.type === 'boss'
        ? [P.createEnemy(result.enemyId, Math.max(0, char.level - 3))]
        : result.enemies;
      startCombat(enemies);
    } else if (result.type === 'merchant') {
      currentShop     = result.shop;
      currentMerchant = result.event.npcName ? { icon:'🧔', name:result.event.npcName, quote:result.event.npcQuote||'' } : pick(P.MERCHANTS);
      render(P.buildMerchantScreen(char, currentMerchant, currentShop));
    } else if (result.type === 'forge') {
      P.showNotification('⚒️ Forja ancestral. Puedes mejorar un objeto por 100 oro × nivel.', 'info', 5000);
      navigate('inventory');
    } else if (result.type === 'event') {
      render(P.buildExploreScreen(char, result, char.currentLocation));
    } else {
      // Empty or loot
      if (result.msg) P.showNotification(result.msg, 'info', 3000);
      render(P.buildExploreScreen(char, null, char.currentLocation));
    }

    // Check quest progress
    P.QuestTracker.update(char, 'check', {});
    autoSaveIfNeeded();
  }

  // ── DIALOGUE / EVENT RESOLUTION ──────────────────────────────
  function resolveChoice(choiceIdx) {
    if (!char) return;
    const result = P.DialogueSystem.resolve(choiceIdx, char);
    if (!result) return;

    const { resultText, effects } = result;
    P.showNotification(resultText.replace(/\n\n/g,' — '), effects.xp?'success':effects.combat?'warn':'info', 5000);

    if (effects.xp)    { const leveled = char.gainXP(effects.xp); if(leveled) showLevelUp(); }
    if (effects.gold)  { char.gold += effects.gold; }
    if (effects.items) { effects.items.forEach(id => { const it=P.ITEMS.find(i=>i.id===id); if(it) char.addItem(clone(it)); P.QuestTracker.update(char,'item_gained',{id}); }); }
    if (effects.crafting) { navigate('inventory'); return; }
    if (effects.combat)  {
      const enemies = effects.combat.map(id => P.createEnemy(id, Math.max(0, char.level-3)));
      startCombat(enemies); return;
    }

    P.Audio.sfx.click();
    // Return to explore screen after a moment
    setTimeout(() => render(P.buildExploreScreen(char, null, char.currentLocation)), 1500);
  }

  // ── COMBAT ────────────────────────────────────────────────────
  function startCombat(enemies) {
    if (!char || !enemies || enemies.length === 0) return;
    char._lastStandUsed = false; // reset last_stand trinket per combat
    if (char.perks && char.perks.includes('escudo_arcano')) {
      char.tempHP = 10;
      combatState.log.push("🔵 ¡Escudo Arcano activado! Obtienes 10 HP temporales.");
    }

    // Weather combat modifiers
    const weatherMod = { atkMod:0, dmgMod:0, msg:'' };
    switch(char.weather) {
      case 'rainy':   weatherMod.atkMod = -1; weatherMod.msg = '🌧️ Lluvia: -1 al ataque (armas mojadas).'; break;
      case 'foggy':   weatherMod.atkMod = -2; weatherMod.msg = '🌫️ Niebla: -2 al ataque (visibilidad reducida).'; break;
      case 'stormy':  weatherMod.atkMod = -1; weatherMod.dmgMod = 2; weatherMod.msg = '⛈️ Tormenta: -1 ataque, +2 daño relámpago.'; break;
    }
    // Undead buff at night
    const hour = char.worldTime || 12;
    const isNight = hour >= 20 || hour <= 5;
    if (isNight && enemies.some(e => e.type === 'undead')) {
      enemies.forEach(e => { if (e.type === 'undead') e.atk = (e.atk||0) + 2; });
    }

    const init = P.rollInitiative(char, enemies[0]);
    window._dndCombatInitData = init; // for initiative tracker in UI
    combatState = {
      enemies: enemies,
      log: [
        `⚔️ ¡Encuentro de combate!`,
        `Iniciativa: tú (${init.playerRoll}) vs ${enemies[0].name} (${init.enemyRoll})`,
        `${init.playerFirst ? '⚡ Actúas primero!' : `⚡ ${enemies[0].name} actúa primero!`}`,
        ...(weatherMod.msg ? [weatherMod.msg] : []),
        ...(isNight && enemies.some(e => e.type === 'undead') ? ['🌑 Noche: los no-muertos empoderados (+2 ATK).'] : [])
      ],
      phase: init.playerFirst ? 'player' : 'enemy',
      currentEnemyIdx: 0,
      deathMsg: '',
      _bonusActionUsed: false,
      weatherMod
    };
    render(P.buildCombatScreen(char, [enemies[combatState.currentEnemyIdx]], combatState.log, combatState.phase, combatState._bonusActionUsed));

    if (!init.playerFirst) {
      setTimeout(() => enemyTurn(), 1000);
    }
    P.Audio.sfx.attack();
  }

  function combatAction(action, param) {
    if (!combatState) return;
    const enemy = combatState.enemies?.[combatState.currentEnemyIdx] || null;
    // Allow death_save action even in death_saves phase
    if (action === 'death_save') {
      const nat = d20();
      const ds  = char._deathSaves;
      if (nat === 20) {
        // Nat 20 — instant recover
        char.hp = 1; char._isDown = false; char._deathSaves = { success:0, fail:0 };
        char._survivedDeathSaves = true;
        combatState.phase = 'player';
        combatState.log.push(`🎲 ¡NAT 20! ¡Te recuperas milagrosamente con 1 HP!`);
        P.Particles.spawnBurst('magic');
        refreshCombatScreen();
      } else if (nat === 1) {
        ds.fail = Math.min(3, ds.fail + 2);
        combatState.log.push(`💀 ¡Nat 1! ¡Dos fracasos simultáneos! (${ds.fail}/3 fallos)`);
        if (ds.fail >= 3) { _triggerActualDeath(enemy); return; }
        refreshCombatScreen();
        setTimeout(() => enemyTurn(), 800);
      } else if (nat >= 10) {
        ds.success++;
        combatState.log.push(`✅ Tirada ${nat} — Éxito (${ds.success}/3)`);
        if (ds.success >= 3) {
          char.hp = 1; char._isDown = false; char._deathSaves = { success:0, fail:0 };
          char._survivedDeathSaves = true;
          combatState.phase = 'player';
          combatState.log.push('💚 ¡Estabilizado! Sobrevives con 1 HP.');
          refreshCombatScreen();
        } else {
          refreshCombatScreen();
          setTimeout(() => enemyTurn(), 800);
        }
      } else {
        ds.fail++;
        combatState.log.push(`❌ Tirada ${nat} — Fracaso (${ds.fail}/3 fallos)`);
        if (ds.fail >= 3) { _triggerActualDeath(enemy); return; }
        refreshCombatScreen();
        setTimeout(() => enemyTurn(), 800);
      }
      return;
    }

    if (combatState.phase !== 'player') return;
    if (!enemy || enemy.hp <= 0) return;

    combatState.phase = 'busy';
    let msg = '';
    let leveledUp = false;

    if (action === 'attack') {
      animateDice(() => {
        const wMod = combatState.weatherMod || { atkMod:0, dmgMod:0 };
        // Inspiration: grant advantage on attack
        const hasInspiration = char._inspiration === true;
        if (hasInspiration) { char._inspiration = false; }
        // Kill streak damage bonus
        const streakBonus = Math.round((char._killStreak||0) * 0.05 * (combatState.baseDmgBonus||1));
        const attackOptions = {
          hasAdvantage: hasInspiration || char.hasCondition('hunters_mark') || char.hasCondition('rage') || char._hidden === true,
          hasDisadvantage: char.hasCondition('stunned') || char.hasCondition('paralyzed') || !!char._zoneBane?.disadvantage,
          weatherAtkMod: wMod.atkMod,
          weatherDmgMod: wMod.dmgMod + (char._zoneBoon?.dmgBonus||0),
          extraDmg: streakBonus
        };
        if (char._hidden) { char._hidden = false; } // consume hidden on attack

        P.triggerAnimation('player', 'dnd-attack-lunge-player');
        const res = P.playerAttack(char, enemy, attackOptions);
        if (res.hits && res.dmg > 0) {
          enemy.hp = Math.max(0, enemy.hp - res.dmg);
          setTimeout(() => {
            P.triggerAnimation('enemy', 'dnd-damage-shake');
            spawnDmgFloat(res.dmg, res.isCrit, 'enemy');
          }, 150);
        }
        if (res.isCrit) {
          combatState.log.push(`💥 ¡CRÍTICO! Atacas a ${enemy.name}: ${res.dmg} daño! (${res.dmgBreakdown}) nat${res.nat}`);
          P.Particles.spawnBurst('fire');
        } else if (res.isFumble) {
          combatState.log.push(`💢 ¡FALLO CRÍTICO! Pierdes el turno.`);
        } else if (res.hits) {
          combatState.log.push(`⚔️ Atacas a ${enemy.name}: ${res.dmg} daño. (${res.nat}+${char.attackBonus}) [HP: ${enemy.hp}/${enemy.maxHP}]`);
        } else {
          combatState.log.push(`❌ Fallas el ataque. (${res.atkRoll} vs CA${enemy.ac})`);
        }
        if (res.special === 'decapitate') combatState.log.push(`☠️ DECAPITACIÓN VORPAL!`);

        // ── EXTRA ATTACK (level 5+ martial classes) ───────────
        const EXTRA_ATK_CLASSES = ['fighter','barbarian','ranger','paladin','monk'];
        const hasExtraAtk = EXTRA_ATK_CLASSES.includes(char.cls?.id) && char.level >= 5 && enemy.hp > 0;
        if (hasExtraAtk) {
          const res2 = P.playerAttack(char, enemy, { ...attackOptions, hasAdvantage: false });
          if (res2.hits && res2.dmg > 0) {
            enemy.hp = Math.max(0, enemy.hp - res2.dmg);
            spawnDmgFloat(res2.dmg, res2.isCrit, 'enemy');
          }
          if (res2.isCrit) combatState.log.push(`💥 [ATAQUE EXTRA] ¡CRÍTICO! ${res2.dmg} daño!`);
          else if (res2.hits) combatState.log.push(`⚔️ [ATAQUE EXTRA] ${res2.dmg} daño a ${enemy.name}. [HP: ${enemy.hp}/${enemy.maxHP}]`);
          else combatState.log.push(`❌ [ATAQUE EXTRA] Fallas. (${res2.atkRoll} vs CA${enemy.ac})`);
        }

        checkEnemyDeath(enemy, () => {
          if (!char.hasCondition('paralyzed')) char.tickConditions();
          endPlayerTurn();
        });
      });
      return;
    } else if (action === 'bonus_shove') {
      if (combatState._bonusActionUsed) { combatState.phase = 'player'; return; }
      combatState._bonusActionUsed = true;
      const strCheck = d20() + char.getMod('str');
      const enemyStr = d20() + Math.floor((enemy.atk||4) / 4);
      combatState.log.push(`💪 Empujón: Fuerza ${strCheck} vs ${enemy.name} ${enemyStr}`);
      if (strCheck >= enemyStr) {
        const shoveType = Math.random() < 0.5 ? 'prone' : 'push';
        if (shoveType === 'prone') {
          P.applyStatusEffect(enemy, 'prone', 1);
          combatState.log.push(`⬇️ ¡${enemy.name} TUMBADO! Desventaja en sus ataques, ventaja en los tuyos (melee).`);
          P.Particles.spawnBurst('magic');
        } else {
          combatState.log.push(`💨 ¡${enemy.name} EMPUJADO hacia atrás! Pierde 1 acción alejándose.`);
          P.applyStatusEffect(enemy, 'stunned', 1); // simulate push = 1 turn lost
        }
        spawnDmgFloat(0, false, 'enemy');
      } else {
        combatState.log.push(`❌ Empujón falla. ${enemy.name} resiste.`);
      }
      combatState.phase = 'player';
      refreshCombatScreen();
      return;
    } else if (action === 'bonus_cover') {
      if (combatState._bonusActionUsed) { combatState.phase = 'player'; return; }
      combatState._bonusActionUsed = true;
      char.addCondition({ id:'covered', name:'En Cubierta', icon:'🏛️', acBonus:2, rounds:2 });
      combatState.log.push(`🏛️ ¡Tomas cubierta! +2 CA por 2 turnos.`);
      combatState.phase = 'player';
      refreshCombatScreen();
      return;
    } else if (action === 'bonus_second_wind') {
      if (combatState._bonusActionUsed || char._secondWindUsed) { combatState.phase = 'player'; return; }
      combatState._bonusActionUsed = true;
      char._secondWindUsed = true;
      const healed = roll(10) + char.level;
      char.hp = Math.min(char.maxHP, char.hp + healed);
      char.stats.healingDone += healed;
      combatState.log.push(`🩹 Segunda Oportunidad: Recuperas ${healed} HP. (disponible en el próximo descanso)`);
      P.Audio.sfx.heal();
      combatState.phase = 'player';
      refreshCombatScreen();
      return;
    } else if (action === 'bonus_action_surge') {
      if (combatState._bonusActionUsed || char._actionSurgeUsed) { combatState.phase = 'player'; return; }
      char._actionSurgeUsed = true;
      // Action Surge: attack immediately again this turn (treated as a full extra attack action)
      combatState.log.push(`⚡ ¡OLEADA DE ACCIÓN! Ataque adicional inmediato.`);
      animateDice(() => {
        const res = P.playerAttack(char, enemy, {});
        if (res.hits && res.dmg > 0) { enemy.hp = Math.max(0, enemy.hp - res.dmg); spawnDmgFloat(res.dmg, res.isCrit, 'enemy'); }
        combatState.log.push(res.isCrit ? `💥 ¡OLEADA CRÍTICO! ${res.dmg} daño!` : res.hits ? `⚔️ Oleada: ${res.dmg} daño a ${enemy.name}.` : `❌ Oleada falla.`);
        checkEnemyDeath(enemy, () => { combatState.phase = 'player'; refreshCombatScreen(); });
      });
      return;
    } else if (action === 'bonus_cunning_hide') {
      if (combatState._bonusActionUsed) { combatState.phase = 'player'; return; }
      combatState._bonusActionUsed = true;
      char._hidden = true;
      combatState.log.push(`👁️ ¡Acción Astuta: Escondido! Ventaja en tu próximo ataque. Golpe furtivo garantizado.`);
      combatState.phase = 'player';
      refreshCombatScreen();
      return;
    } else if (action === 'bonus_cunning_dash') {
      if (combatState._bonusActionUsed) { combatState.phase = 'player'; return; }
      combatState._bonusActionUsed = true;
      // Free flee attempt ignoring normal check
      char.flags.escapeUsed = true;
      combatState.log.push(`🏃 ¡Acción Astuta: Correr! Siguiente huida sin penalización.`);
      combatState.phase = 'player';
      refreshCombatScreen();
      return;
    } else if (action === 'bonus_hex') {
      if (combatState._bonusActionUsed) { combatState.phase = 'player'; return; }
      combatState._bonusActionUsed = true;
      char.addCondition({ id:'hex', name:'Maldición', icon:'🔮', rounds:6 });
      P.applyStatusEffect(enemy, 'weakened', 3);
      combatState.log.push(`🔮 ¡Maldición de Hex! +1d6 daño en ataques mientras el objetivo esté maldito.`);
      combatState.phase = 'player';
      refreshCombatScreen();
      return;
    } else if (action === 'bonus_hunters_mark') {
      if (combatState._bonusActionUsed) { combatState.phase = 'player'; return; }
      combatState._bonusActionUsed = true;
      char.addCondition({ id:'hunters_mark', name:'Marca del Cazador', icon:'🎯', rounds:10 });
      combatState.log.push(`🎯 ¡Marca del Cazador! +1d6 daño extra en cada ataque a ${enemy.name}.`);
      combatState.phase = 'player';
      refreshCombatScreen();
      return;
    } else if (action === 'ability') {
      const abilityIdx = (param !== undefined && param !== null) ? parseInt(param) : 0;
      const ability = char.abilities[abilityIdx];
      if (!ability || ability.curUses <= 0) { combatState.phase = 'player'; return; }
      const res = P.useAbility(char, ability, enemy);
      combatState.log.push(res.msg);
      if (res._wildSurgeMsg) combatState.log.push(res._wildSurgeMsg);
      if (res.dmg > 0) {
        enemy.hp = Math.max(0, enemy.hp - res.dmg);
        if (ability.bonusAction) {
          combatState._bonusActionUsed = true;
          checkEnemyDeath(enemy, () => {
            combatState.phase = 'player';
            refreshCombatScreen();
          });
        } else {
          checkEnemyDeath(enemy, endPlayerTurn);
        }
      } else {
        if (ability.bonusAction) {
          combatState._bonusActionUsed = true;
          combatState.phase = 'player';
          refreshCombatScreen();
        } else {
          endPlayerTurn();
        }
      }
    } else if (action === 'spell') {
      openSpellMenu(); return;
    } else if (action === 'item') {
      // Unknown potion handling
      const invItem = char.inventory.find(i => i.id === param);
      if (invItem && invItem.e === 'unknown_potion') {
        const realId = invItem._real;
        const realItem = P.ITEMS.find(i => i.id === realId) || { name:'Poción Básica', e:'heal', val:10, id: realId };
        combatState.log.push(`🧪 Usas el ${esc(invItem.name)} — ¡Es ${esc(realItem.name||realId)}!`);
        char.inventory = char.inventory.filter(i => i !== invItem);
        if (realItem.e === 'heal') {
          const healed = realItem.val || 10;
          char.hp = Math.min(char.maxHP, char.hp + healed);
          char.stats.healingDone += healed;
          combatState.log.push(`💚 Recuperas ${healed} HP.`);
        } else if (realItem.e === 'poison') {
          P.applyStatusEffect(char, 'poisoned', 3);
          combatState.log.push(`☠️ ¡Era veneno! Envenenado.`);
        }
        endPlayerTurn();
        return;
      }
      const itemMsg = char.useItem(param);
      if (itemMsg) {
        combatState.log.push(`🧪 ${itemMsg}`);
        P.showNotification(itemMsg, 'success', 2000);
      }
      endPlayerTurn();
    } else if (action === 'flee') {
      const fleeRoll = P.utils.d20() + char.getMod('dex');
      const enemyDC  = 10 + (combatState.enemies[0]?.cr || 1) * 2;
      if (char.flags.escapeUsed || fleeRoll >= enemyDC) {
        char.flags.escapeUsed = false;
        combatState = null;
        P.showNotification('¡Huiste del combate!', 'info', 2000);
        setTimeout(() => navigate('world'), 500);
      } else {
        combatState.log.push(`🏃 Intentas huir (${fleeRoll} vs ${enemyDC}). ¡Fallas! El enemigo aprovecha.`);
        combatState.phase = 'player';
        setTimeout(() => enemyTurn(), 800);
      }
      return;
    } else if (action === 'smite') {
      animateDice(() => {
        const res = P.playerAttack(char, enemy, { divineSmite: true });
        if (res.hits && res.dmg > 0) {
          enemy.hp = Math.max(0, enemy.hp - res.dmg);
        }
        combatState.log.push(res.hits ? `⚡ GOLPE DIVINO: ${res.dmg} daño a ${enemy.name}! [HP: ${enemy.hp}/${enemy.maxHP}]` : `❌ Golpe Divino falla.`);
        checkEnemyDeath(enemy, endPlayerTurn);
      });
      return;
    }
    refreshCombatScreen();
  }

  // Helper — true death when 3 death save failures
  function _triggerActualDeath(enemy) {
    char.deathCount++;
    char.stats.deaths++;
    char._isDown = false;
    combatState.deathMsg = `Caído ante ${enemy?.name||'un enemigo'} en ${P.LOCATIONS?.find(l=>l.id===char.currentLocation)?.name||'el camino'}.`;
    P.Audio.sfx.death();
    P.Storage.addScore(P.Storage.calcScore(char));
    combatState.log.push('💀 Tres fallos... La oscuridad te envuelve.');
    refreshCombatScreen();
    if (char.permadeath) P.SaveSystem.deleteSave();
    setTimeout(() => navigate('gameover'), 2200);
  }

  function openSpellMenu() {
    if (!char || !char.spells || char.spells.length === 0) return;
    const enemy = combatState?.enemies[combatState.currentEnemyIdx];
    // Build a simple spell picker overlay
    const spellHTML = `
      <div class="dnd-spell-menu" id="dnd-spell-menu">
        <h3>🔮 Elegir Hechizo</h3>
        ${char.spells.map(sp => `<button class="dnd-btn dnd-btn-choice" onclick="root._dndGame.castSpellAction('${sp.id}')">${sp.icon||'🔮'} ${esc(sp.name)} — ${esc(sp.desc||'')}</button>`).join('')}
        <button class="dnd-btn dnd-btn-ghost" onclick="document.getElementById('dnd-spell-menu').remove();root._dndParts.combatState={...root._dndParts.combatState,phase:'player'}">Cancelar</button>
      </div>`;
    overlay().insertAdjacentHTML('beforeend', spellHTML);
    // Re-expose combatState for cancel
    root._dndParts.combatState = combatState;
    combatState.phase = 'spell_menu';
  }

  function castSpellAction(spellId) {
    document.getElementById('dnd-spell-menu')?.remove();
    const spell = char.spells.find(s => s.id === spellId);
    const enemy = combatState?.enemies[combatState.currentEnemyIdx];
    if (!spell || !enemy) { combatState.phase = 'player'; return; }
    combatState.phase = 'busy';
    animateDice(() => {
      const res = P.castSpell(char, spell, enemy);
      combatState.log.push(res.msg);

      // Wild Magic surge for Sorcerer (20% chance per spell cast)
      if (char.cls.id === 'sorcerer' && Math.random() < 0.20) {
        P.triggerWildMagic(char, enemy, res);
        if (res._wildSurgeMsg) combatState.log.push(res._wildSurgeMsg);
      }

      if (res.dmg > 0) {
        checkEnemyDeath(enemy, endPlayerTurn);
      } else {
        endPlayerTurn();
      }
    });
  }

  function checkEnemyDeath(enemy, callback) {
    // Boss phase 2 at 50% HP
    const PHASE2_MSGS = {
      goblin_king: '"\u00a1KRAX NO SE RINDE! \u00a1KRAX ES ETERNOOO!"',
      forest_guardian: '\u00a1El guardi\u00e1n se fusiona con el bosque! Ra\u00edces y ramas lo envuelven.',
      lich_minor: '"Mi filacte\u00e1ria no puede destruirse..."',
      golem_stone: '[ACTIVANDO MODO DESTRUCCI\u00d3N]',
      beholder: '"Tu existencia\u2026 es un error."',
      dragon_ancient: '\u00a1El drag\u00f3n abre sus alas, listo para el aliento final!',
      katosx_shade: '"git push --force origin life"',
      elder_brain: '[La red ps\u00edquica colapsa y se reconstituye]',
      el_decano: '"\u00a1RECURSO DENEGADO! \u00a1Les llamar\u00e9 a las autoridades acad\u00e9micas!"',
    };
    if (enemy.boss && !enemy._phase2Triggered && enemy.hp > 0 && enemy.hp <= Math.floor(enemy.maxHP / 2)) {
      enemy._phase2Triggered = true;
      enemy.atk = Math.ceil(enemy.atk * 1.2);
      enemy.ac  = Math.min(enemy.ac + 1, 25);
      const p2msg = enemy.phase2Msg || PHASE2_MSGS[enemy.id] || '';
      combatState.log.push(`\u26a1 \u00a1${enemy.name} entra en FASE 2! Furia desatada. (+ATK, +CA)`);
      if (p2msg) combatState.log.push(`💬 ${p2msg}`);
      P.Particles.spawnBurst('fire');
    }
    if (enemy.hp <= 0) {
      enemy.hp = 0;
      char.stats.kills++;
      P.Storage.unlock('killed_' + enemy.id);

      // Kill streak
      char._killStreak = (char._killStreak || 0) + 1;
      char.stats.maxStreak = Math.max(char.stats.maxStreak || 0, char._killStreak);
      if (char._killStreak > 1) {
        combatState.log.push(`🔥 ¡RACHA x${char._killStreak}! +${char._killStreak * 5}% daño`);
        P.Particles.spawnBurst('sparks');
      }
      // Elite kill tracking
      if (enemy.isElite) char._eliteKills = (char._eliteKills||0) + 1;
      // No-damage tracking
      if (!combatState._tookDamageThisFight) char._noDamageLastFight = true;

      // Quest update
      P.QuestTracker.update(char, 'kill', { id: enemy.id });
      if (enemy.boss) P.QuestTracker.update(char, 'kill_boss', { id: enemy.id });

      // Loot
      const loot = P.generateLoot(enemy, char.level);
      let lootMsg = [];
      loot.forEach(l => {
        if (l.type === 'gold') { char.gold += l.amount; char.stats.goldEarned += l.amount; lootMsg.push(`💰 ${fmtGold(l.amount)}`); }
        if (l.type === 'item') { char.addItem(l.item); lootMsg.push(`${l.item.icon} ${l.item.name}${l.isRareDrop?' ✦':''}`); P.QuestTracker.update(char,'item_gained',{id:l.item.id}); }
      });
      combatState.log.push(`☠️ ${enemy.name} derrotado! XP: +${enemy.xp}`);
      if (lootMsg.length) combatState.log.push(`🎁 Botín: ${lootMsg.join(', ')}`);

      // XP and leveling
      const leveledUp = char.gainXP(enemy.xp);

      // Location completion on boss kill
      if (enemy.boss) {
        const completed = world.complete(char, char.currentLocation);
        if (completed) combatState.log.push(`🏆 ¡Zona completada! +${completed.xp} XP, +${fmtGold(completed.gold)}`);
        // True ending trigger
        if (enemy.id === 'dragon_ancient') {
          P.QuestTracker.update(char, 'kill_boss', { id:'dragon_ancient' });
          P.Audio.sfx.levelUp();
          setTimeout(() => navigate('victory'), 2000);
          return;
        }
      }

      // Check for more enemies in wave
      combatState.currentEnemyIdx++;
      if (combatState.currentEnemyIdx < combatState.enemies.length) {
        const next = combatState.enemies[combatState.currentEnemyIdx];
        combatState.log.push(`⚔️ ¡Nuevo enemigo! ${next.name} entra en combate!`);
        combatState.phase = 'player';   // ← must be set BEFORE render so buttons are enabled
        combatState._bonusActionUsed = false;
        refreshCombatScreen();
        return;
      }

      // All enemies dead → victory
      P.Audio.sfx.chest();
      P.Particles.spawnBurst('gold');
      if (leveledUp) showLevelUp();
      combatState.log.push('✅ ¡Victoria! Todos los enemigos derrotados.');
      refreshCombatScreen();

      const completedQuests = P.QuestTracker.update(char, 'check', {});
      completedQuests.forEach(q => {
        P.showNotification(`📜 ¡Misión completada: ${q.title}! +${fmtGold(q.reward?.gold||0)}, +${q.reward?.xp||0} XP`, 'success', 5000);
      });

      // Check achievements after combat
      checkAchievements(char);

      autoSaveIfNeeded();
      setTimeout(() => {
        combatState = null;
        navigate('world');
      }, 2500);
    } else {
      callback();
    }
  }

  function endPlayerTurn() {
    combatState._bonusActionUsed = false;
    combatState.phase = 'enemy';
    refreshCombatScreen();
    setTimeout(() => enemyTurn(), 1200);
  }

  function enemyTurn() {
    const enemy = combatState?.enemies[combatState.currentEnemyIdx];
    if (!enemy || combatState?.phase !== 'enemy') return;

    // Tick status effects on ENEMY at start of their turn
    const enemyStatusMsgs = P.tickStatusDamage(enemy, false);
    enemyStatusMsgs.forEach(m => combatState.log.push(m));
    P.tickEnemyConditions(enemy);

    // If enemy died from status effects, trigger death
    if (enemy.hp <= 0) {
      checkEnemyDeath(enemy, () => {});
      return;
    }

    const result = P.enemyAI(enemy, char);
    combatState.log.push(result.msg || '');
    if (!result.skipped && !result.fled) {
      P.triggerAnimation('enemy', 'dnd-attack-lunge-enemy');
      if (result.hits) {
        setTimeout(() => {
          P.triggerAnimation('player', 'dnd-damage-shake');
        }, 150);
      }
    }

    // Enemy bark on attack
    if (!result.skipped && !result.fled) {
      const hpPct = enemy.hp / enemy.maxHP;
      const barkSit = hpPct < 0.3 ? 'low_hp' : 'attack';
      const bark = P.getEnemyBark(enemy, barkSit);
      if (bark && Math.random() < 0.5) combatState.log.push(bark);
    }

    if (result.skipped) {
      // Opportunity Attack when enemy flees
      if (result.fled) {
        combatState.log.push(`⚔️ ¡ATAQUE DE OPORTUNIDAD! ${enemy.name} intenta escapar...`);
        const oaRes = P.playerAttack(char, enemy, {});
        if (oaRes.hits && oaRes.dmg > 0) {
          enemy.hp = Math.max(0, enemy.hp - oaRes.dmg);
          spawnDmgFloat(oaRes.dmg, oaRes.isCrit, 'enemy');
          combatState.log.push(oaRes.isCrit
            ? `💥 ¡Ataque de oportunidad CRÍTICO! ${oaRes.dmg} daño.`
            : `⚔️ Golpe de oportunidad: ${oaRes.dmg} daño. [HP: ${enemy.hp}/${enemy.maxHP}]`);
          if (enemy.hp <= 0) { checkEnemyDeath(enemy, () => {}); return; }
        } else {
          combatState.log.push(`❌ Fallas el ataque de oportunidad.`);
        }
      }
      combatState.phase = 'player';
      refreshCombatScreen();
      return;
    }

    // Reset kill streak if enemy hit the player
    if (result.hits && result.dmg > 0) {
      char._killStreak = 0;
      combatState._tookDamageThisFight = true;
      // Concentration break check
      if (char._concentration) {
        const conSave = d20() + char.getMod('con');
        const dc = Math.max(10, Math.floor(result.dmg / 2));
        if (conSave < dc) {
          combatState.log.push(`💨 ¡Concentración rota! ${char._concentration.name} se cancela. (${conSave}<${dc})`);
          char._concentration = null;
        }
      }
      // Spawn damage float on player
      spawnDmgFloat(result.dmg, result.isCrit, 'player');
    }

    // Check player death
    if (char.isDead) {
      // last_stand trinket: survive once at 1 HP
      const lastCoin = char.equipment?.trinket?.special === 'last_stand' && !char._lastStandUsed;
      if (lastCoin) {
        char._lastStandUsed = true;
        char.hp = 1;
        char.isDead = false;
        combatState.log.push(`🪙 ¡La Moneda del Último Soldado activa su magia! Sobrevives con 1 HP.`);
        combatState.phase = 'player';
        refreshCombatScreen();
        return;
      }

      // ── DEATH SAVING THROWS (non-permadeath) ────────────────
      if (!char.permadeath) {
        if (!char._isDown) {
          char._isDown = true;
          char._deathSaves = { success:0, fail:0 };
          combatState.log.push('💀 ¡HP a 0! Iniciando Tiradas de Salvación vs Muerte...');
        }
        combatState.phase = 'death_saves';
        refreshCombatScreen();
        return;
      }

      // Permadeath → instant death
      char.deathCount++;
      char.stats.deaths++;
      combatState.deathMsg = `Caído ante ${enemy.name} en ${P.LOCATIONS.find(l=>l.id===char.currentLocation)?.name||'el camino'}.`;
      P.Audio.sfx.death();
      P.Storage.addScore(P.Storage.calcScore(char));
      combatState.log.push('💀 MUERTE PERMANENTE. Partida terminada.');
      refreshCombatScreen();
      P.SaveSystem.deleteSave();
      setTimeout(() => navigate('gameover'), 2000);
      return;
    }

    // ── INJURY CHECK ─────────────────────────────────────────
    if (char.hp <= Math.floor(char.maxHP * 0.25) && !char.hasCondition('injured') && char.hp > 0) {
      char.addCondition({ id:'injured', name:'Herido', icon:'⚠️', desc:'-1 a tiradas', rounds:-1 });
      combatState.log.push('⚠️ ¡Herido! -1 a todas las tiradas hasta largo descanso.');
    }

    combatState.phase = 'player';
    combatState._bonusActionUsed = false;
    // Tick player status effect damage at end of enemy turn
    const playerStatusMsgs = P.tickStatusDamage(char, true);
    playerStatusMsgs.forEach(m => combatState.log.push(m));
    char.tickConditions();
    refreshCombatScreen();
    P.Audio.sfx.attack();
  }

  function refreshCombatScreen() {
    if (!combatState) return;
    const enemy = combatState.enemies[combatState.currentEnemyIdx];
    if (!enemy) return;
    render(P.buildCombatScreen(char, [enemy], combatState.log, combatState.phase, combatState._bonusActionUsed));
    // Auto-scroll log to bottom
    setTimeout(() => {
      const log = document.getElementById('dnd-combat-log');
      if (log) log.scrollTop = log.scrollHeight;
    }, 50);
  }

  // Floating damage number
  function spawnDmgFloat(dmg, isCrit, side = 'enemy') {
    const el = document.createElement('div');
    el.className = `dnd-dmg-float${isCrit ? ' dnd-dmg-crit' : ''}`;
    el.textContent = isCrit ? `💥 ${dmg}!` : `-${dmg}`;
    const target = document.querySelector(side === 'enemy' ? '.dnd-enemy-side' : '.dnd-player-side');
    if (target) {
      target.style.position = 'relative';
      target.appendChild(el);
      setTimeout(() => el.remove(), 1200);
    }
  }

  function animateDice(callback) {
    const diceEl = document.getElementById('dnd-dice-anim');
    if (!diceEl) { callback(); return; }
    const faces = ['⚀','⚁','⚂','⚃','⚄','⚅','🎲'];
    let i = 0;
    diceEl.classList.add('rolling');
    const iv = setInterval(() => {
      diceEl.textContent = faces[i % faces.length];
      i++;
      if (i >= 8) { clearInterval(iv); diceEl.classList.remove('rolling'); diceEl.textContent = '🎲'; callback(); }
    }, 80);
  }

  // ── LEVEL UP ─────────────────────────────────────────────────
  function showLevelUp() {
    const html = P.buildLevelUpOverlay(char, char.level);
    overlay().insertAdjacentHTML('beforeend', html);
    P.Particles.spawnBurst('magic');
    P.QuestTracker.update(char, 'level_up', {});
  }

  // ── ASI / FEAT SCREEN ────────────────────────────────────────
  function showASIScreen() {
    render(P.buildASIScreen(char));
  }

  // _asiDualPick: tracks dual stat selection
  let _asiDualSelected = [];

  function toggleASIDual(btn, stat) {
    const idx = _asiDualSelected.indexOf(stat);
    if (idx >= 0) {
      _asiDualSelected.splice(idx, 1);
      btn.classList.remove('dnd-asi-selected');
    } else if (_asiDualSelected.length < 2) {
      _asiDualSelected.push(stat);
      btn.classList.add('dnd-asi-selected');
    }
    const confirmBtn = document.getElementById('dnd-asi-dual-confirm');
    if (confirmBtn) confirmBtn.style.display = _asiDualSelected.length === 2 ? 'block' : 'none';
  }

  function applyASIDual() {
    if (_asiDualSelected.length !== 2) return;
    const [s1, s2] = _asiDualSelected;
    if (char.baseStats[s1] < 20) char.baseStats[s1]++;
    if (char.baseStats[s2] < 20) char.baseStats[s2]++;
    _asiDualSelected = [];
    char._pendingASI = false;
    P.showNotification(`⬆️ +1 ${s1.toUpperCase()} y +1 ${s2.toUpperCase()}`, 'success', 3000);
    navigate('world');
  }

  function applyASI(type, value) {
    if (type === 'stat2') {
      if (char.baseStats[value] < 20) char.baseStats[value] += 2;
      char._pendingASI = false;
      P.showNotification(`⬆️ +2 ${value.toUpperCase()}`, 'success', 3000);
      navigate('world');
    } else if (type === 'feat') {
      const feat = P.FEATS.find(f => f.id === value);
      if (feat) {
        feat.apply(char);
        char._feats = char._feats || [];
        if (!char._feats.includes(feat.id)) char._feats.push(feat.id);
        char._pendingASI = false;
        P.showNotification(`✦ Talento obtenido: ${feat.icon} ${feat.name}`, 'success', 4000);
        navigate('world');
      }
    }
  }

  // ── INVENTORY ACTIONS ─────────────────────────────────────────
  function equipItem(itemId) {
    const item = char.inventory.find(i => i.id === itemId);
    if (!item || !item.slot) { P.showNotification('No se puede equipar.', 'warn'); return; }
    const check = P.InventoryManager.canEquip(char, item);
    if (!check.ok) { P.showNotification(check.reason, 'warn'); return; }
    char.equip(item);
    P.Audio.sfx.equip();
    P.showNotification(`Equipado: ${item.name}`, 'success', 2000);
    navigate('inventory');
  }

  function unequip(slot) {
    const item = char.equipment[slot];
    if (!item) return;
    char.unequip(slot);
    P.showNotification(`Desequipado: ${item.name}`, 'info', 1500);
    navigate('inventory');
  }

  function useItem(itemId) {
    const msg = char.useItem(itemId);
    if (msg) P.showNotification(msg, 'success', 2500);
    navigate('inventory');
  }

  function sellItem(itemId) {
    const result = P.MerchantSystem.sell(char, itemId, 1);
    P.showNotification(result.msg, result.ok ? 'success' : 'error', 2000);
    navigate('inventory');
  }

  function sortInv(by) {
    char.inventory = P.InventoryManager.sort(char.inventory, by);
    navigate('inventory');
  }

  function buyItem(itemId) {
    const item = currentShop?.find(i => i.id === itemId);
    if (!item) return;
    const result = P.MerchantSystem.buy(char, item, 1);
    P.showNotification(result.msg, result.ok ? 'success' : 'error', 2500);
    if (result.ok && item.stock > 1) item.stock--;
    else if (result.ok) currentShop = currentShop.filter(i => i.id !== itemId);
    render(P.buildMerchantScreen(char, currentMerchant, currentShop || []));
  }

  // ── TOOLTIP ──────────────────────────────────────────────────
  function showTooltip(el, itemId) {
    const item = char?.inventory.find(i => i.id === itemId) || P.ITEMS.find(i => i.id === itemId);
    if (!item) return;
    hideTooltip();
    _tooltipEl = document.createElement('div');
    _tooltipEl.className = 'dnd-tooltip';
    _tooltipEl.innerHTML = P.InventoryManager.itemTooltip(item, char);
    const rect = el.getBoundingClientRect();
    _tooltipEl.style.cssText = `position:fixed;top:${rect.bottom+4}px;left:${rect.left}px;z-index:9999`;
    document.body.appendChild(_tooltipEl);
  }

  function hideTooltip() {
    if (_tooltipEl) { _tooltipEl.remove(); _tooltipEl = null; }
  }

  // ── QUEST ACTIONS ────────────────────────────────────────────
  function acceptQuest(questId) {
    const q = P.QuestTracker.accept(char, questId);
    if (q) P.showNotification(`📜 Misión aceptada: ${q.title}`, 'success', 3000);
    navigate('quests');
  }

  // ── WORLD REST ───────────────────────────────────────────────
  function worldRest(type) {
    const res = world.rest(char, type);
    P.showNotification(res.msg, 'success', 3000);
    navigate('world');
  }

  // ── LORE TAB ─────────────────────────────────────────────────
  function loreTab(tab, btn) {
    document.querySelectorAll('.dnd-lore-panel').forEach(p => p.style.display = 'none');
    document.querySelectorAll('.dnd-tab').forEach(b => b.classList.remove('active'));
    const panel = document.querySelector(`.dnd-lore-${tab}`);
    if (panel) panel.style.display = 'block';
    if (btn) btn.classList.add('active');
  }

  // ── DEVELOPER ROOM ───────────────────────────────────────────
  function enterDevRoom() {
    if (char && !char.flags.devRoomUnlocked) {
      P.showNotification('No tienes acceso. Completa la quest secreta primero.', 'warn', 3000);
      navigate('world'); return;
    }
    P.Storage.unlock('entered_dev_room');
    P.Audio.sfx.secret();
    P.Particles.spawnBurst('magic');
    render(P.buildDevRoomScreen(char));
  }

  function devCommand(cmd) {
    const out = document.getElementById('dnd-dev-output');
    const input = document.getElementById('dnd-dev-input');
    if (!out || !input) return;
    const clean = (cmd||'').trim().toLowerCase();
    let response = '';
    input.value = '';

    switch(clean) {
      case 'help':
        response = '> Comandos: help | whoami | score | lore | unlock | godmode | matrix | version'; break;
      case 'whoami':
        response = char ? `> Eres: ${char.name}, ${char.cls.name} Nv${char.level}` : '> No hay personaje activo.'; break;
      case 'score':
        response = char ? `> Tu score: ${P.Storage.calcScore(char)} puntos` : '> Sin datos.'; break;
      case 'lore':
        response = `> Lore desbloqueado: ${char?.loreFound?.length||0} / ${P.LORE.length}`; break;
      case 'unlock':
        if (char) { char.loreFound = P.LORE.map(l=>l.id); response = '> Todo el lore desbloqueado.'; } break;
      case 'godmode':
        if (char) { char.hp = 9999; char.maxHP = 9999; char.gold = 99999; response = '> GODMODE: HP y oro maximizados.'; }
        P.Storage.unlock('used_godmode'); break;
      case 'matrix':
        response = '> [ THERE IS NO SPOON ]\n> [ TAMBIÉN NO HAY DUNGEON. SOLO CÓDIGO. ]';
        P.Particles.spawnBurst('matrix'); break;
      case 'version':
        response = '> KATOSX_RPG v2.0 — Built by Daniel Salini\n> "El 20% extra es lo que te recuerdan."'; break;
      default:
        response = `> Comando desconocido: "${clean}". Escribe "help".`;
    }

    out.textContent += '\n' + (response || '>');
    out.scrollTop = out.scrollHeight;
  }

  // ── KONAMI CODE LISTENER ────────────────────────────────────
  const konamiSeq = [38,38,40,40,37,39,37,39,66,65];
  let konamiIdx   = 0;
  function initKonamiListener() {
    document.addEventListener('keydown', function(e) {
      if (e.keyCode === konamiSeq[konamiIdx]) {
        konamiIdx++;
        if (konamiIdx === konamiSeq.length) {
          konamiIdx = 0;
          if (!overlay()?.classList.contains('dnd-open')) open();
          else if (char) { char.flags.devRoomUnlocked = true; P.showNotification('🎮 KONAMI CODE! Dev Room desbloqueada.', 'success', 4000); }
          P.Storage.unlock('konami_code');
        }
      } else {
        konamiIdx = e.keyCode === konamiSeq[0] ? 1 : 0;
      }
    });
  }

  // ── AUTO SAVE HELPER ─────────────────────────────────────────
  function autoSaveIfNeeded() {
    if (char && !char.hardcore && !char.permadeath) P.SaveSystem.save(char, world);
  }

  // ── CONSOLE API ──────────────────────────────────────────────
  root.dnd = {
    secret:  () => { P.Audio.sfx.secret(); P.showNotification('🔮 Has despertado algo. Busca los fragmentos de código.', 'info', 5000); if(char){char.flags.meta_aware=true;} console.log('%c✦ KATOSX — El Easter Egg más grande que nadie pidió. ✦\nHay 4 fragmentos de código, 1 sala de debug, y una verdad al final del camino.', 'color:#8b5cf6;font-size:14px;'); },
    devroom: () => { if(!overlay()?.classList.contains('dnd-open')) open(); setTimeout(() => { if(char){char.flags.devRoomUnlocked=true; enterDevRoom();} else P.showNotification('Inicia una partida primero.','warn'); }, 500); },
    godmode: () => { if(char){ char.hp=9999; char.maxHP=9999; char.gold=99999; P.showNotification('GODMODE activado.','success'); P.Storage.unlock('used_godmode'); navigate('world'); } else console.warn('[DND] No hay personaje activo.'); },
    open:    () => open(),
    close:   () => close(),
    nav:     (s) => navigate(s),
    info:    () => console.log('%c[DND] Parts loaded:', 'color:#8b5cf6;', Object.keys(root._dndParts))
  };

  // ── EXPOSE GAME METHODS FOR INLINE HTML ─────────────────────
  root._dndGame = {
    getChar: () => char,
    getCCSelections: () => ccSelections,
    navigate, open, close, loadGame, startGame, explore, resolveChoice,
    ccSelect, ccNext, ccPrev, ccRollStats, ccStandardArray, ccRandomName,
    enterLocation, combatAction, openSpellMenu, castSpellAction,
    equipItem, unequip, useItem, sellItem, sortInv, buyItem,
    showTooltip, hideTooltip, acceptQuest, worldRest, loreTab,
    devCommand, enterDevRoom,
    showASIScreen, toggleASIDual, applyASIDual, applyASI,
    checkAchievements
  };

  // ── INITIALIZATION ───────────────────────────────────────────
  function init() {
    // Expose 'root' globally so inline onclick handlers can use root._dndGame
    if (!window.root) window.root = window;

    // Inject fonts if not present
    if (!document.querySelector('#dnd-fonts')) {
      const link = document.createElement('link');
      link.id   = 'dnd-fonts';
      link.rel  = 'stylesheet';
      link.href = 'https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700;900&family=Cinzel+Decorative:wght@700&family=Roboto+Mono:wght@400;700&display=swap';
      document.head.appendChild(link);
    }

    // Bind trigger button
    const trigger = document.getElementById('dndTrigger');
    if (trigger) {
      trigger.addEventListener('click', function() {
        if (!overlay()?.classList.contains('dnd-open')) open();
      });
      // Easter egg hint: double-click changes label
      trigger.addEventListener('dblclick', function() {
        const label = trigger.querySelector('.dnd-label');
        if (label) {
          label.textContent = '¿Seguro?';
          setTimeout(() => { label.textContent = 'Púlsame'; }, 2000);
        }
      });
    }

    // Close on ESC
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && overlay()?.classList.contains('dnd-open')) {
        if (combatState) {
          P.showNotification('No puedes escapar durante el combate con ESC. Usa el botón Huir.', 'warn', 2000);
          return;
        }
        close();
      }
    });

    // Konami code
    initKonamiListener();

    console.log('%c✦ KATOSX RPG v2.0 — Easter Egg cargado. Escribe dnd.secret() para empezar. ✦', 'color:#8b5cf6;font-size:13px;font-weight:bold;');
    console.log('%c¿Qué es dnd.devroom()? ¿Qué es dnd.godmode()? Tú decides.', 'color:#7c3aed;');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  console.log('%c[DND] Part 10 loaded — GAME ENGINE COMPLETE ✦', 'color:#22c55e;font-weight:bold;font-size:14px;');

})(window);
