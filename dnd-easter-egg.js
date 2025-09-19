// --- COMBATE POR TURNOS CLÁSICO D&D ---
// Optimized with story progression and balanced encounters

(function() {
  'use strict';
  
  // Enhanced classes with progression
  const CLASSES = [
    {n:"Bárbaro",h:12,a:15,s:3,d:1,c:2,desc:"Guerrero salvaje con gran resistencia"},
    {n:"Mago",h:6,a:12,s:0,d:1,c:0,i:3,w:1,desc:"Maestro de la magia arcana"},
    {n:"Clérigo",h:8,a:14,s:1,d:0,c:2,w:3,ch:1,desc:"Sanador divino"},
    {n:"Monje",h:8,a:15,s:1,d:3,c:1,w:2,desc:"Maestro marcial ágil"}
  ];
  
  // Story-driven monster progression
  const STORY_ENCOUNTERS = [
    {type:"story",title:"El Bosque Maldito",desc:"Te adentras en un bosque oscuro. Los árboles susurran secretos antiguos."},
    {type:"combat",monster:{n:"Goblin Explorador",h:8,a:13,at:3,c:0.25},desc:"Un pequeño goblin salta de los arbustos."},
    {type:"story",title:"Ruinas Ancestrales",desc:"Encuentras ruinas cubiertas de musgo. Algo se mueve en las sombras."},
    {type:"combat",monster:{n:"Esqueleto Guardián",h:12,a:14,at:4,c:0.5},desc:"Un esqueleto se alza para defender las ruinas."},
    {type:"event",title:"Cofre Misterioso",desc:"Encuentras un cofre antiguo. ¿Lo abres?",reward:"item"},
    {type:"story",title:"El Puente de Piedra",desc:"Un viejo puente cruza un río turbulento. Algo grande se acerca."},
    {type:"combat",monster:{n:"Orco Berserker",h:18,a:13,at:6,c:0.75},desc:"Un orco feroz bloquea tu camino."},
    {type:"rest",title:"Campamento Seguro",desc:"Encuentras un lugar seguro para descansar y recuperar fuerzas."},
    {type:"story",title:"La Cueva Profunda",desc:"La entrada a una cueva se abre ante ti. El aire huele a peligro."},
    {type:"combat",monster:{n:"Ogro de las Cavernas",h:35,a:12,at:8,c:1.5},desc:"Un ogro gigante emerge rugiendo de la oscuridad."},
    {type:"story",title:"El Tesoro Final",desc:"Llegas al corazón de la cueva. Un brillo dorado ilumina la cámara."},
    {type:"boss",monster:{n:"Dragón Joven",h:60,a:16,at:12,c:3},desc:"Un dragón dorado protege el tesoro ancestral."}
  ];
  
  const ITEMS = [
    {n:"Poción de Curación",e:"heal",v:15,desc:"Restaura vida"},
    {n:"Daga Élfica",e:"weapon",v:3,desc:"+3 daño de ataque"},
    {n:"Escudo de Roble",e:"armor",v:2,desc:"+2 AC"},
    {n:"Amuleto de Suerte",e:"luck",v:1,desc:"+1 a todas las tiradas"}
  ];
  
  let gameState = {
    currentEncounter: 0,
    storyMode: true
  };
  
  // Story-driven encounter system
  window.startStoryGame = function() {
    // Character selection first
    showCharacterSelection();
  };
  
  function showCharacterSelection() {
    const g = document.getElementById('game');
    g.innerHTML = `
      <div class='section'>
        <h2>⚔️ Elige tu Héroe ⚔️</h2>
        <p>Cada clase tiene habilidades únicas que afectan tu aventura:</p>
        <div class='character-grid'>
          ${CLASSES.map((cls, i) => `
            <div class='char-card' onclick='selectCharacter(${i})'>
              <h3>${cls.n}</h3>
              <p>${cls.desc}</p>
              <div class='stats'>
                <small>HP: ${cls.h + 10} | AC: ${cls.a}</small>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }
  
  window.selectCharacter = function(idx) {
    const selectedClass = CLASSES[idx];
    window.char = {
      cls: selectedClass,
      name: selectedClass.n,
      lvl: 1,
      hp: selectedClass.h + 10,
      maxHP: selectedClass.h + 10,
      ac: selectedClass.a,
      xp: 0,
      xpNext: 50,
      gold: 25,
      inv: [ITEMS[0], ITEMS[0]], // Start with 2 healing potions
      log: [],
      stats: {
        str: selectedClass.s || 0,
        dex: selectedClass.d || 0,
        con: selectedClass.c || 0,
        int: selectedClass.i || 0,
        wis: selectedClass.w || 0,
        cha: selectedClass.ch || 0
      }
    };
    
    gameState.currentEncounter = 0;
    startStoryEncounter();
  };
  
  function startStoryEncounter() {
    const encounter = STORY_ENCOUNTERS[gameState.currentEncounter];
    if (!encounter) {
      // Victory ending
      showVictoryScreen();
      return;
    }
    
    const g = document.getElementById('game');
    
    switch(encounter.type) {
      case 'story':
        g.innerHTML = `
          <div class='section story-section'>
            <h2>📜 ${encounter.title}</h2>
            <p class='story-text'>${encounter.desc}</p>
            <div class='char-status'>
              <strong>${window.char.name}</strong> | Nivel ${window.char.lvl} | HP: ${window.char.hp}/${window.char.maxHP} | Oro: ${window.char.gold}
            </div>
            <button onclick='nextEncounter()' class='story-btn'>Continuar Aventura</button>
          </div>
        `;
        break;
        
      case 'combat':
        window.currentMonster = {
          ...encounter.monster,
          maxHP: encounter.monster.h
        };
        g.innerHTML = `
          <div class='section combat-section'>
            <h2>⚔️ ¡Combate!</h2>
            <p class='encounter-desc'>${encounter.desc}</p>
            <div class='combat-status'>
              <div class='hero-status'>
                <strong>${window.char.name}</strong><br>
                Nivel ${window.char.lvl}<br>
                HP: ${window.char.hp}/${window.char.maxHP}<br>
                AC: ${window.char.ac}
              </div>
              <div class='enemy-status'>
                <strong>${window.currentMonster.n}</strong><br>
                HP: ${window.currentMonster.h}/${window.currentMonster.maxHP}<br>
                AC: ${window.currentMonster.a}
              </div>
            </div>
            <div class='combat-log'>${(window.char.log || []).slice(-3).join('<br>')}</div>
            <div class='combat-actions'>
              <button onclick='performAttack()' class='combat-btn'>⚔️ Atacar</button>
              <button onclick='useHealingItem()' class='combat-btn'>🧪 Curar (${countHealingItems()})</button>
              ${window.char.cls.n === 'Mago' ? '<button onclick="castSpell()" class="combat-btn">✨ Hechizo</button>' : ''}
              ${window.char.cls.n === 'Clérigo' ? '<button onclick="divineHeal()" class="combat-btn">🙏 Curación Divina</button>' : ''}
            </div>
          </div>
        `;
        break;
        
      case 'event':
        handleSpecialEvent(encounter);
        break;
        
      case 'rest':
        handleRestEvent(encounter);
        break;
        
      case 'boss':
        window.currentMonster = {
          ...encounter.monster,
          maxHP: encounter.monster.h,
          isBoss: true
        };
        renderBossCombat(encounter);
        break;
    }
  }
  
  function handleSpecialEvent(encounter) {
    const g = document.getElementById('game');
    g.innerHTML = `
      <div class='section event-section'>
        <h2>✨ ${encounter.title}</h2>
        <p>${encounter.desc}</p>
        <div class='event-choices'>
          <button onclick='handleEventChoice(true)' class='event-btn'>Sí, abrir el cofre</button>
          <button onclick='handleEventChoice(false)' class='event-btn'>No, es muy peligroso</button>
        </div>
      </div>
    `;
  }
  
  window.handleEventChoice = function(openChest) {
    if (openChest) {
      if (Math.random() < 0.7) {
        const reward = ITEMS[Math.floor(Math.random() * ITEMS.length)];
        window.char.inv.push(reward);
        addLog(`¡Encuentras: ${reward.n}!`);
      } else {
        const damage = 5;
        window.char.hp = Math.max(1, window.char.hp - damage);
        addLog(`¡Era una trampa! Pierdes ${damage} HP.`);
      }
    } else {
      addLog("Decides no arriesgarte. Quizás fue lo más sabio.");
    }
    
    setTimeout(nextEncounter, 1500);
  };
  
  function handleRestEvent(encounter) {
    const heal = Math.round(window.char.maxHP * 0.6);
    window.char.hp = Math.min(window.char.maxHP, window.char.hp + heal);
    
    const g = document.getElementById('game');
    g.innerHTML = `
      <div class='section rest-section'>
        <h2>🏕️ ${encounter.title}</h2>
        <p>${encounter.desc}</p>
        <p class='heal-text'>Recuperas ${heal} puntos de vida.</p>
        <div class='char-status'>
          HP: ${window.char.hp}/${window.char.maxHP}
        </div>
        <button onclick='nextEncounter()' class='rest-btn'>Continuar Descansado</button>
      </div>
    `;
  }
  
  // Enhanced combat system
  window.performAttack = function() {
    const char = window.char;
    const monster = window.currentMonster;
    
    const d20 = Math.floor(Math.random() * 20) + 1;
    const attackRoll = d20 + (char.stats.str || 0);
    
    if (attackRoll >= monster.a || d20 === 20) { // Natural 20 always hits
      let damage = (char.stats.str || 0) + Math.floor(Math.random() * 8) + 1;
      
      // Class-specific bonuses
      if (char.cls.n === 'Bárbaro') damage += 2;
      if (char.cls.n === 'Monje' && d20 >= 18) damage *= 1.5; // Critical hit
      
      // Apply weapon bonuses
      char.inv.forEach(item => {
        if (item.e === 'weapon') damage += item.v;
      });
      
      monster.h = Math.max(0, monster.h - Math.floor(damage));
      addLog(`¡Atacas e infliges ${Math.floor(damage)} de daño! (${d20})`);
      
      if (monster.h <= 0) {
        handleCombatVictory();
        return;
      }
    } else {
      addLog(`¡Fallas el ataque! (${d20} vs AC ${monster.a})`);
    }
    
    setTimeout(() => monsterAttack(), 800);
  };
  
  window.useHealingItem = function() {
    const healingItems = window.char.inv.filter(item => item.e === 'heal');
    if (healingItems.length === 0) {
      addLog('No tienes pociones de curación.');
      return;
    }
    
    const item = healingItems[0];
    const healAmount = item.v;
    window.char.hp = Math.min(window.char.maxHP, window.char.hp + healAmount);
    
    // Remove the used item
    const itemIndex = window.char.inv.findIndex(i => i.e === 'heal');
    window.char.inv.splice(itemIndex, 1);
    
    addLog(`Usas ${item.n} y recuperas ${healAmount} HP.`);
    setTimeout(() => monsterAttack(), 800);
  };
  
  window.castSpell = function() {
    if (window.char.cls.n !== 'Mago') return;
    
    const damage = 8 + window.char.lvl + (window.char.stats.int || 0);
    window.currentMonster.h = Math.max(0, window.currentMonster.h - damage);
    addLog(`¡Lanzas Misil Mágico e infliges ${damage} de daño!`);
    
    if (window.currentMonster.h <= 0) {
      handleCombatVictory();
      return;
    }
    
    setTimeout(() => monsterAttack(), 800);
  };
  
  window.divineHeal = function() {
    if (window.char.cls.n !== 'Clérigo') return;
    
    const healAmount = 12 + window.char.lvl;
    window.char.hp = Math.min(window.char.maxHP, window.char.hp + healAmount);
    addLog(`¡Canalizas energía divina y recuperas ${healAmount} HP!`);
    
    setTimeout(() => monsterAttack(), 800);
  };
  
  function countHealingItems() {
    return window.char.inv.filter(item => item.e === 'heal').length;
  }
  
  function monsterAttack() {
    const char = window.char;
    const monster = window.currentMonster;
    
    const d20 = Math.floor(Math.random() * 20) + 1;
    const attackRoll = d20 + Math.floor(monster.at / 2);
    
    if (attackRoll >= char.ac || d20 === 20) {
      let damage = monster.at + Math.floor(Math.random() * 6);
      
      // Apply armor bonuses
      char.inv.forEach(item => {
        if (item.e === 'armor') damage = Math.max(1, damage - item.v);
      });
      
      char.hp = Math.max(0, char.hp - damage);
      addLog(`${monster.n} te ataca e inflige ${damage} de daño.`);
      
      if (char.hp <= 0) {
        handleGameOver();
        return;
      }
    } else {
      addLog(`${monster.n} falla su ataque. (${d20})`);
    }
    
    // Re-render combat
    startStoryEncounter();
  }
  
  function handleCombatVictory() {
    const monster = window.currentMonster;
    const xpGain = Math.round(monster.c * 25 + 10);
    const goldGain = Math.round(monster.c * 15 + Math.random() * 10);
    
    window.char.xp += xpGain;
    window.char.gold += goldGain;
    
    addLog(`¡Victoria! +${xpGain} XP, +${goldGain} oro`);
    
    // Level up check
    if (window.char.xp >= window.char.xpNext) {
      levelUp();
    }
    
    // Random item drop
    if (Math.random() < 0.3) {
      const item = ITEMS[Math.floor(Math.random() * ITEMS.length)];
      window.char.inv.push(item);
      addLog(`¡Encuentras: ${item.n}!`);
    }
    
    setTimeout(nextEncounter, 2000);
  }
  
  function levelUp() {
    window.char.lvl++;
    window.char.xp = 0;
    window.char.xpNext = Math.round(window.char.xpNext * 1.5);
    
    const hpGain = Math.floor(window.char.cls.h / 2) + 3;
    window.char.maxHP += hpGain;
    window.char.hp = window.char.maxHP; // Full heal on level up
    
    // Stat improvement
    const statNames = ['str', 'dex', 'con', 'int', 'wis', 'cha'];
    const randomStat = statNames[Math.floor(Math.random() * statNames.length)];
    window.char.stats[randomStat] = (window.char.stats[randomStat] || 0) + 1;
    
    addLog(`¡NIVEL ${window.char.lvl}! +${hpGain} HP, +1 ${randomStat.toUpperCase()}`);
  }
  
  function renderBossCombat(encounter) {
    const g = document.getElementById('game');
    g.innerHTML = `
      <div class='section boss-section'>
        <h2>🐉 ¡JEFE FINAL!</h2>
        <p class='boss-desc'>${encounter.desc}</p>
        <div class='boss-combat-status'>
          <div class='hero-status'>
            <strong>${window.char.name}</strong><br>
            Nivel ${window.char.lvl}<br>
            HP: ${window.char.hp}/${window.char.maxHP}
          </div>
          <div class='boss-status'>
            <strong>${window.currentMonster.n}</strong><br>
            HP: ${window.currentMonster.h}/${window.currentMonster.maxHP}
          </div>
        </div>
        <div class='combat-log'>${(window.char.log || []).slice(-3).join('<br>')}</div>
        <div class='combat-actions'>
          <button onclick='performAttack()' class='boss-btn'>⚔️ Atacar</button>
          <button onclick='useHealingItem()' class='boss-btn'>🧪 Curar (${countHealingItems()})</button>
          ${window.char.cls.n === 'Mago' ? '<button onclick="castSpell()" class="boss-btn">✨ Hechizo</button>' : ''}
          ${window.char.cls.n === 'Clérigo' ? '<button onclick="divineHeal()" class="boss-btn">🙏 Curación Divina</button>' : ''}
        </div>
      </div>
    `;
  }
  
  function showVictoryScreen() {
    const g = document.getElementById('game');
    g.innerHTML = `
      <div class='section victory-section'>
        <h2>🏆 ¡VICTORIA ÉPICA! 🏆</h2>
        <p>Has completado tu aventura heroicamente!</p>
        <div class='final-stats'>
          <h3>Estadísticas Finales:</h3>
          <p><strong>Héroe:</strong> ${window.char.name}</p>
          <p><strong>Nivel Alcanzado:</strong> ${window.char.lvl}</p>
          <p><strong>Oro Obtenido:</strong> ${window.char.gold}</p>
          <p><strong>Items Encontrados:</strong> ${window.char.inv.length}</p>
        </div>
        <p class='victory-text'>El dragón ha sido derrotado y el tesoro ancestral es tuyo. Tu nombre será recordado por generaciones como el héroe que salvó la tierra.</p>
        <button onclick='location.reload()' class='victory-btn'>Nueva Aventura</button>
      </div>
    `;
  }
  
  function handleGameOver() {
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
        <p>Pero las leyendas nunca mueren. ¡Inténtalo de nuevo!</p>
        <button onclick='location.reload()' class='retry-btn'>Reintentar</button>
      </div>
    `;
  }
  
  window.nextEncounter = function() {
    gameState.currentEncounter++;
    startStoryEncounter();
  };
  
  function addLog(message) {
    window.char.log = window.char.log || [];
    window.char.log.push(message);
    if (window.char.log.length > 6) {
      window.char.log = window.char.log.slice(-4);
    }
  }
  
  // Cleanup every 10 seconds
  setInterval(() => {
    if (window.char && window.char.log && window.char.log.length > 4) {
      window.char.log = window.char.log.slice(-3);
    }
    if (window.gc) window.gc();
  }, 10000);
  
})();

// Enhanced initialization
window.addEventListener('DOMContentLoaded', () => {
  const g = document.getElementById('game');
  g.innerHTML = `
    <div class='section welcome-section'>
      <h2>⚔️ Aventura D&D Épica ⚔️</h2>
      <p>Embárcate en una aventura llena de combates estratégicos, progresión de personajes y una historia cautivadora.</p>
      <div class='features'>
        <div class='feature'>📜 Historia Inmersiva</div>
        <div class='feature'>⚔️ Combate Táctico</div>
        <div class='feature'>📈 Progresión Real</div>
        <div class='feature'>🎲 Sistema d20</div>
      </div>
      <button onclick='startStoryGame()' class='start-btn'>Comenzar Aventura</button>
    </div>
  `;
});