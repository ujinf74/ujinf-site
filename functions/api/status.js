export function onRequestGet({ env }) {
  return Response.json(
    {
      ok: true,
      runtime: "cloudflare-pages-functions",
      database: Boolean(env.SITE_DB),
      updated_at: new Date().toISOString(),
    },
    {
      headers: {
        "cache-control": "no-store",
      },
    }
  );
}
