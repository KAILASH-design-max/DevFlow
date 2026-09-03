async function run() {
  try {
    const loginRes = await fetch('http://127.0.0.1:4000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'alice@devflow.io', password: 'password123' })
    });
    const loginData = await loginRes.json();
    const token = loginData.data.accessToken;
    console.log('Logged in successfully, token:', token.substring(0, 20) + '...');

    const wsRes = await fetch('http://127.0.0.1:4000/api/workspaces', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const wsData = await wsRes.json();
    const ws = wsData.data[0];
    console.log('Workspace members count (array length):', ws.members ? ws.members.length : 'undefined');
    if (ws.members) {
      console.log('First member:', JSON.stringify(ws.members[0], null, 2));
    }

    const detailRes = await fetch(`http://127.0.0.1:4000/api/workspaces/${ws.id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const detailData = await detailRes.json();
    console.log('Detail members count:', detailData.data.members ? detailData.data.members.length : 'undefined');

    const invRes = await fetch(`http://127.0.0.1:4000/api/workspaces/${ws.id}/invites`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (invRes.ok) {
      const invData = await invRes.json();
      console.log('Invites:', invData.data.length);
    } else {
      console.error('Invites error:', invRes.status, await invRes.text());
    }
  } catch (err) {
    console.error('Error:', err.message);
  }
}
run();
