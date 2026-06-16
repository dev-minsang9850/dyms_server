const axios = require('axios');
const { getAdminToken } = require('./helper');

async function test() {
  try {
    console.log("Logging in as admin...");
    const token = await getAdminToken();
    console.log("Login successful. Token acquired.");

    console.log("Fetching workspaces list...");
    const wsRes = await axios.get('http://localhost:3000/workspaces/all', {
      headers: { Authorization: `Bearer ${token}` }
    });

    const workspaces = wsRes.data;
    console.log(`Found ${workspaces.length} workspaces:`);
    workspaces.forEach(ws => console.log(` - ${ws.name} (id: ${ws.id}, owner: ${ws.ownerEmail})`));

    // Find a duplicate workspace (let's say we have multiple DY@Club workspaces)
    // We want to delete one of them to verify
    const toDelete = workspaces.find(ws => ws.name === 'DY@Club');
    if (!toDelete) {
      console.log("No DY@Club workspace found to delete.");
      return;
    }

    console.log(`Attempting to delete workspace: ${toDelete.name} (id: ${toDelete.id})`);
    const delRes = await axios.delete(`http://localhost:3000/workspaces/${toDelete.id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log("Delete response:", delRes.data);

  } catch (e) {
    console.error("Error occurred:", e.response ? {
      status: e.response.status,
      data: e.response.data
    } : e.message);
  }
}

test();
