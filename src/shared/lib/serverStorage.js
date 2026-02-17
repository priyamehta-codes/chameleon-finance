const SERVER_TOKEN_KEY = 'subgrid_server_token';
const TOKEN_PATTERN = /^[a-f0-9]{64}$/i;

function parseJsonResponse(response) {
  return response
    .json()
    .catch(() => ({ error: `HTTP ${response.status}` }));
}

export function isValidServerToken(token) {
  return TOKEN_PATTERN.test((token || '').trim());
}

export function getServerToken() {
  return localStorage.getItem(SERVER_TOKEN_KEY) || '';
}

export function saveServerToken(token) {
  const trimmed = (token || '').trim();
  if (!trimmed) {
    localStorage.removeItem(SERVER_TOKEN_KEY);
    return;
  }
  localStorage.setItem(SERVER_TOKEN_KEY, trimmed);
}

export async function backupToServer(token, payload) {
  const normalizedToken = (token || '').trim();
  if (!isValidServerToken(normalizedToken)) {
    throw new Error('Token must be a 64-character hexadecimal string');
  }

  const response = await fetch('/api/r2/backup', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-User-Token': normalizedToken,
    },
    body: JSON.stringify(payload),
  });

  const data = await parseJsonResponse(response);
  if (!response.ok) {
    throw new Error(data.error || `Backup failed (${response.status})`);
  }
  return data;
}

export async function restoreFromServer(token) {
  const normalizedToken = (token || '').trim();
  if (!isValidServerToken(normalizedToken)) {
    throw new Error('Token must be a 64-character hexadecimal string');
  }

  const response = await fetch('/api/r2/backup', {
    method: 'GET',
    headers: {
      'X-User-Token': normalizedToken,
    },
  });

  const data = await parseJsonResponse(response);
  if (!response.ok) {
    throw new Error(data.error || `Restore failed (${response.status})`);
  }
  return data;
}
