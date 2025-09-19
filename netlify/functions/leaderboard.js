const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod === 'GET') {
    try {
      const queryParams = event.queryStringParameters || {};
      const limit = parseInt(queryParams.limit) || 10;
      
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
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(result.rows)
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
