const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000;

// Configuración de Neon Database
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'TU_NEON_CONNECTION_STRING_AQUI',
  ssl: { rejectUnauthorized: false }
});

app.use(cors());
app.use(express.json());

// Health check
app.get('/api/db/health', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ 
      status: 'connected', 
      timestamp: result.rows[0].now,
      database: 'neon' 
    });
  } catch (error) {
    res.status(500).json({ status: 'error', error: error.message });
  }
});

// Crear o login player
app.post('/api/db/players', async (req, res) => {
  try {
    const { username, email } = req.body;
    
    // Intentar insertar nuevo player o actualizar existente
    const result = await pool.query(`
      INSERT INTO players (username, email) 
      VALUES ($1, $2) 
      ON CONFLICT (username) 
      DO UPDATE SET last_login = CURRENT_TIMESTAMP 
      RETURNING id, username, created_at
    `, [username, email]);
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error creating player:', error);
    res.status(500).json({ error: error.message });
  }
});

// Crear character
app.post('/api/db/characters', async (req, res) => {
  try {
    const {
      player_id, name, class_name, level, experience, gold,
      max_hp, current_hp, armor_class, strength, dexterity,
      constitution, intelligence, wisdom, charisma
    } = req.body;
    
    const result = await pool.query(`
      INSERT INTO characters (
        player_id, name, class_name, level, experience, gold,
        max_hp, current_hp, armor_class, strength, dexterity,
        constitution, intelligence, wisdom, charisma
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING id, name, class_name
    `, [
      player_id, name, class_name, level, experience, gold,
      max_hp, current_hp, armor_class, strength, dexterity,
      constitution, intelligence, wisdom, charisma
    ]);
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error creating character:', error);
    res.status(500).json({ error: error.message });
  }
});

// Actualizar character
app.put('/api/db/characters/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      level, experience, gold, current_hp, encounters_completed
    } = req.body;
    
    const result = await pool.query(`
      UPDATE characters 
      SET level = COALESCE($2, level),
          experience = COALESCE($3, experience),
          gold = COALESCE($4, gold),
          current_hp = COALESCE($5, current_hp),
          encounters_completed = COALESCE($6, encounters_completed),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING id, name, level
    `, [id, level, experience, gold, current_hp, encounters_completed]);
    
    res.json(result.rows[0] || { success: true });
  } catch (error) {
    console.error('Error updating character:', error);
    res.status(500).json({ error: error.message });
  }
});

// Leaderboard
app.get('/api/db/leaderboard', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    
    const result = await pool.query(`
      SELECT 
        c.name as character_name,
        c.class_name,
        c.level as final_level,
        c.experience,
        c.encounters_completed,
        c.gold,
        (c.level * 100 + c.encounters_completed * 10 + c.gold) as score,
        c.updated_at
      FROM characters c
      WHERE c.level > 1
      ORDER BY score DESC, c.level DESC, c.experience DESC
      LIMIT $1
    `, [limit]);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ error: error.message });
  }
});

// Combat logs
app.post('/api/db/combat-logs', async (req, res) => {
  try {
    const {
      character_id, encounter_number, monster_name,
      combat_result, experience_gained, gold_gained
    } = req.body;
    
    const result = await pool.query(`
      INSERT INTO combat_logs (
        character_id, encounter_number, monster_name,
        combat_result, player_damage_dealt, timestamp
      ) VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
      RETURNING id
    `, [
      character_id, encounter_number, monster_name,
      combat_result, (experience_gained || 0) + (gold_gained || 0)
    ]);
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error logging combat:', error);
    res.status(500).json({ error: error.message });
  }
});

// Game sessions
app.post('/api/db/game-sessions', async (req, res) => {
  try {
    const {
      character_id, session_outcome, final_level,
      final_encounter, experience_gained, gold_gained
    } = req.body;
    
    const result = await pool.query(`
      INSERT INTO game_sessions (
        character_id, session_outcome, final_level,
        final_encounter, experience_gained, gold_gained,
        session_start, session_end
      ) VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING id
    `, [
      character_id, session_outcome, final_level,
      final_encounter, experience_gained, gold_gained
    ]);
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error creating game session:', error);
    res.status(500).json({ error: error.message });
  }
});

// Gambling stats
app.post('/api/db/gambling-stats', async (req, res) => {
  try {
    const {
      character_id, game_type, bet_amount,
      winnings, game_result, details
    } = req.body;
    
    const result = await pool.query(`
      INSERT INTO gambling_stats (
        character_id, game_type, bet_amount,
        winnings, game_result, details, played_at
      ) VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
      RETURNING id
    `, [
      character_id, game_type, bet_amount,
      winnings, game_result, JSON.stringify(details)
    ]);
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error logging gambling:', error);
    res.status(500).json({ error: error.message });
  }
});

// Estadísticas globales
app.get('/api/db/stats/global', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        COUNT(DISTINCT p.id) as total_players,
        COUNT(DISTINCT c.id) as total_characters,
        COALESCE(SUM(c.encounters_completed), 0) as total_encounters,
        COALESCE(MAX(c.level), 0) as highest_level,
        COALESCE(AVG(c.level), 0) as average_level
      FROM players p
      LEFT JOIN characters c ON p.id = c.player_id
    `);
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching global stats:', error);
    res.status(500).json({ error: error.message });
  }
});

console.log(`🎮 Neon D&D API running on http://localhost:${port}`);
console.log(`🐘 Connected to Neon Database`);

app.listen(port);
