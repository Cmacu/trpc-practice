import z from "zod"

export const sharedSchema = z.object({
  name: z.coerce.string(),
  count: z.coerce.number(),
})

export type SharedInput = z.infer<typeof sharedSchema>

export type SharedOutput = ReturnType<typeof backendFunction>

export const backendFunction = (shared: SharedInput) => {
  console.log("Backend function", shared)
  return { message: `Hi ${shared.name}, Remotely Yours, Backend.`, count: shared.count }
}
