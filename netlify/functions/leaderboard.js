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

  const mockData = [
    {
      character_name: "DragonSlayer_Pro",
      class_name: "Bárbaro",
      final_level: 18,
      score: 4200
    },
    {
      character_name: "MysticWizard_X",
      class_name: "Mago",
      final_level: 15,
      score: 3100
    }
  ];

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify(mockData)
  };
};
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
