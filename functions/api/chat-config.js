function json(data, init = {}) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      'content-type': 'application/json; charset=UTF-8',
      'cache-control': 'no-store, no-cache, must-revalidate',
      'x-content-type-options': 'nosniff',
      ...init.headers
    }
  });
}

export function onRequestGet({ env }) {
  const siteKey = typeof env.TURNSTILE_SITE_KEY === 'string' ? env.TURNSTILE_SITE_KEY.trim() : '';
  const secretKey = typeof env.TURNSTILE_SECRET === 'string' ? env.TURNSTILE_SECRET.trim() : '';
  return json({
    enabled: Boolean(siteKey && secretKey),
    siteKey: siteKey || null
  });
}
