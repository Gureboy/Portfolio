// --- COMBATE POR TURNOS CLÁSICO D&D ---
function startAdventure(character) {
  // Generar dungeon procedural
  window.DUNGEON = generateDungeon(12);
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
  character.gold = 20;
  character.xp = 0;
  character.level = 1;
  character.xpToNext = 20;
  character.status = [];
  character.progress = 0; // índice del monstruo actual
  character.maxHP = character.class.hitDie + (character.class.con || 0) + 10;
  character.hp = character.maxHP;
  character.ac = character.class.baseAC;
  character.initiative = 0;
  character.dead = false;
  character.combatLog = [];
  nextBattle(character);
}

function nextBattle(character) {
  // Cada 2 combates, mostrar tienda antes del combate
  if (character.progress > 0 && character.progress % 2 === 0 && !character.justShopped) {
    renderShop(character);
    character.justShopped = true;
    return;
  } else {
    character.justShopped = false;
  }
  if (!window.DUNGEON) window.DUNGEON = generateDungeon(12);
  if (character.progress >= window.DUNGEON.length) {
    // Victoria total
    const game = document.getElementById('game');
    game.innerHTML = `<div class='section'><h2>¡Has conquistado el dungeon!</h2><p>¡Eres el campeón definitivo!</p><p>Nivel alcanzado: <b>${character.level}</b> | XP: ${character.xp}</p><button class='btn' onclick='location.reload()'>Jugar de nuevo</button>`;
    return;
  }
  setTimeout(()=>renderMinimap(character), 100);
  const room = window.DUNGEON[character.progress];
  if(room.type==='evento') { renderEventRoom(character); return; }
  if(room.type==='descanso') { renderRestRoom(character); return; }
  if(room.type==='boss') { renderBossBattle(character); return; }
  if(room.type==='tienda' && !character.justShopped) {
    renderShop(character);
    character.justShopped = true;
    return;
  } else {
    character.justShopped = false;
  }
  // Combate normal
  // --- Dificultad escalable y progresión ---
  // Cada 3 enemigos, aumenta la dificultad global (multiplicador)
  const difficultyLevel = Math.floor(character.progress / 3);
  const difficultyMultiplier = 1 + difficultyLevel * 0.25; // 25% más fuerte cada 3 enemigos
  // Selección de monstruo y escalado
  let baseMonster = {...MONSTERS[character.progress]};
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
    // Buff temporal: +2 AC o +2 a una stat aleatoria por 2 combates
    if (Math.random() < 0.5) {
      character.status = character.status || [];
      character.status.push({name:'Buff', turns:2});
      character.combatLog.push(`<span style='color:#6cf'>¡Recibes un buff temporal (+2 CA o stat) por 2 combates!</span>`);
      // Efecto real: +2 AC
      character.ac += 2;
    } else {
      // Efecto real: +2 a una stat aleatoria
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
  character.initiative = rollD20() + (character.class.dex||0);
  monster.initiative = rollD20() + 1;
  let turn = character.initiative >= monster.initiative ? 'player' : 'monster';
  renderCombat(character, monster, turn);
}

function renderCombat(character, monster, turn) {
  // Mostrar estados activos
  // Iconos pixel art para estados
  const STATUS_ICONS = {
    'Aturdido': '💫',
    'Envenenado': '☠️',
    'Ralentizado': '🐢',
    'Miedo': '😱',
    'Ceguera': '🙈',
    'Silencio': '🔇',
    'Buff': '✨',
    'Debuff': '💢',
  };
  const STATUS_DESC = {
    'Aturdido': 'Pierde el turno.',
    'Envenenado': 'Recibe daño al final del turno.',
    'Ralentizado': 'Pierde iniciativa y ataque.',
    'Miedo': 'No puede atacar, solo huir.',
    'Ceguera': 'Falla ataques y recibe más daño.',
    'Silencio': 'No puede lanzar hechizos.',
    'Buff': 'Mejora temporal.',
    'Debuff': 'Penalización temporal.',
  };
  // Permitir disipar estados con items/hechizos
  function statusString(entity, isPlayer) {
    if (!entity.status || !entity.status.length) return '';
    return `<span class='status-icons'>` + entity.status.map((s, idx) => {
      let dispelBtn = '';
      // Solo para el jugador, mostrar botón de disipar si es disipable
      if (isPlayer && ['Envenenado','Ralentizado','Miedo','Ceguera','Silencio','Debuff','Buff'].includes(s.name)) {
        dispelBtn = `<button class='dispel-btn' data-idx='${idx}' title='Disipar'>🧹</button>`;
      }
      return `<span class='status-icon' title='${STATUS_DESC[s.name]||s.name}'>${STATUS_ICONS[s.name]||'❓'}${s.turns?`<sup>${s.turns}</sup>`:''}${dispelBtn}</span>`;
    }).join('') + `</span>`;
  }
  const game = document.getElementById('game');
  let html = `<div class='section'><h2>¡Combate!</h2>`;
  html += `<div><b class='player' id='player-hp'>${character.class.name}</b> (Nv. ${character.level}) XP: ${character.xp}/${character.xpToNext} <br>Oro: <span id='player-gold'>${character.gold}</span> | HP: <span id='player-hp-val'>${character.hp}</span>/${character.maxHP} | CA: ${character.ac} ${statusString(character, true)}</div>`;
  html += `<div><b class='enemy' id='monster-hp'>${monster.name}</b> HP: <span id='monster-hp-val'>${monster.hp}</span>/${monster.maxHP} | CA: ${monster.ac} ${statusString(monster, false)}</div>`;
  // Lógica para disipar estados con botón 🧹
  setTimeout(()=>{
    document.querySelectorAll('.dispel-btn').forEach(btn=>{
      btn.onclick = (e)=>{
        const idx = +btn.getAttribute('data-idx');
        const status = character.status[idx];
        // Solo permitir disipar si el jugador tiene un item o hechizo adecuado
        let canDispel = false;
        // Ejemplo: Poción de curación disipa Envenenado, Libro de hechizos disipa Silencio, Escudo disipa Miedo, etc.
        if(status.name==='Envenenado' && character.inventory && character.inventory.some(i=>i.name==='Poción de curación')) canDispel = true;
        if(status.name==='Silencio' && character.inventory && character.inventory.some(i=>i.name==='Libro de hechizos')) canDispel = true;
        if(status.name==='Miedo' && character.inventory && character.inventory.some(i=>i.name==='Escudo')) canDispel = true;
        if(status.name==='Ceguera' && character.spells && character.spells.some(s=>/luz|curar/i.test(s.name))) canDispel = true;
        if(status.name==='Ralentizado' && character.spells && character.spells.some(s=>/bendición|táctica/i.test(s.name))) canDispel = true;
        if(status.name==='Debuff' && character.spells && character.spells.some(s=>/bendición|cura/i.test(s.name))) canDispel = true;
        if(status.name==='Buff') canDispel = true; // Siempre se puede disipar un buff propio
        if(canDispel) {
          character.status.splice(idx,1);
          character.combatLog.push(`<span style='color:#6cf'>Disipas el estado: ${status.name}</span>`);
          renderCombat(character, monster, turn);
        } else {
          document.getElementById('combat-log').innerHTML = `<span style='color:#f66'>No puedes disipar <b>${status.name}</b> sin el item/hechizo adecuado.</span>`;
        }
      };
    });
  }, 100);
  html += `<div id='combat-log' class='combat-log'></div>`;
  html += `<div id='combat-history' class='combat-history'>${(character.combatLog||[]).slice(-8).map(e=>`<div>${e}</div>`).join('')}</div>`;

  if(character.dead || monster.dead) {
    if(character.dead) {
      html += `<div class='section'><b>¡Has muerto! GAME OVER</b></div>`;
      html += `<button class='btn' onclick='location.reload()'>Reiniciar</button>`;
      game.innerHTML = html;
      return;
    } else {
      // Otorgar XP y oro por victoria
      let xpGain = Math.round((monster.cr||1) * 10 + 5);
      let goldGain = Math.round((monster.cr||1) * 6 + Math.random()*5);
      character.xp += xpGain;
      character.gold += goldGain;
      character.combatLog.push(`<span style='color:#ff0'>¡Ganas ${xpGain} XP y ${goldGain} de oro!</span>`);
      // Loot aleatorio: 20% chance de item
      if(Math.random()<0.2) {
        let loot = ITEMS[Math.floor(Math.random()*ITEMS.length)];
        character.inventory = character.inventory || [];
        character.inventory.push(loot);
        character.combatLog.push(`<span style='color:#6cf'>¡Encuentras un botín: ${loot.name}!</span>`);
      }
      // Subida de nivel si corresponde
      let leveledUp = false;
      while(character.xp >= character.xpToNext) {
        character.xp -= character.xpToNext;
        character.level++;
        character.xpToNext = Math.round(character.xpToNext * 1.5 + 10);
        // Mejorar stats aleatoriamente
        const stats = ['str','dex','con','int','wis','cha'];
        const stat = stats[Math.floor(Math.random()*stats.length)];
        character.class[stat] = (character.class[stat]||0) + 1;
        // Aumentar vida máxima
        let hpGain = Math.floor(character.class.hitDie/2) + 2;
        character.maxHP += hpGain;
        character.hp = character.maxHP;
        character.combatLog.push(`<span style='color:#6f6'>¡Subes a nivel ${character.level}! +1 ${stat.toUpperCase()}, +${hpGain} HP</span>`);
        // Aprender nuevo hechizo si hay disponible
        let newSpell = (SPELLS[character.class.name]||[]).find(s=>s.level===character.level && !(character.spells||[]).some(sp=>sp.name===s.name));
        if(newSpell) {
          character.spells = character.spells || [];
          character.spells.push(newSpell);
          character.combatLog.push(`<span style='color:#6cf'>¡Aprendes un nuevo hechizo: ${newSpell.name}!</span>`);
        }
        leveledUp = true;
      }
      html += `<div class='section'><b>¡Victoria! Has derrotado al monstruo.</b></div>`;
      if(leveledUp) html += `<div class='section' style='color:#6f6'><b>¡Subiste de nivel!</b></div>`;
      // Si el jugador tiene buffs temporales, reducir duración
      if(character.status && character.status.length) {
        character.status = character.status.map(s => {
          if(s.name==='Buff' && s.turns) return {...s, turns: s.turns-1};
          return s;
        }).filter(s => !s.turns || s.turns > 0);
        // Si el buff era +2 AC y expiró, quitarlo
        if(!character.status.some(s=>s.name==='Buff')) {
          character.ac = character.class.baseAC;
        }
      }
      html += `<button class='btn' id='next-battle-btn'>Siguiente enemigo</button>`;
      game.innerHTML = html;
      document.getElementById('next-battle-btn').onclick = () => {
        character.progress = (character.progress || 0) + 1;
        nextBattle(character);
      };
      return;
    }
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

  // Estados avanzados: aturdido, miedo, ceguera, silencio, etc.
  if(character.status && character.status.some(s=>s.name==='Aturdido')) {
    document.getElementById('combat-log').innerText = '¡Estás aturdido y pierdes tu turno!';
    character.status = character.status.map(s=>s.name==='Aturdido'?{...s,turns:s.turns-1}:s).filter(s=>s.turns>0);
    setTimeout(()=>renderCombat(character, monster, 'monster'), 1200);
    return;
  }
  if(character.status && character.status.some(s=>s.name==='Miedo')) {
    document.getElementById('combat-log').innerText = '¡Estás asustado y solo puedes huir!';
    character.status = character.status.map(s=>s.name==='Miedo'?{...s,turns:s.turns-1}:s).filter(s=>s.turns>0);
    setTimeout(()=>renderCombat(character, monster, 'monster'), 1200);
    return;
  }
  if(character.status && character.status.some(s=>s.name==='Ceguera')) {
    // Penalización a ataques, se maneja en la lógica de ataque
  }
  if(character.status && character.status.some(s=>s.name==='Silencio')) {
    // No puede lanzar hechizos, se maneja en la UI
  }
  if(monster.status && monster.status.some(s=>s.name==='Aturdido')) {
    document.getElementById('combat-log').innerText = '¡El monstruo está aturdido y pierde su turno!';
    monster.status = monster.status.map(s=>s.name==='Aturdido'?{...s,turns:s.turns-1}:s).filter(s=>s.turns>0);
    setTimeout(()=>renderCombat(character, monster, 'player'), 1200);
    return;
  }
  if(monster.status && monster.status.some(s=>s.name==='Miedo')) {
    document.getElementById('combat-log').innerText = '¡El monstruo está asustado y pierde su turno!';
    monster.status = monster.status.map(s=>s.name==='Miedo'?{...s,turns:s.turns-1}:s).filter(s=>s.turns>0);
    setTimeout(()=>renderCombat(character, monster, 'player'), 1200);
    return;
  }
  if(turn==='player') {
    html += `<div class='section turn-panel'><b>Tu turno</b><br>`;
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
    // Opción de huida
    document.getElementById('flee-btn').onclick = () => {
      let d20 = Math.floor(Math.random()*20)+1 + (character.class.dex||0);
      let log = `Intentas huir (Tirada Destreza): ${d20}`;
      if(d20 >= 15) {
        log += ' ¡Escapas exitosamente del combate!';
        character.combatLog.push(`<b>Tú:</b> ${log}`);
        document.getElementById('combat-log').innerText = log;
        setTimeout(()=>{character.progress++; nextBattle(character);}, 1800);
      } else {
        log += ' No logras escapar.';
        character.combatLog.push(`<b>Tú:</b> ${log}`);
        document.getElementById('combat-log').innerText = log;
        setTimeout(()=>renderCombat(character, monster, 'monster'), 1200);
      }
    };
    // Diálogo avanzado: persuadir, intimidar, sobornar
    setTimeout(()=>{
      const talkBtn = document.getElementById('talk-btn');
      if(talkBtn) {
        talkBtn.onclick = ()=>{
          let html = `<div class='section'><b>¿Cómo quieres dialogar?</b><br>`;
          html += `<button class='btn' id='persuade-btn'>Persuadir</button> <button class='btn' id='intimidate-btn'>Intimidar</button> <button class='btn' id='bribe-btn'>Sobornar</button> <button class='btn' id='back-btn'>Volver</button></div>`;
          document.getElementById('game').innerHTML += html;
          document.getElementById('persuade-btn').onclick = ()=>{
            let d20 = Math.floor(Math.random()*20)+1 + (character.class.cha||0);
            let log = `Intentas persuadir (Carisma): ${d20}`;
            if(d20 >= 18) {
              log += ' ¡Convences al monstruo de dejarte ir!';
              character.combatLog.push(`<b>Tú:</b> ${log}`);
              document.getElementById('combat-log').innerText = log;
              setTimeout(()=>{character.progress++; nextBattle(character);}, 1800);
            } else if(d20 >= 14) {
              log += ' El monstruo duda, pero te deja pasar.';
              character.combatLog.push(`<b>Tú:</b> ${log}`);
              document.getElementById('combat-log').innerText = log;
              setTimeout(()=>{character.progress++; nextBattle(character);}, 1800);
            } else {
              log += ' El monstruo se enfurece y ataca.';
              character.combatLog.push(`<b>Tú:</b> ${log}`);
              document.getElementById('combat-log').innerText = log;
              setTimeout(()=>renderCombat(character, monster, 'monster'), 1200);
            }
          };
          document.getElementById('intimidate-btn').onclick = ()=>{
            let d20 = Math.floor(Math.random()*20)+1 + (character.class.str||0);
            let log = `Intentas intimidar (Fuerza): ${d20}`;
            if(d20 >= 18) {
              log += ' ¡El monstruo huye del miedo!';
              character.combatLog.push(`<b>Tú:</b> ${log}`);
              document.getElementById('combat-log').innerText = log;
              setTimeout(()=>{character.progress++; nextBattle(character);}, 1800);
            } else if(d20 >= 14) {
              log += ' El monstruo duda, pero te deja pasar.';
              character.combatLog.push(`<b>Tú:</b> ${log}`);
              document.getElementById('combat-log').innerText = log;
              setTimeout(()=>{character.progress++; nextBattle(character);}, 1800);
            } else {
              log += ' El monstruo se enfurece y ataca.';
              character.combatLog.push(`<b>Tú:</b> ${log}`);
              document.getElementById('combat-log').innerText = log;
              setTimeout(()=>renderCombat(character, monster, 'monster'), 1200);
            }
          };
          document.getElementById('bribe-btn').onclick = ()=>{
            if(character.gold>=10) {
              character.gold -= 10;
              let log = 'Le das 10 de oro al monstruo. Te deja pasar.';
              character.combatLog.push(`<b>Tú:</b> ${log}`);
              document.getElementById('combat-log').innerText = log;
              setTimeout(()=>{character.progress++; nextBattle(character);}, 1800);
            } else {
              let log = 'No tienes suficiente oro para sobornar.';
              character.combatLog.push(`<b>Tú:</b> ${log}`);
              document.getElementById('combat-log').innerText = log;
            }
          };
          document.getElementById('back-btn').onclick = ()=>{ renderCombat(character, monster, 'player'); };
        };
      }
    }, 200);
  }
// --- EVENTOS SORPRESA Y DESCANSO ---
function renderEventRoom(character) {
  const game = document.getElementById('game');
  // 50% chance de evento narrativo, 50% evento clásico
  if (Math.random() < 0.5) {
    // --- EVENTO NARRATIVO RAMIFICADO ---
    // Selecciona un evento narrativo interesante
    const events = [
      {
        type: 'npc',
        desc: 'En una encrucijada oscura, un bardo herido te pide ayuda a cambio de una canción mágica. ¿Lo ayudas?',
        options: [
          { text: 'Curar al bardo', effect: (character) => {
              let hasPotion = character.inventory && character.inventory.some(i=>i.effect==='heal');
              if (hasPotion) {
                character.combatLog.push('<span style="color:#6cf">El bardo te bendice con una melodía: +2 a todas tus stats esta run.</span>');
                ['str','dex','con','int','wis','cha'].forEach(stat=>character.class[stat]++);
              } else {
                character.combatLog.push('<span style="color:#f66">No tienes poción. El bardo se desvanece en la oscuridad.</span>');
              }
            }
          },
          { text: 'Ignorar', effect: (character) => {
              character.combatLog.push('<span style="color:#aaa">El bardo te maldice con una nota disonante. -1 a tu próxima tirada.</span>');
              character.luckBonus = (character.luckBonus||0) - 1;
            }
          }
        ]
      },
      {
        type: 'puzzle',
        desc: 'Un mural antiguo muestra símbolos: sol, luna, estrella. Una inscripción dice: "Solo quien elija la luz avanzará sin daño." ¿Qué símbolo tocas?',
        options: [
          { text: 'Sol', effect: (character) => {
              character.combatLog.push('<span style="color:#6cf">¡Correcto! Un rayo de luz te cura 10 HP.</span>');
              character.hp = Math.min(character.maxHP, character.hp+10);
            }
          },
          { text: 'Luna', effect: (character) => {
              character.combatLog.push('<span style="color:#f66">La sala se oscurece y pierdes 8 HP.</span>');
              character.hp = Math.max(1, character.hp-8);
            }
          },
          { text: 'Estrella', effect: (character) => {
              character.combatLog.push('<span style="color:#f66">Un destello te ciega y pierdes 5 HP.</span>');
              character.hp = Math.max(1, character.hp-5);
            }
          }
        ]
      },
      {
        type: 'trap',
        desc: 'Un susurro te advierte: "Solo los sabios sobreviven a la trampa del eco". ¿Intentas desactivar la trampa o avanzar?',
        options: [
          { text: 'Desactivar (Inteligencia)', effect: (character) => {
              let d20 = Math.floor(Math.random()*20)+1 + (character.class.int||0);
              if (d20 >= 15) {
                character.combatLog.push('<span style="color:#6cf">¡Desactivas la trampa y encuentras 20 de oro!</span>');
                character.gold += 20;
              } else {
                character.combatLog.push('<span style="color:#f66">Fallas y recibes 12 de daño.</span>');
                character.hp = Math.max(1, character.hp-12);
              }
            }
          },
          { text: 'Avanzar', effect: (character) => {
              character.combatLog.push('<span style="color:#f66">La trampa se activa y pierdes 12 HP.</span>');
              character.hp = Math.max(1, character.hp-12);
            }
          }
        ]
      },
      {
        type: 'story',
        desc: 'Un espectro de un antiguo héroe te cuenta la historia de su caída. Si escuchas, podrías aprender algo valioso. ¿Escuchar?',
        options: [
          { text: 'Escuchar', effect: (character) => {
              character.combatLog.push('<span style="color:#6cf">Ganas sabiduría ancestral. +2 WIS y +1 a todos los hechizos.</span>');
              character.class.wis = (character.class.wis||0)+2;
              if (character.spells) character.spells.forEach(s=>s.value=(s.value||0)+1);
            }
          },
          { text: 'Ignorar', effect: (character) => {
              character.combatLog.push('<span style="color:#aaa">El espectro se desvanece en silencio.</span>');
            }
          }
        ]
      },
      {
        type: 'companion',
        desc: 'Un pequeño dragón dorado se cruza en tu camino. Parece querer acompañarte. ¿Aceptar su compañía?',
        options: [
          { text: 'Aceptar', effect: (character) => {
              if (typeof addCompanion === 'function') {
                addCompanion(character, {name:'Dragón Dorado', desc:'Te protege del primer golpe mortal.', ability: (c,m) => { if (c.hp<=0) { c.hp=1; c.combatLog.push("<span style=\'color:#ff0\'>¡El Dragón Dorado te salva de la muerte!</span>"); }}});
              }
            }
          },
          { text: 'Rechazar', effect: (character) => {
              character.combatLog.push('<span style="color:#aaa">El dragón se va volando, perdiendo una oportunidad única.</span>');
            }
          }
        ]
      }
    ];
    const event = events[Math.floor(Math.random()*events.length)];
    let html = `<div class='section'><h2>Evento Narrativo</h2><p>${event.desc}</p>`;
    event.options.forEach((opt, i) => {
      html += `<button class='btn' id='narrative-opt-${i}'>${opt.text}</button> `;
    });
    html += `</div>`;
    game.innerHTML = html;
    event.options.forEach((opt, i) => {
      document.getElementById(`narrative-opt-${i}`).onclick = () => {
        opt.effect(character);
        character.progress++;
        nextBattle(character);
      };
    });
  } else {
    // --- EVENTO CLÁSICO (loot, altar, hada, etc) ---
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
  renderCombat(character, boss, 'monster');
}

// --- SISTEMA DE JEFES ÚNICOS Y MECÁNICAS ESPECIALES ---
// Bosses con patrones, fases, invocaciones o transformaciones
// Llama a renderBossBattleEspecial(character) para bosses avanzados

const SPECIAL_BOSSES = [
  {
    name: 'Rey Liche',
    phases: [
      { desc: 'Fase 1: Invoca esqueletos y lanza rayos oscuros.',
        action: (character, boss) => {
          if (Math.random()<0.4) {
            character.status = character.status || [];
            character.status.push({name:'Ceguera', turns:2});
            character.combatLog.push('<span style="color:#f66">¡El Rey Liche te ciega con magia oscura!</span>');
          }
        }
      },
      { desc: 'Fase 2: Se regenera y lanza maldiciones.',
        action: (character, boss) => {
          if (boss.hp < boss.maxHP/2 && !boss.phase2) {
            boss.phase2 = true;
            boss.hp += 30;
            character.combatLog.push('<span style="color:#ff0">¡El Rey Liche se regenera y entra en Fase 2!</span>');
            character.status.push({name:'Debuff', turns:3});
          }
        }
      }
    ],
    onTurn: (character, boss) => {
      if (!boss.phase2) SPECIAL_BOSSES[0].phases[0].action(character, boss);
      else SPECIAL_BOSSES[0].phases[1].action(character, boss);
    }
  },
  {
    name: 'Dragón Ancestral',
    phases: [
      { desc: 'Fase 1: Aliento de fuego y embestidas.',
        action: (character, boss) => {
          if (Math.random()<0.3) {
            character.hp = Math.max(1, character.hp-18);
            character.combatLog.push('<span style="color:#f66">¡El Dragón lanza un aliento de fuego! Pierdes 18 HP.</span>');
          }
        }
      },
      { desc: 'Fase 2: Vuela y esquiva ataques, invoca dragones menores.',
        action: (character, boss) => {
          if (boss.hp < boss.maxHP/2 && !boss.phase2) {
            boss.phase2 = true;
            character.combatLog.push('<span style="color:#ff0">¡El Dragón Ancestral entra en Fase 2 y esquiva tu próximo ataque!</span>');
            boss.evadeNext = true;
          }
        }
      }
    ],
    onTurn: (character, boss) => {
      if (!boss.phase2) SPECIAL_BOSSES[1].phases[0].action(character, boss);
      else SPECIAL_BOSSES[1].phases[1].action(character, boss);
    }
  }
];

function renderBossBattleEspecial(character) {
  // Selecciona boss especial según el piso o aleatorio
  let boss = JSON.parse(JSON.stringify(SPECIAL_BOSSES[Math.floor(Math.random()*SPECIAL_BOSSES.length)]));
  boss.hp = 120 + Math.floor(Math.random()*40);
  boss.maxHP = boss.hp;
  boss.ac = 20;
  boss.atk = 18;
  boss.status = [];
  boss.dead = false;
  boss.phase2 = false;
  // UI y combate
  function bossTurn() {
    boss.onTurn(character, boss);
    // Ataque normal
    if (!boss.evadeNext) {
      let dmg = boss.atk;
      character.hp = Math.max(1, character.hp-dmg);
      character.combatLog.push(`<span style='color:#f66'>¡${boss.name} te ataca! Pierdes ${dmg} HP.</span>`);
    } else {
      character.combatLog.push(`<span style='color:#6cf'>¡${boss.name} esquiva tu ataque!</span>`);
      boss.evadeNext = false;
    }
    if (character.hp <= 0) { character.hp = 0; character.dead = true; }
    renderCombat(character, boss, 'player');
  }
  renderCombat(character, boss, 'player');
  // Sobrescribe el botón de ataque para alternar turnos
  setTimeout(()=>{
    const attackBtn = document.getElementById('attack-btn');
    if (attackBtn) {
      attackBtn.onclick = () => {
        let dmg = (character.class.str||0) + Math.floor(Math.random()*12)+1;
        boss.hp -= dmg;
        character.combatLog.push(`<span style='color:#6f6'>¡Atacas a ${boss.name} e infliges ${dmg} de daño!</span>`);
        if (boss.hp <= 0) { boss.hp = 0; boss.dead = true; renderCombat(character, boss, 'player'); return; }
        bossTurn();
      };
    }
  }, 300);
}
// --- INSTRUCCIONES DE INTEGRACIÓN ---
// Llama a renderBossBattleEspecial(character) en vez de renderBossBattle para bosses avanzados o finales.
// Puedes alternar bosses normales y especiales según el piso o dificultad.

// --- SISTEMA DE COMPANIONS Y MASCOTAS ---
// Permite encontrar aliados temporales o mascotas con habilidades propias durante la aventura
// Llama a addCompanion(character, companion) para agregar uno

const COMPANIONS = [
  {
    name: "Lobo Fiel",
    desc: "Ataca junto a ti, puede aturdir enemigos.",
    ability: function(character, monster) {
      // 20% de chance de aturdir al atacar
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
      // +2 iniciativa al jugador
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
      character.luckBonus = 1;
    }
  }
];

function addCompanion(character, companion) {
  character.companions = character.companions || [];
  character.companions.push(companion);
  character.combatLog = character.combatLog || [];
  character.combatLog.push(`<span style='color:#ff9'>¡${companion.name} se une a tu aventura! (${companion.desc})</span>`);
}

// --- INTEGRACIÓN EN COMBATE ---
// Llama a companionsAbility(character, monster) al inicio de cada combate
function companionsAbility(character, monster) {
  if (!character.companions) return;
  character.companions.forEach(c => {
    if (typeof c.ability === 'function') c.ability(character, monster);
  });
}

// --- INTEGRACIÓN EN EVENTOS ---
// Ejemplo: en renderEventRoom, puedes dar la opción de encontrar un companion
// Ejemplo de uso:
//   if (Math.random() < 0.2) { // 20% chance en un evento
//     const companion = COMPANIONS[Math.floor(Math.random()*COMPANIONS.length)];
//     addCompanion(character, companion);
//   }

// --- INSTRUCCIONES DE INTEGRACIÓN ---
// 1. Llama a companionsAbility(character, monster) al iniciar cada combate (antes de la primera acción).
// 2. Puedes mostrar los companions activos en la UI junto al personaje.
// 3. Puedes agregar companions como recompensa de eventos, loot, o tiendas especiales.
// dnd-easter-egg.js
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

// --- MONSTER BESTIARY (sample, can be expanded) ---
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


// --- SISTEMA DE LOGROS Y ESTADÍSTICAS ---
// Guarda y muestra logros, récords y estadísticas de runs
// Llama a updateStats(character, event) en los puntos clave del juego

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

function renderStats() {
  const stats = getStats();
  let html = `<div class='section'><h2>Estadísticas</h2>`;
  html += `<ul>`;
  html += `<li>Runs jugadas: <b>${stats.runs}</b></li>`;
  html += `<li>Victorias: <b>${stats.victories}</b></li>`;
  html += `<li>Muertes: <b>${stats.deaths}</b></li>`;
  html += `<li>Monstruos derrotados: <b>${stats.monstersDefeated}</b></li>`;
  html += `<li>Jefes derrotados: <b>${stats.bossesDefeated}</b></li>`;
  html += `<li>Oro máximo: <b>${stats.goldMax}</b></li>`;
  html += `<li>Nivel máximo: <b>${stats.levelMax}</b></li>`;
  html += `<li>Legendarios encontrados: <b>${stats.legendaryFound}</b></li>`;
  html += `</ul><button class='btn' onclick='renderCharacterCreation()'>Volver</button></div>`;
  document.getElementById('game').innerHTML = html;
}

// --- LOGROS (ejemplo simple) ---
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

// --- INTEGRACIÓN ---
// Llama a updateStats(character, 'start') al iniciar una run
// Llama a updateStats(character, 'victory') al ganar
// Llama a updateStats(character, 'death') al morir
// Llama a updateStats(character, 'monster') al derrotar monstruo
// Llama a updateStats(character, 'boss') al derrotar jefe
// Llama a updateStats(character, 'legendary') al encontrar un legendario
// Llama a checkAchievements() tras cada updateStats
// Llama a renderStats() para mostrar estadísticas y logros

// --- SISTEMA DE ITEMS LEGENDARIOS ---
// Items raros con efectos únicos, baja probabilidad de drop
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

// Ejemplo de drop: 2% chance tras combate o en cofres
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

// --- INSTRUCCIONES DE INTEGRACIÓN ---
// 1. Llama a tryLegendaryDrop(character) tras cada combate ganado o evento de cofre.
// 2. Aplica los efectos de los legendarios en combate según su effect.
// 3. Llama a updateStats y checkAchievements en los puntos clave.
// 4. Llama a renderStats() para mostrar estadísticas/logros desde el menú principal.

// --- SISTEMA DE RELIQUIAS Y ARTEFACTOS ---
// Objetos raros con efectos pasivos únicos
// Llama a tryRelicDrop(character) tras eventos clave o combates

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
  if (Math.random() < 0.05) { // 5% chance
    const relic = RELICS[Math.floor(Math.random()*RELICS.length)];
    character.relics = character.relics || [];
    character.relics.push(relic);
    relic.effect(character);
    character.combatLog.push(`<span style='color:#ff0'>¡Has encontrado una reliquia: ${relic.name}! (${relic.desc})</span>`);
  }
}

// --- INTEGRACIÓN ---
// Llama a tryRelicDrop(character) tras cada combate, cofre o evento importante.
// Aplica los efectos pasivos de las reliquias en la lógica de combate, oro, muerte, etc.
// Puedes mostrar las reliquias activas en la UI del personaje.

// --- UI: Selección de personaje ---
function renderCharacterCreation() {
  const game = document.getElementById('game');
  let html = `<div class='section'><h2>1. Elige tu Clase</h2><div class='choices' id='class-choices'>`;
  CLASSES.forEach((c, i) => {
    html += `<label><input type='radio' name='class' value='${i}' ${i===0?'checked':''}>${c.name}</label>`;
  });
  html += `</div><div id='class-desc' style='margin-bottom:18px;'></div></div>`;

  html += `<div class='section'><h2>2. Elige tu Raza</h2><div class='choices' id='race-choices'>`;
  RACES.forEach((r, i) => {
    html += `<label><input type='radio' name='race' value='${i}' ${i===0?'checked':''}>${r.name}</label>`;
  });
  html += `</div><div id='race-desc' style='margin-bottom:18px;'></div></div>`;

  html += `<div class='section'><h2>3. Elige tu Trasfondo</h2><div class='choices' id='bg-choices'>`;
  BACKGROUNDS.forEach((b, i) => {
    html += `<label><input type='radio' name='bg' value='${i}' ${i===0?'checked':''}>${b.name}</label>`;
  });
  html += `</div><div id='bg-desc' style='margin-bottom:18px;'></div></div>`;

  html += `<button class='btn' id='start-btn'>Comenzar Aventura</button> `;
  html += `<button class='btn' id='stats-btn' style='margin-left:12px;'>Estadísticas/Logros</button>`;
  game.innerHTML = html;

  // Mostrar descripción al seleccionar
  function updateClassDesc() {
    const idx = +document.querySelector('input[name=class]:checked').value;
    const c = CLASSES[idx];
    document.getElementById('class-desc').innerHTML = `<b>${c.name}</b>: ${c.desc}<br><small>Vida: d${c.hitDie}, CA base: ${c.baseAC}, Fuerza: +${c.str}, Destreza: +${c.dex}, Constitución: +${c.con}, Inteligencia: +${c.int}, Sabiduría: +${c.wis}, Carisma: +${c.cha}<br>Habilidades: ${c.abilities.join(', ')}</small>`;
  }
  function updateRaceDesc() {
    const idx = +document.querySelector('input[name=race]:checked').value;
    const r = RACES[idx];
    let bonus = Object.entries(r.bonus).map(([k,v])=>`${k.toUpperCase()}: +${v}`).join(', ');
    document.getElementById('race-desc').innerHTML = `<b>${r.name}</b>: ${r.desc}<br><small>Bonos: ${bonus}</small>`;
  }
  function updateBgDesc() {
    const idx = +document.querySelector('input[name=bg]:checked').value;
    const b = BACKGROUNDS[idx];
    document.getElementById('bg-desc').innerHTML = `<b>${b.name}</b>: ${b.desc}`;
  }
  document.querySelectorAll('input[name=class]').forEach(e=>e.onchange=updateClassDesc);
  document.querySelectorAll('input[name=race]').forEach(e=>e.onchange=updateRaceDesc);
  document.querySelectorAll('input[name=bg]').forEach(e=>e.onchange=updateBgDesc);
  updateClassDesc(); updateRaceDesc(); updateBgDesc();

  document.getElementById('start-btn').onclick = () => {
    const classIdx = +document.querySelector('input[name=class]:checked').value;
    const raceIdx = +document.querySelector('input[name=race]:checked').value;
    const bgIdx = +document.querySelector('input[name=bg]:checked').value;
    startGame({
      class: CLASSES[classIdx],
      race: RACES[raceIdx],
      background: BACKGROUNDS[bgIdx]
    });
  };
  document.getElementById('stats-btn').onclick = () => {
    renderStats();
  };
}

// --- SISTEMA DE ARTE Y PERSONALIZACIÓN DE PERSONAJE ---
// Permite elegir/desbloquear skins, colores, retratos o customizar el avatar
// Llama a renderAvatarCustomization(selected) tras elegir clase/raza/trasfondo

const AVATAR_SKINS = [
  { name: 'Clásico', color: '#bfa', img: '🧙' },
  { name: 'Oscuro', color: '#333', img: '🧛' },
  { name: 'Dorado', color: '#fc0', img: '🧝' },
  { name: 'Dragón', color: '#c33', img: '🐲' },
  { name: 'Fantasma', color: '#9ef', img: '👻' },
  { name: 'Aleatorio', color: null, img: null }
];

function renderAvatarCustomization(selected) {
  const game = document.getElementById('game');
  let html = `<div class='section'><h2>7. Personaliza tu Avatar</h2><div class='choices'>`;
  AVATAR_SKINS.forEach((skin, i) => {
    html += `<label style='background:${skin.color||'#fff'};padding:8px 12px;border-radius:8px;margin:4px;display:inline-block;cursor:pointer;'>`;
    html += `<input type='radio' name='skin' value='${i}' ${i===0?'checked':''}>`;
    html += `<span style='font-size:2em;'>${skin.img||'❓'}</span> <b>${skin.name}</b></label>`;
  });
  html += `</div><button class='btn' id='finish-avatar-btn'>Finalizar y Comenzar Aventura</button>`;
  game.innerHTML = html;
  document.getElementById('finish-avatar-btn').onclick = () => {
    const idx = +document.querySelector('input[name=skin]:checked').value;
    let skin = AVATAR_SKINS[idx];
    if (skin.name === 'Aleatorio') {
      skin = AVATAR_SKINS[Math.floor(Math.random()*(AVATAR_SKINS.length-1))];
    }
    startAdventure({
      ...selected,
      avatar: skin
    });
  };
}

// --- INTEGRACIÓN EN SELECCIÓN DE PERSONAJE ---
// Llama a renderAvatarCustomization(selected) en vez de startAdventure(selected) tras elegir inventario/hechizos
// Muestra el avatar en la UI de combate y eventos:
// Ejemplo: <div class='avatar' style='font-size:2.5em;color:${character.avatar?.color||'#fff'}'>${character.avatar?.img||'🧙'}</div>
// Puedes desbloquear skins por logros, eventos o reliquias especiales

// --- SISTEMA DE RANKING Y PUNTUACIONES ---
// Guarda y muestra las mejores runs y puntuaciones locales
// Llama a updateRanking(character) al finalizar la run

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
  ranking = ranking.sort((a,b)=>b.level-a.level || b.gold-a.gold).slice(0,10); // Top 10
  saveRanking(ranking);
}

function renderRanking() {
  const ranking = getRanking();
  let html = `<div class='section'><h2>Ranking de Runs</h2><table style='width:100%;text-align:center'><tr><th>Fecha</th><th>Lvl</th><th>Oro</th><th>Turnos</th><th>Daño Recibido</th><th>Victoria</th></tr>`;
  ranking.forEach(run => {
    html += `<tr><td>${run.date}</td><td>${run.level}</td><td>${run.gold}</td><td>${run.turns}</td><td>${run.damageTaken}</td><td>${run.victory?'🏆':'❌'}</td></tr>`;
  });
  html += `</table><button class='btn' onclick='renderCharacterCreation()'>Volver</button></div>`;
  document.getElementById('game').innerHTML = html;
}

// --- INTEGRACIÓN ---
// Llama a updateRanking(character) al terminar la run (victoria o muerte)
// Llama a renderRanking() desde el menú principal para mostrar la tabla

// --- SISTEMA DE MODO HISTORIA / CAMPAÑA Y ENDLESS ---
// Permite progresión por capítulos, desbloqueo de zonas y modo endless
// Llama a startStoryMode() o startEndlessMode() desde el menú principal

const STORY_CHAPTERS = [
  {
    name: 'Capítulo 1: Las Catacumbas',
    desc: 'Explora las catacumbas y derrota al jefe esqueleto.',
    floors: 5,
    boss: 'Rey Esqueleto'
  },
  {
    name: 'Capítulo 2: La Torre Arcana',
    desc: 'Enfrenta magos y trampas mágicas hasta el Liche.',
    floors: 7,
    boss: 'Rey Liche'
  },
  {
    name: 'Capítulo 3: La Cima del Dragón',
    desc: 'Escala la montaña y vence al Dragón Ancestral.',
    floors: 9,
    boss: 'Dragón Ancestral'
  }
];

function startStoryMode() {
  // Selección de capítulo
  const game = document.getElementById('game');
  let html = `<div class='section'><h2>Modo Historia</h2><div class='choices'>`;
  STORY_CHAPTERS.forEach((ch, i) => {
    html += `<label><input type='radio' name='chapter' value='${i}' ${i===0?'checked':''}> <b>${ch.name}</b>: ${ch.desc}</label><br>`;
  });
  html += `</div><button class='btn' id='start-chapter-btn'>Comenzar Capítulo</button> <button class='btn' onclick='renderCharacterCreation()'>Volver</button>`;
  game.innerHTML = html;
  document.getElementById('start-chapter-btn').onclick = () => {
    const chapterIdx = +document.querySelector('input[name=chapter]:checked').value;
    const chapter = STORY_CHAPTERS[chapterIdx];
    // Ajustar dificultad y recursos según el capítulo
    window.DUNGEON = generateDungeon(chapter.floors);
    startAdventure({
      class: { ...CLASSES[0] }, // Clase por defecto
      race: { ...RACES[0] },   // Raza por defecto
      background: { ...BACKGROUNDS[0] }, // Trasfondo por defecto
      progress: 0,
      gold: 10,
      xp: 0,
      level: 1,
      xpToNext: 20,
      status: [],
      maxHP: 10,
      hp: 10,
      ac: 10,
      initiative: 0,
      dead: false,
      combatLog: [],
      chapter: chapter.name // Guardar nombre del capítulo
    });
  };
}

// --- MODO ENDLESS DUNGEON ---
function startEndlessMode() {
  const game = document.getElementById('game');
  // Reiniciar progreso y stats
  let character = {
    class: { ...CLASSES[0] },
    race: { ...RACES[0] },
    background: { ...BACKGROUNDS[0] },
    progress: 0,
    gold: 10,
    xp: 0,
    level: 1,
    xpToNext: 20,
    status: [],
    maxHP: 10,
    hp: 10,
    ac: 10,
    initiative: 0,
    dead: false,
    combatLog: [],
    chapter: 'Endless Dungeon'
  };
  window.DUNGEON = generateDungeon(12);
  startAdventure(character);
}

// --- PANTALLA DE SELECCIÓN DE MODO DE JUEGO ---
function renderModeSelection() {
  const game = document.getElementById('game');
  let html = `<div class='section'><h2>Elige tu modo de juego</h2>`;
  html += `<button class='btn big-btn' id='story-mode-btn'>Modo Historia / Campaña</button> `;
  html += `<button class='btn big-btn' id='endless-mode-btn'>Modo Endless Dungeon</button>`;
  html += `<div style='margin-top:18px'><button class='btn' id='stats-btn'>Estadísticas/Logros</button> <button class='btn' id='ranking-btn'>Ranking</button></div>`;
  html += `</div>`;
  game.innerHTML = html;
  document.getElementById('story-mode-btn').onclick = () => { startStoryMode(); };
  document.getElementById('endless-mode-btn').onclick = () => { startEndlessMode(); };
  document.getElementById('stats-btn').onclick = () => { renderStats(); };
  document.getElementById('ranking-btn').onclick = () => { renderRanking(); };
}

// --- INICIO AUTOMÁTICO EN SELECCIÓN DE MODO ---
window.addEventListener('DOMContentLoaded', ()=>{
  renderModeSelection();
});