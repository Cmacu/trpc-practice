
# DEMO 1: Project Setup

```
cd ~/Projects/Personal
mkdir trpc-demo
cd trpc-demo
yarn init -p -y
mkdir backend
cd backend
yarn init -p -y
yarn add -D typescript
yarn tsc --init
yarn add express cors
yarn add -D @types/express @types/cors
yarn add -D tsx
cd ../
yarn create vite
cd frontend
yarn
code ../
```

## Backend

### backend/src/server.ts

```
import express from "express"
import cors from "cors"

const router = express()
router.use(cors())

router.get("/", (req, res) => {
  res.send("Hello World")
})

router.listen(5555, () => console.log("Server is running http://localhost:5555"))
```

### backend/package.json

```
"scripts": {
  "dev": "NODE_PATH=./src yarn tsx watch src/server.ts",
  "start": "NODE_PATH=./dist node dist/server.js",
  "build": "yarn tsc"
}
```

### Terminal

```
cd backend && yarn dev
```

## Frontend

### frontend/index.html

```
<head>
  <meta charset="UTF-8" />
  <link rel="icon" type="image/svg+xml"
    href="https://secure.meetupstatic.com/photos/event/9/f/2/d/clean_469240749.webp" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>San Diego + TS</title>
</head>
```

### frontend/src/App.tsx

```
<div>
  <a href='https://sandiegojs.org' target='_blank'>
    <img
      src='https://secure.meetupstatic.com/photos/event/9/f/2/d/clean_469240749.webp'
      className='logo'
      alt='SanDiego TS logo'
    />
  </a>
</div>
<h2>San Diego TypeScript Community</h2>
```

### Terminal

```
cd frontend && yarn dev
```

### package.json

```
"scripts": {
  "dev:frontend": "cd frontend && yarn dev",
  "dev:backend": "cd backend && yarn dev",
  "dev": "yarn dev:frontend & yarn dev:backend"
}
```

## Basic TypeScript Sharing

### /backend/src/shared.ts

```
export type SharedInput = {
  name: string
  count: number
}

export const backendFunction = (shared: SharedInput) => {
  console.log("Backend function", shared)
  return { message: `Hi ${shared.name}, Remotely Yours, Backend.`, count: shared.count }
}
```

### /frontend/src/App.tsx

```
const response = backendFunction({ name: "Stasi", count })
```

### /frontend/tsconfig.json

```
"references": [{ "path": "../backend/tsconfig.json" }],
"paths": {
  "@backend/*": ["../backend/src/*"]
}
```

### /backend/tsconfig.json

```
composite: true,
```

### frontend/vite.config.ts

```
import tsconfigPaths from "vite-tsconfig-paths"

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [tsconfigPaths(), react()],
})
```

## Convert to HTTP

### Update backend/server.ts

```
router.get("/shared", (req, res) => {
  const response = backendFunction(req.query as any)
  res.json(response)
})
```

### Update backend/src/shared.ts

```
import z from "zod"

export const sharedSchema = z.object({
  name: z.coerce.string(),
  count: z.coerce.number(),
})

export type SharedInput = z.infer<typeof sharedSchema>
export type SharedOutput = ReturnType<typeof backendFunction>

// use sharedSchema on server
```

### frontend/src/App.tsx

```
const useSharedApi = (count: number) => {
  const [apiResponse, setApiResponse] = useState<SharedOutput | null>(null)

  const fetchShared = async () => {
    const data = sharedSchema.parse({ name: "Frontend", count })
    const query = new URLSearchParams({ name: data.name, count: data.count.toString() }).toString()
    const response = await fetch(`http://localhost:5555/shared?${query.toString()}`)
    const responseData = await response.json()
    setApiResponse(responseData)
  }
  useEffect(() => {
    void fetchShared()
  }, [count])
  return apiResponse
}
```

# DEMO 2: TRPC setup

## TRPC Backend

### terminal

```
cd backend
yarn add @trpc/server
```

### backend/src/trpc.ts
```
import { initTRPC } from "@trpc/server"
import { backendFunction, sharedSchema } from "./shared"
import { createExpressMiddleware } from "@trpc/server/adapters/express"

const trpc = initTRPC.create()

const trpcRouter = trpc.router({
  hello: trpc.procedure.input(sharedSchema).query(({ input }) => {
    return backendFunction(input)
  }),
})

export type TrpcRouter = typeof trpcRouter

export const trpcMiddleware = createExpressMiddleware({ router: trpcRouter })
```

### backend/src/server.ts

```
router.use("/trpc", trpcMiddleware)
```

## TRPC Frontend

### terminal

```
cd ../frontend
yarn add @trpc/client
```

### frontend/src/App.tsx

```
const trpcClient = createTRPCProxyClient<TrpcRouter>({
  links: [
    httpBatchLink({
      url: "http://localhost:5555/trpc",
    }),
  ],
})

// inside useSharedApi
const fetchTrpc = async () => {
  const data = await trpcClient.hello.query({ name: "Frontend", count })
  setApiResponse(data)
}
```

### Demo advantages

- input type checking
- output type
- refactoring
- build errors


# DEMO 3: TRPC Authentication flow

## Authentication Backend

### terminal

```
cd ../backend
yarn add jsonwebtoken
yarn add -D @types/jsonwebtoken
```

### backend/src/auth.ts

```
import jwt from "jsonwebtoken"

// spell-checker: disable-next-line
const TOKEN_SECRET = "sandiegojsmeetup" // 16 characters
const ACCESS_EXPIRATION = 5 * 60 * 1000 // 5 minutes
const REFRESH_EXPIRATION = 24 * 60 * 60 * 1000 // 24 hours

export type TokenData = {
  name?: string
  isAdmin?: boolean
}

const generateToken = (data: TokenData, expiresIn: number) => jwt.sign(data, TOKEN_SECRET, { expiresIn })

export const getTokens = (data: TokenData) => {
  return {
    ...data,
    exp: Date.now() + ACCESS_EXPIRATION,
    accessToken: generateToken(data, ACCESS_EXPIRATION),
    refreshToken: generateToken(data, REFRESH_EXPIRATION),
  }
}
export type Session = ReturnType<typeof getTokens>

export const parseToken = (token: string) => {
  try {
    return jwt.verify(token, TOKEN_SECRET) as TokenData
  } catch (error) {
    console.error("parse token error", error)
    throw new Error("Invalid token. Please login again.")
  }
}
```

### backend/src/trpc.ts

```
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
```

## Authentication Frontend

### frontend/src/session.ts
```

```

### App.tsx

```
```

## Backend TRPC Private router

### backend/src/trpc.ts

```
```

## Frontend TRPC Private router

### frontend/src/App.tsx

```
```