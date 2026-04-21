/**
 * GET /api/auth
 * Step 1 of GitHub OAuth — redirects to GitHub login page.
 *
 * Requires environment variables set in Cloudflare Pages → Settings → Environment variables:
 *   GITHUB_CLIENT_ID
 *   GITHUB_CLIENT_SECRET
 */
export async function onRequestGet(context) {
  const { env } = context;

  if (!env.GITHUB_CLIENT_ID) {
    return new Response('GITHUB_CLIENT_ID is not configured.', { status: 500 });
  }

  const params = new URLSearchParams({
    client_id: env.GITHUB_CLIENT_ID,
    scope: 'repo,user',
  });

  return Response.redirect(
    `https://github.com/login/oauth/authorize?${params}`,
    302
  );
}
