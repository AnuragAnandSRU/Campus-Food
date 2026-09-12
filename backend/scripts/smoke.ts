/**
 * No-database smoke test for auth wiring.
 * Boots the Express app (no Mongo, no sockets) and checks that validation,
 * the auth guard, and 404 handling behave correctly. Run: npm run smoke
 */
import app from '../src/app';

const PORT = 5099;
const base = `http://127.0.0.1:${PORT}`;
let failures = 0;

const json = { 'Content-Type': 'application/json' };

function check(name: string, ok: boolean, detail?: string): void {
  if (ok) {
    console.log(`  \x1b[32m✓\x1b[0m ${name}`);
  } else {
    console.log(`  \x1b[31m✗\x1b[0m ${name}${detail ? ` — ${detail}` : ''}`);
    failures++;
  }
}

async function run(): Promise<void> {
  let r = await fetch(`${base}/health`);
  check('GET /health → 200', r.status === 200, `got ${r.status}`);

  r = await fetch(`${base}/api/does-not-exist`);
  check('unknown route → 404', r.status === 404, `got ${r.status}`);

  r = await fetch(`${base}/api/auth/register`, {
    method: 'POST',
    headers: json,
    body: JSON.stringify({ email: 'not-an-email', password: '123' }),
  });
  check('POST /auth/register (invalid) → 400', r.status === 400, `got ${r.status}`);

  r = await fetch(`${base}/api/auth/login`, {
    method: 'POST',
    headers: json,
    body: JSON.stringify({}),
  });
  check('POST /auth/login (empty) → 400', r.status === 400, `got ${r.status}`);

  r = await fetch(`${base}/api/auth/me`);
  check('GET /auth/me (no token) → 401', r.status === 401, `got ${r.status}`);

  r = await fetch(`${base}/api/auth/reset-password`, {
    method: 'POST',
    headers: json,
    body: JSON.stringify({}),
  });
  check('POST /auth/reset-password (empty) → 400', r.status === 400, `got ${r.status}`);
}

console.log('\n🔍 Auth wiring smoke test (no database)\n');
const server = app.listen(PORT, async () => {
  try {
    await run();
  } catch (err) {
    console.error('Smoke test crashed:', err);
    failures++;
  } finally {
    server.close();
    console.log(
      failures === 0
        ? '\n\x1b[32m✅ All smoke checks passed\x1b[0m\n'
        : `\n\x1b[31m❌ ${failures} check(s) failed\x1b[0m\n`
    );
    process.exit(failures === 0 ? 0 : 1);
  }
});
