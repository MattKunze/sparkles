import crypto from "crypto";

import { sharedConfig } from "@/config";
import { OauthConfig, OauthEnvironment, OauthState } from "@/types";

import { getDb, makeDbKey } from "./surreal";

type PkceChallenge = {
  codeVerifier: string;
  codeChallenge: string;
  environmentId: string;
  timestamp: number;
};

export async function storePkceChallenge({
  state,
  environmentId,
}: {
  state: string;
  environmentId: string;
}) {
  const codeVerifier = crypto.randomBytes(64).toString("hex");
  const codeChallenge = crypto
    .createHash("sha256")
    .update(codeVerifier)
    .digest("base64")
    .replace(/\//g, "_")
    .replace(/\+/g, "-")
    .replace(/=/g, "");

  const challenge = {
    codeVerifier,
    codeChallenge,
    environmentId,
    timestamp: Date.now(),
  };

  const db = await getDb();
  await db.update<PkceChallenge>(makeDbKey("pkce", state), challenge);

  return challenge;
}

export async function loadPkceChallenge(
  state: string
): Promise<PkceChallenge | undefined> {
  const db = await getDb();
  const key = makeDbKey("pkce", state);
  const [challenge] = await db.select<PkceChallenge>(key);
  if (challenge) {
    await db.delete(key);
  }

  return challenge;
}

export async function fetchAccessToken(
  config: OauthConfig,
  code: string,
  codeVerifier: string
): Promise<OauthState> {
  const params = new URLSearchParams({
    grant_type: "authorization_code",
    code: String(code),
    code_verifier: codeVerifier,
    redirect_uri: `${sharedConfig.WEB_ENDPOINT}/api/oauth_callback`,
  });
  const tokenResponse = await fetch(config.tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${btoa(
        [config.clientId, config.clientSecret].join(":")
      )}`,
    },
    body: params.toString(),
  });
  if (!tokenResponse.ok) {
    console.error(await tokenResponse.text());
    throw new Error(tokenResponse.statusText);
  }

  const {
    access_token: accessToken,
    refresh_token: refreshToken,
    expires_in,
  } = (await tokenResponse.json()) as {
    access_token: string;
    refresh_token: string;
    expires_in: number;
  };

  return {
    accessToken,
    refreshToken,
    expires: new Date(Date.now() + expires_in * 1000),
  };
}

export async function refreshAccessToken(
  environment: OauthEnvironment
): Promise<OauthState> {
  if (!environment.state?.refreshToken) {
    throw new Error("Invalid environment");
  }

  const params = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: environment.state.refreshToken,
    client_id: environment.config.clientId,
    client_secret: environment.config.clientSecret,
  });

  const tokenResponse = await fetch(environment.config.tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });
  if (!tokenResponse.ok) {
    console.error(await tokenResponse.text());
    throw new Error(tokenResponse.statusText);
  }

  const {
    access_token: accessToken,
    refresh_token: refreshToken,
    expires_in,
  } = (await tokenResponse.json()) as {
    access_token: string;
    refresh_token: string;
    expires_in: number;
  };

  return {
    accessToken,
    refreshToken,
    expires: new Date(Date.now() + expires_in * 1000),
  };
}
