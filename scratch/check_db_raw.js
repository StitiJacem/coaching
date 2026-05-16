const { Client } = require('pg');
const dotenv = require('dotenv');
dotenv.config();

async function checkDb() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'coaching_db',
  });

  try {
    await client.connect();
    console.log('Connected to DB');

    const resRoles = await client.query('SELECT role, COUNT(*) FROM users GROUP BY role');
    console.log('User roles distribution:');
    console.table(resRoles.rows);

    const resCoaches = await client.query("SELECT id, username, first_name, last_name, role FROM users WHERE role = 'coach' LIMIT 5");
    console.log('Sample Coaches:');
    console.table(resCoaches.rows);

    const resProfiles = await client.query('SELECT COUNT(*) FROM coach_profiles');
    console.log(`Total coach profiles: ${resProfiles.rows[0].count}`);

    const resRequests = await client.query('SELECT status, COUNT(*) FROM coaching_requests GROUP BY status');
    console.log('Coaching requests:');
    console.table(resRequests.rows);

    await client.end();
  } catch (err) {
    console.error('Error:', err);
  }
}

checkDb();
