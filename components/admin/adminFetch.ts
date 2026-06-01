/**
 * Client-side fetch wrapper for admin API calls.
 *
 * - Always sends cookies (`credentials: "include"` not needed for same-origin,
 *   but explicit for clarity).
 * - On 401 response, attempts a single silent `/auth/refresh` and retries the
 *   original request. Avoids the "edit returns unauthenticated" UX trap when
 *   the 15-minute access token expires mid-session.
 * - Returns the raw Response so callers can handle .json() and status codes
 *   the same way they would for `fetch`.
 */

export async function adminFetch(
  input: string,
  init: RequestInit = {},
): Promise<Response> {
  const res = await fetch(input, { credentials: "same-origin", ...init });
  if (res.status !== 401) return res;

  // Try one silent refresh, then retry.
  const refresh = await fetch("/api/v1/auth/refresh", {
    method: "POST",
    credentials: "same-origin",
  });
  if (!refresh.ok) return res;

  return fetch(input, { credentials: "same-origin", ...init });
}
