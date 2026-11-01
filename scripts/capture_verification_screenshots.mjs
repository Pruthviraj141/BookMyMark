import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';

const ARTIFACT_DIR = '/home/pruthvi/.gemini/antigravity-ide/brain/f0c0ae55-ea1c-4276-b424-a6721eb5be0c';

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function run() {
  console.log('Launching headless Chrome for CDP screenshots...');
  const chromeProc = spawn('google-chrome', [
    '--headless',
    '--no-sandbox',
    '--disable-gpu',
    '--remote-debugging-port=9222',
    'http://127.0.0.1:4173'
  ]);

  await sleep(2000);

  const listRes = await fetch('http://127.0.0.1:9222/json/list');
  const listData = await listRes.json();
  const pageWs = listData[0]?.webSocketDebuggerUrl;

  const ws = new WebSocket(pageWs);
  let id = 1;
  const pending = new Map();

  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.id && pending.has(msg.id)) {
      pending.get(msg.id)(msg);
      pending.delete(msg.id);
    }
  };

  await new Promise((resolve) => {
    ws.onopen = resolve;
  });

  function send(method, params = {}) {
    return new Promise((resolve) => {
      const msgId = id++;
      pending.set(msgId, resolve);
      ws.send(JSON.stringify({ id: msgId, method, params }));
    });
  }

  // 1. Setup mobile viewport (iPhone 14 / Pixel: 390x844, scale 2)
  await send('Emulation.setDeviceMetricsOverride', {
    width: 390,
    height: 844,
    deviceScaleFactor: 2,
    mobile: true
  });

  await sleep(1500);

  // 2. Dark Mode Login
  await send('Runtime.evaluate', {
    expression: `
      localStorage.setItem('savr_app_theme', 'dark');
      document.documentElement.classList.remove('light');
      document.documentElement.classList.add('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
    `
  });
  await sleep(500);

  let darkLoginShot = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(
    path.join(ARTIFACT_DIR, 'screenshot_login_dark.png'),
    Buffer.from(darkLoginShot.result.data, 'base64')
  );
  console.log('✓ screenshot_login_dark.png saved');

  // 3. Light Mode Login
  await send('Runtime.evaluate', {
    expression: `
      localStorage.setItem('savr_app_theme', 'light');
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
      document.documentElement.setAttribute('data-theme', 'light');
    `
  });
  await sleep(500);

  let lightLoginShot = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(
    path.join(ARTIFACT_DIR, 'screenshot_login_light.png'),
    Buffer.from(lightLoginShot.result.data, 'base64')
  );
  console.log('✓ screenshot_login_light.png saved');

  // 4. Authenticated Home Header Screen
  const mockSession = {
    access_token: 'mock-token',
    token_type: 'bearer',
    expires_in: 3600,
    refresh_token: 'mock-refresh',
    user: {
      id: 'mock-user-123',
      aud: 'authenticated',
      role: 'authenticated',
      email: 'alex@bookmymark.app',
      user_metadata: { full_name: 'Alex Rivera' }
    }
  };

  await send('Runtime.evaluate', {
    expression: `
      localStorage.setItem('sb-ycaenlslaoiqnyopmytx-auth-token', JSON.stringify(${JSON.stringify(mockSession)}));
      localStorage.setItem('savr_auth_token', 'mock-token');
      localStorage.setItem('savr_app_theme', 'dark');
      location.reload();
    `
  });

  await sleep(2000);

  await send('Runtime.evaluate', {
    expression: `
      document.documentElement.classList.remove('light');
      document.documentElement.classList.add('dark');
    `
  });
  await sleep(600);

  let homeShot = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(
    path.join(ARTIFACT_DIR, 'screenshot_home_header.png'),
    Buffer.from(homeShot.result.data, 'base64')
  );
  console.log('✓ screenshot_home_header.png saved');

  ws.close();
  chromeProc.kill();
  console.log('All verification screenshots captured!');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
