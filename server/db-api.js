// Simple Express server for development testing

const express = require('express');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Mock database responses for development
let mockData = {
  players: [],
  characters: [],
  leaderboard: [
    { character_name: 'Aragorn', character_class: 'Bárbaro', final_level: 8, score: 1250 },
    { character_name: 'Gandalf', character_class: 'Mago', final_level: 7, score: 1100 },
    { character_name: 'Legolas', character_class: 'Pícaro', final_level: 6, score: 950 }
  ]
};

// Health check
app.get('/api/db/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Players
app.post('/api/db/players', (req, res) => {
  const player = {
    id: Date.now(),
    username: req.body.username,
    created_at: new Date().toISOString()
  };
  mockData.players.push(player);
  res.json(player);
});

// Characters
app.post('/api/db/characters', (req, res) => {
  const character = {
    id: Date.now(),
    ...req.body,
    created_at: new Date().toISOString()
  };
  mockData.characters.push(character);
  res.json(character);
});

app.put('/api/db/characters/:id', (req, res) => {
  res.json({ success: true, updated_at: new Date().toISOString() });
});

// Leaderboard
app.get('/api/db/leaderboard', (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  res.json(mockData.leaderboard.slice(0, limit));
});

// Combat logs
app.post('/api/db/combat-logs', (req, res) => {
  res.json({ id: Date.now(), success: true });
});

// Gambling stats
app.post('/api/db/gambling-stats', (req, res) => {
  res.json({ id: Date.now(), success: true });
});

// Game sessions
app.post('/api/db/game-sessions', (req, res) => {
  res.json({ id: Date.now(), success: true });
});

console.log(`🎮 D&D Database API running on http://localhost:${port}`);
console.log('📊 Mock data loaded for development');

app.listen(port);
    const result = await pool.query(
      'SELECT * FROM top_characters LIMIT $1',
      [limit]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Combat logs endpoint
app.post('/api/db/combat-logs', async (req, res) => {
  try {
    const result = await pool.query(
      `INSERT INTO combat_logs (
        character_id, session_id, encounter_number, monster_name, monster_level,
        player_damage_dealt, combat_result, combat_duration
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id`,
      [
        req.body.character_id, req.body.session_id, req.body.encounter_number,
        req.body.monster_name, req.body.monster_level, req.body.player_damage_dealt,
        req.body.combat_result, req.body.combat_duration
      ]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Global stats endpoint
app.get('/api/db/stats/global', async (req, res) => {
  try {
    const stats = await pool.query(`
      SELECT 
        COUNT(DISTINCT p.id) as total_players,
        COUNT(DISTINCT c.id) as total_characters,
        COALESCE(SUM(c.encounters_completed), 0) as total_encounters,
        COALESCE(SUM(c.bosses_defeated), 0) as total_bosses,
        COALESCE(MAX(c.level), 0) as highest_level,
        COUNT(DISTINCT s.id) as total_sessions
      FROM players p
      LEFT JOIN characters c ON p.id = c.player_id
      LEFT JOIN game_sessions s ON c.id = s.character_id
    `);
    res.json(stats.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`D&D Database API running on port ${port}`);
});
