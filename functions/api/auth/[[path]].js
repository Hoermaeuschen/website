/**
 * Cloudflare Pages Function — GitHub OAuth proxy for Decap CMS
 *
 * Handles two routes:
 *   GET /api/auth           → redirects to GitHub OAuth login
 *   GET /api/auth/callback  → exchanges code for token, posts back to CMS
 *
 * Required environment variables (set in Cloudflare Pages → Settings → Environment variables):
 *   GITHUB_CLIENT_ID      — from your GitHub OAuth App
 *   GITHUB_CLIENT_SECRET  — from your GitHub OAuth App
 *
 * How to create the GitHub OAuth App:
 *   1. Go to github.com → Settings → Developer settings → OAuth Apps → New OAuth App
 *   2. Application name: HörMäuschen CMS
 *   3. Homepage URL: https://www.hoermaeuschen.ch
 *   4. Authorization callback URL: https://www.hoermaeuschen.ch/api/auth/callback
 *   5. Copy Client ID and Client Secret into Cloudflare Pages environment variables
 */

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const isCallback = url.pathname.endsWith('/callback');

  if (!env.GITHUB_CLIENT_ID || !env.GITHUB_CLIENT_SECRET) {
    return new Response(
      'OAuth nicht konfiguriert. Bitte GITHUB_CLIENT_ID und GITHUB_CLIENT_SECRET ' +
      'in den Cloudflare Pages Umgebungsvariablen setzen.',
      { status: 500 }
    );
  }

  // ── Step 1: Start — redirect to GitHub login ─────────────────────────────
  if (!isCallback) {
    const params = new URLSearchParams({
      client_id: env.GITHUB_CLIENT_ID,
      scope: 'repo,user',
    });
    return Response.redirect(
      `https://github.com/login/oauth/authorize?${params}`,
      302
    );
  }

  // ── Step 2: Callback — exchange code for access token ────────────────────
  const code = url.searchParams.get('code');
  if (!code) {
    return new Response('Fehlender OAuth-Code.', { status: 400 });
  }

  const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      client_id: env.GITHUB_CLIENT_ID,
      client_secret: env.GITHUB_CLIENT_SECRET,
      code,
    }),
  });

  const tokenData = await tokenRes.json();

  if (!tokenData.access_token) {
    const errMsg = tokenData.error_description || tokenData.error || 'Unbekannter Fehler';
    return new Response(`GitHub OAuth Fehler: ${errMsg}`, { status: 400 });
  }

  // ── Step 3: Post token back to Decap CMS via window.postMessage ──────────
  const token = JSON.stringify(tokenData.access_token);
  const html = `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="utf-8" />
  <title>Authentifizierung erfolgreich</title>
</head>
<body>
  <p>Authentifizierung erfolgreich – dieses Fenster schliesst sich automatisch.</p>
  <script>
    (function () {
      var token = ${token};
      var msg = 'authorization:github:success:' + JSON.stringify({ token: token, provider: 'github' });
      function onMessage(e) {
        window.opener.postMessage(msg, e.origin);
      }
      window.addEventListener('message', onMessage, false);
      window.opener.postMessage('authorizing:github', '*');
    })();
  <\/script>
</body>
</html>`;

  return new Response(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}
