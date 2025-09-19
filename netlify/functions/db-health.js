const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      status: 'connected',
      timestamp: new Date().toISOString(),
      database: 'demo',
      message: 'D&D Game Backend Ready!'
    })
  };
};
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ status: 'error', error: error.message })
    };
  }
};
};
