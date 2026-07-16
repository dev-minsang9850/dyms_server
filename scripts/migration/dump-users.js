const { Client } = require('pg');
const fs = require('fs');

// Read .env manually
const envRaw = fs.readFileSync('.env', 'utf-8');
const env = {};
envRaw.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    let key = match[1].trim();
    let val = match[2].trim();
    if (val.startsWith('"') && val.endsWith('"')) {
      val = val.slice(1, -1);
    }
    env[key] = val;
  }
});

async function dumpUsers() {
  const client = new Client({
    host: env.DB_HOST,
    port: env.DB_PORT,
    user: env.DB_USERNAME,
    password: env.DB_PASSWORD,
    database: env.DB_DATABASE,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Connected to Supabase DB');
    
    const usersRes = await client.query('SELECT * FROM users');
    const users = usersRes.rows;
    
    fs.writeFileSync('./scripts/migration/users-dump.json', JSON.stringify(users, null, 2));
    console.log(`Successfully dumped ${users.length} users to scripts/migration/users-dump.json`);
    
  } catch (error) {
    console.error('Error dumping users:', error);
  } finally {
    await client.end();
  }
}

dumpUsers();
