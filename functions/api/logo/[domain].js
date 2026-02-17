const DOMAIN_PATTERN =
  /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/i;

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
  });
}

export async function onRequestGet(context) {
  const token = context.env.LOGO_DEV_API_TOKEN;
  if (!token) {
    return json({ error: "Logo proxy is not configured" }, 503);
  }

  let rawDomain = context.params.domain || "";
  try {
    rawDomain = decodeURIComponent(rawDomain);
  } catch {
    return json({ error: "Invalid domain encoding" }, 400);
  }
  rawDomain = rawDomain.toLowerCase();
  const domain = rawDomain.replace(/^www\./, "").trim();
  if (!DOMAIN_PATTERN.test(domain)) {
    return json({ error: "Invalid domain" }, 400);
  }

  const upstreamUrl = new URL(`https://img.logo.dev/${domain}`);
  upstreamUrl.searchParams.set("token", token);
  upstreamUrl.searchParams.set("size", "100");
  upstreamUrl.searchParams.set("retina", "true");
  upstreamUrl.searchParams.set("format", "png");

  const upstream = await fetch(upstreamUrl.toString(), {
    cf: {
      cacheEverything: true,
      cacheTtl: 86400,
    },
  });

  if (!upstream.ok) {
    return json({ error: "Logo fetch failed" }, upstream.status === 404 ? 404 : 502);
  }

  const headers = new Headers();
  headers.set("Content-Type", upstream.headers.get("content-type") || "image/png");
  headers.set("Cache-Control", "public, max-age=86400");

  return new Response(upstream.body, {
    status: 200,
    headers,
  });
}
