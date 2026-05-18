const ACCESS_TOKEN_KEY = "rf_access_token";
const REFRESH_TOKEN_KEY = "rf_refresh_token";

export function saveTokens(
  accessToken: string,
  refreshToken: string
) {
  localStorage.setItem(
    ACCESS_TOKEN_KEY,
    accessToken
  );

  localStorage.setItem(
    REFRESH_TOKEN_KEY,
    refreshToken
  );
}

export function getAccessToken() {
  return localStorage.getItem(
    ACCESS_TOKEN_KEY
  );
}

export function getRefreshToken() {
  return localStorage.getItem(
    REFRESH_TOKEN_KEY
  );
}

export function clearTokens() {
  localStorage.removeItem(
    ACCESS_TOKEN_KEY
  );

  localStorage.removeItem(
    REFRESH_TOKEN_KEY
  );
}

export async function refreshAccessToken() {
  const refreshToken =
    getRefreshToken();

  if (!refreshToken) {
    return null;
  }

  const API_BASE =
    import.meta.env.VITE_API_URL ||
    "http://127.0.0.1:8000";

  const formData = new FormData();

  formData.append(
    "refresh_token",
    refreshToken
  );

  try {
    const response = await fetch(
      `${API_BASE}/api/v1/auth/refresh`,
      {
        method: "POST",
        body: formData,
      }
    );

    if (!response.ok) {
      clearTokens();
      return null;
    }

    const data = await response.json();

    if (data.access_token) {
      localStorage.setItem(
        ACCESS_TOKEN_KEY,
        data.access_token
      );

      return data.access_token;
    }

    return null;
  } catch {
    clearTokens();
    return null;
  }
}