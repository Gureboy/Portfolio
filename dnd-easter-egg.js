// --- JUEGO D&D OPTIMIZADO Y LIMPIO ---
// Complete roguelike offline con arquitectura modular

(function($) {
  'use strict';
  
  // ================================
  // CONFIGURACIÓN Y CONSTANTES
  // ================================
  
  const CONFIG = {
    AUTO_SAVE_INTERVAL: 10000,
    MAX_LOG_ENTRIES: 6,
    ANIMATION_DELAY: 800,
    LEVEL_UP_MULTIPLIER: 1.5
  };

  const GAME_STATES = {
    MENU: 'menu',
    CHARACTER_SELECT: 'character_select',
    PLAYING: 'playing',
    PAUSED: 'paused'
  };

  // ================================
  // SISTEMA DE ALMACENAMIENTO
  // ================================
  
  const GameStorage = {
    PREFIX: 'dnd_game_',
    
    save(key, data) {
      try {
        localStorage.setItem(this.PREFIX + key, JSON.stringify(data));
        return true;
      } catch (error) {
        console.warn('Storage save failed:', error);
        return false;
      }
    },
    
    load(key) {
      try {
        const data = localStorage.getItem(this.PREFIX + key);
        return data ? JSON.parse(data) : null;
      } catch (error) {
        console.warn('Storage load failed:', error);
        return null;
      }
    },
    
    remove(key) {
      localStorage.removeItem(this.PREFIX + key);
    },
    
    clear() {
      Object.keys(localStorage)
        .filter(key => key.startsWith(this.PREFIX))
        .forEach(key => localStorage.removeItem(key));
    },
    
    getLeaderboard() {
      return (this.load('leaderboard') || [])
        .sort((a, b) => b.score - a.score)
        .slice(0, 10);
    },
    
    addScore(playerData) {
      const scores = this.load('leaderboard') || [];
      scores.push({
        character_name: playerData.name,
        class_name: playerData.cls.n,
        final_level: playerData.lvl,
        score: this.calculateScore(playerData),
        date: new Date().toISOString(),
        playTime: Date.now() - playerData.startTime
      });
      this.save('leaderboard', scores);
    },
    
    calculateScore(player) {
      const levelBonus = player.lvl * 100;
      const goldBonus = player.gold;
      const xpBonus = player.xp;
      const timeBonus = Math.max(0, 10000 - (Date.now() - player.startTime) / 1000);
      return Math.round(levelBonus + goldBonus + xpBonus + timeBonus);
    }
  };

  // ================================
  // DATOS DEL JUEGO
  // ================================
  
  const CLASSES = [
    {
      n: "Bárbaro",
      h: 12, a: 15, s: 3, d: 1, c: 2,
      desc: "Guerrero salvaje con gran resistencia",
      special: "Furia (+3 daño por 3 turnos)",
      color: "#dc2626"
    },
    {
      n: "Mago", 
      h: 6, a: 12, s: 0, d: 1, c: 0, i: 3, w: 1,
      desc: "Maestro de la magia arcana",
      special: "Hechizos poderosos",
      color: "#7c3aed"
    },
    {
      n: "Clérigo",
      h: 8, a: 14, s: 1, d: 0, c: 2, w: 3, ch: 1,
      desc: "Sanador divino",
      special: "Curación divina",
      color: "#059669"
    },
    {
      n: "Pícaro",
      h: 8, a: 13, s: 1, d: 3, c: 1, w: 1,
      desc: "Ágil y sigiloso",
      special: "Ataque furtivo",
      color: "#d97706"
    }
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
  
  // ================================
  // ESTADO DEL JUEGO
  // ================================
  
  class GameState {
    constructor() {
      this.currentEncounter = 0;
      this.currentState = GAME_STATES.MENU;
      this.autoSaveInterval = null;
      this.startTime = Date.now();
    }

    reset() {
      this.currentEncounter = 0;
      this.currentState = GAME_STATES.MENU;
      this.startTime = Date.now();
      this.stopAutoSave();
    }

    startAutoSave() {
      this.stopAutoSave();
      this.autoSaveInterval = setInterval(() => {
        if (window.char) {
          GameStorage.save('current_character', window.char);
          GameStorage.save('current_encounter', this.currentEncounter);
        }
      }, CONFIG.AUTO_SAVE_INTERVAL);
    }

    stopAutoSave() {
      if (this.autoSaveInterval) {
        clearInterval(this.autoSaveInterval);
        this.autoSaveInterval = null;
      }
    }
  }

  const gameState = new GameState();

  // ================================
  // SISTEMA DE PERSONAJES
  // ================================
  
  class Character {
    constructor(selectedClass) {
      Object.assign(this, {
        cls: selectedClass,
        name: selectedClass.n,
        lvl: 1,
        hp: selectedClass.h + 10,
        maxHP: selectedClass.h + 10,
        ac: selectedClass.a,
        xp: 0,
        xpNext: 50,
        gold: 50,
        startTime: Date.now(),
        inv: [ITEMS[0], ITEMS[0]],
        equipped: {
          weapon: null, armor: null, ring: null,
          amulet: null, head: null, boots: null
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
        abilities: this.getInitialAbilities(selectedClass.n)
      });
    }

    getInitialAbilities(className) {
      const abilities = { rage: 0, spells: 0, heals: 0, sneak: 0 };
      switch(className) {
        case 'Bárbaro': abilities.rage = 2; break;
        case 'Mago': abilities.spells = 3; break;
        case 'Clérigo': abilities.heals = 3; break;
        case 'Pícaro': abilities.sneak = 2; break;
      }
      return abilities;
    }

    addLog(message) {
      this.log.push(`[${new Date().toLocaleTimeString()}] ${message}`);
      if (this.log.length > CONFIG.MAX_LOG_ENTRIES) {
        this.log = this.log.slice(-CONFIG.MAX_LOG_ENTRIES);
      }
      this.updateCombatLog();
    }

    updateCombatLog() {
      const logElement = $('#combat-log');
      if (logElement.length) {
        logElement.html(this.log.slice(-4).join('<br>'));
      }
    }

    levelUp() {
      this.lvl++;
      this.xp -= this.xpNext;
      this.xpNext = Math.round(this.xpNext * CONFIG.LEVEL_UP_MULTIPLIER);
      
      const hpGain = Math.floor(this.cls.h / 2) + 4;
      this.maxHP += hpGain;
      this.hp = this.maxHP;
      
      // Restore abilities
      Object.keys(this.abilities).forEach(ability => {
        if (this.abilities[ability] < this.getMaxAbility(ability)) {
          this.abilities[ability]++;
        }
      });

      this.addLog(`¡NIVEL ${this.lvl}! +${hpGain} HP máximo. Habilidades restauradas.`);
      this.showLevelUpNotification();
    }

    getMaxAbility(ability) {
      const maxes = { rage: 5, spells: 8, heals: 6, sneak: 4 };
      return maxes[ability] || 3;
    }

    showLevelUpNotification() {
      const notification = $(`
        <div class='level-up-notification'>
          <h3>🎉 ¡NIVEL ${this.lvl}! 🎉</h3>
          <p>Tu personaje se ha fortalecido</p>
        </div>
      `);
      
      $('body').append(notification);
      notification.fadeIn(300).delay(2000).fadeOut(300, () => notification.remove());
    }
  }

  // ================================
  // SISTEMA DE COMBATE
  // ================================
  
  class Combat {
    static performAttack() {
      const char = window.char;
      const monster = window.currentMonster;
      
      const d20 = Math.floor(Math.random() * 20) + 1;
      const attackBonus = this.calculateAttackBonus(char);
      const attackRoll = d20 + attackBonus;
      const isCritical = d20 === 20 || (d20 >= 18 && char.cls.n === 'Pícaro');
      
      if (attackRoll >= monster.a || isCritical) {
        let damage = this.calculateDamage(char, isCritical);
        monster.h = Math.max(0, monster.h - damage);
        
        const critText = isCritical ? ' ¡CRÍTICO!' : '';
        char.addLog(`Atacas e infliges ${damage} de daño${critText} (${d20}+${attackBonus})`);
        
        if (monster.h <= 0) {
          this.handleVictory();
          return;
        }
      } else {
        char.addLog(`Fallas el ataque (${d20}+${attackBonus} vs AC ${monster.a})`);
      }
      
      setTimeout(() => this.monsterAttack(), CONFIG.ANIMATION_DELAY);
    }

    static calculateAttackBonus(char) {
      let bonus = char.stats.str;
      if (char.equipped.weapon) bonus += char.equipped.weapon.v;
      return bonus;
    }

    static calculateDamage(char, isCritical) {
      let damage = this.calculateAttackBonus(char) + Math.floor(Math.random() * 8) + 1;
      
      // Rage bonus
      const rageCondition = char.conditions.find(c => c.name === 'rage');
      if (rageCondition) damage += rageCondition.bonus;
      
      // Critical hit
      if (isCritical) damage *= 2;
      
      return damage;
    }

    static handleVictory() {
      const monster = window.currentMonster;
      const xpGain = Math.round((monster.c || 1) * 25 + 10);
      const goldGain = Math.round((monster.c || 1) * 15 + Math.random() * 10);
      
      window.char.xp += xpGain;
      window.char.gold += goldGain;
      window.char.addLog(`¡Victoria! +${xpGain} XP, +${goldGain} oro`);
      
      while(window.char.xp >= window.char.xpNext) {
        window.char.levelUp();
      }
      
      setTimeout(() => EncounterManager.nextEncounter(), 2000);
    }

    static monsterAttack() {
      const char = window.char;
      const monster = window.currentMonster;
      
      const d20 = Math.floor(Math.random() * 20) + 1;
      const attackRoll = d20 + Math.floor(monster.at / 2);
      const playerAC = this.calculateAC(char);
      
      if (attackRoll >= playerAC || d20 === 20) {
        let damage = monster.at + Math.floor(Math.random() * 6);
        
        // Armor reduction
        if (char.equipped.armor) {
          damage = Math.max(1, damage - Math.floor(char.equipped.armor.v / 2));
        }
        
        char.hp = Math.max(0, char.hp - damage);
        char.addLog(`${monster.n} te ataca e inflige ${damage} de daño`);
        
        if (char.hp <= 0) {
          GameManager.handleGameOver();
          return;
        }
      } else {
        char.addLog(`${monster.n} falla su ataque`);
      }
      
      UI.updateCombatDisplay();
    }

    static calculateAC(char) {
      let ac = char.cls.a;
      if (char.equipped.armor) ac += char.equipped.armor.v;
      const defendCondition = char.conditions.find(c => c.name === 'defending');
      if (defendCondition) ac += defendCondition.acBonus;
      return ac;
    }
  }

  // ================================
  // INTERFAZ DE USUARIO
  // ================================
  
  class UI {
    static showWelcomeScreen() {
      const $game = $('#game');
      $game.html(`
        <div class='section welcome-section fade-in'>
          <div class='welcome-header'>
            <h2>⚔️ Aventura D&D Épica ⚔️</h2>
            <p class='welcome-subtitle'>Roguelike completo con sistema avanzado de RPG</p>
          </div>
          
          <div class='features-grid'>
            <div class='feature-card'><i class='fas fa-scroll'></i> Historia Épica</div>
            <div class='feature-card'><i class='fas fa-sword'></i> Combate Estratégico</div>
            <div class='feature-card'><i class='fas fa-backpack'></i> Sistema de Inventario</div>
            <div class='feature-card'><i class='fas fa-magic'></i> Habilidades Especiales</div>
            <div class='feature-card'><i class='fas fa-store'></i> Mercaderes</div>
            <div class='feature-card'><i class='fas fa-hammer'></i> Mejora de Equipo</div>
          </div>
          
          <div class='welcome-actions'>
            <button id='start-game-btn' class='btn btn-primary'>🎮 Nueva Aventura</button>
            <button id='continue-btn' class='btn btn-secondary'>📁 Continuar</button>
            <button id='show-leaderboard-btn' class='btn btn-outline'>🏆 Ranking</button>
          </div>
        </div>
      `);
      
      this.bindWelcomeEvents();
    }

    static bindWelcomeEvents() {
      $('#start-game-btn').on('click', () => this.showCharacterSelection());
      $('#continue-btn').on('click', () => GameManager.loadSavedGame());
      $('#show-leaderboard-btn').on('click', () => this.showLeaderboard());
    }

    static showCharacterSelection() {
      const $game = $('#game');
      $game.html(`
        <div class='section char-selection fade-in'>
          <div class='selection-header'>
            <h2>⚔️ Elige tu Héroe ⚔️</h2>
            <p>Cada clase tiene habilidades únicas y estilos de juego diferentes</p>
          </div>
          
          <div class='character-grid'>
            ${CLASSES.map((cls, i) => `
              <div class='char-card' data-class-index='${i}' style='border-color: ${cls.color}'>
                <div class='char-header' style='background: ${cls.color}'>
                  <h3>${cls.n}</h3>
                </div>
                <div class='char-body'>
                  <p class='char-desc'>${cls.desc}</p>
                  <div class='char-special'>
                    <strong>Especial:</strong> ${cls.special}
                  </div>
                  <div class='char-stats'>
                    HP: ${cls.h + 10} | AC: ${cls.a} | ATK: ${cls.s}
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
          
          <div class='selection-footer'>
            <button id='back-to-menu' class='btn btn-secondary'>← Volver</button>
          </div>
        </div>
      `);
      
      this.bindCharacterSelectionEvents();
    }

    static bindCharacterSelectionEvents() {
      $('.char-card').on('click', function() {
        const classIndex = $(this).data('class-index');
        GameManager.selectCharacter(classIndex);
      });
      
      $('#back-to-menu').on('click', () => this.showWelcomeScreen());
    }

    // ...existing code... (resto de métodos UI)

    static updateCombatDisplay() {
      if ($('.combat-section').length) {
        $('.hero-panel').replaceWith(this.renderHeroPanel());
        $('.enemy-panel').replaceWith(this.renderEnemyPanel());
      }
    }

    static renderHeroPanel() {
      const char = window.char;
      return `
        <div class='hero-panel'>
          <h3>${char.name} <span class='level-badge'>Nv.${char.lvl}</span></h3>
          <div class='hp-bar'>
            <div class='hp-fill' style='width: ${(char.hp/char.maxHP)*100}%'></div>
            <span class='hp-text'>${char.hp}/${char.maxHP} HP</span>
          </div>
          <div class='stats-row'>
            <span>AC: ${Combat.calculateAC(char)}</span>
            <span>ATK: ${Combat.calculateAttackBonus(char)}</span>
            <span>Oro: ${char.gold}</span>
          </div>
          ${this.renderConditions(char.conditions)}
        </div>
      `;
    }

    static renderEnemyPanel() {
      const monster = window.currentMonster;
      return `
        <div class='enemy-panel'>
          <h3>${monster.n}</h3>
          <div class='hp-bar enemy'>
            <div class='hp-fill' style='width: ${(monster.h/monster.maxHP)*100}%'></div>
            <span class='hp-text'>${monster.h}/${monster.maxHP} HP</span>
          </div>
          <div class='stats-row'>
            <span>AC: ${monster.a}</span>
            <span>ATK: ${monster.at}</span>
          </div>
          ${this.renderConditions(monster.conditions)}
        </div>
      `;
    }

    static renderConditions(conditions) {
      if (!conditions?.length) return '';
      return `<div class='conditions'>
        ${conditions.map(c => `<span class='condition ${c.name}'>${c.name} (${c.turns || '∞'})</span>`).join('')}
      </div>`;
    }
  }

  // ================================
  // GESTOR PRINCIPAL DEL JUEGO
  // ================================
  
  class GameManager {
    static init() {
      gameState.reset();
      UI.showWelcomeScreen();
      this.setupGlobalEvents();
    }

    static setupGlobalEvents() {
      // ESC para pausar/volver al menú
      $(document).on('keydown', (e) => {
        if (e.key === 'Escape' && gameState.currentState === GAME_STATES.PLAYING) {
          this.pauseGame();
        }
      });

      // Prevenir pérdida de datos al cerrar
      $(window).on('beforeunload', () => {
        if (window.char) {
          GameStorage.save('current_character', window.char);
          GameStorage.save('current_encounter', gameState.currentEncounter);
        }
      });
    }

    static selectCharacter(classIndex) {
      const selectedClass = CLASSES[classIndex];
      window.char = new Character(selectedClass);
      
      gameState.currentState = GAME_STATES.PLAYING;
      gameState.startAutoSave();
      
      window.char.addLog(`¡Aventura iniciada como ${selectedClass.n}!`);
      EncounterManager.startEncounter();
    }

    static loadSavedGame() {
      const savedChar = GameStorage.load('current_character');
      const savedEncounter = GameStorage.load('current_encounter');
      
      if (savedChar && savedEncounter !== null) {
        window.char = Object.assign(new Character(savedChar.cls), savedChar);
        gameState.currentEncounter = savedEncounter;
        gameState.currentState = GAME_STATES.PLAYING;
        gameState.startAutoSave();
        
        EncounterManager.startEncounter();
      } else {
        alert('No hay partida guardada disponible');
      }
    }

    static pauseGame() {
      gameState.currentState = GAME_STATES.PAUSED;
      // Implementar menú de pausa
    }

    static handleGameOver() {
      gameState.stopAutoSave();
      GameStorage.addScore(window.char);
      
      const $game = $('#game');
      $game.html(`
        <div class='section gameover-section fade-in'>
          <h2>💀 Game Over</h2>
          <p>Tu aventura ha llegado a su fin...</p>
          <div class='death-stats'>
            <div class='stat-item'>
              <span class='stat-label'>Nivel Alcanzado:</span>
              <span class='stat-value'>${window.char.lvl}</span>
            </div>
            <div class='stat-item'>
              <span class='stat-label'>Encuentros:</span>
              <span class='stat-value'>${gameState.currentEncounter}</span>
            </div>
            <div class='stat-item'>
              <span class='stat-label'>Oro Acumulado:</span>
              <span class='stat-value'>${window.char.gold}</span>
            </div>
            <div class='stat-item'>
              <span class='stat-label'>Score Final:</span>
              <span class='stat-value'>${GameStorage.calculateScore(window.char)}</span>
            </div>
          </div>
          <div class='game-over-actions'>
            <button id='show-leaderboard-btn' class='btn btn-primary'>🏆 Ver Ranking</button>
            <button id='retry-btn' class='btn btn-secondary'>🔄 Reintentar</button>
            <button id='menu-btn' class='btn btn-outline'>🏠 Menú Principal</button>
          </div>
        </div>
      `);
      
      $('#show-leaderboard-btn').on('click', () => UI.showLeaderboard());
      $('#retry-btn').on('click', () => this.init());
      $('#menu-btn').on('click', () => this.init());
    }
  }

  // ================================
  // GESTOR DE ENCUENTROS
  // ================================
  
  class EncounterManager {
    static startEncounter() {
      const encounter = STORY_ENCOUNTERS[gameState.currentEncounter];
      if (!encounter) {
        this.showVictoryScreen();
        return;
      }
      
      switch(encounter.type) {
        case 'story': this.renderStoryEncounter(encounter); break;
        case 'combat': this.renderCombatEncounter(encounter); break;
        case 'merchant': this.renderMerchantEncounter(encounter); break;
        case 'treasure': this.renderTreasureEncounter(encounter); break;
        case 'forge': this.renderForgeEncounter(encounter); break;
        case 'rest': this.renderRestEncounter(encounter); break;
        case 'boss': this.renderBossEncounter(encounter); break;
      }
    }

    static nextEncounter() {
      gameState.currentEncounter++;
      this.startEncounter();
    }

    // ...existing code... (métodos de encuentros)
  }

  // ================================
  // INICIALIZACIÓN
  // ================================
  
  // Esperar a que jQuery esté listo
  $(document).ready(() => {
    GameManager.init();
  });

  // Exponer funciones globales necesarias
  window.selectCharacter = (idx) => GameManager.selectCharacter(idx);
  window.performAttack = () => Combat.performAttack();
  window.nextEncounter = () => EncounterManager.nextEncounter();

})(jQuery);