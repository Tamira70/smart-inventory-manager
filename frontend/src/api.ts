import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  saveAccessToken,
} from "./auth";

const API_BASE_URL = "";

let refreshPromise: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  const refresh = getRefreshToken();

  if (!refresh) {
    throw new Error("Kein Refresh-Token vorhanden.");
  }

  const response = await fetch(`${API_BASE_URL}/inventory-api/refresh/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ refresh }),
  });

  if (!response.ok) {
    throw new Error("Token-Refresh fehlgeschlagen.");
  }

  const data = await response.json();

  if (!data.access) {
    throw new Error("Kein neuer Access-Token zurückgegeben.");
  }

  saveAccessToken(data.access);
  return data.access;
}

async function getValidAccessTokenAfterRefresh(): Promise<string> {
  if (!refreshPromise) {
    refreshPromise = refreshAccessToken().finally(() => {
      refreshPromise = null;
    });
  }

  return refreshPromise;
}

export async function apiFetch(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  let token = getAccessToken();

  const makeRequest = async (accessToken: string | null) => {
    const headers = new Headers(options.headers || {});

    if (!headers.has("Content-Type") && options.body) {
      headers.set("Content-Type", "application/json");
    }

    if (accessToken) {
      headers.set("Authorization", `Bearer ${accessToken}`);
    }

    return fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers,
    });
  };

  let response = await makeRequest(token);

  if (response.status !== 401) {
    return response;
  }

  try {
    token = await getValidAccessTokenAfterRefresh();
    response = await makeRequest(token);

    if (response.status === 401) {
      clearTokens();
      throw new Error("Sitzung abgelaufen. Bitte erneut einloggen.");
    }

    return response;
  } catch {
    clearTokens();
    throw new Error("Sitzung abgelaufen. Bitte erneut einloggen.");
  }
}