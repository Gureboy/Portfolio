// --- COMBATE POR TURNOS CLÁSICO D&D ---
// Ultra-optimized memory-efficient version

(function() {
  'use strict';
  
  // Minimal data structures - reduced to essentials only
  const CLASSES = [
    {n:"Bárbaro",h:12,a:15,s:3,d:1,c:2},
    {n:"Mago",h:6,a:12,s:0,d:1,c:0,i:3,w:1},
    {n:"Clérigo",h:8,a:14,s:1,d:0,c:2,w:3,ch:1},
    {n:"Monje",h:8,a:15,s:1,d:3,c:1,w:2}
  ];
  
  const MONSTERS = [
    {n:"Goblin",h:7,a:13,at:3,c:0.25},
    {n:"Orco",h:15,a:13,at:5,c:0.5},
    {n:"Ogro",h:59,a:11,at:9,c:2},
    {n:"Dragón",h:110,a:17,at:15,c:6}
  ];
  
  const ITEMS = [
    {n:"Poción",e:"h",v:10,p:15},
    {n:"Daga",e:"a",v:2,p:8},
    {n:"Escudo",e:"ac",v:2,p:20}
  ];
  
  // Memory pools for object reuse
  let logPool = [];
  let statusPool = [];
  
  // Ultra-minimal combat render
  window.renderCombat = function(char, mon, turn) {
    const g = document.getElementById('game');
    if (!g) return;
    
    // Trim logs aggressively
    if (char.log && char.log.length > 5) char.log = char.log.slice(-3);
    
    g.innerHTML = `<div class='section'>
      <h2>¡Combate!</h2>
      <div>${char.cls.n} Nv.${char.lvl} HP:${char.hp}/${char.maxHP}</div>
      <div>${mon.n} HP:${mon.hp}/${mon.maxHP}</div>
      <div class='log'>${(char.log||[]).join('<br>')}</div>
      ${turn==='player'?`<div>
        <button onclick='attack()'>⚔️</button>
        <button onclick='useItem()'>🧪</button>
      </div>`:''}
    </div>`;
  };
  
  // Ultra-simplified functions
  window.attack = function() {
    const c = window.char, m = window.mon;
    const hit = Math.random()*20+1+(c.cls.s||0) >= m.a;
    
    if (hit) {
      const dmg = (c.cls.s||0)+Math.random()*8+1;
      m.hp = Math.max(0, m.hp-dmg);
      addLog(c, `Daño: ${dmg}`);
      
      if (m.hp <= 0) {
        victory(c, m);
        return;
      }
    } else {
      addLog(c, 'Fallas');
    }
    
    setTimeout(() => monsterAttack(c, m), 500);
  };
  
  window.useItem = function() {
    const c = window.char;
    if (!c.inv || !c.inv.length) return;
    
    const item = c.inv.pop();
    if (item.e === 'h') {
      c.hp = Math.min(c.maxHP, c.hp + item.v);
      addLog(c, `Curas ${item.v} HP`);
    }
    
    setTimeout(() => monsterAttack(c, window.mon), 500);
  };
  
  function addLog(char, msg) {
    char.log = char.log || [];
    char.log.push(msg);
    if (char.log.length > 5) char.log = char.log.slice(-3);
  }
  
  function victory(char, mon) {
    const xp = Math.round(mon.c * 10);
    const gold = Math.round(mon.c * 6);
    
    char.xp += xp;
    char.gold += gold;
    
    if (char.xp >= char.xpNext) {
      char.lvl++;
      char.xp = 0;
      char.xpNext = Math.round(char.xpNext * 1.5);
      char.maxHP += 5;
      char.hp = char.maxHP;
    }
    
    document.getElementById('game').innerHTML = `
      <div class='section'>
        <h2>¡Victoria!</h2>
        <p>+${xp} XP, +${gold} oro</p>
        <button onclick='nextBattle()'>Continuar</button>
      </div>
    `;
  }
  
  function monsterAttack(char, mon) {
    const hit = Math.random()*20+1+Math.floor(mon.at/2) >= char.ac;
    
    if (hit) {
      const dmg = mon.at + Math.random()*6;
      char.hp = Math.max(0, char.hp - dmg);
      addLog(char, `Recibes ${dmg} daño`);
      
      if (char.hp <= 0) {
        document.getElementById('game').innerHTML = `
          <div class='section'>
            <h2>¡Game Over!</h2>
            <button onclick='location.reload()'>Reiniciar</button>
          </div>
        `;
        return;
      }
    } else {
      addLog(char, 'El enemigo falla');
    }
    
    renderCombat(char, mon, 'player');
  }
  
  window.nextBattle = function() {
    const char = window.char;
    char.progress = (char.progress || 0) + 1;
    
    const monIdx = Math.min(char.progress, MONSTERS.length - 1);
    const baseMon = MONSTERS[monIdx];
    
    window.mon = {
      n: baseMon.n,
      hp: baseMon.h,
      maxHP: baseMon.h,
      a: baseMon.a,
      at: baseMon.at,
      c: baseMon.c
    };
    
    renderCombat(char, window.mon, 'player');
  };
  
  // Ultra-aggressive cleanup every 5 seconds
  setInterval(() => {
    if (window.char) {
      const c = window.char;
      if (c.log && c.log.length > 3) c.log = c.log.slice(-2);
      if (c.inv && c.inv.length > 10) c.inv = c.inv.slice(-5);
    }
    
    // Clear unused DOM
    const logs = document.querySelectorAll('.log div');
    if (logs.length > 5) {
      for (let i = 0; i < logs.length - 3; i++) {
        logs[i].remove();
      }
    }
    
    if (window.gc) window.gc();
  }, 5000);
  
  // Initialize with minimal character
  window.startSimpleGame = function() {
    window.char = {
      cls: CLASSES[0],
      lvl: 1,
      hp: 22,
      maxHP: 22,
      ac: 15,
      xp: 0,
      xpNext: 20,
      gold: 20,
      inv: [ITEMS[0], ITEMS[0]],
      log: []
    };
    
    nextBattle();
  };
  
})();

// Minimal initialization
window.addEventListener('DOMContentLoaded', () => {
  document.getElementById('game').innerHTML = `
    <div class='section'>
      <h2>D&D Minimalista</h2>
      <p>Versión ultra-optimizada</p>
      <button onclick='startSimpleGame()'>Comenzar</button>
    </div>
  `;
});