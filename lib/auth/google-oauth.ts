import { createRemoteJWKSet, jwtVerify } from "jose";
import { env } from "@/lib/env";

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_JWKS = createRemoteJWKSet(
  new URL("https://www.googleapis.com/oauth2/v3/certs"),
);

export function buildGoogleAuthUrl(state: string): string {
  if (
    !env.GOOGLE_OAUTH_CLIENT_ID ||
    !env.GOOGLE_OAUTH_CLIENT_SECRET ||
    !env.GOOGLE_OAUTH_REDIRECT_URI
  ) {
    throw new Error("google oauth is not configured");
  }

  const url = new URL(GOOGLE_AUTH_URL);
  url.searchParams.set("client_id", env.GOOGLE_OAUTH_CLIENT_ID);
  url.searchParams.set("redirect_uri", env.GOOGLE_OAUTH_REDIRECT_URI);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "openid email profile");
  url.searchParams.set("state", state);
  url.searchParams.set("prompt", "select_account");
  return url.toString();
}

type GoogleTokenResponse = {
  id_token: string;
};

type GoogleIdentity = {
  sub: string;
  email: string;
  email_verified?: boolean;
  name?: string;
};

export async function exchangeCodeAndGetIdentity(code: string): Promise<GoogleIdentity> {
  if (
    !env.GOOGLE_OAUTH_CLIENT_ID ||
    !env.GOOGLE_OAUTH_CLIENT_SECRET ||
    !env.GOOGLE_OAUTH_REDIRECT_URI
  ) {
    throw new Error("google oauth is not configured");
  }

  const body = new URLSearchParams({
    code,
    client_id: env.GOOGLE_OAUTH_CLIENT_ID,
    client_secret: env.GOOGLE_OAUTH_CLIENT_SECRET,
    redirect_uri: env.GOOGLE_OAUTH_REDIRECT_URI,
    grant_type: "authorization_code",
  });

  const tokenRes = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
    cache: "no-store",
  });
  if (!tokenRes.ok) {
    throw new Error("failed to exchange oauth code");
  }

  const tokenJson = (await tokenRes.json()) as Partial<GoogleTokenResponse>;
  if (!tokenJson.id_token) {
    throw new Error("missing id_token from google");
  }

  const verified = await jwtVerify(tokenJson.id_token, GOOGLE_JWKS, {
    audience: env.GOOGLE_OAUTH_CLIENT_ID,
    issuer: ["https://accounts.google.com", "accounts.google.com"],
  });

  const payload = verified.payload;
  const email = typeof payload.email === "string" ? payload.email : "";
  if (!email) {
    throw new Error("google account email is missing");
  }

  return {
    sub: typeof payload.sub === "string" ? payload.sub : "",
    email,
    email_verified: Boolean(payload.email_verified),
    name: typeof payload.name === "string" ? payload.name : undefined,
  };
}
