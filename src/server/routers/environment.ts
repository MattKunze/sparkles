import { ulid } from "ulid";
import { z } from "zod";

import {
  deleteEnvironment,
  getEnvironments,
  updateEnvironment,
} from "@/server/db";
import { Environment } from "@/types";

import { procedure, router } from "../trpc";

export const environmentRouter = router({
  list: procedure.query((opts) => getEnvironments(opts.ctx)),
  create: procedure
    .input(z.object({ name: z.string() }))
    .mutation(async (opts) => {
      const env: Environment = {
        id: ulid(),
        name: opts.input.name,
        owner: opts.ctx.session.user.email,
        variables: {},
      };
      await updateEnvironment(opts.ctx, env);
      return getEnvironments(opts.ctx);
    }),
  update: procedure
    .input(
      z.object({
        id: z.string(),
        name: z.string(),
        variables: z.record(
          z.object({
            type: z.enum(["plain", "secret"]),
            value: z.string(),
          })
        ),
      })
    )
    .mutation((opts) => {
      const env: Environment = {
        id: opts.input.id,
        name: opts.input.name,
        owner: opts.ctx.session.user.email,
        variables: opts.input.variables,
      };
      return updateEnvironment(opts.ctx, env);
    }),
  delete: procedure
    .input(z.object({ id: z.string() }))
    .mutation(async (opts) => {
      await deleteEnvironment(opts.ctx, opts.input.id);
      return opts.input.id;
    }),
});
