export function escapeHtml(text) {
  if (!text) return "";
  const element = document.createElement("div");
  element.textContent = text;
  return element.innerHTML;
}

export function extractDomain(url) {
  if (!url) return "";
  try {
    if (!url.startsWith("http")) url = "https://" + url;
    return new URL(url).hostname.replace("www.", "");
  } catch {
    return url.replace("www.", "");
  }
}

// Clean bank transaction names into human-readable subscription names
export function cleanSubscriptionName(rawName) {
  let name = rawName
    .replace(/\*+/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\b(PURCHASE|POS|ACH|DEBIT|RECURRING|PAYMENT)\b/gi, "")
    .trim();

  const words = name.split(" ");
  for (let i = 0; i < words.length; i++) {
    if (words[i].length > 0) {
      words[i] = words[i].charAt(0).toUpperCase() + words[i].slice(1).toLowerCase();
    }
  }

  return words.join(" ").substring(0, 30);
}
