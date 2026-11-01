import { createApp } from '../src/app.js';
import { getDb } from '../src/database/connection.js';

getDb();
const app = createApp();

async function run() {
  console.log('--- Registering Test User ---');
  const regRes = await app.request('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'real_tester_' + Date.now(), password: 'password123' })
  });
  const { data: { token, user } } = await regRes.json();
  console.log('User registered:', user.id);

  const realLinks = [
    {
      name: 'YouTube Video',
      url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      sharedText: 'Rick Astley - Never Gonna Give You Up (Official Music Video)'
    },
    {
      name: 'X Post',
      url: 'https://x.com/karpathy/status/1759265005878239459',
      sharedText: 'Andrej Karpathy on AI and neural networks'
    },
    {
      name: 'Instagram Reel',
      url: 'https://www.instagram.com/reel/C321_example_reel/',
      sharedText: 'Awesome workout and fitness tips reel from Instagram #fitness #workout'
    }
  ];

  for (const item of realLinks) {
    console.log('\n--- Testing ' + item.name + ' ---');
    const postRes = await app.request('/api/bookmarks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + token
      },
      body: JSON.stringify({ url: item.url, sharedText: item.sharedText })
    });
    const postBody = await postRes.json();
    console.log('POST status:', postRes.status, 'ID:', postBody.data?.id, 'Platform:', postBody.data?.platform);

    // Wait 5 seconds for async metadata & AI processing
    console.log('Waiting for background metadata & Groq AI processing...');
    await new Promise(r => setTimeout(r, 6000));

    const getRes = await app.request('/api/bookmarks/' + postBody.data.id, {
      method: 'GET',
      headers: { Authorization: 'Bearer ' + token }
    });
    const getBody = await getRes.json();
    console.log('Result for ' + item.name + ':');
    console.log('  Title:', getBody.data?.title);
    console.log('  Thumbnail:', getBody.data?.thumbnail_url);
    console.log('  AI Status:', getBody.data?.ai_status);
    console.log('  Category:', getBody.data?.category);
    console.log('  Tags:', getBody.data?.tags);
    console.log('  Summary:', getBody.data?.summary);
  }
}

run().catch(console.error);
