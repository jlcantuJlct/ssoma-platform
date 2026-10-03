const html = '<br><br><p><a href="#">✅</a></p>';
fetch('http://localhost:3002/api/send-email', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ to: ['test@test.com'], subject: 'test', html, text: 'test' }) })
.then(r => r.json())
.then(console.log)
.catch(console.error);
