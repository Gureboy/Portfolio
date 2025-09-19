// --- COMBATE POR TURNOS CLÁSICO D&D ---
// Juego roguelike D&D por turnos, con bestiario, clases, inventario, hechizos, vendedores y sistema d20

// --- DATA: CLASSES, RACES, BACKGROUNDS, SPELLS, MONSTERS, ITEMS ---
const CLASSES = [
  {
    name: "Bárbaro",
    hitDie: 12,
    baseAC: 15,
    str: 3, dex: 1, con: 2, int: 0, wis: 0, cha: 0,
    desc: "Guerrero salvaje, gran fuerza y resistencia.",
    abilities: ["Ira", "Resistencia Salvaje"]
  },
  {
    name: "Mago",
    hitDie: 6,
    baseAC: 12,
    str: 0, dex: 1, con: 0, int: 3, wis: 1, cha: 0,
    desc: "Maestro de la magia arcana, frágil pero poderoso.",
    abilities: ["Hechizos", "Cantrips"]
  },
  {
    name: "Clérigo",
    hitDie: 8,
    baseAC: 14,
    str: 1, dex: 0, con: 2, int: 0, wis: 3, cha: 1,
    desc: "Sanador y protector, canaliza poder divino.",
    abilities: ["Curar", "Hechizos Divinos"]
  },
  {
    name: "Invocador",
    hitDie: 8,
    baseAC: 13,
    str: 0, dex: 1, con: 1, int: 2, wis: 2, cha: 1,
    desc: "Llama criaturas y controla el campo de batalla.",
    abilities: ["Invocar", "Hechizos"]
  },
  {
    name: "Monje",
    hitDie: 8,
    baseAC: 15,
    str: 1, dex: 3, con: 1, int: 0, wis: 2, cha: 0,
    desc: "Maestro marcial, rápido y evasivo.",
    abilities: ["Golpe Marcial", "Esquiva"]
  },
  {
    name: "Luchador",
    hitDie: 10,
    baseAC: 16,
    str: 2, dex: 2, con: 2, int: 0, wis: 0, cha: 0,
    desc: "Versátil y resistente, experto en armas.",
    abilities: ["Ataque Extra", "Defensa"]
  },
  {
    name: "Paladín",
    hitDie: 10,
    baseAC: 17,
    str: 2, dex: 0, con: 2, int: 0, wis: 1, cha: 2,
    desc: "Guerrero sagrado, combina fuerza y magia.",
    abilities: ["Imposición de Manos", "Hechizos Divinos"]
  },
  {
    name: "Hobgoblin",
    hitDie: 8,
    baseAC: 14,
    str: 2, dex: 2, con: 2, int: 0, wis: 0, cha: 0,
    desc: "Guerrero disciplinado, táctico y fuerte.",
    abilities: ["Disciplina Marcial", "Tácticas de Batalla"]
  }
];

const RACES = [
  { name: "Humano", bonus: {str:1, dex:1, con:1, int:1, wis:1, cha:1}, desc: "Versátil y adaptable." },
  { name: "Elfo", bonus: {dex:2, int:1}, desc: "Ágil y sabio, visión en la oscuridad." },
  { name: "Enano", bonus: {con:2, str:1}, desc: "Resistente y fuerte, robusto." },
  { name: "Mediano", bonus: {dex:2, cha:1}, desc: "Pequeño, escurridizo y carismático." },
  { name: "Dracónido", bonus: {str:2, cha:1}, desc: "Descendiente de dragones, aliento elemental." },
  { name: "Hobgoblin", bonus: {con:2, int:1}, desc: "Marcial, disciplinado y astuto." }
];

const BACKGROUNDS = [
  { name: "Aventurero", desc: "Busca gloria y tesoros." },
  { name: "Erudito", desc: "Conocedor de saberes antiguos." },
  { name: "Soldado", desc: "Entrenado en combate." },
  { name: "Noble", desc: "De familia influyente." },
  { name: "Forajido", desc: "Vive al margen de la ley." },
  { name: "Clérigo", desc: "Devoto a una deidad." }
];

// Cantrips únicos por clase
const CANTRIPS = {
  "Mago": [
    { name: "Prestidigitación", desc: "Trucos menores mágicos." },
    { name: "Rayo de Escarcha", desc: "Inflige daño leve y ralentiza." },
    { name: "Mano Mágica", desc: "Manipula objetos a distancia." }
  ],
  "Clérigo": [
    { name: "Luz", desc: "Ilumina una zona." }
  ],
  "Paladín": [
    { name: "Luz Sagrada", desc: "Causa daño radiante menor." }
  ],
  "Bárbaro": [
    { name: "Grito Intimidante", desc: "Asusta a un enemigo débil." }
  ],
  "Invocador": [
    { name: "Chispa", desc: "Causa daño eléctrico menor." }
  ],
  "Monje": [
    { name: "Puño de Energía", desc: "Golpe mágico menor." }
  ],
  "Luchador": [
    { name: "Tajo Rápido", desc: "Ataque rápido con arma." }
  ],
  "Hobgoblin": [
    { name: "Disciplina Menor", desc: "Bonificación táctica menor." }
  ]
};

// Hechizos solo accesibles por subida de nivel
const SPELLS = {
  "Mago": [
    { name: "Misil Mágico", desc: "Daño automático a un enemigo.", level: 1 },
    { name: "Armadura de mago", desc: "Aumenta la defensa temporalmente.", level: 1 },
    { name: "Bola de Fuego", desc: "Gran daño en área.", level: 3 }
  ],
  "Clérigo": [
    { name: "Curar Heridas", desc: "Restaura puntos de vida.", level: 1 },
    { name: "Bendición", desc: "Mejora tiradas de ataque y salvación.", level: 1 }
  ],
  "Paladín": [
    { name: "Imposición de Manos", desc: "Cura puntos de vida igual a nivel x5.", level: 1 },
    { name: "Escudo de la Fe", desc: "+2 CA durante 1 min.", level: 1 }
  ],
  "Bárbaro": [
    { name: "Furia Potenciada", desc: "Aumenta el daño durante varios turnos.", level: 1 }
  ],
  "Invocador": [
    { name: "Invocar Familiar", desc: "Llama a una criatura menor para ayudar.", level: 1 }
  ],
  "Monje": [
    { name: "Golpe Astral", desc: "Ataque mágico cuerpo a cuerpo.", level: 1 }
  ],
  "Luchador": [
    { name: "Ataque Preciso", desc: "Aumenta la probabilidad de acertar.", level: 1 }
  ],
  "Hobgoblin": [
    { name: "Táctica de Batalla", desc: "Bonificación a aliados cercanos.", level: 1 }
  ]
};

const ITEMS = [
  { name: "Poción de curación", effect: "heal", value: 10, price: 15 },
  { name: "Antorcha", effect: "light", value: 0, price: 2 },
  { name: "Daga", effect: "atk", value: 2, price: 8 },
  { name: "Escudo", effect: "ac", value: 2, price: 20 },
  { name: "Libro de hechizos", effect: "spell", value: 1, price: 25 },
  { name: "Armadura ligera", effect: "ac", value: 1, price: 18 },
  { name: "Poción de fuerza", effect: "str", value: 2, price: 30 }
];

// --- MONSTER BESTIARY ---
const MONSTERS = [
  { name: "Goblin", cr: 0.25, hp: 7, ac: 13, atk: 3, desc: "Pequeño y escurridizo." },
  { name: "Orco", cr: 0.5, hp: 15, ac: 13, atk: 5, desc: "Fuerte y brutal." },
  { name: "Hobgoblin", cr: 0.5, hp: 11, ac: 18, atk: 4, desc: "Marcial y táctico." },
  { name: "Ogro", cr: 2, hp: 59, ac: 11, atk: 9, desc: "Gigante y demoledor." },
  { name: "Dragón Joven", cr: 6, hp: 110, ac: 17, atk: 15, desc: "Poderoso y temido." },
  { name: "Liche", cr: 10, hp: 135, ac: 17, atk: 18, desc: "Hechicero no-muerto legendario." },
  { name: "Beholder", cr: 13, hp: 180, ac: 18, atk: 22, desc: "Monstruo aberrante de muchos ojos." },
  { name: "Tarrasque", cr: 30, hp: 676, ac: 25, atk: 36, desc: "La bestia más temida del multiverso." }
];

// --- MAPAS Y EVENTOS ROGUELIKE ---
const ROOM_TYPES = ['combate','tienda','evento','descanso','boss'];

function generateDungeon(floors=10) {
  let dungeon = [];
  for(let i=0;i<floors;i++) {
    let type = 'combate';
    if(i===floors-1) type = 'boss';
    else if(i>0 && i%3===0) type = Math.random()<0.5?'tienda':'evento';
    else if(i>0 && Math.random()<0.15) type = 'descanso';
    dungeon.push({type, idx:i});
  }
  return dungeon;
}

function renderMinimap(character) {
  const game = document.getElementById('game');
  let html = `<div class='minimap'>`;
  (window.DUNGEON||[]).forEach((room,i)=>{
    let cls = 'minimap-room';
    if(i===character.progress) cls+=' current';
    if(i<character.progress) cls+=' done';
    html += `<span class='${cls}' title='${room.type}'>${room.type[0].toUpperCase()}</span>`;
  });
  html += `</div>`;
  game.insertAdjacentHTML('afterbegin', html);
}

function startAdventure(character) {
  // Generar dungeon procedural
  window.DUNGEON = generateDungeon(12);
  
  character.gold = 20;
  character.xp = 0;
  character.level = 1;
  character.xpToNext = 20;
  character.status = [];
  character.progress = 0;
  character.maxHP = character.class.hitDie + (character.class.con || 0) + 10;
  character.hp = character.maxHP;
  character.ac = character.class.baseAC;
  character.initiative = 0;
  character.dead = false;
  character.combatLog = [];
  
  // Agregar cantrips si están disponibles
  if (CANTRIPS[character.class.name]) {
    character.cantrips = [...CANTRIPS[character.class.name]];
  }
  
  nextBattle(character);
}

function nextBattle(character) {
  // Expandir dungeon si es endless y estamos cerca del final
  if(character.progress >= window.DUNGEON.length - 5) {
    expandEndlessDungeon(character);
  }
  
  // Cada 2 combates, mostrar tienda antes del combate
  if (character.progress > 0 && character.progress % 2 === 0 && !character.justShopped) {
    renderShop(character);
    character.justShopped = true;
    return;
  } else {
    character.justShopped = false;
  }
  
  if (!window.DUNGEON) window.DUNGEON = generateDungeon(12);
  
  // En endless nunca termina, en story mode sí
  if (character.progress >= window.DUNGEON.length && window.selectedChapter && window.selectedChapter.floors !== Infinity) {
    // Victoria total en modo historia
    updateStats(character, 'victory');
    updateRanking(character);
    checkAchievements();
    const game = document.getElementById('game');
    game.innerHTML = `<div class='section'><h2>¡Has completado ${character.chapter}!</h2><p>¡Eres el héroe de esta historia!</p><p>Nivel alcanzado: <b>${character.level}</b> | XP: ${character.xp} | Oro: ${character.gold}</p><p>Turnos jugados: ${character.turns} | Daño recibido: ${character.damageTaken}</p><button class='btn' onclick='renderModeSelection()'>Volver al menú</button></div>`;
    return;
  }
  
  setTimeout(()=>renderMinimap(character), 100);
  const room = window.DUNGEON[character.progress];
  
  if(room.type==='evento') { renderEventRoom(character); return; }
  if(room.type==='descanso') { renderRestRoom(character); return; }
  if(room.type==='boss') { 
    // En endless, usar boss especial cada cierto tiempo
    if(window.selectedChapter && window.selectedChapter.floors === Infinity && character.progress % 20 === 0) {
      renderBossBattleEspecial(character);
    } else {
      renderBossBattle(character);
    }
    return; 
  }
  if(room.type==='tienda' && !character.justShopped) {
    renderShop(character);
    character.justShopped = true;
    return;
  } else {
    character.justShopped = false;
  }
  
  // Combate normal - mejorar selección de monstruo
  const difficultyLevel = Math.floor(character.progress / 3);
  const difficultyMultiplier = 1 + difficultyLevel * 0.25;
  
  // Seleccionar monstruo apropiado para el nivel
  let monsterIndex = Math.min(character.progress, MONSTERS.length - 1);
  if (character.progress >= MONSTERS.length) {
    monsterIndex = Math.floor(Math.random() * MONSTERS.length);
  }
  
  let baseMonster = {...MONSTERS[monsterIndex]};
  let monster = {
    ...baseMonster,
    hp: Math.round(baseMonster.hp * difficultyMultiplier),
    maxHP: Math.round(baseMonster.hp * difficultyMultiplier),
    atk: Math.round(baseMonster.atk * difficultyMultiplier),
    ac: Math.round(baseMonster.ac + difficultyLevel),
    cr: baseMonster.cr * difficultyMultiplier,
    desc: baseMonster.desc + (difficultyLevel > 0 ? ` (Potenciado x${difficultyMultiplier.toFixed(2)})` : ''),
    status: [],
    dead: false
  };
  
  // Progresión: cada 2 enemigos derrotados, el jugador recupera parte de la vida y puede recibir un buff temporal
  if (character.progress > 0 && character.progress % 2 === 0) {
    const heal = Math.round(character.maxHP * 0.3);
    character.hp = Math.min(character.hp + heal, character.maxHP);
    character.combatLog.push(`<span style='color:#6f6'>Recuperas ${heal} HP tras avanzar en el dungeon.</span>`);
    
    if (Math.random() < 0.5) {
      character.status = character.status || [];
      character.status.push({name:'Buff', turns:2});
      character.combatLog.push(`<span style='color:#6cf'>¡Recibes un buff temporal (+2 CA) por 2 combates!</span>`);
      character.ac += 2;
    } else {
      const stats = ['str','dex','con','int','wis','cha'];
      const stat = stats[Math.floor(Math.random()*stats.length)];
      character.class[stat] = (character.class[stat]||0) + 2;
      character.combatLog.push(`<span style='color:#6cf'>¡${stat.toUpperCase()} +2 por 2 combates!</span>`);
      character.status = character.status || [];
      character.status.push({name:'Buff', turns:2, stat});
    }
  }
  
  // Determinar iniciativa (d20 + DEX)
  function rollD20() { return Math.floor(Math.random()*20)+1; }
  character.initiative = rollD20() + (character.class.dex||0) + (character.luckBonus||0);
  monster.initiative = rollD20() + 1;
  
  // Aplicar habilidades de companions
  companionsAbility(character, monster);
  
  let turn = character.initiative >= monster.initiative ? 'player' : 'monster';
  renderCombat(character, monster, turn);
}

function renderCombat(character, monster, turn) {
  // Iconos y descripciones de estados
  const STATUS_ICONS = {
    'Aturdido': '💫', 'Envenenado': '☠️', 'Ralentizado': '🐢', 'Miedo': '😱',
    'Ceguera': '🙈', 'Silencio': '🔇', 'Buff': '✨', 'Debuff': '💢'
  };
  
  const STATUS_DESC = {
    'Aturdido': 'Pierde el turno.', 'Envenenado': 'Recibe daño al final del turno.',
    'Ralentizado': 'Pierde iniciativa y ataque.', 'Miedo': 'No puede atacar, solo huir.',
    'Ceguera': 'Falla ataques y recibe más daño.', 'Silencio': 'No puede lanzar hechizos.',
    'Buff': 'Mejora temporal.', 'Debuff': 'Penalización temporal.'
  };
  
  function statusString(entity, isPlayer) {
    if (!entity.status || !entity.status.length) return '';
    return `<span class='status-icons'>` + entity.status.map((s, idx) => {
      let dispelBtn = '';
      if (isPlayer && ['Envenenado','Ralentizado','Miedo','Ceguera','Silencio','Debuff'].includes(s.name)) {
        dispelBtn = `<button class='dispel-btn' data-idx='${idx}' title='Disipar'>🧹</button>`;
      }
      return `<span class='status-icon' title='${STATUS_DESC[s.name]||s.name}'>${STATUS_ICONS[s.name]||'❓'}${s.turns?`<sup>${s.turns}</sup>`:''}${dispelBtn}</span>`;
    }).join('') + `</span>`;
  }
  
  const game = document.getElementById('game');
  let html = `<div class='section'><h2>¡Combate!</h2>`;
  html += `<div><b class='player'>${character.class.name}</b> (Nv. ${character.level}) XP: ${character.xp}/${character.xpToNext} <br>Oro: <span>${character.gold}</span> | HP: <span>${character.hp}</span>/${character.maxHP} | CA: ${character.ac} ${statusString(character, true)}</div>`;
  html += `<div><b class='enemy'>${monster.name}</b> HP: <span>${monster.hp}</span>/${monster.maxHP} | CA: ${monster.ac} ${statusString(monster, false)}</div>`;
  
  // Mostrar companions activos
  if (character.companions && character.companions.length > 0) {
    html += `<div class='companions'><small>Companions: ${character.companions.map(c=>c.name).join(', ')}</small></div>`;
  }
  
  html += `<div id='combat-log' class='combat-log'></div>`;
  html += `<div id='combat-history' class='combat-history'>${(character.combatLog||[]).slice(-8).map(e=>`<div>${e}</div>`).join('')}</div>`;

  // Manejo de lógica de disipar estados
  setTimeout(()=>{
    document.querySelectorAll('.dispel-btn').forEach(btn=>{
      btn.onclick = (e)=>{
        const idx = +btn.getAttribute('data-idx');
        const status = character.status[idx];
        let canDispel = false;
        
        if(status.name==='Envenenado' && character.inventory && character.inventory.some(i=>i.effect==='heal')) canDispel = true;
        if(status.name==='Silencio' && character.inventory && character.inventory.some(i=>i.name==='Libro de hechizos')) canDispel = true;
        if(status.name==='Miedo' && character.inventory && character.inventory.some(i=>i.name==='Escudo')) canDispel = true;
        if(['Ceguera','Ralentizado','Debuff'].includes(status.name) && character.spells && character.spells.length) canDispel = true;
        
        if(canDispel) {
          character.status.splice(idx,1);
          character.combatLog.push(`<span style='color:#6cf'>Disipas el estado: ${status.name}</span>`);
          renderCombat(character, monster, turn);
        } else {
          alert(`No puedes disipar ${status.name} sin el item/hechizo adecuado.`);
        }
      };
    });
  }, 100);

  // Verificar muerte o victoria
  if(character.dead || monster.dead) {
    if(character.dead) {
      // Verificar si tiene amuleto del destino
      if(character.hasDestinyAmulet) {
        character.hasDestinyAmulet = false;
        character.hp = 1;
        character.dead = false;
        character.combatLog.push(`<span style='color:#ff0'>¡El Amuleto del Destino te salva de la muerte!</span>`);
        renderCombat(character, monster, turn);
        return;
      }
      
      updateStats(character, 'death');
      updateRanking(character);
      checkAchievements();
      html += `<div class='section'><b>¡Has muerto! GAME OVER</b></div>`;
      html += `<button class='btn' onclick='renderModeSelection()'>Volver al menú</button>`;
      game.innerHTML = html;
      return;
    } else {
      // Victoria - Otorgar XP y oro
      updateStats(character, 'monster');
      let xpGain = Math.round((monster.cr||1) * 10 + 5);
      let goldGain = Math.round((monster.cr||1) * 6 + Math.random()*5);
      
      // Aplicar multiplicador de oro si tiene cáliz de la fortuna
      if(character.goldMultiplier) {
        goldGain *= character.goldMultiplier;
      }
      
      character.xp += xpGain;
      character.gold += goldGain;
      character.combatLog.push(`<span style='color:#ff0'>¡Ganas ${xpGain} XP y ${goldGain} de oro!</span>`);
      
      // Intentar drops legendarios y reliquias
      tryLegendaryDrop(character);
      tryRelicDrop(character);
      
      // Loot aleatorio
      if(Math.random()<0.2) {
        let loot = ITEMS[Math.floor(Math.random()*ITEMS.length)];
        character.inventory = character.inventory || [];
        character.inventory.push(loot);
        character.combatLog.push(`<span style='color:#6cf'>¡Encuentras un botín: ${loot.name}!</span>`);
      }
      
      // Sistema de subida de nivel
      let leveledUp = false;
      while(character.xp >= character.xpToNext) {
        character.xp -= character.xpToNext;
        character.level++;
        character.xpToNext = Math.round(character.xpToNext * 1.5 + 10);
        
        const stats = ['str','dex','con','int','wis','cha'];
        const stat = stats[Math.floor(Math.random()*stats.length)];
        character.class[stat] = (character.class[stat]||0) + 1;
        
        let hpGain = Math.floor(character.class.hitDie/2) + 2;
        character.maxHP += hpGain;
        character.hp = character.maxHP;
        character.combatLog.push(`<span style='color:#6f6'>¡Subes a nivel ${character.level}! +1 ${stat.toUpperCase()}, +${hpGain} HP</span>`);
        
        // Aprender nuevo hechizo
        let newSpell = (SPELLS[character.class.name]||[]).find(s=>s.level===character.level && !character.spells.some(sp=>sp.name===s.name));
        if(newSpell) {
          character.spells = character.spells || [];
          character.spells.push(newSpell);
          character.combatLog.push(`<span style='color:#6cf'>¡Aprendes un nuevo hechizo: ${newSpell.name}!</span>`);
        }
        leveledUp = true;
      }
      
      // Reducir duración de buffs
      if(character.status && character.status.length) {
        character.status = character.status.map(s => {
          if(s.name==='Buff' && s.turns) return {...s, turns: s.turns-1};
          return s;
        }).filter(s => !s.turns || s.turns > 0);
        
        if(!character.status.some(s=>s.name==='Buff')) {
          character.ac = character.class.baseAC;
        }
      }
      
      html += `<div class='section'><b>¡Victoria! Has derrotado al monstruo.</b></div>`;
      if(leveledUp) html += `<div class='section' style='color:#6f6'><b>¡Subiste de nivel!</b></div>`;
      html += `<button class='btn' id='next-battle-btn'>Siguiente enemigo</button>`;
      game.innerHTML = html;
      
      document.getElementById('next-battle-btn').onclick = () => {
        character.progress++;
        nextBattle(character);
      };
      return;
    }
  }

  // Manejar estados que afectan turnos
  if(handleStatusEffects(character, monster, turn)) {
    return; // Si un estado afecta el turno, salir
  }

  // Turno del jugador
  if(turn==='player') {
    html += renderPlayerTurn(character, monster);
  }
  
  game.innerHTML = html;
  
  // Configurar event listeners después de renderizar
  if(turn==='player') {
    setupPlayerTurnEvents(character, monster);
  }
}

// Función auxiliar para manejar efectos de estado
function handleStatusEffects(character, monster, turn) {
  if(character.status && character.status.some(s=>s.name==='Aturdido')) {
    document.getElementById('combat-log').innerText = '¡Estás aturdido y pierdes tu turno!';
    character.status = character.status.map(s=>s.name==='Aturdido'?{...s,turns:s.turns-1}:s).filter(s=>s.turns>0);
    setTimeout(()=>handleMonsterTurn(character, monster), 1200);
    return true;
  }
  
  if(character.status && character.status.some(s=>s.name==='Miedo')) {
    document.getElementById('combat-log').innerText = '¡Estás asustado y solo puedes huir!';
    character.status = character.status.map(s=>s.name==='Miedo'?{...s,turns:s.turns-1}:s).filter(s=>s.turns>0);
    setTimeout(()=>handleMonsterTurn(character, monster), 1200);
    return true;
  }
  
  if(monster.status && monster.status.some(s=>s.name==='Aturdido')) {
    document.getElementById('combat-log').innerText = '¡El monstruo está aturdido y pierde su turno!';
    monster.status = monster.status.map(s=>s.name==='Aturdido'?{...s,turns:s.turns-1}:s).filter(s=>s.turns>0);
    setTimeout(()=>renderCombat(character, monster, 'player'), 1200);
    return true;
  }
  
  if(monster.status && monster.status.some(s=>s.name==='Miedo')) {
    document.getElementById('combat-log').innerText = '¡El monstruo está asustado y pierde su turno!';
    monster.status = monster.status.map(s=>s.name==='Miedo'?{...s,turns:s.turns-1}:s).filter(s=>s.turns>0);
    setTimeout(()=>renderCombat(character, monster, 'player'), 1200);
    return true;
  }
  
  return false;
}

// Función auxiliar para renderizar el turno del jugador
function renderPlayerTurn(character, monster) {
  let html = `<div class='section turn-panel'><b>Tu turno</b><br>`;
  html += `<button class='btn big-btn' id='attack-btn'>⚔️ Atacar</button> `;
  html += `<button class='btn big-btn' id='item-btn'>🧪 Usar Item</button> `;
  
  if(character.cantrips && character.cantrips.length)
    html += `<select id='cantrip-select' class='big-select'>${character.cantrips.map((c,i)=>`<option value='${i}'>${c.name}</option>`)}</select><button class='btn big-btn' id='cantrip-btn'>✨ Cantrip</button> `;
  
  if(character.spells && character.spells.length && !(character.status && character.status.some(s=>s.name==='Silencio')))
    html += `<select id='spell-select' class='big-select'>${character.spells.map((s,i)=>`<option value='${i}'>${s.name}</option>`)}</select><button class='btn big-btn' id='spell-btn'>🪄 Hechizo</button> `;
  
  if(character.status && character.status.some(s=>s.name==='Silencio'))
    html += `<span class='fx-status' style='margin-left:8px;'>No puedes lanzar hechizos (Silenciado)</span>`;
  
  html += `<button class='btn big-btn' id='flee-btn'>🏃‍♂️ Huir</button> `;
  html += `<button class='btn big-btn' id='talk-btn'>💬 Dialogar</button> `;
  html += `</div>`;
  
  return html;
}

// Función para configurar los event listeners del turno del jugador
function setupPlayerTurnEvents(character, monster) {
  // Botón de ataque
  const attackBtn = document.getElementById('attack-btn');
  if(attackBtn) {
    attackBtn.onclick = () => {
      character.turns = (character.turns || 0) + 1;
      let d20 = Math.floor(Math.random()*20)+1 + (character.luckBonus||0);
      let toHit = d20 + (character.class.str||0);
      
      // Penalización por ceguera
      let blindPenalty = character.status && character.status.some(s=>s.name==='Ceguera') ? -5 : 0;
      toHit += blindPenalty;
      
      if(toHit >= monster.ac) {
        let dmg = (character.class.str||0) + Math.floor(Math.random()*8)+1;
        
        // Aplicar bonos de items
        if(character.inventory) {
          character.inventory.forEach(item=>{
            if(item.effect==='atk') dmg += item.value;
          });
        }
        
        monster.hp -= dmg;
        character.combatLog.push(`<span style='color:#6f6'>¡Atacas e infliges ${dmg} de daño! (${d20}+${(character.class.str||0)+blindPenalty} vs CA ${monster.ac})</span>`);
        
        if(monster.hp <= 0) { 
          monster.hp = 0; 
          monster.dead = true; 
        }
      } else {
        character.combatLog.push(`<span style='color:#f66'>¡Fallas el ataque! (${d20}+${(character.class.str||0)+blindPenalty} vs CA ${monster.ac})</span>`);
      }
      
      if(!monster.dead) {
        setTimeout(()=>handleMonsterTurn(character, monster), 1000);
      } else {
        renderCombat(character, monster, 'player');
      }
    };
  }
  
  // Botón de usar item
  const itemBtn = document.getElementById('item-btn');
  if(itemBtn) {
    itemBtn.onclick = () => {
      if(!character.inventory || !character.inventory.length) {
        alert('No tienes items.');
        return;
      }
      
      let itemHtml = `<div class='section item-selection'><h3>Selecciona un item:</h3>`;
      character.inventory.forEach((item, i) => {
        itemHtml += `<div class='item-option'><button class='btn' data-idx='${i}'>${item.name}</button> <small>${item.desc || item.effect}</small></div>`;
      });
      itemHtml += `<button class='btn' id='cancel-item'>Cancelar</button></div>`;
      
      document.getElementById('game').innerHTML += itemHtml;
      
      document.querySelectorAll('[data-idx]').forEach(btn => {
        btn.onclick = () => {
          const idx = +btn.getAttribute('data-idx');
          const item = character.inventory[idx];
          useItem(character, monster, item, idx);
        };
      });
      
      document.getElementById('cancel-item').onclick = () => {
        renderCombat(character, monster, 'player');
      };
    };
  }
  
  // Botón de cantrip
  const cantripBtn = document.getElementById('cantrip-btn');
  if(cantripBtn) {
    cantripBtn.onclick = () => {
      const idx = +document.getElementById('cantrip-select').value;
      const cantrip = character.cantrips[idx];
      castCantrip(character, monster, cantrip);
    };
  }
  
  // Botón de hechizo
  const spellBtn = document.getElementById('spell-btn');
  if(spellBtn) {
    spellBtn.onclick = () => {
      const idx = +document.getElementById('spell-select').value;
      const spell = character.spells[idx];
      castSpell(character, monster, spell);
    };
  }
  
  // Botón de huir
  const fleeBtn = document.getElementById('flee-btn');
  if(fleeBtn) {
    fleeBtn.onclick = () => {
      character.turns = (character.turns || 0) + 1;
      let d20 = Math.floor(Math.random()*20)+1 + (character.class.dex||0) + (character.luckBonus||0);
      let log = `Intentas huir (Destreza): ${d20}`;
      
      if(d20 >= 15) {
        log += ' ¡Escapas exitosamente del combate!';
        character.combatLog.push(`<span style='color:#6cf'>${log}</span>`);
        character.progress++;
        setTimeout(()=>nextBattle(character), 1000);
      } else {
        log += ' No logras escapar.';
        character.combatLog.push(`<span style='color:#f66'>${log}</span>`);
        setTimeout(()=>handleMonsterTurn(character, monster), 1000);
      }
    };
  }
  
  // Botón de dialogar
  const talkBtn = document.getElementById('talk-btn');
  if(talkBtn) {
    talkBtn.onclick = () => {
      handleDialogue(character, monster);
    };
  }
}

// Función para usar items
function useItem(character, monster, item, idx) {
  character.turns = (character.turns || 0) + 1;
  
  if(item.effect === 'heal') {
    let healAmount = item.value;
    character.hp = Math.min(character.maxHP, character.hp + healAmount);
    character.combatLog.push(`<span style='color:#6f6'>Usas ${item.name} y recuperas ${healAmount} HP.</span>`);
  } else if(item.effect === 'str') {
    character.class.str = (character.class.str||0) + item.value;
    character.combatLog.push(`<span style='color:#6cf'>Usas ${item.name} y ganas +${item.value} STR temporalmente.</span>`);
  } else if(item.effect === 'ac') {
    character.ac += item.value;
    character.combatLog.push(`<span style='color:#6cf'>Usas ${item.name} y ganas +${item.value} CA.</span>`);
  }
  
  // Consumir el item
  character.inventory.splice(idx, 1);
  
  if(!monster.dead) {
    setTimeout(()=>handleMonsterTurn(character, monster), 1000);
  } else {
    renderCombat(character, monster, 'player');
  }
}

// Función para lanzar cantrips
function castCantrip(character, monster, cantrip) {
  character.turns = (character.turns || 0) + 1;
  
  if(cantrip.name === 'Rayo de Escarcha') {
    let dmg = 3 + Math.floor(Math.random()*4);
    monster.hp -= dmg;
    monster.status = monster.status || [];
    monster.status.push({name:'Ralentizado', turns:1});
    character.combatLog.push(`<span style='color:#6cf'>Lanzas ${cantrip.name} e infliges ${dmg} de daño y ralentizas al enemigo.</span>`);
  } else if(cantrip.name === 'Grito Intimidante') {
    monster.status = monster.status || [];
    monster.status.push({name:'Miedo', turns:1});
    character.combatLog.push(`<span style='color:#6cf'>Lanzas ${cantrip.name} y asustas al enemigo.</span>`);
  } else if(cantrip.name === 'Luz Sagrada') {
    let dmg = 4 + Math.floor(Math.random()*4);
    monster.hp -= dmg;
    character.combatLog.push(`<span style='color:#ff0'>Lanzas ${cantrip.name} e infliges ${dmg} de daño radiante.</span>`);
  } else if(cantrip.name === 'Chispa') {
    let dmg = 2 + Math.floor(Math.random()*6);
    monster.hp -= dmg;
    character.combatLog.push(`<span style='color:#6cf'>Lanzas ${cantrip.name} e infliges ${dmg} de daño eléctrico.</span>`);
  } else {
    // Cantrip genérico
    let dmg = 2 + Math.floor(Math.random()*3);
    monster.hp -= dmg;
    character.combatLog.push(`<span style='color:#6cf'>Lanzas ${cantrip.name} e infliges ${dmg} de daño.</span>`);
  }
  
  if(monster.hp <= 0) { 
    monster.hp = 0; 
    monster.dead = true; 
  }
  
  if(!monster.dead) {
    setTimeout(()=>handleMonsterTurn(character, monster), 1000);
  } else {
    renderCombat(character, monster, 'player');
  }
}

// Función para lanzar hechizos
function castSpell(character, monster, spell) {
  character.turns = (character.turns || 0) + 1;
  
  if(spell.name === 'Curar Heridas') {
    let heal = 8 + character.level * 2;
    character.hp = Math.min(character.maxHP, character.hp + heal);
    character.combatLog.push(`<span style='color:#6f6'>Lanzas ${spell.name} y recuperas ${heal} HP.</span>`);
  } else if(spell.name === 'Misil Mágico') {
    let dmg = 4 + character.level;
    monster.hp -= dmg;
    character.combatLog.push(`<span style='color:#6cf'>Lanzas ${spell.name} e infliges ${dmg} de daño automático.</span>`);
  } else if(spell.name === 'Bola de Fuego') {
    let dmg = 15 + Math.floor(Math.random()*10);
    monster.hp -= dmg;
    character.combatLog.push(`<span style='color:#f60'>Lanzas ${spell.name} e infliges ${dmg} de daño explosivo.</span>`);
  } else if(spell.name === 'Armadura de mago') {
    character.ac += 3;
    character.status = character.status || [];
    character.status.push({name:'Buff', turns:3});
    character.combatLog.push(`<span style='color:#6cf'>Lanzas ${spell.name} y ganas +3 CA por 3 turnos.</span>`);
  } else if(spell.name === 'Bendición') {
    character.luckBonus = (character.luckBonus||0) + 2;
    character.status = character.status || [];
    character.status.push({name:'Buff', turns:5});
    character.combatLog.push(`<span style='color:#6cf'>Lanzas ${spell.name} y ganas +2 a todas las tiradas por 5 turnos.</span>`);
  } else if(spell.name === 'Imposición de Manos') {
    let heal = character.level * 5;
    character.hp = Math.min(character.maxHP, character.hp + heal);
    character.combatLog.push(`<span style='color:#6f6'>Lanzas ${spell.name} y recuperas ${heal} HP.</span>`);
  } else if(spell.name === 'Escudo de la Fe') {
    character.ac += 2;
    character.status = character.status || [];
    character.status.push({name:'Buff', turns:4});
    character.combatLog.push(`<span style='color:#6cf'>Lanzas ${spell.name} y ganas +2 CA por 4 turnos.</span>`);
  } else if(spell.name === 'Furia Potenciada') {
    character.class.str = (character.class.str||0) + 3;
    character.status = character.status || [];
    character.status.push({name:'Buff', turns:3});
    character.combatLog.push(`<span style='color:#f60'>Lanzas ${spell.name} y ganas +3 STR por 3 turnos.</span>`);
  } else {
    // Hechizo genérico
    let dmg = 5 + character.level;
    monster.hp -= dmg;
    character.combatLog.push(`<span style='color:#6cf'>Lanzas ${spell.name} e infliges ${dmg} de daño.</span>`);
  }
  
  if(monster.hp <= 0) { 
    monster.hp = 0; 
    monster.dead = true; 
  }
  
  if(!monster.dead) {
    setTimeout(()=>handleMonsterTurn(character, monster), 1000);
  } else {
    renderCombat(character, monster, 'player');
  }
}

// Función para el turno del monstruo
function handleMonsterTurn(character, monster) {
  // Aplicar daño por veneno al jugador
  if(character.status && character.status.some(s=>s.name==='Envenenado')) {
    let poisonDmg = 3;
    character.hp = Math.max(1, character.hp-poisonDmg);
    character.damageTaken = (character.damageTaken||0) + poisonDmg;
    character.combatLog.push(`<span style='color:#f66'>El veneno te daña por ${poisonDmg} HP.</span>`);
    
    // Reducir duración del veneno
    character.status = character.status.map(s=>s.name==='Envenenado'?{...s,turns:s.turns-1}:s).filter(s=>s.turns>0);
  }
  
  // Verificar si el jugador tiene botas del viento para esquivar el primer ataque
  if(character.hasWindBoots) {
    character.hasWindBoots = false;
    character.combatLog.push(`<span style='color:#6cf'>¡Las Botas del Viento te ayudan a esquivar el ataque!</span>`);
    renderCombat(character, monster, 'player');
    return;
  }
  
  // Ataque del monstruo
  let d20 = Math.floor(Math.random()*20)+1;
  let toHit = d20 + Math.floor(monster.atk/2);
  
  if(toHit >= character.ac) {
    let dmg = monster.atk + Math.floor(Math.random()*6);
    
    // Verificar si tiene capa de las sombras (20% evasión)
    if(character.inventory && character.inventory.some(i=>i.name==='Capa de las Sombras') && Math.random() < 0.2) {
      character.combatLog.push(`<span style='color:#6cf'>¡La Capa de las Sombras te ayuda a esquivar el ataque!</span>`);
      renderCombat(character, monster, 'player');
      return;
    }
    
    character.hp -= dmg;
    character.damageTaken = (character.damageTaken||0) + dmg;
    character.combatLog.push(`<span style='color:#f66'>¡${monster.name} te ataca e inflige ${dmg} de daño! (${d20}+${Math.floor(monster.atk/2)} vs CA ${character.ac})</span>`);
    
    if(character.hp <= 0) {
      character.hp = 0;
      character.dead = true;
    }
  } else {
    character.combatLog.push(`<span style='color:#6cf'>¡${monster.name} falla su ataque! (${d20}+${Math.floor(monster.atk/2)} vs CA ${character.ac})</span>`);
  }
  
  renderCombat(character, monster, 'player');
}

// --- SISTEMA DE LOGROS Y ESTADÍSTICAS ---
const DEFAULT_STATS = {
  runs: 0,
  victories: 0,
  deaths: 0,
  monstersDefeated: 0,
  bossesDefeated: 0,
  goldMax: 0,
  levelMax: 0,
  legendaryFound: 0
};

function getStats() {
  return JSON.parse(localStorage.getItem('dnd_stats') || 'null') || {...DEFAULT_STATS};
}

function saveStats(stats) {
  localStorage.setItem('dnd_stats', JSON.stringify(stats));
}

function updateStats(character, event) {
  let stats = getStats();
  if (event === 'start') stats.runs++;
  if (event === 'victory') stats.victories++;
  if (event === 'death') stats.deaths++;
  if (event === 'monster') stats.monstersDefeated++;
  if (event === 'boss') stats.bossesDefeated++;
  if (character.gold > stats.goldMax) stats.goldMax = character.gold;
  if (character.level > stats.levelMax) stats.levelMax = character.level;
  if (event === 'legendary') stats.legendaryFound++;
  saveStats(stats);
}

// --- LOGROS ---
const ACHIEVEMENTS = [
  { key: 'victories', value: 1, name: '¡Primera Victoria!', desc: 'Gana tu primer run.' },
  { key: 'bossesDefeated', value: 5, name: 'Cazador de Jefes', desc: 'Derrota 5 jefes.' },
  { key: 'legendaryFound', value: 1, name: '¡Legendario!', desc: 'Encuentra un item legendario.' },
  { key: 'levelMax', value: 10, name: 'Veterano', desc: 'Alcanza nivel 10.' }
];

function checkAchievements() {
  const stats = getStats();
  let unlocked = JSON.parse(localStorage.getItem('dnd_achievements')||'[]');
  ACHIEVEMENTS.forEach(a => {
    if (!unlocked.includes(a.name) && stats[a.key] >= a.value) {
      unlocked.push(a.name);
      setTimeout(()=>alert(`¡Logro desbloqueado: ${a.name}\n${a.desc}`), 500);
    }
  });
  localStorage.setItem('dnd_achievements', JSON.stringify(unlocked));
}

// --- SISTEMA DE ITEMS LEGENDARIOS ---
const LEGENDARY_ITEMS = [
  {
    name: "Espada de la Eternidad",
    effect: "atk",
    value: 7,
    desc: "+7 ATK. Daña a todos los enemigos al atacar.",
    legendary: true
  },
  {
    name: "Anillo del Inmortal",
    effect: "resurrect",
    value: 1,
    desc: "Te revive una vez al morir.",
    legendary: true
  },
  {
    name: "Capa de las Sombras",
    effect: "evasion",
    value: 3,
    desc: "+3 CA y 20% de esquivar todo daño.",
    legendary: true
  },
  {
    name: "Báculo del Archimago",
    effect: "spell",
    value: 3,
    desc: "+3 a todos los hechizos y cantrips.",
    legendary: true
  }
];

function tryLegendaryDrop(character) {
  if (Math.random() < 0.02) {
    const item = LEGENDARY_ITEMS[Math.floor(Math.random()*LEGENDARY_ITEMS.length)];
    character.inventory = character.inventory || [];
    character.inventory.push(item);
    character.combatLog.push(`<span style='color:#ff0'>¡Encuentras un item legendario: ${item.name}!</span>`);
    updateStats(character, 'legendary');
    checkAchievements();
  }
}

// --- SISTEMA DE RELIQUIAS ---
const RELICS = [
  {
    name: 'Amuleto del Destino',
    desc: 'Una vez por run, puedes evitar la muerte y quedas a 1 HP.',
    effect: (character) => { character.hasDestinyAmulet = true; }
  },
  {
    name: 'Cáliz de la Fortuna',
    desc: 'Duplica el oro obtenido en cada evento o combate.',
    effect: (character) => { character.goldMultiplier = 2; }
  },
  {
    name: 'Corona del Sabio',
    desc: '+2 a todas las tiradas de inteligencia y sabiduría.',
    effect: (character) => { character.class.int = (character.class.int||0)+2; character.class.wis = (character.class.wis||0)+2; }
  },
  {
    name: 'Botas del Viento',
    desc: '+3 DEX y puedes esquivar el primer ataque de cada combate.',
    effect: (character) => { character.class.dex = (character.class.dex||0)+3; character.hasWindBoots = true; }
  }
];

function tryRelicDrop(character) {
  if (Math.random() < 0.05) {
    const relic = RELICS[Math.floor(Math.random()*RELICS.length)];
    character.relics = character.relics || [];
    character.relics.push(relic);
    relic.effect(character);
    character.combatLog.push(`<span style='color:#ff0'>¡Has encontrado una reliquia: ${relic.name}! (${relic.desc})</span>`);
  }
}

// --- SISTEMA DE COMPANIONS ---
const COMPANIONS = [
  {
    name: "Lobo Fiel",
    desc: "Ataca junto a ti, puede aturdir enemigos.",
    ability: function(character, monster) {
      if (Math.random() < 0.2) {
        monster.status = monster.status || [];
        monster.status.push({name:'Aturdido', turns:1});
        character.combatLog.push(`<span style='color:#6cf'>¡Tu Lobo Fiel aturde al enemigo!</span>`);
      }
    }
  },
  {
    name: "Halcón Mensajero",
    desc: "Te da ventaja en iniciativa y puede esquivar ataques.",
    ability: function(character, monster) {
      character.initiative += 2;
    }
  },
  {
    name: "Espíritu Sanador",
    desc: "Cura 5 HP al inicio de cada combate.",
    ability: function(character, monster) {
      if (character.hp < character.maxHP) {
        character.hp = Math.min(character.maxHP, character.hp + 5);
        character.combatLog.push(`<span style='color:#6f6'>¡El Espíritu Sanador te cura 5 HP!</span>`);
      }
    }
  },
  {
    name: "Gato Negro",
    desc: "Aumenta tu suerte, +1 a todas las tiradas d20.",
    ability: function(character, monster) {
      character.luckBonus = (character.luckBonus || 0) + 1;
    }
  }
];

function addCompanion(character, companion) {
  character.companions = character.companions || [];
  character.companions.push(companion);
  character.combatLog = character.combatLog || [];
  character.combatLog.push(`<span style='color:#ff9'>¡${companion.name} se une a tu aventura! (${companion.desc})</span>`);
}

function companionsAbility(character, monster) {
  if (!character.companions) return;
  character.companions.forEach(c => {
    if (typeof c.ability === 'function') c.ability(character, monster);
  });
}

// --- SISTEMA DE RANKING ---
function getRanking() {
  return JSON.parse(localStorage.getItem('dnd_ranking')||'[]');
}

function saveRanking(ranking) {
  localStorage.setItem('dnd_ranking', JSON.stringify(ranking));
}

function updateRanking(character) {
  let ranking = getRanking();
  const run = {
    date: new Date().toLocaleString(),
    level: character.level,
    gold: character.gold,
    turns: character.turns||0,
    damageTaken: character.damageTaken||0,
    victory: character.dead ? false : true
  };
  ranking.push(run);
  ranking = ranking.sort((a,b)=>b.level-a.level || b.gold-a.gold).slice(0,10);
  saveRanking(ranking);
}

// Función para manejar diálogos
function handleDialogue(character, monster) {
  const game = document.getElementById('game');
  let html = `<div class='section dialogue-options'><b>¿Cómo quieres dialogar con ${monster.name}?</b><br>`;
  html += `<button class='btn' id='persuade-btn'>Persuadir (Carisma)</button> `;
  html += `<button class='btn' id='intimidate-btn'>Intimidar (Fuerza)</button> `;
  html += `<button class='btn' id='bribe-btn'>Sobornar (10 oro)</button> `;
  html += `<button class='btn' id='back-btn'>Volver</button></div>`;
  
  game.innerHTML += html;
  
  document.getElementById('persuade-btn').onclick = ()=>{
    character.turns = (character.turns || 0) + 1;
    let d20 = Math.floor(Math.random()*20)+1 + (character.class.cha||0) + (character.luckBonus||0);
    let log = `Intentas persuadir (Carisma): ${d20}`;
    
    if(d20 >= 18) {
      log += ' ¡Persuades al monstruo! Te deja pasar.';
      character.combatLog.push(`<span style='color:#6cf'>${log}</span>`);
      character.progress++;
      setTimeout(()=>nextBattle(character), 1000);
    } else if(d20 >= 14) {
      log += ' El monstruo duda, pero te deja pasar.';
      character.combatLog.push(`<span style='color:#6cf'>${log}</span>`);
      character.progress++;
      setTimeout(()=>nextBattle(character), 1000);  
    } else {
      log += ' El monstruo se enfurece y ataca.';
      character.combatLog.push(`<span style='color:#f66'>${log}</span>`);
      setTimeout(()=>handleMonsterTurn(character, monster), 1000);
    }
  };
  
  document.getElementById('intimidate-btn').onclick = ()=>{
    character.turns = (character.turns || 0) + 1;
    let d20 = Math.floor(Math.random()*20)+1 + (character.class.str||0) + (character.luckBonus||0);
    let log = `Intentas intimidar (Fuerza): ${d20}`;
    
    if(d20 >= 18) {
      log += ' ¡Intimidates al monstruo! Te deja pasar.';
      character.combatLog.push(`<span style='color:#6cf'>${log}</span>`);
      character.progress++;
      setTimeout(()=>nextBattle(character), 1000);
    } else if(d20 >= 14) {
      log += ' El monstruo duda, pero te deja pasar.';
      character.combatLog.push(`<span style='color:#6cf'>${log}</span>`);
      character.progress++;
      setTimeout(()=>nextBattle(character), 1000);
    } else {
      log += ' El monstruo se enfurece y ataca.';
      character.combatLog.push(`<span style='color:#f66'>${log}</span>`);
      setTimeout(()=>handleMonsterTurn(character, monster), 1000);
    }
  };
  
  document.getElementById('bribe-btn').onclick = ()=>{
    if(character.gold>=10) {
      character.gold -= 10;
      let log = 'Sobornas al monstruo con 10 oro. Te deja pasar.';
      character.combatLog.push(`<span style='color:#ff0'>${log}</span>`);
      character.progress++;
      setTimeout(()=>nextBattle(character), 1000);
    } else {
      alert('No tienes suficiente oro para sobornar.');
    }
  };
  
  document.getElementById('back-btn').onclick = ()=>{ 
    renderCombat(character, monster, 'player'); 
  };
}

// Función para aplicar bonificadores raciales al crear personaje
function startGame(selected) {
  // Aplicar bonos raciales
  Object.entries(selected.race.bonus).forEach(([stat, bonus]) => {
    selected.class[stat] = (selected.class[stat] || 0) + bonus;
  });
  
  // Inicializar inventario y hechizos
  selected.inventory = [];
  selected.spells = [];
  selected.turns = 0;
  selected.damageTaken = 0;
  
  // Agregar cantrips si están disponibles
  if (CANTRIPS[selected.class.name]) {
    selected.cantrips = [...CANTRIPS[selected.class.name]];
  }
  
  // Inicializar estadísticas de seguimiento
  updateStats(selected, 'start');
  checkAchievements();
  
  startAdventure(selected);
}

// --- TIENDA ---
function renderShop(character) {
  const game = document.getElementById('game');
  let html = `<div class='section'><h2>¡Tienda ambulante!</h2><p>Tienes <b>${character.gold}</b> de oro.</p><div class='shop-items'>`;
  ITEMS.forEach((item, i) => {
    html += `<div class='shop-item'><b>${item.name}</b> <small>(${item.effect})</small> - <b>${item.price} oro</b> <button class='btn' data-idx='${i}'>Comprar</button></div>`;
  });
  html += `</div><button class='btn' id='skip-shop'>Salir de la tienda</button></div>`;
  game.innerHTML = html;
  document.querySelectorAll('.shop-item .btn').forEach(btn => {
    btn.onclick = () => {
      const idx = +btn.getAttribute('data-idx');
      const item = ITEMS[idx];
      if(character.gold >= item.price) {
        character.gold -= item.price;
        character.inventory = character.inventory || [];
        character.inventory.push(item);
        renderShop(character);
      } else {
        btn.innerText = 'Sin oro';
        setTimeout(()=>{btn.innerText = 'Comprar';}, 1000);
      }
    };
  });
  document.getElementById('skip-shop').onclick = () => {
    nextBattle(character);
  };
}

// --- EVENTOS SORPRESA Y DESCANSO ---
function renderEventRoom(character) {
  const game = document.getElementById('game');
  let events = [
    {desc:'Encuentras un cofre misterioso. ¿Abrirlo?', effect:()=>{
      if(Math.random()<0.7) {
        let loot = ITEMS[Math.floor(Math.random()*ITEMS.length)];
        character.inventory.push(loot);
        character.combatLog.push(`<span style='color:#6cf'>¡El cofre contenía: ${loot.name}!</span>`);
      } else {
        character.hp = Math.max(1, character.hp-10);
        character.combatLog.push(`<span style='color:#f66'>¡Era una trampa! Pierdes 10 HP.</span>`);
      }
    }},
    {desc:'Un hada te ofrece curación. ¿Aceptar?', effect:()=>{
      if(Math.random()<0.8) {
        let heal = 15+Math.floor(Math.random()*10);
        character.hp = Math.min(character.maxHP, character.hp+heal);
        character.combatLog.push(`<span style='color:#6f6'>¡El hada te cura ${heal} HP!</span>`);
      } else {
        character.status.push({name:'Envenenado',turns:2});
        character.combatLog.push(`<span style='color:#f66'>¡El hada era malvada! Quedas envenenado.</span>`);
      }
    }},
    {desc:'Un mercader ambulante te ofrece un descuento especial.', effect:()=>{
      character.gold += 10;
      character.combatLog.push(`<span style='color:#ff0'>¡Ganas 10 de oro!</span>`);
    }},
    {desc:'Encuentras un altar antiguo. ¿Rezar?', effect:()=>{
      if(Math.random()<0.5) {
        character.status.push({name:'Buff',turns:2});
        character.combatLog.push(`<span style='color:#6cf'>¡Recibes una bendición temporal!</span>`);
      } else {
        character.status.push({name:'Debuff',turns:2});
        character.combatLog.push(`<span style='color:#f66'>¡Recibes una maldición temporal!</span>`);
      }
    }},
  ];
  let ev = events[Math.floor(Math.random()*events.length)];
  game.innerHTML = `<div class='section'><h2>Evento</h2><p>${ev.desc}</p><button class='btn' id='event-yes'>Sí</button> <button class='btn' id='event-no'>No</button></div>`;
  document.getElementById('event-yes').onclick = ()=>{ ev.effect(); character.progress++; nextBattle(character); };
  document.getElementById('event-no').onclick = ()=>{ character.progress++; nextBattle(character); };
}

function renderRestRoom(character) {
  const game = document.getElementById('game');
  let heal = Math.round(character.maxHP*0.5);
  character.hp = Math.min(character.maxHP, character.hp+heal);
  game.innerHTML = `<div class='section'><h2>Descanso</h2><p>Recuperas ${heal} HP y avanzas al siguiente piso.</p><button class='btn' id='rest-next'>Continuar</button></div>`;
  character.combatLog.push(`<span style='color:#6f6'>Descansas y recuperas ${heal} HP.</span>`);
  document.getElementById('rest-next').onclick = ()=>{ character.progress++; nextBattle(character); };
}

function renderBossBattle(character) {
  let boss = {...MONSTERS[MONSTERS.length-1]};
  boss.hp = Math.round(boss.hp*1.5);
  boss.maxHP = boss.hp;
  boss.atk = Math.round(boss.atk*1.5);
  boss.ac = boss.ac+3;
  boss.name = 'Boss: '+boss.name;
  boss.status = [];
  boss.dead = false;
  boss.isBoss = true;
  
  updateStats(character, 'boss');
  renderCombat(character, boss, 'player');
}

// Función para expandir dungeon endless
function expandEndlessDungeon(character) {
  const currentLength = window.DUNGEON.length;
  for(let i = currentLength; i < currentLength + 20; i++) {
    let type = 'combate';
    if(i>0 && i%3===0) type = Math.random()<0.5?'tienda':'evento';
    else if(i>0 && i%5===0) type = 'descanso';
    else if(i>0 && i%10===0) type = 'boss';
    else if(i>0 && Math.random()<0.15) type = 'descanso';
    
    window.DUNGEON.push({type, idx:i});
  }
}

// --- TIENDA MEJORADA ---
const ITEMS_MEJORADOS = [
  { name: "Poción de curación mayor", effect: "heal", value: 20, price: 40 },
  { name: "Antorcha brillante", effect: "light", value: 0, price: 5 },
  { name: "Daga afilada", effect: "atk", value: 3, price: 12 },
  { name: "Escudo robusto", effect: "ac", value: 3, price: 30 },
  { name: "Libro de hechizos avanzado", effect: "spell", value: 2, price: 50 },
  { name: "Armadura media", effect: "ac", value: 2, price: 35 },
  { name: "Poción de fuerza gigante", effect: "str", value: 4, price: 60 }
];

function renderShopMejorada(character) {
  const game = document.getElementById('game');
  let html = `<div class='section'><h2>¡Tienda Mejorada!</h2><p>Tienes <b>${character.gold}</b> de oro.</p><div class='shop-items'>`;
  ITEMS_MEJORADOS.forEach((item, i) => {
    html += `<div class='shop-item'><b>${item.name}</b> <small>(${item.effect})</small> - <b>${item.price} oro</b> <button class='btn' data-idx='${i}'>Comprar</button></div>`;
  });
  html += `</div><button class='btn' id='skip-shop'>Salir de la tienda</button></div>`;
  game.innerHTML = html;
  document.querySelectorAll('.shop-item .btn').forEach(btn => {
    btn.onclick = () => {
      const idx = +btn.getAttribute('data-idx');
      const item = ITEMS_MEJORADOS[idx];
      if(character.gold >= item.price) {
        character.gold -= item.price;
        character.inventory = character.inventory || [];
        character.inventory.push(item);
        renderShopMejorada(character);
      } else {
        btn.innerText = 'Sin oro';
        setTimeout(()=>{btn.innerText = 'Comprar';}, 1000);
      }
    };
  });
  document.getElementById('skip-shop').onclick = () => {
    nextBattle(character);
  };
}

// --- EVENTOS MEJORADOS ---
function renderEventRoomMejorada(character) {
  const game = document.getElementById('game');
  let events = [
    {desc:'Encuentras un cofre antiguo. ¿Abrirlo?', effect:()=>{
      if(Math.random()<0.8) {
        let loot = ITEMS_MEJORADOS[Math.floor(Math.random()*ITEMS_MEJORADOS.length)];
        character.inventory.push(loot);
        character.combatLog.push(`<span style='color:#6cf'>¡El cofre contenía: ${loot.name}!</span>`);
      } else {
        character.hp = Math.max(1, character.hp-15);
        character.combatLog.push(`<span style='color:#f66'>¡Era una trampa mortal! Pierdes 15 HP.</span>`);
      }
    }},
    {desc:'Un espíritu benévolo te ofrece curación. ¿Aceptar?', effect:()=>{
      if(Math.random()<0.9) {
        let heal = 25+Math.floor(Math.random()*15);
        character.hp = Math.min(character.maxHP, character.hp+heal);
        character.combatLog.push(`<span style='color:#6f6'>¡El espíritu te cura ${heal} HP!</span>`);
      } else {
        character.status.push({name:'Envenenado',turns:3});
        character.combatLog.push(`<span style='color:#f66'>¡El espíritu era engañoso! Quedas envenenado.</span>`);
      }
    }},
    {desc:'Un mercader misterioso te ofrece un trato especial.', effect:()=>{
      character.gold += 20;
      character.combatLog.push(`<span style='color:#ff0'>¡Ganas 20 de oro!</span>`);
    }},
    {desc:'Encuentras un altar sagrado. ¿Rezar?', effect:()=>{
      if(Math.random()<0.7) {
        character.status.push({name:'Buff',turns:3});
        character.combatLog.push(`<span style='color:#6cf'>¡Recibes una poderosa bendición!</span>`);
      } else {
        character.status.push({name:'Debuff',turns:3});
        character.combatLog.push(`<span style='color:#f66'>¡Recibes una maldición poderosa!</span>`);
      }
    }},
  ];
  let ev = events[Math.floor(Math.random()*events.length)];
  game.innerHTML = `<div class='section'><h2>Evento Mejorado</h2><p>${ev.desc}</p><button class='btn' id='event-yes'>Sí</button> <button class='btn' id='event-no'>No</button></div>`;
  document.getElementById('event-yes').onclick = ()=>{ ev.effect(); character.progress++; nextBattle(character); };
  document.getElementById('event-no').onclick = ()=>{ character.progress++; nextBattle(character); };
}

// --- INICIALIZACIÓN DEL JUEGO ---
window.addEventListener('DOMContentLoaded', () => {
  renderModeSelection();
});