export const EnvironmentTypes = ["kvp", "oauth"] as const;
export type EnvironmentType = (typeof EnvironmentTypes)[number];

export type KvpEnvironment = {
  id: string;
  name: string;
  owner: string;
  type: "kvp";
  variables: Record<string, { type: "plain" | "secret"; value: string }>;
};

export const GrantTypes = [
  "authorization_code",
  "client_credentials",
  "password_realm",
] as const;
export type GrantType = (typeof GrantTypes)[number];

export type OauthConfig = {
  grantType: GrantType;
  authorizeUrl: string;
  tokenUrl: string;
  clientId: string;
  clientSecret: string;
  audience?: string;
  scope?: string;
};

export type OauthState = {
  accessToken: string;
  refreshToken?: string;
  scope?: string;
  expires?: Date;
};

export type OauthEnvironment = {
  id: string;
  name: string;
  owner: string;
  type: "oauth";
  config: OauthConfig;
  state?: OauthState;
};

export type Environment = KvpEnvironment | OauthEnvironment;
