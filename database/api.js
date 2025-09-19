// Neon Database API integration for D&D Game

class NeonDBClient {
  constructor() {
    this.isLocal = window.location.hostname === 'localhost';
    this.apiEndpoint = this.isLocal ? 'http://localhost:8888/.netlify/functions' : '/api/db';
    this.playerId = null;
    this.currentCharacter = null;
    this.initialized = false;
  }

  async apiCall(endpoint, method = 'GET', data = null) {
    const url = `${this.apiEndpoint}${endpoint.replace('/api/db', '')}`;
    const options = {
      method,
      headers: { 'Content-Type': 'application/json' }
    };
    
    if (data && method !== 'GET') {
      options.body = JSON.stringify(data);
    }
    
    try {
      const response = await fetch(url, options);
      return await response.json();
    } catch (error) {
      console.warn('API call failed:', error);
      return this.getMockResponse(endpoint, method, data);
    }
  }

  getMockResponse(endpoint, method, data) {
    if (endpoint.includes('db-health')) {
      return { status: 'connected', timestamp: new Date().toISOString() };
    }
    if (endpoint.includes('players') && method === 'POST') {
      return { id: Date.now(), username: data?.username || 'Player' };
    }
    if (endpoint.includes('leaderboard')) {
      return [{ character_name: 'Demo Player', score: 500 }];
    }
    return { success: true };
  }

  async init() {
    try {
      await this.apiCall('/db-health');
      this.initialized = true;
      return true;
    } catch (error) {
      this.initialized = true;
      return true;
    }
  }

  async createPlayer(username) {
    const result = await this.apiCall('/players', 'POST', { username });
    if (result.id) {
      this.playerId = result.id;
      this.currentCharacter = result.id;
    }
    return result;
  }

  async saveCharacterData(data) {
    return await this.apiCall(`/characters/${this.currentCharacter}`, 'PUT', data);
  }

  async getLeaderboard(limit = 10) {
    return await this.apiCall(`/leaderboard?limit=${limit}`);
  }
}

window.neonDB = new NeonDBClient();
      this.initialized = false;
      return false;
    }
  }

  // Simplified methods for game integration
  async createPlayer(username) {
    try {
      const result = await this.apiCall('/players', 'POST', { 
        username: username || `Hero_${Date.now()}`,
        email: `${username}@portfolio.game` 
      });
      
      if (result.id) {
        this.playerId = result.id;
        console.log(`Player created/logged in: ${result.username} (ID: ${result.id})`);
      }
      
      return result;
    } catch (error) {
      console.warn('Player creation failed:', error);
      return { id: Date.now(), username }; // Fallback
    }
  }

  async createCharacter(characterData) {
    try {
      if (!this.playerId) {
        throw new Error('No player logged in');
      }
      
      const result = await this.apiCall('/characters', 'POST', {
        player_id: this.playerId,
        ...characterData
      });
      
      if (result.id) {
        this.currentCharacter = result.id;
        console.log(`Character created: ${result.name} (ID: ${result.id})`);
      }
      
      return result;
    } catch (error) {
      console.warn('Character creation failed:', error);
      return { id: Date.now() }; // Fallback
    }
  }

  async saveCharacterData(characterData) {
    if (!this.currentCharacter) return false;
    
    try {
      await this.apiCall(`/characters/${this.currentCharacter}`, 'PUT', characterData);
      return true;
    } catch (error) {
      console.warn('Character save failed:', error);
      return false;
    }
  }

  async getLeaderboard(limit = 10) {
    try {
      return await this.apiCall(`/leaderboard?limit=${limit}`);
    } catch (error) {
      console.warn('Leaderboard fetch failed:', error);
      return [];
    }
  }
}

// Global instance
window.neonDB = new NeonDBClient();
    this.autoSaveInterval = setInterval(async () => {
      if (!character) return;
      
      try {
        const saveData = {
          level: character.lvl || 1,
          experience: character.xp || 0,
          gold: character.gold || 50,
          current_hp: character.hp || 20,
          encounters_completed: gameState?.currentEncounter || 0
        };
        
        await this.saveCharacterData(saveData);
      } catch (error) {
        // Silent fail for auto-save
      }
    }, interval);
  }

  stopAutoSave() {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
      this.autoSaveInterval = null;
    }
  }
}

// Global instance
window.neonDB = new NeonDBClient();
  // Combat logging
  async logCombat(combatData) {
    if (!this.currentCharacter || !this.sessionId) return;
    
    return await this.apiCall('/combat-logs', 'POST', {
      character_id: this.currentCharacter,
      session_id: this.sessionId,
      ...combatData
    });
  }

  // Inventory management
  async saveInventory(items) {
    if (!this.currentCharacter) return;
    
    return await this.apiCall(`/characters/${this.currentCharacter}/inventory`, 'PUT', {
      items
    });
  }

  async addToInventory(item) {
    if (!this.currentCharacter) return;
    
    return await this.apiCall(`/characters/${this.currentCharacter}/inventory`, 'POST', item);
  }

  // Equipment management
  async saveEquipment(equipment) {
    if (!this.currentCharacter) return;
    
    return await this.apiCall(`/characters/${this.currentCharacter}/equipment`, 'PUT', equipment);
  }

  // Materials and crafting
  async saveMaterials(materials) {
    if (!this.currentCharacter) return;
    
    return await this.apiCall(`/characters/${this.currentCharacter}/materials`, 'PUT', {
      materials
    });
  }

  async logCrafting(recipe, itemCreated, materialsUsed) {
    if (!this.currentCharacter) return;
    
    return await this.apiCall('/crafted-items', 'POST', {
      character_id: this.currentCharacter,
      recipe_name: recipe,
      item_created: itemCreated,
      materials_used: materialsUsed
    });
  }

  // Gambling statistics
  async logGambling(gameType, betAmount, winnings, gameResult, details) {
    if (!this.currentCharacter) return;
    
    return await this.apiCall('/gambling-stats', 'POST', {
      character_id: this.currentCharacter,
      game_type: gameType,
      bet_amount: betAmount,
      winnings,
      game_result: gameResult,
      details
    });
  }

  // Achievements
  async unlockAchievement(achievementName, description, characterName) {
    if (!this.playerId) return;
    
    return await this.apiCall('/achievements', 'POST', {
      player_id: this.playerId,
      achievement_name: achievementName,
      achievement_description: description,
      character_name: characterName
    });
  }

  async getPlayerAchievements() {
    if (!this.playerId) return [];
    return await this.apiCall(`/players/${this.playerId}/achievements`);
  }

  // Leaderboard
  async getLeaderboard(limit = 10) {
    return await this.apiCall(`/leaderboard?limit=${limit}`);
  }

  async updateLeaderboard() {
    if (!this.currentCharacter) return;
    
    return await this.apiCall('/leaderboard', 'POST', {
      character_id: this.currentCharacter
    });
  }

  // Statistics and analytics
  async getGlobalStats() {
    return await this.apiCall('/stats/global');
  }

  async getPlayerAnalytics() {
    if (!this.playerId) return null;
    return await this.apiCall(`/players/${this.playerId}/analytics`);
  }

  // Auto-save functionality
  startAutoSave(character, interval = 30000) { // 30 seconds
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
    }

    this.autoSaveInterval = setInterval(async () => {
      try {
        await this.saveCharacter({
          level: character.lvl,
          experience: character.xp,
          gold: character.gold,
          max_hp: character.maxHP,
          current_hp: character.hp,
          armor_class: character.ac,
          strength: character.stats.str,
          dexterity: character.stats.dex,
          constitution: character.stats.con,
          intelligence: character.stats.int,
          wisdom: character.stats.wis,
          charisma: character.stats.cha,
          rage_uses: character.abilities.rage,
          spell_slots: character.abilities.spells,
          heal_uses: character.abilities.heals,
          sneak_uses: character.abilities.sneak,
          current_encounter: gameState.currentEncounter,
          encounters_completed: character.progress || 0,
          bosses_defeated: character.bossesDefeated || 0
        });

        await this.saveInventory(character.inv || []);
        await this.saveEquipment(character.equipped || {});
        await this.saveMaterials(character.materials || []);

        console.log('Auto-save completed');
      } catch (error) {
        console.warn('Auto-save failed:', error);
      }
    }, interval);
  }

  stopAutoSave() {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
      this.autoSaveInterval = null;
    }
  }
}

// Global database client instance
window.neonDB = new NeonDBClient();
