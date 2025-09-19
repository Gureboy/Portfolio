// --- COMBATE POR TURNOS CLÁSICO D&D ---
// Complete roguelike with full inventory, equipment, and deeper mechanics

(function() {
  'use strict';
  
  // OPTIMIZACIÓN 1: Cache de elementos DOM
  const DOMCache = {
    gameElement: null,
    getGame() {
      if (!this.gameElement) {
        this.gameElement = document.getElementById('game');
      }
      return this.gameElement;
    },
    clearCache() {
      this.gameElement = null;
    }
  };

  // OPTIMIZACIÓN 2: Debounce para auto-save
  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  // OPTIMIZACIÓN 4: Lazy loading de funciones pesadas
  const LazyLoaders = {
    stackAuth: null,
    neonDB: null,
    
    async getStackAuth() {
      if (!this.stackAuth && window.stackAuth) {
        this.stackAuth = window.stackAuth;
        await this.stackAuth.init();
      }
      return this.stackAuth;
    },
    
    async getNeonDB() {
      if (!this.neonDB && window.neonDB) {
        this.neonDB = window.neonDB;
        await this.neonDB.init();
      }
      return this.neonDB;
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
  
  // Enhanced character selection with authentication
  function showCharacterSelection() {
    const g = DOMCache.getGame();
    
    // Check authentication (optimizado)
    const stackAuth = LazyLoaders.stackAuth;
    if (!stackAuth?.isAuthenticated() && !window.guestMode) {
      showLoginScreen();
      return;
    }
    
    const user = stackAuth?.getUser();
    
    // Usar DocumentFragment para mejor performance
    const fragment = document.createDocumentFragment();
    const container = document.createElement('div');
    container.className = 'section char-selection';
    
    // User welcome (solo si está logueado)
    if (user) {
      const userWelcome = document.createElement('div');
      userWelcome.className = 'user-welcome';
      userWelcome.innerHTML = `
        <p>¡Bienvenido, <strong>${user.display_name || user.email || 'Aventurero'}!</strong></p>
        <button onclick='logout()' class='logout-btn'>Cerrar Sesión</button>
      `;
      container.appendChild(userWelcome);
    }
    
    // Title and description
    const title = document.createElement('h2');
    title.textContent = '⚔️ Elige tu Héroe ⚔️';
    container.appendChild(title);
    
    const desc = document.createElement('p');
    desc.textContent = 'Cada clase tiene habilidades especiales y estilos de juego únicos:';
    container.appendChild(desc);
    
    // Character grid (optimizado con template)
    const grid = document.createElement('div');
    grid.className = 'character-grid';
    
    CLASSES.forEach((cls, i) => {
      const card = document.createElement('div');
      card.className = 'char-card';
      card.addEventListener('click', () => selectCharacter(i), { passive: true });
      
      card.innerHTML = `
        <h3>${cls.n}</h3>
        <p class='char-desc'>${cls.desc}</p>
        <p class='char-special'><strong>Especial:</strong> ${cls.special}</p>
        <div class='char-stats'>
          <small>HP: ${cls.h + 10} | AC: ${cls.a} | ATK: ${cls.s}</small>
        </div>
      `;
      
      grid.appendChild(card);
    });
    
    container.appendChild(grid);
    fragment.appendChild(container);
    
    // Clear and append in one operation
    g.innerHTML = '';
    g.appendChild(fragment);
  }

  // OPTIMIZACIÓN 6: Mejorar selectCharacter con async optimizado
  window.selectCharacter = async function(idx) {
    const selectedClass = CLASSES[idx];
    
    try {
      // Parallel initialization
      const [stackAuth, neonDB] = await Promise.all([
        LazyLoaders.getStackAuth(),
        LazyLoaders.getNeonDB()
      ]);
      
      if (neonDB && !neonDB.playerId) {
        const user = stackAuth?.getUser();
        const username = window.guestMode ? 
          `Guest_${Date.now()}` : 
          (user?.display_name || user?.email || `Hero_${selectedClass.n}_${Date.now()}`);
        
        await neonDB.createPlayer(username);
      }
    } catch (error) {
      console.warn('Database initialization failed, continuing offline:', error);
    }
    
    window.char = initializeCharacter(selectedClass);
    
    // Debounced auto-save
    const debouncedSave = debounce(async (char) => {
      const neonDB = LazyLoaders.neonDB;
      if (neonDB?.initialized && (LazyLoaders.stackAuth?.isAuthenticated() || window.guestMode)) {
        await neonDB.saveCharacterData({
          level: char.lvl,
          experience: char.xp,
          gold: char.gold,
          current_hp: char.hp,
          encounters_completed: gameState.currentEncounter
        });
      }
    }, 2000); // Save every 2 seconds instead of 30
    
    // Start optimized auto-save
    window.autoSaveFunction = () => debouncedSave(window.char);
    window.autoSaveInterval = setInterval(window.autoSaveFunction, 5000);
    
    gameState.currentEncounter = 0;
    startStoryEncounter();
  };
  
  // Enhanced encounter system
  function startStoryEncounter() {
    const encounter = STORY_ENCOUNTERS[gameState.currentEncounter];
    if (!encounter) {
      showVictoryScreen();
      return;
    }
    
    const g = DOMCache.getGame();
    
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
    
    const g = DOMCache.getGame();
    
    // Use template literal with better structure
    const combatHTML = `
      <div class='section combat-section'>
        <h2>⚔️ ¡Combate!</h2>
        <p class='encounter-desc'>${encounter.desc}</p>
        
        <div class='combat-grid'>
          ${renderHeroPanel()}
          ${renderEnemyPanel()}
        </div>
        
        <div class='combat-log' id='combat-log'>${getCombatLogHTML()}</div>
        <div class='action-panel'>${renderActionPanel()}</div>
      </div>
    `;
    
    g.innerHTML = combatHTML;
  }

  // OPTIMIZACIÓN 8: Funciones helper para mejor modularidad
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

  function renderActionPanel() {
    return `
      <div class='basic-actions'>
        <button onclick='performAttack()' class='combat-btn primary'>⚔️ Atacar</button>
        <button onclick='showInventoryInCombat()' class='combat-btn'>🎒 Inventario</button>
        <button onclick='defendAction()' class='combat-btn'>🛡️ Defenderse</button>
      </div>
      <div class='special-actions'>${renderSpecialActions()}</div>
    `;
  }

  function getCombatLogHTML() {
    const logs = window.char.log || [];
    return logs.slice(-4).join('<br>');
  }

  // OPTIMIZACIÓN 9: Mejorar addLog con límite más estricto
  function addLog(message) {
    window.char.log = window.char.log || [];
    window.char.log.push(message);
    
    // Mantener solo los últimos 6 mensajes
    if (window.char.log.length > 6) {
      window.char.log = window.char.log.slice(-6);
    }
    
    // Update combat log in real-time si existe
    const logElement = document.getElementById('combat-log');
    if (logElement) {
      logElement.innerHTML = getCombatLogHTML();
    }
  }

  // CORRECCIÓN: Agregar funciones faltantes
  function renderSpecialActions() {
    const char = window.char;
    let actions = [];
    
    if (char.abilities.rage > 0) {
      actions.push(`<button onclick='useRage()' class='special-btn'>🔥 Furia (${char.abilities.rage})</button>`);
    }
    
    if (char.abilities.spells > 0) {
      actions.push(`<button onclick='castMagicMissile()' class='special-btn'>✨ Misil Mágico (${char.abilities.spells})</button>`);
    }
    
    if (char.abilities.heals > 0) {
      actions.push(`<button onclick='divineHeal()' class='special-btn'>🙏 Curación (${char.abilities.heals})</button>`);
    }
    
    if (char.abilities.sneak > 0) {
      actions.push(`<button onclick='sneakAttack()' class='special-btn'>🗡️ Ataque Furtivo (${char.abilities.sneak})</button>`);
    }
    
    return actions.join('');
  }

  function renderConditions(conditions) {
    if (!conditions || conditions.length === 0) return '';
    return conditions.map(c => `<span class='condition ${c.name}'>${c.name} (${c.turns || '∞'})</span>`).join(' ');
  }

  // CORRECCIÓN: Combat mechanics improvements
  window.performAttack = function() {
    const char = window.char;
    const monster = window.currentMonster;
    
    const d20 = Math.floor(Math.random() * 20) + 1;
    const attackRoll = d20 + calculateAttack() + (char.equipped.weapon?.precision || 0);
    
    const isCritical = d20 === 20 || (d20 >= 18 && char.cls.n === 'Pícaro');
    
    if (attackRoll >= monster.a || isCritical) {
      let damage = calculateAttack() + Math.floor(Math.random() * 8) + 1;
      
      const rageBonus = char.conditions.find(c => c.name === 'rage')?.bonus || 0;
      damage += rageBonus;
      
      if (isCritical) {
        damage *= 2;
        addLog(`¡CRÍTICO! Daño duplicado.`);
      }
      
      if (char.equipped.weapon?.n === 'Martillo de Guerra' && Math.random() < 0.3) {
        monster.conditions.push({name: 'stun', turns: 1});
        addLog('¡El martillo aturde al enemigo!');
      }
      
      if (char.equipped.weapon?.n === 'Hoja Dracónica') {
        const fireDamage = 5;
        damage += fireDamage;
        addLog(`¡Daño de fuego adicional: ${fireDamage}!`);
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

  // CORRECCIÓN: Defend action implementation
  window.defendAction = function() {
    window.char.conditions.push({name: 'defending', turns: 1, acBonus: 3});
    addLog('Te preparas para defenderte. +3 AC hasta tu próximo turno.');
    setTimeout(() => monsterAttack(), 800);
  };

  // CORRECCIÓN: Agregar funciones de combate faltantes
  async function handleCombatVictory() {
    const monster = window.currentMonster;
    const xpGain = Math.round((monster.c || 1) * 25 + 10);
    const goldGain = Math.round((monster.c || 1) * 15 + Math.random() * 10);
    
    window.char.xp += xpGain;
    window.char.gold += goldGain;
    window.char.progress = (window.char.progress || 0) + 1;
    
    // Log combat to database if available
    try {
      if (window.neonDB?.initialized) {
        await window.neonDB.apiCall('/combat-logs', 'POST', {
          character_id: window.neonDB.currentCharacter,
          encounter_number: gameState.currentEncounter,
          monster_name: monster.n,
          combat_result: 'victory',
          experience_gained: xpGain,
          gold_gained: goldGain
        });
      }
    } catch (error) {
      console.warn('Failed to log combat:', error);
    }
    
    addLog(`¡Victoria! +${xpGain} XP, +${goldGain} oro`);
    
    while(window.char.xp >= window.char.xpNext) {
      levelUpCharacter();
    }
    
    const drops = rollLootDrop(monster);
    for (const drop of drops) {
      if (drop.t) {
        window.char.materials = window.char.materials || [];
        window.char.materials.push(drop);
        addLog(`¡Encuentras material: ${drop.n}!`);
      } else {
        window.char.inv.push(drop);
      }
    }
    
    setTimeout(nextEncounter, 2000);
  }

  function showVictoryScreen() {
    const g = DOMCache.getGame();
    g.innerHTML = `
      <div class='section victory-section'>
        <h2>🏆 ¡VICTORIA COMPLETA! 🏆</h2>
        <p>¡Has completado toda la aventura épica!</p>
        <div class='final-stats'>
          <p><strong>Nivel Final:</strong> ${window.char.lvl}</p>
          <p><strong>Encuentros Completados:</strong> ${gameState.currentEncounter}</p>
          <p><strong>Oro Total:</strong> ${window.char.gold}</p>
          <p><strong>Score Final:</strong> ${calculateFinalScore()}</p>
        </div>
        <div class='victory-actions'>
          <button onclick='showLeaderboard()' class='victory-btn'>🏆 Ver Ranking</button>
          <button onclick='location.reload()' class='victory-btn'>🔄 Nueva Aventura</button>
        </div>
      </div>
    `;
  }

  function calculateFinalScore() {
    return (window.char.lvl * 100) + 
           (gameState.currentEncounter * 10) + 
           Math.floor(window.char.gold / 10) +
           (window.char.xp);
  }

  // CORRECCIÓN: Event delegation para mejor performance
  function setupEventDelegation() {
    const gameElement = DOMCache.getGame();
    
    gameElement.addEventListener('click', (e) => {
      const target = e.target;
      
      if (target.matches('.combat-btn.primary')) {
        e.preventDefault();
        performAttack();
      } else if (target.matches('.logout-btn')) {
        e.preventDefault();
        logout();
      } else if (target.matches('.char-card')) {
        const cards = Array.from(document.querySelectorAll('.char-card'));
        const index = cards.indexOf(target);
        if (index !== -1) {
          selectCharacter(index);
        }
      }
    }, { passive: false });
  }

  // CORRECCIÓN: Cleanup optimizado
  function optimizedCleanup() {
    if (window.autoSaveInterval) {
      clearInterval(window.autoSaveInterval);
      window.autoSaveInterval = null;
    }
    
    DOMCache.clearCache();
    
    if (window.char && Object.keys(window.char.inv || {}).length > 100) {
      window.char.inv = window.char.inv.slice(0, 50);
    }
  }

  // CORRECCIÓN: Funciones de autenticación faltantes
  function showLoginScreen() {
    const g = DOMCache.getGame();
    g.innerHTML = `
      <div class='section auth-section'>
        <h2>🏰 Acceso al Reino</h2>
        <p>Inicia sesión para guardar tu progreso y competir en el ranking global</p>
        <div class='welcome-actions'>
          <button onclick='playAsGuest()' class='start-btn primary'>👤 Jugar como Invitado</button>
          <button onclick='showWelcomeScreen()' class='start-btn'>🔙 Volver</button>
        </div>
      </div>
    `;
  }

  window.playAsGuest = function() {
    window.guestMode = true;
    showCharacterSelection();
  };

  window.logout = function() {
    window.guestMode = false;
    showLoginScreen();
  };

  window.startStoryGame = function() {
    showCharacterSelection();
  };

  window.closeAchievement = function() {
    const popup = document.querySelector('.achievement-popup');
    if (popup) popup.remove();
  };

  // Inventory system
  window.showInventoryInCombat = function() {
    const consumables = window.char.inv.filter(item => 
      item.e === 'heal' || item.e === 'cure' || item.e === 'buff'
    );
    
    if (consumables.length === 0) {
      addLog('No tienes items consumibles.');
      return;
    }
    
    const g = document.getElementById('game');
    g.innerHTML += `
      <div class='inventory-overlay'>
        <div class='inventory-panel'>
          <h3>Inventario de Combate</h3>
          <div class='item-grid'>
            ${consumables.map((item, i) => `
              <div class='item-card ${item.r}' onclick='useInventoryItem(${window.char.inv.indexOf(item)})'>
                <strong>${item.n}</strong>
                <p>${item.desc}</p>
                <small class='rarity'>${item.r}</small>
              </div>
            `).join('')}
          </div>
          <button onclick='closeCombatInventory()' class='close-btn'>Cerrar</button>
        </div>
      </div>
    `;
  };
  
  window.closeCombatInventory = function() {
    document.querySelector('.inventory-overlay').remove();
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
    closeCombatInventory();
    setTimeout(() => monsterAttack(), 800);
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

  // Corregir el showWelcomeScreen que estaba incompleto - BUSCAR Y REEMPLAZAR LA FUNCIÓN EXISTENTE:
  function showWelcomeScreen() {
    const g = DOMCache.getGame();
    g.innerHTML = `
      <div class='section welcome-section'>
        <h2>⚔️ Aventura D&D Épica ⚔️</h2>
        <p>Un verdadero roguelike con sistema completo de inventario, equipo y progresión profunda.</p>
        <div class='features-grid'>
          <div class='feature-card'>📜 Historia Épica</div>
          <div class='feature-card'>⚔️ Combate Estratégico</div>
          <div class='feature-card'>🎒 Sistema de Inventario</div>
          <div class='feature-card'>⚡ Habilidades Especiales</div>
          <div class='feature-card'>🏪 Mercaderes</div>
          <div class='feature-card'>🔨 Mejora de Equipo</div>
        </div>
        <div class='welcome-actions'>
          <button onclick='showLoginScreen()' class='start-btn primary'>🔐 Iniciar Sesión</button>
          <button onclick='playAsGuest()' class='start-btn'>👤 Jugar como Invitado</button>
        </div>
      </div>
    `;
  }

  // --- DND EASTER EGG CODE ---
  // Easter egg: secret developer menu
  function showDevMenu() {
    const g = DOMCache.getGame();
    g.innerHTML = `
      <div class='section dev-menu'>
        <h2>🛠️ Menú del Desarrollador</h2>
        <p>Acciones rápidas para pruebas:</p>
        <div class='dev-actions'>
          <button onclick='testLevelUp()' class='dev-btn'>⚡ Subir de Nivel</button>
          <button onclick='giveGold(1000)' class='dev-btn'>💰 Dar 1000 oro</button>
          <button onclick='addItemToInventory("Poción Mayor")' class='dev-btn'>🍷 Añadir Poción Mayor</button>
          <button onclick='toggleGodMode()' class='dev-btn'>🛡️ Modo Dios</button>
        </div>
        <button onclick='closeDevMenu()' class='close-btn'>Cerrar</button>
      </div>
    `;
  }

  function closeDevMenu() {
    const menu = document.querySelector('.dev-menu');
    if (menu) menu.remove();
  }

  // Test functions for development
  window.testLevelUp = function() {
    levelUpCharacter();
    addLog('Subiste de nivel para pruebas.');
  };

  window.giveGold = function(amount) {
    window.char.gold += amount;
    addLog(`Te dieron ${amount} de oro.`);
  };

  window.addItemToInventory = function(itemName) {
    const item = ITEMS.find(i => i.n === itemName);
    if (item) {
      window.char.inv.push(item);
      addLog(`Añadiste ${item.n} a tu inventario.`);
    }
  };

  window.toggleGodMode = function() {
    window.char.hp = window.char.maxHP;
    window.char.xp = window.char.xpNext;
    window.char.gold += 1000;
    addLog('Modo Dios activado: salud completa, XP y oro extra.');
  };

  // --- END DND EASTER EGG CODE ---

  // Rest encounter with choices
  function renderRestEncounter(encounter) {
    const g = document.getElementById('game');
    g.innerHTML = `
      <div class='section rest-section'>
        <h2>🏕️ ${encounter.title}</h2>
        <p>${encounter.desc}</p>
        
        <div class='rest-options'>
          <div class='rest-option'>
            <h4>Descanso Rápido</h4>
            <p>Recupera 40% HP</p>
            <button onclick='quickRest()' class='rest-btn'>Descanso Rápido</button>
          </div>
          
          <div class='rest-option'>
            <h4>Descanso Completo</h4>
            <p>Recupera 80% HP + restaura 1 habilidad</p>
            <button onclick='fullRest()' class='rest-btn'>Descanso Completo</button>
          </div>
          
          <div class='rest-option'>
            <h4>Meditar</h4>
            <p>Recupera 25% HP + gana 15 XP</p>
            <button onclick='meditate()' class='rest-btn'>Meditar</button>
          </div>
        </div>
      </div>
    `;
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
    
    // Restore one random ability
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

  window.nextEncounter = function() {
    gameState.currentEncounter++;
    startStoryEncounter();
  };

  // Add crafting materials and recipes
  const MATERIALS = [
    {n:"Hierro",t:"metal",r:"common",desc:"Material básico para forjar"},
    {n:"Mithril",t:"metal",r:"rare",desc:"Metal élfico ligero y resistente"},
    {n:"Gema Arcana",t:"magic",r:"uncommon",desc:"Cristal imbuido con magia"},
    {n:"Escama Dragón",t:"special",r:"legendary",desc:"Escama de dragón antigua"},
    {n:"Esencia Sombra",t:"essence",r:"rare",desc:"Poder de las sombras concentrado"}
  ];

  const RECIPES = [
    {name:"Espada Forjada",materials:[{n:"Hierro",q:2},{n:"Gema Arcana",q:1}],result:{n:"Espada Mágica",e:"weapon",v:6,r:"rare",desc:"+6 ATK, efecto mágico"}},
    {name:"Armadura Élfica",materials:[{n:"Mithril",q:3}],result:{n:"Cota Mithril",e:"armor",v:5,r:"rare",desc:"+5 AC, +1 DEX"}},
    {name:"Amuleto Poder",materials:[{n:"Gema Arcana",q:2},{n:"Esencia Sombra",q:1}],result:{n:"Amuleto Supremo",e:"accessory",v:3,r:"legendary",desc:"+3 a todos los stats"}}
  ];
  
  // Enhanced loot system with material drops
  function rollLootDrop(monster) {
    const drops = [];
    
    // Regular item drop
    if (Math.random() < 0.3) {
      const item = ITEMS[Math.floor(Math.random() * ITEMS.length)];
      drops.push(item);
    }
    
    // Material drop based on monster type
    if (Math.random() < 0.4) {
      let material;
      if (monster.n.includes('Dragón')) {
        material = MATERIALS.find(m => m.n === 'Escama Dragón');
      } else if (monster.n.includes('Golem')) {
        material = MATERIALS.find(m => m.n === 'Hierro');
      } else if (monster.n.includes('Liche')) {
        material = MATERIALS.find(m => m.n === 'Esencia Sombra');
      } else {
        material = MATERIALS[Math.floor(Math.random() * 3)]; // Common materials
      }
      drops.push(material);
    }
    
    return drops;
  }

  // Gambling/Casino encounter
  function renderCasinoEncounter() {
    const g = document.getElementById('game');
    g.innerHTML = `
      <div class='section casino-section'>
        <h2>🎰 Casino Mágico</h2>
        <p>Un casino flotante aparece mágicamente. Los dados brillan con poder arcano.</p>
        <p class='gold-display'>Oro disponible: <strong>${window.char.gold}</strong></p>
        
        <div class='casino-games'>
          <div class='casino-game'>
            <h4>🎲 Dados del Destino</h4>
            <p>Apuesta 20 oro - Gana hasta 100 oro</p>
            <button onclick='playDiceGame()' class='casino-btn' ${window.char.gold < 20 ? 'disabled' : ''}>Jugar (20 oro)</button>
          </div>
          
          <div class='casino-game'>
            <h4>🃏 Cartas Arcanas</h4>
            <p>Apuesta 50 oro - Gana item raro o pierde todo</p>
            <button onclick='playCardGame()' class='casino-btn' ${window.char.gold < 50 ? 'disabled' : ''}>Jugar (50 oro)</button>
          </div>
          
          <div class='casino-game'>
            <h4>🎰 Tragamonedas Épico</h4>
            <p>Apuesta 100 oro - Jackpot: item legendario</p>
            <button onclick='playSlotMachine()' class='casino-btn' ${window.char.gold < 100 ? 'disabled' : ''}>Jugar (100 oro)</button>
          </div>
        </div>
        
        <button onclick='nextEncounter()' class='casino-btn'>Abandonar Casino</button>
      </div>
    `;
  }

  window.playDiceGame = async function() {
    if (window.char.gold >= 20) {
      window.char.gold -= 20;
      const roll1 = Math.floor(Math.random() * 6) + 1;
      const roll2 = Math.floor(Math.random() * 6) + 1;
      const total = roll1 + roll2;
      
      let winnings = 0;
      if (total === 12) winnings = 100;
      else if (total === 7 || total === 11) winnings = 60;
      else if (total >= 8) winnings = 30;
      
      window.char.gold += winnings;
      
      // Log gambling if database available
      try {
        if (window.neonDB.initialized) {
          await window.neonDB.apiCall('/gambling-stats', 'POST', {
            character_id: window.neonDB.currentCharacter,
            game_type: 'dice',
            bet_amount: 20,
            winnings: winnings,
            game_result: winnings > 0 ? 'win' : 'loss',
            details: { roll1, roll2, total }
          });
        }
      } catch (error) {
        console.warn('Failed to log gambling:', error);
      }
      
      addLog(`Dados: ${roll1}+${roll2}=${total}. ${winnings > 0 ? `¡Ganas ${winnings} oro!` : 'Pierdes la apuesta.'}`);
      setTimeout(() => renderCasinoEncounter(), 1500);
    }
  };

  window.playCardGame = function() {
    if (window.char.gold >= 50) {
      window.char.gold -= 50;
      const card = Math.floor(Math.random() * 13) + 1; // 1-13
      
      if (card >= 11) { // Jack, Queen, King
        const rareItems = ITEMS.filter(i => i.r === 'rare');
        const prize = rareItems[Math.floor(Math.random() * rareItems.length)];
        window.char.inv.push(prize);
        addLog(`¡Carta alta! Ganas: ${prize.n}`);
      } else if (card >= 8) {
        window.char.gold += 75;
        addLog(`¡Buena carta! Recuperas 75 oro.`);
      } else {
        addLog(`Carta baja (${card}). Pierdes la apuesta.`);
      }
      
      setTimeout(() => renderCasinoEncounter(), 1500);
    }
  };

  window.playSlotMachine = function() {
    if (window.char.gold >= 100) {
      window.char.gold -= 100;
      const reel1 = Math.floor(Math.random() * 5);
      const reel2 = Math.floor(Math.random() * 5);
      const reel3 = Math.floor(Math.random() * 5);
      
      const symbols = ['🍒','🍋','⭐','💎','👑'];
      
      if (reel1 === reel2 && reel2 === reel3) {
        if (reel1 === 4) { // Triple crown - JACKPOT
          const legendaryItems = ITEMS.filter(i => i.r === 'legendary');
          const jackpot = legendaryItems[Math.floor(Math.random() * legendaryItems.length)];
          window.char.inv.push(jackpot);
          addLog(`¡¡¡JACKPOT!!! ${symbols[reel1]}${symbols[reel2]}${symbols[reel3]} - Ganas: ${jackpot.n}`);
        } else { // Other triples
          window.char.gold += 200;
          addLog(`¡Triple! ${symbols[reel1]}${symbols[reel2]}${symbols[reel3]} - Ganas 200 oro.`);
        }
      } else if (reel1 === reel2 || reel2 === reel3 || reel1 === reel3) {
        window.char.gold += 50;
        addLog(`¡Par! ${symbols[reel1]}${symbols[reel2]}${symbols[reel3]} - Recuperas 50 oro.`);
      } else {
        addLog(`${symbols[reel1]}${symbols[reel2]}${symbols[reel3]} - Sin premio.`);
      }
      
      setTimeout(() => renderCasinoEncounter(), 1500);
    }
  };

  // Pet/Companion system enhancement
  const PETS = [
    {n:"Dragoncito",desc:"Pequeño dragón que ocasionalmente escupe fuego",bonus:"fire_breath",rarity:"legendary"},
    {n:"Lobo Sombra",desc:"Lobo que aumenta tu sigilo",bonus:"stealth",rarity:"rare"},
    {n:"Búho Sabio",desc:"Te otorga sabiduría adicional",bonus:"wisdom",rarity:"uncommon"},
    {n:"Gato de Suerte",desc:"Mejora tus probabilidades de crítico",bonus:"luck",rarity:"common"}
  ];

  function applyPetBonuses(char) {
    if (!char.pet) return;
    
    switch(char.pet.bonus) {
      case 'fire_breath':
        if (Math.random() < 0.15) {
          const damage = 8;
          window.currentMonster.h = Math.max(0, window.currentMonster.h - damage);
          addLog(`¡${char.pet.n} escupe fuego por ${damage} de daño!`);
          return true; // Pet attacked
        }
        break;
      case 'stealth':
        char.stats.dex += 1; // Temporary bonus
        break;
      case 'wisdom':
        char.xp += 2; // Small XP bonus per turn
        break;
      case 'luck':
        // Handled in attack calculation
        break;
    }
    return false;
  }

  // Dungeon events system
  const RANDOM_EVENTS = [
    {
      name: "Tormenta Mágica",
      desc: "Una tormenta mágica azota el área",
      effect: () => {
        if (Math.random() < 0.5) {
          window.char.hp = Math.max(1, window.char.hp - 8);
          addLog('La tormenta te daña por 8 HP.');
        } else {
          window.char.abilities.spells = Math.min(window.char.abilities.spells + 1, 8);
          addLog('La magia de la tormenta restaura 1 hechizo.');
        }
      }
    },
    {
      name: "Encuentro con Fantasma",
      desc: "Un fantasma aparece y te ofrece un trato",
      effect: () => {
        if (window.char.gold >= 30) {
          window.char.gold -= 30;
          const heal = 25;
          window.char.hp = Math.min(window.char.maxHP, window.char.hp + heal);
          addLog(`Pagas 30 oro al fantasma y recuperas ${heal} HP.`);
        } else {
          addLog('El fantasma se va decepcionado por tu pobreza.');
        }
      }
    },
    {
      name: "Fuente Mística",
      desc: "Encuentras una fuente que brilla con magia",
      effect: () => {
        const choice = confirm("¿Beber de la fuente mística? (Puede ser beneficioso o peligroso)");
        if (choice) {
          if (Math.random() < 0.6) {
            const statBoost = ['str','dex','con','int','wis','cha'][Math.floor(Math.random()*6)];
            window.char.stats[statBoost]++;
            addLog(`¡La fuente mejora tu ${statBoost.toUpperCase()} permanentemente!`);
          } else {
            window.char.hp = Math.max(1, window.char.hp - 10);
            addLog('La fuente estaba maldita. Pierdes 10 HP.');
          }
        }
      }
    }
  ];

  // Crafting system integration
  function renderCraftingEncounter() {
    window.char.materials = window.char.materials || [];
    
    const g = document.getElementById('game');
    g.innerHTML = `
      <div class='section crafting-section'>
        <h2>🔨 Taller de Crafteo</h2>
        <p>Un maestro artesano te permite crear items únicos.</p>
        
        <div class='materials-inventory'>
          <h4>Materiales disponibles:</h4>
          ${window.char.materials.length > 0 ? 
            window.char.materials.map((mat,i) => `<span class='material ${mat.r}'>${mat.n}</span>`).join(' ') 
            : '<p>No tienes materiales de crafteo.</p>'}
        </div>
        
        <div class='recipes-list'>
          <h4>Recetas disponibles:</h4>
          ${RECIPES.map((recipe, i) => `
            <div class='recipe-card'>
              <h5>${recipe.name}</h5>
              <p>Requiere: ${recipe.materials.map(m => `${m.q}x ${m.n}`).join(', ')}</p>
              <p>Resultado: ${recipe.result.n} (${recipe.result.desc})</p>
              <button onclick='craftItem(${i})' class='craft-btn' 
                ${canCraft(recipe) ? '' : 'disabled'}>
                Craftear
              </button>
            </div>
          `).join('')}
        </div>
        
        <button onclick='nextEncounter()' class='craft-btn'>Salir del taller</button>
      </div>
    `;
  }

  function canCraft(recipe) {
    return recipe.materials.every(req => {
      const owned = window.char.materials.filter(m => m.n === req.n).length;
      return owned >= req.q;
    });
  }

  window.craftItem = function(recipeIndex) {
    const recipe = RECIPES[recipeIndex];
    if (canCraft(recipe)) {
      // Remove materials
      recipe.materials.forEach(req => {
        for (let i = 0; i < req.q; i++) {
          const matIndex = window.char.materials.findIndex(m => m.n === req.n);
          if (matIndex !== -1) {
            window.char.materials.splice(matIndex, 1);
          }
        }
      });
      
      // Add crafted item
      window.char.inv.push(recipe.result);
      addLog(`¡Has crafteado: ${recipe.result.n}!`);
      
      renderCraftingEncounter(); // Refresh display
    }
  };

  // Boss abilities system
  const BOSS_ABILITIES = {
    'Señor Dragón': [
      {
        name: 'Aliento Devastador',
        cooldown: 3,
        effect: (char) => {
          const damage = 20 + Math.floor(Math.random() * 10);
          char.hp = Math.max(0, char.hp - damage);
          addLog(`¡El dragón usa Aliento Devastador por ${damage} de daño!`);
        }
      },
      {
        name: 'Rugido Aterrador',
        cooldown: 4,
        effect: (char) => {
          char.conditions.push({name: 'fear', turns: 2});
          addLog('¡El rugido del dragón te aterroriza!');
        }
      }
    ]
  };

  // Enhanced monster AI with abilities
  function enhancedMonsterAttack() {
    const char = window.char;
    const monster = window.currentMonster;
    
    // Boss special abilities
    if (monster.isBoss && monster.abilities) {
      const availableAbilities = monster.abilities.filter(a => !a.onCooldown);
      if (availableAbilities.length > 0 && Math.random() < 0.4) {
        const ability = availableAbilities[Math.floor(Math.random() * availableAbilities.length)];
        ability.effect(char);
        ability.onCooldown = ability.cooldown;
        
        // Reduce all cooldowns
        monster.abilities.forEach(a => {
          if (a.onCooldown) a.onCooldown--;
        });
        
        if (char.hp <= 0) {
          handleGameOver();
          return;
        }
        
        updateConditions();
        renderBossEncounter({monster: monster, desc: `El ${monster.n} desata su poder.`});
        return;
      }
    }
    
    // Regular attack logic...
    // ...existing monsterAttack code...
  }

  // Achievement system expansion
  const ADVANCED_ACHIEVEMENTS = [
    {id:'rich',req:'gold',val:1000,name:'Millonario',desc:'Acumula 1000 de oro',reward:{type:'item',item:'Anillo de Fortuna'}},
    {id:'crafter',req:'crafted',val:5,name:'Maestro Artesano',desc:'Craftea 5 items',reward:{type:'recipe',recipe:'Super Forja'}}},
    {id:'gambler',req:'gambles_won',val:3,name:'Rey del Casino',desc:'Gana 3 apuestas',reward:{type:'gold',amount:500}},
    {id:'collector',req:'materials',val:10,name:'Coleccionista',desc:'Recolecta 10 materiales diferentes',reward:{type:'stat',stat:'all',amount:1}}
  ];

  function checkAdvancedAchievements() {
    window.char.achievements = window.char.achievements || [];
    window.char.stats_tracker = window.char.stats_tracker || {};
    
    ADVANCED_ACHIEVEMENTS.forEach(ach => {
      if (!window.char.achievements.includes(ach.id)) {
        let qualified = false;
        
        switch(ach.req) {
          case 'gold':
            qualified = window.char.gold >= ach.val;
            break;
          case 'crafted':
            qualified = (window.char.stats_tracker.crafted || 0) >= ach.val;
            break;
          case 'gambler':
            qualified = (window.char.stats_tracker.gambles_won || 0) >= ach.val;
            break;
          case 'materials':
            const uniqueMaterials = new Set(window.char.materials?.map(m => m.n) || []);
            qualified = uniqueMaterials.size >= ach.val;
            break;
        }
        
        if (qualified) {
          window.char.achievements.push(ach.id);
          showAchievementUnlock(ach);
        }
      }
    });
  }

  async function showAchievementUnlock(achievement) {
    try {
      await window.neonDB.unlockAchievement(
        achievement.name,
        achievement.desc,
        window.char.name
      );
    } catch (error) {
      console.warn('Failed to save achievement:', error);
    }
    
    const g = document.getElementById('game');
    g.innerHTML += `
      <div class='achievement-popup'>
        <h3>🏆 ¡Logro Desbloqueado!</h3>
        <h4>${achievement.name}</h4>
        <p>${achievement.desc}</p>
        <button onclick='closeAchievement()' class='achievement-btn'>¡Genial!</button>
      </div>
    `;
  }

  // Enhanced leaderboard with user highlighting
  async function showLeaderboard() {
    try {
      const leaderboard = await window.neonDB.getLeaderboard(10);
      const currentUser = window.stackAuth.getUser();
      const g = DOMCache.getGame();
      
      g.innerHTML += `
        <div class='leaderboard-overlay'>
          <div class='leaderboard-panel'>
            <h3>🏆 Tabla de Líderes Global 🏆</h3>
            <div class='leaderboard-list'>
              ${leaderboard.length > 0 ? leaderboard.map((entry, i) => {
                const isCurrentUser = currentUser && 
                  (entry.character_name?.includes(currentUser.display_name) || 
                   entry.character_name?.includes(currentUser.email));
                
                return `
                  <div class='leaderboard-entry ${i < 3 ? 'top-three' : ''} ${isCurrentUser ? 'current-user' : ''}'>
                    <span class='rank'>#${i + 1}</span>
                    <span class='name'>${entry.character_name || 'Anónimo'}</span>
                    <span class='class'>${entry.character_class || 'Aventurero'}</span>
                    <span class='level'>Nv.${entry.final_level || 1}</span>
                    <span class='score'>${entry.score || 0} pts</span>
                    ${isCurrentUser ? '<span class="you-label">¡Tú!</span>' : ''}
                  </div>
                `;
              }).join('') : '<p>No hay datos de ranking disponibles</p>'}
            </div>
            <button onclick='closeLeaderboard()' class='close-btn'>Cerrar</button>
          </div>
        </div>
      `;
    } catch (error) {
      console.warn('Failed to load leaderboard:', error);
      // Show offline message
      document.getElementById('game').innerHTML += `
        <div class='leaderboard-overlay'>
          <div class='leaderboard-panel'>
            <h3>🏆 Ranking No Disponible</h3>
            <p>El ranking global requiere conexión a la base de datos.</p>
            <button onclick='closeLeaderboard()' class='close-btn'>Cerrar</button>
          </div>
        </div>
      `;
    }
  }

  window.closeLeaderboard = function() {
    const overlay = document.querySelector('.leaderboard-overlay');
    if (overlay) overlay.remove();
  };

  // Enhanced game over with database updates
  async function handleGameOver() {
    try {
      if (window.neonDB.initialized) {
        // Save final game state
        await window.neonDB.apiCall('/game-sessions', 'POST', {
          character_id: window.neonDB.currentCharacter,
          session_outcome: 'death',
          final_level: window.char.lvl,
          final_encounter: gameState.currentEncounter,
          experience_gained: window.char.xp,
          gold_gained: window.char.gold - 50
        });
      }
    } catch (error) {
      console.warn('Failed to save final game state:', error);
    }
    
    // Stop auto-save
    if (window.neonDB) {
      window.neonDB.stopAutoSave();
    }
    
    const g = document.getElementById('game');
    g.innerHTML = `
      <div class='section gameover-section'>
        <h2>💀 Game Over</h2>
        <p>Tu aventura ha llegado a su fin...</p>
        <div class='death-stats'>
          <p><strong>Nivel Alcanzado:</strong> ${window.char.lvl}</p>
          <p><strong>Encuentros Completados:</strong> ${gameState.currentEncounter}</p>
          <p><strong>Oro Acumulado:</strong> ${window.char.gold}</p>
        </div>
        <div class='game-over-actions'>
          <button onclick='showLeaderboard()' class='leaderboard-btn'>🏆 Ver Ranking Global</button>
          <button onclick='location.reload()' class='retry-btn'>🔄 Reintentar</button>
        </div>
      </div>
    `;
  }

  // OPTIMIZACIÓN 13: Initialize con mejor control de carga
  async function initializeGame() {
    try {
      // Setup event delegation
      setupEventDelegation();
      
      // Lazy load dependencies
      await Promise.all([
        LazyLoaders.getStackAuth().catch(() => null),
        LazyLoaders.getNeonDB().catch(() => null)
      ]);
      
      // Show appropriate screen
      const stackAuth = LazyLoaders.stackAuth;
      if (stackAuth?.isAuthenticated()) {
        showCharacterSelection();
      } else {
        showWelcomeScreen();
      }
      
    } catch (error) {
      console.error('Game initialization failed:', error);
      showErrorScreen();
    }
  }

  function showWelcomeScreen() {
    const g = DOMCache.getGame();
    g.innerHTML = `
      <div class='section welcome-section'>
        <h2>⚔️ Aventura D&D Épica ⚔️</h2>
        <p>Un verdadero roguelike con sistema completo de inventario, equipo y progresión profunda.</p>
        <div class='features-grid'>
          <div class='feature-card'>📜 Historia Épica</div>
          <div class='feature-card'>⚔️ Combate Estratégico</div>
          <div class='feature-card'>🎒 Sistema de Inventario</div>
          <div class='feature-card'>⚡ Habilidades Especiales</div>
          <div class='feature-card'>🏪 Mercaderes</div>
          <div class='feature-card'>🔨 Mejora de Equipo</div>
        </div>
        <div class='welcome-actions'>
          <button onclick='showLoginScreen()' class='start-btn primary'>🔐 Iniciar Sesión</button>
          <button onclick='playAsGuest()' class='start-btn'>👤 Jugar como Invitado</button>
        </div>
      </div>
    `;
  }

  function showErrorScreen() {
    const g = DOMCache.getGame();
    g.innerHTML = `
      <div class='section error-section'>
        <h2>⚠️ Error de Carga</h2>
        <p>Hubo un problema al cargar el juego.</p>
        <button onclick='location.reload()' class='retry-btn'>🔄 Reintentar</button>
      </div>
    `;
  }

  // OPTIMIZACIÓN 14: Cleanup automático
  setInterval(optimizedCleanup, 30000); // Cada 30 segundos

  // Cleanup al cerrar página
  window.addEventListener('beforeunload', () => {
    optimizedCleanup();
    if (window.autoSaveFunction) {
      window.autoSaveFunction(); // Last save
    }
  });

  // OPTIMIZACIÓN 15: Initialize cuando el DOM esté listo
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeGame);
  } else {
    initializeGame();
  }

  // AGREGAR ESTAS FUNCIONES AL FINAL, ANTES DE })();

  // Merchant encounter
  function renderMerchantEncounter(encounter) {
    const availableItems = generateMerchantStock();
    
    const g = DOMCache.getGame();
    g.innerHTML = `
      <div class='section merchant-section'>
        <h2>🏪 ${encounter.title}</h2>
        <p>${encounter.desc}</p>
        <p class='gold-display'>Oro disponible: <strong>${window.char.gold}</strong></p>
        
        <div class='merchant-stock'>
          ${availableItems.map((item, i) => `
            <div class='merchant-item ${item.r}'>
              <div class='item-info'>
                <strong>${item.n}</strong>
                <p>${item.desc}</p>
                <div class='item-stats'>
                  <span class='price'>${item.p} oro</span>
                  <span class='rarity'>${item.r}</span>
                </div>
              </div>
              <button onclick='buyItem(${i})' class='buy-btn' 
                ${window.char.gold < item.p ? 'disabled' : ''}>
                Comprar
              </button>
            </div>
          `).join('')}
        </div>
        
        <div class='merchant-actions'>
          <button onclick='showEquipment()' class='merchant-btn'>🎒 Ver Equipo</button>
          <button onclick='nextEncounter()' class='merchant-btn'>Continuar</button>
        </div>
      </div>
    `;
    
    window.merchantStock = availableItems;
  }

  function generateMerchantStock() {
    const stock = [];
    const level = Math.min(Math.floor(gameState.currentEncounter / 3) + 1, 5);
    
    stock.push(ITEMS.find(i => i.n === 'Poción Menor'));
    stock.push(ITEMS.find(i => i.n === 'Poción Mayor'));
    
    const equipment = ITEMS.filter(i => i.slot && i.r !== 'legendary');
    for (let i = 0; i < 3; i++) {
      const randomItem = equipment[Math.floor(Math.random() * equipment.length)];
      if (!stock.includes(randomItem)) {
        stock.push(randomItem);
      }
    }
    
    return stock;
  }

  window.buyItem = function(index) {
    const item = window.merchantStock[index];
    if (window.char.gold >= item.p) {
      window.char.gold -= item.p;
      window.char.inv.push(item);
      addLog(`Compras ${item.n} por ${item.p} oro.`);
      
      document.querySelector('.gold-display strong').textContent = window.char.gold;
      document.querySelectorAll('.buy-btn')[index].disabled = true;
      document.querySelectorAll('.buy-btn')[index].textContent = 'Comprado';
    }
  };

  // Equipment management
  window.showEquipment = function() {
    const g = DOMCache.getGame();
    g.innerHTML += `
      <div class='equipment-overlay'>
        <div class='equipment-panel'>
          <h3>Equipo y Inventario</h3>
          
          <div class='equipment-slots'>
            <h4>Equipado:</h4>
            ${Object.entries(window.char.equipped).map(([slot, item]) => `
              <div class='equip-slot'>
                <strong>${slot}:</strong> 
                ${item ? `${item.n} (+${item.v})` : 'Vacío'}
                ${item ? `<button onclick='unequipItem("${slot}")' class='unequip-btn'>Desequipar</button>` : ''}
              </div>
            `).join('')}
          </div>
          
          <div class='inventory-items'>
            <h4>Inventario:</h4>
            ${window.char.inv.map((item, i) => `
              <div class='inv-item ${item.r}'>
                <strong>${item.n}</strong> - ${item.desc}
                ${item.slot ? `<button onclick='equipItem(${i})' class='equip-btn'>Equipar</button>` : ''}
              </div>
            `).join('')}
          </div>
          
          <button onclick='closeEquipment()' class='close-btn'>Cerrar</button>
        </div>
      </div>
    `;
  };

  window.equipItem = function(index) {
    const item = window.char.inv[index];
    const slot = item.slot;
    
    if (window.char.equipped[slot]) {
      window.char.inv.push(window.char.equipped[slot]);
    }
    
    window.char.equipped[slot] = item;
    window.char.inv.splice(index, 1);
    
    addLog(`Equipas ${item.n}.`);
    closeEquipment();
    showEquipment();
  };

  window.unequipItem = function(slot) {
    const item = window.char.equipped[slot];
    window.char.inv.push(item);
    window.char.equipped[slot] = null;
    
    addLog(`Desequipas ${item.n}.`);
    closeEquipment();
    showEquipment();
  };

  window.closeEquipment = function() {
    document.querySelector('.equipment-overlay').remove();
  };

  // Special abilities
  window.useRage = function() {
    if (window.char.abilities.rage > 0) {
      window.char.abilities.rage--;
      window.char.conditions.push({name: 'rage', turns: 3, bonus: 3});
      addLog('¡Entras en FURIA! +3 daño por 3 turnos.');
      setTimeout(() => monsterAttack(), 800);
    }
  };

  window.castMagicMissile = function() {
    if (window.char.abilities.spells > 0) {
      window.char.abilities.spells--;
      const damage = 12 + window.char.stats.int + window.char.lvl;
      window.currentMonster.h = Math.max(0, window.currentMonster.h - damage);
      addLog(`¡Lanzas Misil Mágico e infliges ${damage} de daño certero!`);
      
      if (window.currentMonster.h <= 0) {
        handleCombatVictory();
        return;
      }
      setTimeout(() => monsterAttack(), 800);
    }
  };

  window.sneakAttack = function() {
    if (window.char.abilities.sneak > 0) {
      window.char.abilities.sneak--;
      const d20 = Math.floor(Math.random() * 20) + 1;
      const attackRoll = d20 + window.char.stats.dex + 2;
      
      if (attackRoll >= window.currentMonster.a) {
        let damage = calculateAttack() + Math.floor(Math.random() * 8) + window.char.lvl * 2;
        window.currentMonster.h = Math.max(0, window.currentMonster.h - damage);
        addLog(`¡Ataque furtivo! Infliges ${damage} de daño desde las sombras.`);
        
        if (window.currentMonster.h <= 0) {
          handleCombatVictory();
          return;
        }
      } else {
        addLog('Tu ataque furtivo falla.');
      }
      setTimeout(() => monsterAttack(), 800);
    }
  };

  window.divineHeal = function() {
    if (window.char.abilities.heals > 0) {
      window.char.abilities.heals--;
      const healAmount = 15 + window.char.lvl * 2 + (window.char.stats.wis * 2);
      window.char.hp = Math.min(window.char.maxHP, window.char.hp + healAmount);
      
      const negConditions = window.char.conditions.filter(c => ['poison', 'curse', 'weakness'].includes(c.name));
      if (negConditions.length > 0) {
        const removed = negConditions[0];
        window.char.conditions = window.char.conditions.filter(c => c !== removed);
        addLog(`¡La luz divina purifica ${removed.name}!`);
      }
      
      addLog(`¡Curación divina restaura ${healAmount} HP!`);
      setTimeout(() => monsterAttack(), 800);
    }
  };

  // Monster AI improvements
  function monsterAttack() {
    const char = window.char;
    const monster = window.currentMonster;
    
    if (monster.conditions.find(c => c.name === 'stun')) {
      monster.conditions = monster.conditions.filter(c => c.name !== 'stun');
      addLog(`${monster.n} está aturdido y pierde su turno.`);
      updateConditions();
      startStoryEncounter();
      return;
    }
    
    const d20 = Math.floor(Math.random() * 20) + 1;
    const attackRoll = d20 + Math.floor(monster.at / 2);
    const currentAC = calculateAC() + (char.conditions.find(c => c.name === 'defending')?.acBonus || 0);
    
    if (attackRoll >= currentAC || d20 === 20) {
      let damage = monster.at + Math.floor(Math.random() * 6);
      
      if (char.equipped.armor) {
        const reduction = Math.floor(char.equipped.armor.v / 2);
        damage = Math.max(1, damage - reduction);
      }
      
      if (monster.n.includes('Dragón') && Math.random() < 0.3) {
        damage += 10;
        addLog(`¡${monster.n} usa aliento de fuego!`);
      }
      
      if (monster.n.includes('Liche') && Math.random() < 0.2) {
        char.conditions.push({name: 'curse', turns: 3, debuff: -2});
        addLog(`¡${monster.n} te maldice!`);
      }
      
      char.hp = Math.max(0, char.hp - damage);
      addLog(`${monster.n} te ataca e inflige ${damage} de daño. (${d20}+${Math.floor(monster.at/2)} vs AC ${currentAC})`);
      
      if (char.hp <= 0) {
        handleGameOver();
        return;
      }
    } else {
      addLog(`${monster.n} falla su ataque. (${d20}+${Math.floor(monster.at/2)} vs AC ${currentAC})`);
    }
    
    updateConditions();
    startStoryEncounter();
  }

  function updateConditions() {
    window.char.conditions = window.char.conditions.map(c => {
      if (c.turns) c.turns--;
      return c;
    }).filter(c => !c.turns || c.turns > 0);
    
    if (window.currentMonster) {
      window.currentMonster.conditions = window.currentMonster.conditions.map(c => {
        if (c.turns) c.turns--;
        return c;
      }).filter(c => !c.turns || c.turns > 0);
    }
  }

  // Treasure encounters
  function renderTreasureEncounter(encounter) {
    const g = document.getElementById('game');
    const treasures = generateTreasureRewards();
    
    g.innerHTML = `
      <div class='section treasure-section'>
        <h2>💰 ${encounter.title}</h2>
        <p>${encounter.desc}</p>
        <div class='treasure-rewards'>
          <h3>¡Tesoros encontrados!</h3>
          ${treasures.map((reward, i) => `
            <div class='treasure-item ${reward.type}'>
              <strong>${reward.name}</strong>
              <p>${reward.desc}</p>
              <button onclick='takeTreasure(${i})' class='treasure-btn'>Tomar</button>
            </div>
          `).join('')}
        </div>
        <div class='treasure-choice'>
          <p><em>Puedes elegir solo uno. ¡Elige sabiamente!</em></p>
        </div>
      </div>
    `;
    
    window.treasureRewards = treasures;
  }

  function generateTreasureRewards() {
    const level = Math.floor(gameState.currentEncounter / 4) + 1;
    const rewards = [];
    
    const goldAmount = (50 + level * 25) + Math.floor(Math.random() * 50);
    rewards.push({
      type: 'gold',
      name: `${goldAmount} Monedas de Oro`,
      desc: 'Oro puro que brilla bajo la luz',
      value: goldAmount
    });
    
    const rareItems = ITEMS.filter(i => i.r === 'rare' || i.r === 'uncommon');
    const randomItem = rareItems[Math.floor(Math.random() * rareItems.length)];
    rewards.push({
      type: 'item',
      name: randomItem.n,
      desc: randomItem.desc,
      item: randomItem
    });
    
    const stats = ['str', 'dex', 'con', 'int', 'wis', 'cha'];
    const randomStat = stats[Math.floor(Math.random() * stats.length)];
    rewards.push({
      type: 'stat',
      name: `Cristal de ${randomStat.toUpperCase()}`,
      desc: `Aumenta permanentemente tu ${randomStat.toUpperCase()} en +1`,
      stat: randomStat
    });
    
    return rewards;
  }

  window.takeTreasure = function(index) {
    const reward = window.treasureRewards[index];
    
    switch(reward.type) {
      case 'gold':
        window.char.gold += reward.value;
                      addLog(`¡Obtienes ${reward.value} de oro!`);
        break;
      case 'item':
        window.char.inv.push(reward.item);
        addLog(`¡Obtienes ${reward.item.n}!`);
        break;
      case 'stat':
        window.char.stats[reward.stat]++;
        addLog(`¡Tu ${reward.stat.toUpperCase()} aumenta permanentemente!`);
        break;
    }
    
    setTimeout(nextEncounter, 1500);
  };

  // Forge encounters
  function renderForgeEncounter(encounter) {
    const upgradeable = window.char.inv.filter(item => item.slot && !item.enhanced);
    
    const g = document.getElementById('game');
    g.innerHTML = `
      <div class='section forge-section'>
        <h2>🔨 ${encounter.title}</h2>
        <p>${encounter.desc}</p>
        <p class='forge-cost'>Costo de mejora: 100 oro por item</p>
        <p>Oro disponible: <strong>${window.char.gold}</strong></p>
        
        ${upgradeable.length > 0 ? `
          <div class='forge-items'>
            <h3>Items que puedes mejorar:</h3>
            ${upgradeable.map((item, i) => `
              <div class='forge-item ${item.r}'>
                <div class='item-details'>
                  <strong>${item.n}</strong>
                  <p>Actual: ${item.desc}</p>
                  <p class='enhancement'>Mejorado: +${item.v + 2} ${item.e} (era +${item.v})</p>
                </div>
                <button onclick='enhanceItem(${window.char.inv.indexOf(item)})' 
                  class='enhance-btn' ${window.char.gold < 100 ? 'disabled' : ''}>
                  Mejorar (100 oro)
                </button>
              </div>
            `).join('')}
          </div>
        ` : '<p>No tienes items que puedan ser mejorados.</p>'}
        
        <button onclick='nextEncounter()' class='forge-btn'>Continuar sin mejorar</button>
      </div>
    `;
  }

  window.enhanceItem = function(index) {
    if (window.char.gold >= 100) {
      const item = window.char.inv[index];
      window.char.gold -= 100;
      
      item.v += 2;
      item.enhanced = true;
      item.n = item.n + ' +';
      item.desc = item.desc.replace(/\+\d+/, `+${item.v}`);
      
      addLog(`¡${item.n} ha sido mejorado! Ahora otorga +${item.v} ${item.e}`);
      renderForgeEncounter({title: 'Forja Mágica', desc: 'La forja brilla con poder arcano.'});
    }
  };

  // Story encounters with choices
  function renderStoryEncounter(encounter) {
    const g = document.getElementById('game');
    
    const hasChoices = Math.random() < 0.4;
    
    if (hasChoices) {
      const choices = generateStoryChoices();
      g.innerHTML = `
        <div class='section story-section'>
          <h2>📜 ${encounter.title}</h2>
          <p class='story-text'>${encounter.desc}</p>
          <div class='story-choices'>
            ${choices.map((choice, i) => `
              <button onclick='makeStoryChoice(${i})' class='choice-btn'>
                ${choice.text}
              </button>
            `).join('')}
          </div>
          <div class='char-status'>
            <strong>${window.char.name}</strong> | Nivel ${window.char.lvl} | 
            HP: ${window.char.hp}/${window.char.maxHP} | Oro: ${window.char.gold}
          </div>
        </div>
      `;
      window.storyChoices = choices;
    } else {
      g.innerHTML = `
        <div class='section story-section'>
          <h2>📜 ${encounter.title}</h2>
          <p class='story-text'>${encounter.desc}</p>
          <div class='char-status'>
            <strong>${window.char.name}</strong> | Nivel ${window.char.lvl} | 
            HP: ${window.char.hp}/${window.char.maxHP} | Oro: ${window.char.gold}
          </div>
          <button onclick='nextEncounter()' class='story-btn'>Continuar Aventura</button>
        </div>
      `;
    }
  }

  function generateStoryChoices() {
    const choices = [
      {
        text: "🗡️ Actuar con valentía",
        effect: () => {
          if (Math.random() < 0.7) {
            const goldGain = 15 + Math.random() * 10;
            window.char.gold += Math.floor(goldGain);
            addLog(`Tu valentía es recompensada con ${Math.floor(goldGain)} oro.`);
          } else {
            const damage = 5;
            window.char.hp = Math.max(1, window.char.hp - damage);
            addLog(`Tu imprudencia te cuesta ${damage} HP.`);
          }
        }
      },
      {
        text: "🧠 Usar tu intelecto",
        effect: () => {
          const intCheck = Math.random() * 20 + window.char.stats.int;
          if (intCheck >= 15) {
            window.char.xp += 10;
            addLog('Tu sabiduría te otorga 10 XP adicional.');
          } else {
            addLog('Tu análisis no revela nada útil.');
          }
        }
      },
      {
        text: "🤝 Ser diplomático",
        effect: () => {
          const chaCheck = Math.random() * 20 + window.char.stats.cha;
          if (chaCheck >= 12) {
            const heal = 10;
            window.char.hp = Math.min(window.char.maxHP, window.char.hp + heal);
            addLog(`Tu carisma te ayuda a encontrar ayuda. Recuperas ${heal} HP.`);
          } else {
            addLog('Tus palabras no tienen el efecto deseado.');
          }
        }
      }
    ];
    
    return choices.slice(0, 2 + Math.floor(Math.random() * 2));
  }

  window.makeStoryChoice = function(index) {
    const choice = window.storyChoices[index];
    choice.effect();
    setTimeout(nextEncounter, 1500);
  };

  // Boss encounters
  function renderBossEncounter(encounter) {
    window.currentMonster = {
      ...encounter.monster,
      maxHP: encounter.monster.h,
      conditions: [],
      isBoss: true,
      phase: 1,
      maxPhases: 3
    };
    
    const g = document.getElementById('game');
    g.innerHTML = `
      <div class='section boss-section'>
        <h2>🐉 ¡JEFE FINAL!</h2>
        <div class='boss-phase'>Fase ${window.currentMonster.phase} de ${window.currentMonster.maxPhases}</div>
        <p class='boss-desc'>${encounter.desc}</p>
        
        <div class='boss-combat-status'>
          <div class='hero-status'>
            <h3>${window.char.name} (Nv.${window.char.lvl})</h3>
            <div class='hp-bar'>
              <div class='hp-fill' style='width: ${(window.char.hp/window.char.maxHP)*100}%'></div>
              <span class='hp-text'>${window.char.hp}/${window.char.maxHP} HP</span>
            </div>
            <p>AC: ${calculateAC()} | ATK: ${calculateAttack()}</p>
          </div>
          
          <div class='boss-status'>
            <h3>${window.currentMonster.n}</h3>
            <div class='boss-hp-bar'>
              <div class='hp-fill boss' style='width: ${(window.currentMonster.h/window.currentMonster.maxHP)*100}%'></div>
              <span class='hp-text'>${window.currentMonster.h}/${window.currentMonster.maxHP} HP</span>
            </div>
            <p>AC: ${window.currentMonster.a} | Fase: ${window.currentMonster.phase}</p>
          </div>
        </div>
        
        <div class='combat-log'>${(window.char.log || []).slice(-4).join('<br>')}</div>
        
        <div class='boss-actions'>
          ${renderBossActions()}
        </div>
      </div>
    `;
  }

  function renderBossActions() {
    return `
      <div class='action-grid'>
        <button onclick='performBossAttack()' class='boss-action primary'>⚔️ Ataque Total</button>
        <button onclick='showInventoryInCombat()' class='boss-action'>🎒 Inventario</button>
        <button onclick='defendAction()' class='boss-action'>🛡️ Defenderse</button>
        ${renderSpecialActions()}
      </div>
    `;
  }

  window.performBossAttack = function() {
    const d20 = Math.floor(Math.random() * 20) + 1;
    const attackRoll = d20 + calculateAttack();
    const isCritical = d20 === 20;
    
    if (attackRoll >= window.currentMonster.a || isCritical) {
      let damage = calculateAttack() + Math.floor(Math.random() * 10) + 3;
      
      if (isCritical) damage *= 2;
      
      const rageBonus = window.char.conditions.find(c => c.name === 'rage')?.bonus || 0;
      damage += rageBonus;
      
      window.currentMonster.h = Math.max(0, window.currentMonster.h - damage);
      addLog(`¡Golpeas al jefe con ${damage} de daño!${isCritical ? ' ¡CRÍTICO!' : ''}`);
      
      const healthPercentage = window.currentMonster.h / window.currentMonster.maxHP;
      if (healthPercentage <= 0.66 && window.currentMonster.phase === 1) {
        window.currentMonster.phase = 2;
        addLog('¡El jefe entra en su segunda fase! Se vuelve más peligroso.');
        window.currentMonster.at += 3;
      } else if (healthPercentage <= 0.33 && window.currentMonster.phase === 2) {
        window.currentMonster.phase = 3;
        addLog('¡FASE FINAL! El jefe desata todo su poder.');
        window.currentMonster.at += 5;
      }
      
      if (window.currentMonster.h <= 0) {
        handleBossVictory();
        return;
      }
    } else {
      addLog(`Tu ataque falla contra el poderoso jefe.`);
    }
    
    setTimeout(() => bossAttack(), 1000);
  };

  function bossAttack() {
    const monster = window.currentMonster;
    const d20 = Math.floor(Math.random() * 20) + 1;
    
    let attackBonus = Math.floor(monster.at / 2) + (monster.phase - 1) * 2;
    const attackRoll = d20 + attackBonus;
    const currentAC = calculateAC() + (window.char.conditions.find(c => c.name === 'defending')?.acBonus || 0);
    
    if (attackRoll >= currentAC || d20 === 20) {
      let damage = monster.at + Math.floor(Math.random() * 8) + monster.phase * 2;
      
      if (monster.phase >= 2 && Math.random() < 0.4) {
        damage += 8;
        addLog(`¡${monster.n} usa un ataque devastador!`);
      }
      
      if (monster.phase === 3 && Math.random() < 0.3) {
        window.char.conditions.push({name: 'curse', turns: 2});
        addLog(`¡${monster.n} te maldice con magia oscura!`);
      }
      
      window.char.hp = Math.max(0, window.char.hp - damage);
      addLog(`${monster.n} te ataca con furia e inflige ${damage} de daño.`);
      
      if (window.char.hp <= 0) {
        handleGameOver();
        return;
      }
    } else {
      addLog(`${monster.n} falla su poderoso ataque.`);
    }
    
    updateConditions();
    renderBossEncounter({monster: monster, desc: `El ${monster.n} ruge con poder ancestral.`});
  }

  function handleBossVictory() {
    const xpGain = 100 + window.char.lvl * 10;
    const goldGain = 200 + Math.floor(Math.random() * 100);
    
    window.char.xp += xpGain;
    window.char.gold += goldGain;
    
    const legendaryItems = ITEMS.filter(i => i.r === 'legendary');
    const legendaryReward = legendaryItems[Math.floor(Math.random() * legendaryItems.length)];
    window.char.inv.push(legendaryReward);
    
    const g = document.getElementById('game');
    g.innerHTML = `
      <div class='section boss-victory'>
        <h2>🏆 ¡VICTORIA ÉPICA! 🏆</h2>
        <p>Has derrotado al temible jefe final en una batalla legendaria.</p>
        <div class='victory-rewards'>
          <h3>Recompensas Épicas:</h3>
          <p>📈 <strong>+${xpGain} XP</strong></p>
          <p>💰 <strong>+${goldGain} oro</strong></p>
          <p>⭐ <strong>Item Legendario:</strong> ${legendaryReward.n}</p>
        </div>
        <button onclick='nextEncounter()' class='victory-btn epic'>Continuar la Leyenda</button>
      </div>
    `;
    
    setTimeout(() => {
      while(window.char.xp >= window.char.xpNext) {
        levelUpCharacter();
      }
    }, 1000);
  }

  function levelUpCharacter() {
    window.char.lvl++;
    window.char.xp -= window.char.xpNext;
    window.char.xpNext = Math.round(window.char.xpNext * 1.5);
    
    const hpGain = Math.floor(window.char.cls.h / 2) + 4;
    window.char.maxHP += hpGain;
    window.char.hp = window.char.maxHP;
    
    showStatSelection(hpGain);
  }

  function showStatSelection(hpGain) {
    const g = document.getElementById('game');
    g.innerHTML += `
      <div class='levelup-overlay'>
        <div class='levelup-panel'>
          <h2>🎉 ¡NIVEL ${window.char.lvl}! 🎉</h2>
          <p>+${hpGain} HP máximo (curación completa)</p>
          <p>Elige un atributo para mejorar:</p>
          <div class='stat-choices'>
            ${['str', 'dex', 'con', 'int', 'wis', 'cha'].map(stat => `
              <button onclick='improveStat("${stat}")' class='stat-btn'>
                ${stat.toUpperCase()}: ${window.char.stats[stat]} → ${window.char.stats[stat] + 1}
              </button>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  }

  window.improveStat = function(stat) {
    window.char.stats[stat]++;
    addLog(`¡NIVEL ${window.char.lvl}! ${stat.toUpperCase()} mejorado a ${window.char.stats[stat]}`);
    
    if (window.char.cls.n === 'Bárbaro') window.char.abilities.rage = Math.min(window.char.abilities.rage + 1, 5);
    if (window.char.cls.n === 'Mago') window.char.abilities.spells = Math.min(window.char.abilities.spells + 1, 8);
    if (window.char.cls.n === 'Clérigo') window.char.abilities.heals = Math.min(window.char.abilities.heals + 1, 6);
    if (window.char.cls.n === 'Pícaro') window.char.abilities.sneak = Math.min(window.char.abilities.sneak + 1, 4);
    
    document.querySelector('.levelup-overlay').remove();
  };

})();