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

async function restoreUsers() {
  const client = new Client({
    host: env.DB_HOST,
    port: env.DB_PORT,
    user: env.DB_USERNAME,
    password: env.DB_PASSWORD,
    database: env.DB_DATABASE,
  });

  try {
    await client.connect();
    console.log('Connected to Local DB for restore');
    
    // Read the dumped data
    const usersData = fs.readFileSync('./scripts/migration/users-dump.json', 'utf-8');
    const users = JSON.parse(usersData);
    
    if (users.length === 0) {
      console.log('No users to restore.');
      return;
    }
    
    console.log(`Found ${users.length} users in dump. Starting restore...`);
    
    let successCount = 0;
    
    for (const user of users) {
      try {
        const columns = Object.keys(user).map(col => `"${col}"`).join(', ');
        const values = Object.values(user);
        const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
        
        const query = `INSERT INTO users (${columns}) VALUES (${placeholders}) ON CONFLICT ("id") DO NOTHING`;
        
        await client.query(query, values);
        successCount++;
        console.log(`Restored user: ${user.email}`);
      } catch (err) {
        console.error(`Failed to restore user ${user.email}:`, err.message);
      }
    }
    
    console.log(`Restore complete! Successfully inserted ${successCount} out of ${users.length} users.`);
    
  } catch (error) {
    console.error('Error during restore:', error);
  } finally {
    await client.end();
  }
}

restoreUsers();
