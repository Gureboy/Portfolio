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
  // INTERFAZ DE USUARIO MEJORADA
  // ================================
  
  class UI {
    static showWelcomeScreen() {
      const $game = $('#game');
      $game.html(`
        <div class='dnd-game-container'>
          <div class='glass-background'></div>
          <div class='section welcome-section glass-card fade-in'>
            <div class='welcome-header glass-header'>
              <div class='title-glow'>
                <h2 class='dnd-title'>⚔️ Aventura D&D Épica ⚔️</h2>
                <div class='title-underline'></div>
              </div>
              <p class='welcome-subtitle glass-text'>Roguelike completo con sistema avanzado de RPG</p>
            </div>
            
            <div class='features-grid glass-grid'>
              <div class='feature-card glass-mini-card'>
                <div class='feature-icon'><i class='fas fa-scroll'></i></div>
                <span>Historia Épica</span>
              </div>
              <div class='feature-card glass-mini-card'>
                <div class='feature-icon'><i class='fas fa-sword'></i></div>
                <span>Combate Estratégico</span>
              </div>
              <div class='feature-card glass-mini-card'>
                <div class='feature-icon'><i class='fas fa-backpack'></i></div>
                <span>Sistema de Inventario</span>
              </div>
              <div class='feature-card glass-mini-card'>
                <div class='feature-icon'><i class='fas fa-magic'></i></div>
                <span>Habilidades Especiales</span>
              </div>
              <div class='feature-card glass-mini-card'>
                <div class='feature-icon'><i class='fas fa-store'></i></div>
                <span>Mercaderes</span>
              </div>
              <div class='feature-card glass-mini-card'>
                <div class='feature-icon'><i class='fas fa-hammer'></i></div>
                <span>Mejora de Equipo</span>
              </div>
            </div>
            
            <div class='welcome-actions'>
              <button id='start-game-btn' class='glass-btn glass-btn-primary'>
                <span class='btn-icon'>🎮</span>
                <span>Nueva Aventura</span>
                <div class='btn-glow'></div>
              </button>
              <button id='continue-btn' class='glass-btn glass-btn-secondary'>
                <span class='btn-icon'>📁</span>
                <span>Continuar</span>
              </button>
              <button id='show-leaderboard-btn' class='glass-btn glass-btn-outline'>
                <span class='btn-icon'>🏆</span>
                <span>Ranking</span>
              </button>
            </div>
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
        <div class='dnd-game-container'>
          <div class='glass-background character-bg'></div>
          <div class='section char-selection glass-card fade-in'>
            <div class='selection-header glass-header'>
              <div class='title-glow'>
                <h2 class='dnd-title'>⚔️ Elige tu Héroe ⚔️</h2>
                <div class='title-underline'></div>
              </div>
              <p class='glass-text'>Cada clase tiene habilidades únicas y estilos de juego diferentes</p>
            </div>
            
            <div class='character-grid glass-grid'>
              ${CLASSES.map((cls, i) => `
                <div class='char-card glass-character-card' data-class-index='${i}'>
                  <div class='char-header glass-char-header' style='background: linear-gradient(135deg, ${cls.color}80, ${cls.color}40)'>
                    <h3 class='char-title'>${cls.n}</h3>
                    <div class='class-icon' style='color: ${cls.color}'>⚔️</div>
                  </div>
                  <div class='char-body glass-content'>
                    <p class='char-desc glass-text'>${cls.desc}</p>
                    <div class='char-special glass-special'>
                      <strong class='special-label'>Especial:</strong> 
                      <span class='special-text'>${cls.special}</span>
                    </div>
                    <div class='char-stats glass-stats'>
                      <div class='stat-item'>
                        <span class='stat-label'>HP</span>
                        <span class='stat-value'>${cls.h + 10}</span>
                      </div>
                      <div class='stat-item'>
                        <span class='stat-label'>AC</span>
                        <span class='stat-value'>${cls.a}</span>
                      </div>
                      <div class='stat-item'>
                        <span class='stat-label'>ATK</span>
                        <span class='stat-value'>${cls.s}</span>
                      </div>
                    </div>
                  </div>
                  <div class='card-glow' style='background: linear-gradient(135deg, ${cls.color}20, transparent)'></div>
                </div>
              `).join('')}
            </div>
            
            <div class='selection-footer'>
              <button id='back-to-menu' class='glass-btn glass-btn-secondary'>
                <span class='btn-icon'>←</span>
                <span>Volver</span>
              </button>
            </div>
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

    static renderCombatEncounter(encounter) {
      window.currentMonster = {
        ...encounter.monster,
        maxHP: encounter.monster.h,
        conditions: []
      };
      
      const $game = $('#game');
      $game.html(`
        <div class='dnd-game-container'>
          <div class='glass-background combat-bg'></div>
          <div class='section combat-section glass-card fade-in'>
            <div class='combat-header glass-header'>
              <h2 class='dnd-title'>⚔️ ¡Combate Épico! ⚔️</h2>
              <p class='encounter-desc glass-text'>${encounter.desc}</p>
            </div>
            
            <div class='combat-arena glass-arena'>
              ${this.renderHeroPanel()}
              <div class='vs-indicator glass-vs'>
                <span class='vs-text'>VS</span>
                <div class='vs-glow'></div>
              </div>
              ${this.renderEnemyPanel()}
            </div>
            
            <div class='combat-log-container glass-mini-card'>
              <h4 class='log-title'>📜 Registro de Combate</h4>
              <div class='combat-log glass-log' id='combat-log'></div>
            </div>
            
            <div class='action-panel glass-actions'>
              <div class='basic-actions'>
                <button id='attack-btn' class='glass-btn glass-btn-combat glass-btn-primary'>
                  <span class='btn-icon'>⚔️</span>
                  <span>Atacar</span>
                  <div class='btn-glow'></div>
                </button>
                <button id='inventory-btn' class='glass-btn glass-btn-combat'>
                  <span class='btn-icon'>🎒</span>
                  <span>Inventario</span>
                </button>
                <button id='defend-btn' class='glass-btn glass-btn-combat'>
                  <span class='btn-icon'>🛡️</span>
                  <span>Defenderse</span>
                </button>
              </div>
              <div class='special-actions glass-specials'>
                ${this.renderSpecialActions()}
              </div>
            </div>
          </div>
        </div>
      `);
      
      this.bindCombatEvents();
    }

    static renderHeroPanel() {
      const char = window.char;
      return `
        <div class='hero-panel glass-character-panel'>
          <div class='panel-header'>
            <h3 class='character-name'>${char.name}</h3>
            <span class='level-badge glass-badge'>Nv.${char.lvl}</span>
          </div>
          
          <div class='hp-container'>
            <div class='hp-bar glass-bar'>
              <div class='hp-fill hero-hp' style='width: ${(char.hp/char.maxHP)*100}%'></div>
              <div class='hp-glow'></div>
              <span class='hp-text'>${char.hp}/${char.maxHP} HP</span>
            </div>
          </div>
          
          <div class='stats-grid glass-stats-grid'>
            <div class='stat-box glass-mini-card'>
              <span class='stat-icon'>🛡️</span>
              <span class='stat-value'>${Combat.calculateAC(char)}</span>
              <span class='stat-label'>AC</span>
            </div>
            <div class='stat-box glass-mini-card'>
              <span class='stat-icon'>⚔️</span>
              <span class='stat-value'>${Combat.calculateAttackBonus(char)}</span>
              <span class='stat-label'>ATK</span>
            </div>
            <div class='stat-box glass-mini-card'>
              <span class='stat-icon'>💰</span>
              <span class='stat-value'>${char.gold}</span>
              <span class='stat-label'>Oro</span>
            </div>
          </div>
          
          ${this.renderConditions(char.conditions)}
          <div class='panel-glow hero-glow'></div>
        </div>
      `;
    }

    static renderEnemyPanel() {
      const monster = window.currentMonster;
      return `
        <div class='enemy-panel glass-character-panel enemy'>
          <div class='panel-header'>
            <h3 class='character-name'>${monster.n}</h3>
            <div class='danger-indicator'>💀</div>
          </div>
          
          <div class='hp-container'>
            <div class='hp-bar glass-bar enemy-bar'>
              <div class='hp-fill enemy-hp' style='width: ${(monster.h/monster.maxHP)*100}%'></div>
              <div class='hp-glow enemy-glow'></div>
              <span class='hp-text'>${monster.h}/${monster.maxHP} HP</span>
            </div>
          </div>
          
          <div class='stats-grid glass-stats-grid'>
            <div class='stat-box glass-mini-card enemy-stat'>
              <span class='stat-icon'>🛡️</span>
              <span class='stat-value'>${monster.a}</span>
              <span class='stat-label'>AC</span>
            </div>
            <div class='stat-box glass-mini-card enemy-stat'>
              <span class='stat-icon'>⚔️</span>
              <span class='stat-value'>${monster.at}</span>
              <span class='stat-label'>ATK</span>
            </div>
          </div>
          
          ${this.renderConditions(monster.conditions)}
          <div class='panel-glow enemy-glow'></div>
        </div>
      `;
    }

    static renderSpecialActions() {
      const char = window.char;
      let actions = [];
      
      if (char.abilities.rage > 0) {
        actions.push(`
          <button id='use-rage' class='glass-btn glass-btn-special rage-btn'>
            <span class='btn-icon'>🔥</span>
            <span>Furia (${char.abilities.rage})</span>
            <div class='special-glow rage-glow'></div>
          </button>
        `);
      }
      
      if (char.abilities.spells > 0) {
        actions.push(`
          <button id='cast-magic' class='glass-btn glass-btn-special magic-btn'>
            <span class='btn-icon'>✨</span>
            <span>Misil Mágico (${char.abilities.spells})</span>
            <div class='special-glow magic-glow'></div>
          </button>
        `);
      }
      
      if (char.abilities.heals > 0) {
        actions.push(`
          <button id='divine-heal' class='glass-btn glass-btn-special heal-btn'>
            <span class='btn-icon'>🙏</span>
            <span>Curación (${char.abilities.heals})</span>
            <div class='special-glow heal-glow'></div>
          </button>
        `);
      }
      
      if (char.abilities.sneak > 0) {
        actions.push(`
          <button id='sneak-attack' class='glass-btn glass-btn-special sneak-btn'>
            <span class='btn-icon'>🗡️</span>
            <span>Ataque Furtivo (${char.abilities.sneak})</span>
            <div class='special-glow sneak-glow'></div>
          </button>
        `);
      }
      
      return actions.join('');
    }

    static renderConditions(conditions) {
      if (!conditions?.length) return '';
      return `
        <div class='conditions-container'>
          ${conditions.map(c => `
            <div class='condition-badge glass-condition ${c.name}'>
              <span class='condition-icon'>${this.getConditionIcon(c.name)}</span>
              <span class='condition-text'>${c.name}</span>
              <span class='condition-turns'>(${c.turns || '∞'})</span>
            </div>
          `).join('')}
        </div>
      `;
    }

    static getConditionIcon(conditionName) {
      const icons = {
        'rage': '🔥',
        'defending': '🛡️',
        'poison': '☠️',
        'curse': '💀',
        'blessed': '✨'
      };
      return icons[conditionName] || '⚡';
    }

    static showLeaderboard() {
      const leaderboard = GameStorage.getLeaderboard();
      const $game = $('#game');
      
      $game.html(`
        <div class='dnd-game-container'>
          <div class='glass-background leaderboard-bg'></div>
          <div class='section leaderboard-section glass-card fade-in'>
            <div class='leaderboard-header glass-header'>
              <div class='title-glow'>
                <h2 class='dnd-title'>🏆 Ranking de Aventureros 🏆</h2>
                <div class='title-underline'></div>
              </div>
              <p class='glass-text'>Los héroes más valientes del reino</p>
            </div>
            
            <div class='leaderboard-list glass-list'>
              ${leaderboard.length > 0 ? leaderboard.map((entry, i) => `
                <div class='leaderboard-entry glass-entry ${i < 3 ? 'top-three' : ''}'>
                  <div class='rank-badge glass-rank-badge rank-${i + 1}'>
                    <span class='rank-number'>#${i + 1}</span>
                    ${i < 3 ? `<div class='rank-glow rank-${i + 1}-glow'></div>` : ''}
                  </div>
                  <div class='entry-info'>
                    <div class='entry-main'>
                      <span class='entry-name'>${entry.character_name}</span>
                      <span class='entry-class glass-badge'>${entry.class_name}</span>
                    </div>
                    <div class='entry-stats'>
                      <span class='stat-item'>Nv.${entry.final_level}</span>
                      <span class='stat-item'>${entry.score} pts</span>
                    </div>
                  </div>
                  <div class='entry-glow'></div>
                </div>
              `).join('') : `
                <div class='empty-leaderboard glass-mini-card'>
                  <div class='empty-icon'>🏆</div>
                  <p class='glass-text'>¡Sé el primer héroe en completar una aventura!</p>
                </div>
              `}
            </div>
            
            <div class='leaderboard-actions'>
              <button id='back-to-menu' class='glass-btn glass-btn-secondary'>
                <span class='btn-icon'>🏠</span>
                <span>Menú Principal</span>
              </button>
              <button id='clear-scores' class='glass-btn glass-btn-outline'>
                <span class='btn-icon'>🗑️</span>
                <span>Limpiar Puntuaciones</span>
              </button>
            </div>
          </div>
        </div>
      `);
      
      $('#back-to-menu').on('click', () => this.showWelcomeScreen());
      $('#clear-scores').on('click', function() {
        if (confirm('¿Seguro que quieres borrar todas las puntuaciones?')) {
          GameStorage.save('leaderboard', []);
          UI.showLeaderboard();
        }
      });
    }

    static updateCombatDisplay() {
      if ($('.combat-section').length) {
        $('.hero-panel').replaceWith(this.renderHeroPanel());
        $('.enemy-panel').replaceWith(this.renderEnemyPanel());
      }
    }

    static bindCombatEvents() {
      $('#attack-btn').on('click', () => Combat.performAttack());
      $('#inventory-btn').on('click', () => this.showInventoryInCombat());
      $('#defend-btn').on('click', () => this.defendAction());
      
      // Special abilities
      $('#use-rage').on('click', () => this.useRage());
      $('#cast-magic').on('click', () => this.castMagicMissile());
      $('#divine-heal').on('click', () => this.divineHeal());
      $('#sneak-attack').on('click', () => this.sneakAttack());
    }

    // ...existing code...
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