const DOMAIN_PATTERN =
  /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/i;

export function normalizeDomain(input) {
  if (!input || typeof input !== 'string') return null;

  const trimmed = input.trim().toLowerCase();
  if (!trimmed) return null;

  const withoutProtocol = trimmed.replace(/^https?:\/\//, '');
  const withoutWww = withoutProtocol.replace(/^www\./, '');
  const domain = withoutWww.split('/')[0].split('?')[0].split('#')[0].trim();

  if (!domain || domain.length < 4 || !DOMAIN_PATTERN.test(domain)) {
    return null;
  }
  return domain;
}

export function getLogoProxyUrl(domainOrUrl) {
  const domain = normalizeDomain(domainOrUrl);
  if (!domain) return null;
  return `/api/logo/${encodeURIComponent(domain)}`;
}
