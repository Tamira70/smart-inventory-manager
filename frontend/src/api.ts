import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  saveAccessToken,
} from "./auth";

const API_BASE_URL = "";

let refreshPromise: Promise<string> | null = null;

async function readJsonOrThrow(response: Response) {
  const contentType = response.headers.get("content-type") || "";
  const text = await response.clone().text();

  if (!text) {
    return null;
  }

  if (!contentType.includes("application/json")) {
    throw new Error(
      `Server hat kein JSON geliefert. Status: ${
        response.status
      }. Antwort beginnt mit: ${text.slice(0, 120)}`
    );
  }

  return JSON.parse(text);
}

async function refreshAccessToken(): Promise<string> {
  const refresh = getRefreshToken();

  if (!refresh) {
    throw new Error("Kein Refresh-Token vorhanden.");
  }

  const response = await fetch(`${API_BASE_URL}/inventory-api/token/refresh/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ refresh }),
  });

  const data = await readJsonOrThrow(response);

  if (!response.ok) {
    throw new Error("Token-Refresh fehlgeschlagen.");
  }

  if (!data?.access) {
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

  if (response.status === 401) {
    try {
      token = await getValidAccessTokenAfterRefresh();
      response = await makeRequest(token);

      if (response.status === 401) {
        clearTokens();
        throw new Error("Sitzung abgelaufen. Bitte erneut einloggen.");
      }
    } catch {
      clearTokens();
      throw new Error("Sitzung abgelaufen. Bitte erneut einloggen.");
    }
  }

  if (!response.ok) {
    await readJsonOrThrow(response);
  }

  return response;
}