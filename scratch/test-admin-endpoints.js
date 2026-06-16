const axios = require('axios');
const { getAdminToken } = require('./helper');

async function test() {
  console.log('Logging in...');
  const token = await getAdminToken();
  console.log('Token obtained:', token.substring(0, 20) + '...');
  
  const client = axios.create({
    baseURL: 'http://localhost:3000',
    headers: { Authorization: `Bearer ${token}` }
  });

  // Let's list workspaces first
  console.log('\nFetching workspaces...');
  const wsRes = await client.get('/workspaces/all');
  console.log('Workspaces:', wsRes.data.map(w => ({ id: w.id, name: w.name })));
  
  // Let's list users
  console.log('\nFetching users...');
  const usersRes = await client.get('/users');
  console.log('Users:', usersRes.data.map(u => ({ id: u.id, email: u.email, position: u.position })));

  const targetUser = usersRes.data.find(u => u.email === 'dlalstkd1200@gmail.com');
  if (targetUser) {
    console.log(`\nTesting position change for ${targetUser.email} to 'deputy'...`);
    try {
      const posRes = await client.patch(`/users/${targetUser.id}/position`, { position: 'deputy' });
      console.log('Position update response:', posRes.status, posRes.data);
    } catch (e) {
      console.error('Position update failed:', e.response?.status, e.response?.data || e.message);
    }
  }

  // Find a workspace to delete (e.g. DY@학생)
  const targetWorkspace = wsRes.data.find(w => w.name === 'DY@학생');
  if (targetWorkspace) {
    console.log(`\nTesting workspace deletion for ${targetWorkspace.name}...`);
    try {
      const delWsRes = await client.delete(`/workspaces/${targetWorkspace.id}`);
      console.log('Workspace deletion response:', delWsRes.status, delWsRes.data);
    } catch (e) {
      console.error('Workspace deletion failed:', e.response?.status, e.response?.data || e.message);
    }
  }
}

test().catch(console.error);
