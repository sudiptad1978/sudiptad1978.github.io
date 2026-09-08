const PRODUCTION_HOSTS = new Set([
  'sudipta-dutta-portfolio.pages.dev'
]);

const VISIT_COOKIE = 'sd_portfolio_visit';
const VISIT_WINDOW_SECONDS = 60 * 60 * 24;

function json(data, init = {}) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      'content-type': 'application/json; charset=UTF-8',
      'cache-control': 'no-store, no-cache, must-revalidate',
      pragma: 'no-cache',
      ...init.headers
    }
  });
}

function hasRecentVisit(request) {
  const cookieHeader = request.headers.get('Cookie') || '';
  return cookieHeader.split(';').some((part) => part.trim().startsWith(`${VISIT_COOKIE}=`));
}

export async function onRequestPost({ request, env }) {
  const hostname = new URL(request.url).hostname;

  // Preview deployments must not change the production total.
  if (!PRODUCTION_HOSTS.has(hostname)) {
    return json({ total: null, counted: false });
  }

  const recentVisit = hasRecentVisit(request);
  let row;

  if (recentVisit) {
    row = await env.VISITOR_COUNTER_DB
      .prepare('SELECT total FROM site_counter WHERE id = 1')
      .first();
  } else {
    row = await env.VISITOR_COUNTER_DB
      .prepare('UPDATE site_counter SET total = total + 1 WHERE id = 1 RETURNING total')
      .first();
  }

  if (!row) return json({ error: 'Counter unavailable' }, { status: 503 });

  const headers = {
    'vary': 'Cookie'
  };

  if (!recentVisit) {
    headers['set-cookie'] = `${VISIT_COOKIE}=1; Max-Age=${VISIT_WINDOW_SECONDS}; Path=/; Secure; HttpOnly; SameSite=Lax`;
  }

  return json({ total: Number(row.total), counted: !recentVisit }, { headers });
}

export async function onRequestGet({ request, env }) {
  const hostname = new URL(request.url).hostname;
  if (!PRODUCTION_HOSTS.has(hostname)) return json({ total: null, counted: false });

  const row = await env.VISITOR_COUNTER_DB
    .prepare('SELECT total FROM site_counter WHERE id = 1')
    .first();

  if (!row) return json({ error: 'Counter unavailable' }, { status: 503 });
  return json({ total: Number(row.total), counted: false });
}
