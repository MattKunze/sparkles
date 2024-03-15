import { NextRequest } from "next/server";

import { sharedConfig } from "@/config";
import {
  getEnvironmentPriviledged,
  updateEnvironmentPriviledged,
} from "@/server/db";
import { fetchAccessToken, loadPkceChallenge } from "@/server/db/oauth";

export async function GET(request: NextRequest) {
  const state = String(request.nextUrl.searchParams.get("state"));
  const code = String(request.nextUrl.searchParams.get("code"));

  const challenge = await loadPkceChallenge(String(state));
  if (!challenge) {
    throw new Error("Invalid state");
  }

  const environment = await getEnvironmentPriviledged(challenge.environmentId);
  if (environment?.type !== "oauth") {
    throw new Error("Invalid environment");
  }

  const oauthState = await fetchAccessToken(
    environment.config,
    code,
    challenge.codeVerifier
  );
  const updated = { ...environment, state: oauthState };
  await updateEnvironmentPriviledged(updated);

  // process was initiated via a new/popup window so close to return
  return Response.redirect(new URL("/close-window", sharedConfig.WEB_ENDPOINT));
}
