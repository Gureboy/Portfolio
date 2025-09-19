// --- JUEGO D&D COMPLETAMENTE OFFLINE CON JQUERY ---
// Complete roguelike sin backend, usando localStorage

(function($) {
  'use strict';
  
  // Sistema de guardado local
  const GameStorage = {
    save(key, data) {
      try {
        localStorage.setItem(`dnd_game_${key}`, JSON.stringify(data));
        return true;
      } catch (error) {
        console.warn('No se pudo guardar:', error);
        return false;
      }
    },
    
    load(key) {
      try {
        const data = localStorage.getItem(`dnd_game_${key}`);
        return data ? JSON.parse(data) : null;
      } catch (error) {
        console.warn('No se pudo cargar:', error);
        return null;
      }
    },
    
    getLeaderboard() {
      const scores = this.load('leaderboard') || [];
      return scores.sort((a, b) => b.score - a.score).slice(0, 10);
    },
    
    addScore(playerData) {
      const scores = this.load('leaderboard') || [];
      scores.push({
        character_name: playerData.name,
        class_name: playerData.cls.n,
        final_level: playerData.lvl,
        score: this.calculateScore(playerData),
        date: new Date().toISOString()
      });
      this.save('leaderboard', scores);
    },
    
    calculateScore(player) {
      return (player.lvl * 100) + (player.gold) + (player.xp);
    }
  };
  
  // Enhanced classes with unique abilities
  const CLASSES = [
    {n:"Bárbaro",h:12,a:15,s:3,d:1,c:2,desc:"Guerrero salvaje con gran resistencia",special:"Furia (+3 daño por 3 turnos)"},
    {n:"Mago",h:6,a:12,s:0,d:1,c:0,i:3,w:1,desc:"Maestro de la magia arcana",special:"Hechizos poderosos"},
    {n:"Clérigo",h:8,a:14,s:1,d:0,c:2,w:3,ch:1,desc:"Sanador divino",special:"Curación divina"},
    {n:"Pícaro",h:8,a:13,s:1,d:3,c:1,w:1,desc:"Ágil y sigiloso",special:"Ataque furtivo"}
  ];
  
  // Expanded item system with rarities
  const ITEMS = [
    // Consumables
    {n:"Poción Menor",e:"heal",v:15,r:"common",p:20,desc:"Restaura 15 HP"},
    {n:"Poción Mayor",e:"heal",v:30,r:"uncommon",p:50,desc:"Restaura 30 HP"},
    {n:"Elixir Supremo",e:"heal",v:60,r:"rare",p:120,desc:"Restaura 60 HP"},
    {n:"Antídoto",e:"cure",v:1,r:"common",p:25,desc:"Cura veneno"},
    
    // Weapons
    {n:"Daga Oxidada",e:"weapon",v:1,r:"common",p:15,desc:"+1 daño",slot:"weapon"},
    {n:"Espada Corta",e:"weapon",v:3,r:"common",p:40,desc:"+3 daño",slot:"weapon"},
    {n:"Espada Élfica",e:"weapon",v:5,r:"uncommon",p:80,desc:"+5 daño, +1 precisión",slot:"weapon"},
    {n:"Martillo de Guerra",e:"weapon",v:7,r:"rare",p:150,desc:"+7 daño, aturde enemigos",slot:"weapon"},
    {n:"Hoja Dracónica",e:"weapon",v:10,r:"legendary",p:300,desc:"+10 daño, daño de fuego",slot:"weapon"},
    
    // Armor
    {n:"Túnica Raída",e:"armor",v:1,r:"common",p:20,desc:"+1 AC",slot:"armor"},
    {n:"Armadura de Cuero",e:"armor",v:2,r:"common",p:45,desc:"+2 AC",slot:"armor"},
    {n:"Cota de Malla",e:"armor",v:4,r:"uncommon",p:90,desc:"+4 AC",slot:"armor"},
    {n:"Armadura Élfica",e:"armor",v:6,r:"rare",p:180,desc:"+6 AC, +1 esquiva",slot:"armor"},
    
    // Accessories
    {n:"Anillo de Fuerza",e:"accessory",v:2,r:"uncommon",p:60,desc:"+2 STR",slot:"ring",stat:"str"},
    {n:"Amuleto de Agilidad",e:"accessory",v:2,r:"uncommon",p:60,desc:"+2 DEX",slot:"amulet",stat:"dex"},
    {n:"Corona de Sabiduría",e:"accessory",v:3,r:"rare",p:100,desc:"+3 INT",slot:"head",stat:"int"},
    {n:"Botas Veloces",e:"accessory",v:1,r:"common",p:35,desc:"+1 esquiva",slot:"boots"}
  ];
  
  // Enhanced story with more variety
  const STORY_ENCOUNTERS = [
    {type:"story",title:"El Bosque Maldito",desc:"Te adentras en un bosque oscuro donde las sombras cobran vida."},
    {type:"combat",monster:{n:"Goblin Explorador",h:8,a:13,at:3,c:0.25},desc:"Un goblin te embosca desde los arbustos."},
    {type:"merchant",title:"Mercader Errante",desc:"Un mercader ofrece sus mercancías en el camino."},
    {type:"story",title:"Ruinas Ancestrales",desc:"Ruinas cubiertas de musgo guardan secretos olvidados."},
    {type:"combat",monster:{n:"Esqueleto Guardián",h:15,a:14,at:4,c:0.5},desc:"Un esqueleto protege las ruinas milenarias."},
    {type:"treasure",title:"Cámara del Tesoro",desc:"Una cámara secreta repleta de tesoros te espera."},
    {type:"story",title:"El Puente Traicionero",desc:"Un puente de cuerda cruza un abismo mortal."},
    {type:"combat",monster:{n:"Orco Berserker",h:25,a:13,at:6,c:0.75},desc:"Un orco feroz bloquea tu paso con furia."},
    {type:"rest",title:"Santuario Sagrado",desc:"Un lugar sagrado donde puedes descansar y meditar."},
    {type:"story",title:"La Torre del Mago",desc:"Una torre misteriosa se alza ante ti, irradiando magia."},
    {type:"combat",monster:{n:"Golem de Piedra",h:40,a:15,at:7,c:1.2},desc:"Un golem ancestral despierta para defenderse."},
    {type:"forge",title:"Forja Mágica",desc:"Una forja ancestral puede mejorar tu equipo."},
    {type:"story",title:"Las Catacumbas Profundas",desc:"Desciendes a las profundidades donde el mal acecha."},
    {type:"combat",monster:{n:"Liche Menor",h:50,a:16,at:9,c:2},desc:"Un hechicero no-muerto te desafía con magia oscura."},
    {type:"story",title:"El Corazón del Dungeon",desc:"Llegas al núcleo del dungeon donde reside el mal primordial."},
    {type:"boss",monster:{n:"Señor Dragón",h:80,a:18,at:15,c:4},desc:"El señor dragón despierta para defender su tesoro."}
  ];
  
  let gameState = {
    currentEncounter: 0,
    storyMode: true,
    shopLevel: 1
  };
  
  // Equipment system
  function initializeCharacter(selectedClass) {
    return {
      cls: selectedClass,
      name: selectedClass.n,
      lvl: 1,
      hp: selectedClass.h + 10,
      maxHP: selectedClass.h + 10,
      ac: selectedClass.a,
      xp: 0,
      xpNext: 50,
      gold: 50,
      inv: [ITEMS[0], ITEMS[0]], // Start with 2 minor potions
      equipped: {
        weapon: null,
        armor: null,
        ring: null,
        amulet: null,
        head: null,
        boots: null
      },
      log: [],
      stats: {
        str: selectedClass.s || 0,
        dex: selectedClass.d || 0,
        con: selectedClass.c || 0,
        int: selectedClass.i || 0,
        wis: selectedClass.w || 0,
        cha: selectedClass.ch || 0
      },
      conditions: [],
      abilities: {
        rage: selectedClass.n === 'Bárbaro' ? 2 : 0,
        spells: selectedClass.n === 'Mago' ? 3 : 0,
        heals: selectedClass.n === 'Clérigo' ? 3 : 0,
        sneak: selectedClass.n === 'Pícaro' ? 2 : 0
      }
    };
  }
  
  // Enhanced character selection sin autenticación
  function showCharacterSelection() {
    const $game = $('#game');
    
    const html = `
      <div class='section char-selection'>
        <h2>⚔️ Elige tu Héroe ⚔️</h2>
        <p>Cada clase tiene habilidades especiales y estilos de juego únicos:</p>
        
        <div class='character-grid'>
          ${CLASSES.map((cls, i) => `
            <div class='char-card' data-class-index='${i}'>
              <h3>${cls.n}</h3>
              <p class='char-desc'>${cls.desc}</p>
              <p class='char-special'><strong>Especial:</strong> ${cls.special}</p>
              <div class='char-stats'>
                <small>HP: ${cls.h + 10} | AC: ${cls.a} | ATK: ${cls.s}</small>
              </div>
            </div>
          `).join('')}
        </div>
        
        <div class='game-info'>
          <p><strong>🎮 Juego completamente offline</strong></p>
          <p>Tu progreso se guarda automáticamente en el navegador</p>
        </div>
      </div>
    `;
    
    $game.html(html);
    
    // Usar jQuery para eventos
    $('.char-card').on('click', function() {
      const classIndex = $(this).data('class-index');
      selectCharacter(classIndex);
    });
  }

  // Función selectCharacter simplificada
  window.selectCharacter = function(idx) {
    const selectedClass = CLASSES[idx];
    window.char = initializeCharacter(selectedClass);
    
    // Auto-save cada 10 segundos
    setInterval(() => {
      GameStorage.save('current_character', window.char);
      GameStorage.save('current_encounter', gameState.currentEncounter);
    }, 10000);
    
    gameState.currentEncounter = 0;
    addLog(`¡Aventura iniciada como ${selectedClass.n}!`);
    startStoryEncounter();
  };
  
  // Enhanced encounter system
  function startStoryEncounter() {
    const encounter = STORY_ENCOUNTERS[gameState.currentEncounter];
    if (!encounter) {
      showVictoryScreen();
      return;
    }
    
    const $game = $('#game');
    
    switch(encounter.type) {
      case 'story':
        renderStoryEncounter(encounter);
        break;
      case 'combat':
        renderCombatEncounter(encounter);
        break;
      case 'merchant':
        renderMerchantEncounter(encounter);
        break;
      case 'treasure':
        renderTreasureEncounter(encounter);
        break;
      case 'forge':
        renderForgeEncounter(encounter);
        break;
      case 'rest':
        renderRestEncounter(encounter);
        break;
      case 'boss':
        renderBossEncounter(encounter);
        break;
    }
  }
  
  function renderCombatEncounter(encounter) {
    window.currentMonster = {
      ...encounter.monster,
      maxHP: encounter.monster.h,
      conditions: []
    };
    
    const $game = $('#game');
    const combatHTML = `
      <div class='section combat-section'>
        <h2>⚔️ ¡Combate!</h2>
        <p class='encounter-desc'>${encounter.desc}</p>
        
        <div class='combat-grid'>
          ${renderHeroPanel()}
          ${renderEnemyPanel()}
        </div>
        
        <div class='combat-log' id='combat-log'>${getCombatLogHTML()}</div>
        
        <div class='action-panel'>
          <div class='basic-actions'>
            <button id='attack-btn' class='combat-btn primary'>⚔️ Atacar</button>
            <button id='inventory-btn' class='combat-btn'>🎒 Inventario</button>
            <button id='defend-btn' class='combat-btn'>🛡️ Defenderse</button>
          </div>
          <div class='special-actions'>${renderSpecialActions()}</div>
        </div>
      </div>
    `;
    
    $game.html(combatHTML);
    
    // jQuery events para combate
    $('#attack-btn').on('click', performAttack);
    $('#inventory-btn').on('click', showInventoryInCombat);
    $('#defend-btn').on('click', defendAction);
    
    // Special abilities
    $('#use-rage').on('click', useRage);
    $('#cast-magic').on('click', castMagicMissile);
    $('#divine-heal').on('click', divineHeal);
    $('#sneak-attack').on('click', sneakAttack);
  }

  // Inventory con jQuery
  window.showInventoryInCombat = function() {
    const consumables = window.char.inv.filter(item => 
      item.e === 'heal' || item.e === 'cure' || item.e === 'buff'
    );
    
    if (consumables.length === 0) {
      addLog('No tienes items consumibles.');
      return;
    }
    
    const $game = $('#game');
    const html = `
      <div class='inventory-overlay'>
        <div class='inventory-panel'>
          <h3>Inventario de Combate</h3>
          <div class='item-grid'>
            ${consumables.map((item, i) => `
              <div class='item-card ${item.r}' data-item-index='${window.char.inv.indexOf(item)}'>
                <strong>${item.n}</strong>
                <p>${item.desc}</p>
                <small class='rarity'>${item.r}</small>
              </div>
            `).join('')}
          </div>
          <button id='close-inventory' class='close-btn'>Cerrar</button>
        </div>
      </div>
    `;
    
    $game.append(html);
    
    // jQuery events
    $('.item-card').on('click', function() {
      const itemIndex = $(this).data('item-index');
      useInventoryItem(itemIndex);
    });
    
    $('#close-inventory').on('click', function() {
      $('.inventory-overlay').remove();
    });
  };

  // Equipment management con jQuery
  window.showEquipment = function() {
    const $game = $('#game');
    const html = `
      <div class='equipment-overlay'>
        <div class='equipment-panel'>
          <h3>Equipo y Inventario</h3>
          
          <div class='equipment-slots'>
            <h4>Equipado:</h4>
            ${Object.entries(window.char.equipped).map(([slot, item]) => `
              <div class='equip-slot'>
                <strong>${slot}:</strong> 
                ${item ? `${item.n} (+${item.v})` : 'Vacío'}
                ${item ? `<button class='unequip-btn' data-slot='${slot}'>Desequipar</button>` : ''}
              </div>
            `).join('')}
          </div>
          
          <div class='inventory-items'>
            <h4>Inventario:</h4>
            ${window.char.inv.map((item, i) => `
              <div class='inv-item ${item.r}'>
                <strong>${item.n}</strong> - ${item.desc}
                ${item.slot ? `<button class='equip-btn' data-item-index='${i}'>Equipar</button>` : ''}
              </div>
            `).join('')}
          </div>
          
          <button id='close-equipment' class='close-btn'>Cerrar</button>
        </div>
      </div>
    `;
    
    $game.append(html);
    
    // jQuery events
    $('.equip-btn').on('click', function() {
      const itemIndex = $(this).data('item-index');
      equipItem(itemIndex);
    });
    
    $('.unequip-btn').on('click', function() {
      const slot = $(this).data('slot');
      unequipItem(slot);
    });
    
    $('#close-equipment').on('click', function() {
      $('.equipment-overlay').remove();
    });
  };

  // Inicialización con jQuery
  function initializeGame() {
    // Cargar partida guardada si existe
    const savedChar = GameStorage.load('current_character');
    const savedEncounter = GameStorage.load('current_encounter');
    
    if (savedChar && savedEncounter !== null) {
      const continueGame = confirm('¿Continuar partida guardada?');
      if (continueGame) {
        window.char = savedChar;
        gameState.currentEncounter = savedEncounter;
        startStoryEncounter();
        return;
      }
    }
    
    // Nueva partida
    showWelcomeScreen();
  }

  // Welcome screen con jQuery
  function showWelcomeScreen() {
    const $game = $('#game');
    $game.html(`
      <div class='section welcome-section'>
        <h2>⚔️ Aventura D&D Épica ⚔️</h2>
        <p>Un verdadero roguelike completamente offline con sistema completo de inventario y progresión profunda.</p>
        <div class='features-grid'>
          <div class='feature-card'>📜 Historia Épica</div>
          <div class='feature-card'>⚔️ Combate Estratégico</div>
          <div class='feature-card'>🎒 Sistema de Inventario</div>
          <div class='feature-card'>⚡ Habilidades Especiales</div>
          <div class='feature-card'>🏪 Mercaderes</div>
          <div class='feature-card'>🔨 Mejora de Equipo</div>
        </div>
        <div class='welcome-actions'>
          <button id='start-game-btn' class='start-btn primary'>🎮 Comenzar Aventura</button>
          <button id='show-leaderboard-btn' class='start-btn'>🏆 Ver Ranking</button>
        </div>
      </div>
    `);
    
    // jQuery events
    $('#start-game-btn').on('click', showCharacterSelection);
    $('#show-leaderboard-btn').on('click', showLeaderboard);
  }

  // FUNCIONES FALTANTES - Agregar al final antes de })(jQuery);

  // Helper functions
  function renderHeroPanel() {
    const char = window.char;
    return `
      <div class='hero-panel'>
        <h3>${char.name} (Nv.${char.lvl})</h3>
        <div class='hp-bar'>
          <div class='hp-fill' style='width: ${(char.hp/char.maxHP)*100}%'></div>
          <span class='hp-text'>${char.hp}/${char.maxHP} HP</span>
        </div>
        <p>AC: ${calculateAC()} | ATK: ${calculateAttack()}</p>
        <div class='conditions'>${renderConditions(char.conditions)}</div>
      </div>
    `;
  }

  function renderEnemyPanel() {
    const monster = window.currentMonster;
    return `
      <div class='enemy-panel'>
        <h3>${monster.n}</h3>
        <div class='hp-bar enemy'>
          <div class='hp-fill' style='width: ${(monster.h/monster.maxHP)*100}%'></div>
          <span class='hp-text'>${monster.h}/${monster.maxHP} HP</span>
        </div>
        <p>AC: ${monster.a}</p>
        <div class='conditions'>${renderConditions(monster.conditions)}</div>
      </div>
    `;
  }

  function renderSpecialActions() {
    const char = window.char;
    let actions = [];
    
    if (char.abilities.rage > 0) {
      actions.push(`<button id='use-rage' class='special-btn'>🔥 Furia (${char.abilities.rage})</button>`);
    }
    
    if (char.abilities.spells > 0) {
      actions.push(`<button id='cast-magic' class='special-btn'>✨ Misil Mágico (${char.abilities.spells})</button>`);
    }
    
    if (char.abilities.heals > 0) {
      actions.push(`<button id='divine-heal' class='special-btn'>🙏 Curación (${char.abilities.heals})</button>`);
    }
    
    if (char.abilities.sneak > 0) {
      actions.push(`<button id='sneak-attack' class='special-btn'>🗡️ Ataque Furtivo (${char.abilities.sneak})</button>`);
    }
    
    return actions.join('');
  }

  function renderConditions(conditions) {
    if (!conditions || conditions.length === 0) return '';
    return conditions.map(c => `<span class='condition ${c.name}'>${c.name} (${c.turns || '∞'})</span>`).join(' ');
  }

  function getCombatLogHTML() {
    const logs = window.char.log || [];
    return logs.slice(-4).join('<br>');
  }

  function addLog(message) {
    window.char.log = window.char.log || [];
    window.char.log.push(message);
    
    if (window.char.log.length > 6) {
      window.char.log = window.char.log.slice(-6);
    }
    
    const logElement = document.getElementById('combat-log');
    if (logElement) {
      logElement.innerHTML = getCombatLogHTML();
    }
  }

  // Combat functions
  window.performAttack = function() {
    const char = window.char;
    const monster = window.currentMonster;
    
    const d20 = Math.floor(Math.random() * 20) + 1;
    const attackRoll = d20 + calculateAttack();
    const isCritical = d20 === 20 || (d20 >= 18 && char.cls.n === 'Pícaro');
    
    if (attackRoll >= monster.a || isCritical) {
      let damage = calculateAttack() + Math.floor(Math.random() * 8) + 1;
      
      const rageBonus = char.conditions.find(c => c.name === 'rage')?.bonus || 0;
      damage += rageBonus;
      
      if (isCritical) {
        damage *= 2;
        addLog(`¡CRÍTICO! Daño duplicado.`);
      }
      
      monster.h = Math.max(0, monster.h - damage);
      addLog(`¡Atacas e infliges ${damage} de daño! (${d20}+${calculateAttack()})`);
      
      if (monster.h <= 0) {
        handleCombatVictory();
        return;
      }
    } else {
      addLog(`¡Fallas el ataque! (${d20}+${calculateAttack()} vs AC ${monster.a})`);
    }
    
    setTimeout(() => monsterAttack(), 800);
  };

  window.defendAction = function() {
    window.char.conditions.push({name: 'defending', turns: 1, acBonus: 3});
    addLog('Te preparas para defenderte. +3 AC hasta tu próximo turno.');
    setTimeout(() => monsterAttack(), 800);
  };

  function handleCombatVictory() {
    const monster = window.currentMonster;
    const xpGain = Math.round((monster.c || 1) * 25 + 10);
    const goldGain = Math.round((monster.c || 1) * 15 + Math.random() * 10);
    
    window.char.xp += xpGain;
    window.char.gold += goldGain;
    
    addLog(`¡Victoria! +${xpGain} XP, +${goldGain} oro`);
    
    while(window.char.xp >= window.char.xpNext) {
      levelUpCharacter();
    }
    
    setTimeout(nextEncounter, 2000);
  }

  window.nextEncounter = function() {
    gameState.currentEncounter++;
    startStoryEncounter();
  };

  // Equipment system
  function calculateAC() {
    let ac = window.char.cls.a;
    if (window.char.equipped.armor) ac += window.char.equipped.armor.v;
    if (window.char.equipped.boots && window.char.equipped.boots.desc.includes('esquiva')) ac += 1;
    return ac;
  }
  
  function calculateAttack() {
    let attack = window.char.stats.str;
    if (window.char.equipped.weapon) attack += window.char.equipped.weapon.v;
    return attack;
  }

  window.equipItem = function(index) {
    const item = window.char.inv[index];
    const slot = item.slot;
    
    if (window.char.equipped[slot]) {
      window.char.inv.push(window.char.equipped[slot]);
    }
    
    window.char.equipped[slot] = item;
    window.char.inv.splice(index, 1);
    
    addLog(`Equipas ${item.n}.`);
    $('.equipment-overlay').remove();
    showEquipment();
  };

  window.unequipItem = function(slot) {
    const item = window.char.equipped[slot];
    window.char.inv.push(item);
    window.char.equipped[slot] = null;
    
    addLog(`Desequipas ${item.n}.`);
    $('.equipment-overlay').remove();
    showEquipment();
  };

  window.useInventoryItem = function(index) {
    const item = window.char.inv[index];
    
    if (item.e === 'heal') {
      window.char.hp = Math.min(window.char.maxHP, window.char.hp + item.v);
      addLog(`Usas ${item.n} y recuperas ${item.v} HP.`);
    } else if (item.e === 'cure') {
      window.char.conditions = window.char.conditions.filter(c => c !== 'poison');
      addLog(`Usas ${item.n} y curas el veneno.`);
    }
    
    window.char.inv.splice(index, 1);
    $('.inventory-overlay').remove();
    setTimeout(() => monsterAttack(), 800);
  };

  // Rest encounters
  function renderRestEncounter(encounter) {
    const $game = $('#game');
    $game.html(`
      <div class='section rest-section'>
        <h2>🏕️ ${encounter.title}</h2>
        <p>${encounter.desc}</p>
        
        <div class='rest-options'>
          <div class='rest-option'>
            <h4>Descanso Rápido</h4>
            <p>Recupera 40% HP</p>
            <button id='quick-rest' class='rest-btn'>Descanso Rápido</button>
          </div>
          
          <div class='rest-option'>
            <h4>Descanso Completo</h4>
            <p>Recupera 80% HP + restaura 1 habilidad</p>
            <button id='full-rest' class='rest-btn'>Descanso Completo</button>
          </div>
          
          <div class='rest-option'>
            <h4>Meditar</h4>
            <p>Recupera 25% HP + gana 15 XP</p>
            <button id='meditate' class='rest-btn'>Meditar</button>
          </div>
        </div>
      </div>
    `);
    
    $('#quick-rest').on('click', quickRest);
    $('#full-rest').on('click', fullRest);
    $('#meditate').on('click', meditate);
  }

  window.quickRest = function() {
    const heal = Math.round(window.char.maxHP * 0.4);
    window.char.hp = Math.min(window.char.maxHP, window.char.hp + heal);
    addLog(`Descansas rápidamente y recuperas ${heal} HP.`);
    setTimeout(nextEncounter, 1000);
  };

  window.fullRest = function() {
    const heal = Math.round(window.char.maxHP * 0.8);
    window.char.hp = Math.min(window.char.maxHP, window.char.hp + heal);
    
    const abilities = Object.keys(window.char.abilities).filter(a => window.char.abilities[a] < getMaxAbility(a));
    if (abilities.length > 0) {
      const restored = abilities[Math.floor(Math.random() * abilities.length)];
      window.char.abilities[restored]++;
      addLog(`Descansas completamente. Recuperas ${heal} HP y restauras 1 uso de ${restored}.`);
    } else {
      addLog(`Descansas completamente y recuperas ${heal} HP.`);
    }
    
    setTimeout(nextEncounter, 1500);
  };

  window.meditate = function() {
    const heal = Math.round(window.char.maxHP * 0.25);
    window.char.hp = Math.min(window.char.maxHP, window.char.hp + heal);
    window.char.xp += 15;
    addLog(`Meditas en silencio. Recuperas ${heal} HP y ganas 15 XP de sabiduría.`);
    setTimeout(nextEncounter, 1000);
  };

  function getMaxAbility(ability) {
    const maxes = { rage: 5, spells: 8, heals: 6, sneak: 4 };
    return maxes[ability] || 3;
  }

  // Leaderboard local
  function showLeaderboard() {
    const leaderboard = GameStorage.getLeaderboard();
    const $game = $('#game');
    
    $game.html(`
      <div class='section leaderboard-section'>
        <h2>🏆 Ranking Local</h2>
        <div class='leaderboard-list'>
          ${leaderboard.length > 0 ? leaderboard.map((entry, i) => `
            <div class='leaderboard-entry ${i < 3 ? 'top-three' : ''}'>
              <span class='rank'>#${i + 1}</span>
              <span class='name'>${entry.character_name}</span>
              <span class='class'>${entry.class_name}</span>
              <span class='level'>Nv.${entry.final_level}</span>
              <span class='score'>${entry.score} pts</span>
            </div>
          `).join('') : '<p>No hay puntuaciones guardadas</p>'}
        </div>
        <div class='leaderboard-actions'>
          <button id='back-to-menu' class='leaderboard-btn'>🏠 Menu Principal</button>
          <button id='clear-scores' class='leaderboard-btn'>🗑️ Limpiar Puntuaciones</button>
        </div>
      </div>
    `);
    
    $('#back-to-menu').on('click', showWelcomeScreen);
    $('#clear-scores').on('click', function() {
      if (confirm('¿Seguro que quieres borrar todas las puntuaciones?')) {
        GameStorage.save('leaderboard', []);
        showLeaderboard();
      }
    });
  }

  // Cleanup optimization
  function optimizedCleanup() {
    if (window.char && Object.keys(window.char.inv || {}).length > 100) {
      window.char.inv = window.char.inv.slice(0, 50);
    }
  }

  // Ajustar el final del archivo para usar jQuery
})(jQuery);