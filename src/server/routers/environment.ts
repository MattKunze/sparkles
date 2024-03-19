import crypto from "crypto";
import { ulid } from "ulid";
import { z } from "zod";

import { sharedConfig } from "@/config";
import {
  deleteEnvironment,
  getEnvironment,
  getEnvironments,
  updateEnvironment,
} from "@/server/db";
import {
  fetchClientAccessToken,
  refreshAccessToken,
  storePkceChallenge,
} from "@/server/db/oauth";
import { Environment, EnvironmentTypes, GrantTypes } from "@/types";

import { procedure, router } from "../trpc";

const UpdateBaseSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(["kvp", "oauth"]),
});
const UpdateKvpSchema = z.object({
  type: z.literal("kvp"),
  variables: z.record(
    z.object({
      type: z.enum(["plain", "secret"]),
      value: z.string(),
    })
  ),
});
const UpdateOauthSchema = z.object({
  type: z.literal("oauth"),
  config: z.object({
    authorizeUrl: z.string(),
    tokenUrl: z.string(),
    clientId: z.string(),
    clientSecret: z.string(),
    scope: z.string(),
  }),
});

const UpdateSchema = UpdateBaseSchema.and(
  z.union([UpdateKvpSchema, UpdateOauthSchema])
);
type T = z.infer<typeof UpdateSchema>;

export const environmentRouter = router({
  list: procedure.query((opts) => getEnvironments(opts.ctx)),
  create: procedure
    .input(z.object({ name: z.string(), type: z.enum(EnvironmentTypes) }))
    .mutation(async (opts) => {
      const env = {
        id: ulid(),
        name: opts.input.name,
        owner: opts.ctx.session.user.email,
        type: opts.input.type,
        ...(opts.input.type === "kvp" && {
          variables: {},
        }),
        ...(opts.input.type === "oauth" && {
          config: {
            authorizeUrl: "",
            tokenUrl: "",
            clientId: "",
            clientSecret: "",
            scope: "",
          },
        }),
      } as Environment;
      await updateEnvironment(opts.ctx, env);
      return getEnvironments(opts.ctx);
    }),
  update: procedure
    .input(
      z
        .object({
          id: z.string(),
          name: z.string(),
        })
        .and(
          z.union([
            z.object({
              type: z.literal("kvp"),
              variables: z.record(
                z.object({
                  type: z.enum(["plain", "secret"]),
                  value: z.string(),
                })
              ),
            }),
            z.object({
              type: z.literal("oauth"),
              config: z.object({
                grantType: z.enum(GrantTypes),
                authorizeUrl: z.string(),
                tokenUrl: z.string(),
                clientId: z.string(),
                clientSecret: z.string(),
                scope: z.string().optional(),
                audience: z.string().optional(),
              }),
            }),
          ])
        )
    )
    .mutation((opts) => {
      const env: Environment =
        opts.input.type === "kvp"
          ? {
              id: opts.input.id,
              name: opts.input.name,
              owner: opts.ctx.session.user.email,
              type: "kvp",
              variables: opts.input.variables,
            }
          : {
              id: opts.input.id,
              name: opts.input.name,
              owner: opts.ctx.session.user.email,
              type: "oauth",
              config: opts.input.config,
            };
      return updateEnvironment(opts.ctx, env);
    }),
  delete: procedure
    .input(z.object({ id: z.string() }))
    .mutation(async (opts) => {
      await deleteEnvironment(opts.ctx, opts.input.id);
      return opts.input.id;
    }),
  authorize: procedure
    .input(z.object({ id: z.string(), password: z.string().optional() }))
    .mutation(async (opts) => {
      const env = await getEnvironment(opts.ctx, opts.input.id);
      if (env?.type !== "oauth") {
        throw new Error("Invalid environment");
      }

      switch (env.config.grantType) {
        case "authorization_code": {
          const state = crypto.randomBytes(16).toString("hex");

          const { codeChallenge } = await storePkceChallenge({
            state,
            environmentId: env.id,
          });

          const params = new URLSearchParams({
            response_type: "code",
            client_id: env.config.clientId,
            scope: env.config.scope ?? "",
            code_challenge_method: "S256",
            code_challenge: codeChallenge,
            state,
            redirect_uri: `${sharedConfig.WEB_ENDPOINT}/api/oauth_callback`,
          });

          return {
            authorizeUrl: `${env.config.authorizeUrl}?${params.toString()}`,
          };
        }
        case "client_credentials": {
          const state = await fetchClientAccessToken(env.config);
          const updated = { ...env, state };
          await updateEnvironment(opts.ctx, updated);
          return updated;
        }
        case "password_realm": {
          throw new Error("Not implemented");
        }
      }
    }),
  clearAuthState: procedure
    .input(z.object({ id: z.string() }))
    .mutation(async (opts) => {
      const env = await getEnvironment(opts.ctx, opts.input.id);
      if (env?.type !== "oauth") {
        throw new Error("Invalid environment");
      }
      const updated = { ...env, state: undefined };
      await updateEnvironment(opts.ctx, updated);
      return updated;
    }),
  refreshAccessToken: procedure
    .input(z.object({ id: z.string() }))
    .mutation(async (opts) => {
      const env = await getEnvironment(opts.ctx, opts.input.id);
      if (env?.type !== "oauth" || !env.state?.refreshToken) {
        throw new Error("Invalid environment");
      }

      const state = await refreshAccessToken(env);
      const updated = { ...env, state };
      await updateEnvironment(opts.ctx, updated);
      return updated;
    }),
});
