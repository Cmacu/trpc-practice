import express from "express"
import cors from "cors"
import { backendFunction, sharedSchema } from "./shared"
import { trpcMiddleware } from "./trpc"

const router = express()
router.use(cors())

router.get("/", (req, res) => {
  res.send("Hello World")
})

router.get("/shared", (req, res) => {
  const data = sharedSchema.parse(req.query)
  const response = backendFunction(data)
  res.json(response)
})

router.use("/trpc", trpcMiddleware)

router.listen(5555, () => console.log("Server is running http://localhost:5555"))
