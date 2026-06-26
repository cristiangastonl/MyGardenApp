// Promote versionCode 15 (2.0.2) to the Play PRODUCTION track at 100% rollout.
// Uses pc-api-key.json. Flow: token -> create edit -> patch production track
// -> validate -> commit. PUBLIC + IRREVERSIBLE on commit.
import crypto from 'node:crypto';
import { readFileSync } from 'node:fs';

const PKG = 'app.mygardencare.app';
const VERSION_CODE = 15;
const sa = JSON.parse(readFileSync(new URL('../pc-api-key.json', import.meta.url)));

const b64url = (buf) =>
  Buffer.from(buf).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

async function getToken() {
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claim = b64url(JSON.stringify({
    iss: sa.client_email,
    scope: 'https://www.googleapis.com/auth/androidpublisher',
    aud: sa.token_uri,
    iat: now,
    exp: now + 3600,
  }));
  const signingInput = `${header}.${claim}`;
  const signer = crypto.createSign('RSA-SHA256');
  signer.update(signingInput);
  const jwt = `${signingInput}.${b64url(signer.sign(sa.private_key))}`;
  const res = await fetch(sa.token_uri, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error('Token error: ' + JSON.stringify(json));
  return json.access_token;
}

async function req(token, method, path, body) {
  const res = await fetch(
    `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${PKG}${path}`,
    {
      method,
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    }
  );
  const text = await res.text();
  let json;
  try { json = text ? JSON.parse(text) : {}; } catch { json = { raw: text }; }
  if (!res.ok) throw new Error(`${method} ${path} -> ${res.status}: ${JSON.stringify(json)}`);
  return json;
}

async function main() {
  const token = await getToken();

  // 1. Create edit
  const edit = await req(token, 'POST', '/edits');
  const editId = edit.id;
  console.log('Edit creado:', editId);

  let committed = false;
  try {
    // 2. Patch production track with a completed (100%) release of vc13
    const trackBody = {
      track: 'production',
      releases: [
        {
          name: '2.0.2',
          versionCodes: [String(VERSION_CODE)],
          status: 'completed', // 100% full rollout
          // No countryTargeting: rejected on `completed` releases. Production track
          // already has worldwide targeting established from the vc13 release; a
          // completed release inherits it.
          releaseNotes: [
            {
              language: 'en-US',
              text: "Bug fixes and improvements:\n• Fixed the annual subscription purchase\n• Photos picked from the gallery now preview correctly\n• Smoother experience when adding a plant\n• Pet-toxic plants now show how to keep them safely out of reach",
            },
          ],
        },
      ],
    };
    const patched = await req(token, 'PUT', `/edits/${editId}/tracks/production`, trackBody);
    console.log('Track production seteado:', JSON.stringify(patched.releases?.map(r => ({ status: r.status, vc: r.versionCodes })), null, 2));

    // 3. Validate before commit
    await req(token, 'POST', `/edits/${editId}:validate`);
    console.log('Validate OK ✓');

    // 4. Commit -> PUBLISH
    await req(token, 'POST', `/edits/${editId}:commit`);
    committed = true;
    console.log('\n✅ COMMIT OK — vc13 (2.0.0) promovido a PRODUCCION al 100%. En revision de Google.');
  } finally {
    if (!committed) {
      // Abandon the edit so nothing partial lingers
      try { await req(token, 'DELETE', `/edits/${editId}`); console.log('Edit abandonado (no se publico nada).'); } catch {}
    }
  }
}

main().catch((e) => { console.error('❌ FALLO:', e.message); process.exit(1); });
