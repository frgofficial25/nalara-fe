const fetch = require('node-fetch');

async function test() {
  const res = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'student@example.com', password: 'password123' }) // We don't have valid creds but we can see the response structure if it fails or if there's a default one
  });
  const data = await res.json();
  console.log(JSON.stringify(data, null, 2));
}
test();
