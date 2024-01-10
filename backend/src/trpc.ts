import { initTRPC } from "@trpc/server"
import z from "zod"
import { backendFunction, sharedSchema } from "./shared"
import { createExpressMiddleware } from "@trpc/server/adapters/express"
import { getTokens } from "./auth"

const trpc = initTRPC.create()

const trpcRouter = trpc.router({
  hello: trpc.procedure.input(sharedSchema).query(({ input }) => {
    return backendFunction(input)
  }),
  authorize: trpc.procedure
    .input(
      z.object({
        name: z.string(),
        password: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      const response = getTokens({
        name: input.name,
        isAdmin: true,
      })
      return response
    }),
})

export type TrpcRouter = typeof trpcRouter

export const trpcMiddleware = createExpressMiddleware({ router: trpcRouter })
