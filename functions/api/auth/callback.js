/**
 * GET /api/auth/callback
 * Step 2 of GitHub OAuth — exchanges the code for a token and posts it back to Decap CMS.
 */
export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const code = url.searchParams.get('code');

  if (!code) {
    return new Response('Missing OAuth code.', { status: 400 });
  }

  if (!env.GITHUB_CLIENT_ID || !env.GITHUB_CLIENT_SECRET) {
    return new Response('OAuth credentials are not configured.', { status: 500 });
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
    const err = tokenData.error_description || tokenData.error || 'Unknown error';
    return new Response(`GitHub OAuth error: ${err}`, { status: 400 });
  }

  const token = JSON.stringify(tokenData.access_token);
  const html = `<!DOCTYPE html>
<html lang="de">
<head><meta charset="utf-8"><title>Authentifizierung erfolgreich</title></head>
<body>
<p>Authentifizierung erfolgreich – dieses Fenster schliesst sich automatisch.</p>
<script>
(function () {
  var token = ${token};
  var msg = 'authorization:github:success:' + JSON.stringify({ token: token, provider: 'github' });
  function onMessage(e) { window.opener.postMessage(msg, e.origin); }
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
