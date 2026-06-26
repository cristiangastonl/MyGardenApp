// One-off: query Google Play track state for app.mygardencare.app using the
// pc-api-key.json service account. Read-only (creates a throwaway edit, lists
// tracks, then abandons the edit). Not committed to release flow.
import crypto from 'node:crypto';
import { readFileSync } from 'node:fs';

const PKG = 'app.mygardencare.app';
const sa = JSON.parse(readFileSync(new URL('../pc-api-key.json', import.meta.url)));

function b64url(buf) {
  return Buffer.from(buf).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

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
  const signature = b64url(signer.sign(sa.private_key));
  const jwt = `${signingInput}.${signature}`;

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

async function main() {
  const token = await getToken();
  const auth = { Authorization: `Bearer ${token}` };
  const base = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${PKG}`;

  // Create a throwaway edit
  const editRes = await fetch(`${base}/edits`, { method: 'POST', headers: auth });
  const edit = await editRes.json();
  if (!editRes.ok) throw new Error('Edit error: ' + JSON.stringify(edit));
  const editId = edit.id;

  try {
    const tracksRes = await fetch(`${base}/edits/${editId}/tracks`, { headers: auth });
    const tracks = await tracksRes.json();
    if (!tracksRes.ok) throw new Error('Tracks error: ' + JSON.stringify(tracks));

    console.log('=== Play tracks for', PKG, '===');
    for (const t of tracks.tracks || []) {
      console.log(`\nTrack: ${t.track}`);
      for (const r of t.releases || []) {
        const codes = (r.versionCodes || []).join(', ');
        console.log(`  - status=${r.status} name="${r.name || ''}" versionCodes=[${codes}] userFraction=${r.userFraction ?? '-'}`);
      }
    }
  } finally {
    // Abandon the edit so we never commit anything
    await fetch(`${base}/edits/${editId}`, { method: 'DELETE', headers: auth });
  }
}

main().catch((e) => { console.error('FAILED:', e.message); process.exit(1); });
