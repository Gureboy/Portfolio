const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod === 'POST') {
    try {
      const {
        player_id, name, class_name, level = 1, experience = 0, gold = 50,
        max_hp = 20, current_hp = 20, armor_class = 10, 
        strength = 10, dexterity = 10, constitution = 10, 
        intelligence = 10, wisdom = 10, charisma = 10
      } = JSON.parse(event.body);
      
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
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(result.rows[0])
      };
    } catch (error) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: error.message })
      };
    }
  }

  if (event.httpMethod === 'PUT') {
    try {
      const pathParts = event.path.split('/');
      const characterId = pathParts[pathParts.length - 1];
      const { 
        level, experience, gold, current_hp, encounters_completed 
      } = JSON.parse(event.body);
      
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
      `, [characterId, level, experience, gold, current_hp, encounters_completed]);
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(result.rows[0] || { success: true })
      };
    } catch (error) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: error.message })
      };
    }
  }

  return {
    statusCode: 405,
    headers,
    body: JSON.stringify({ error: 'Method not allowed' })
  };
};
