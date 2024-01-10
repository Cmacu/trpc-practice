import { useState, useEffect } from "react"
import "./App.css"
import { SharedOutput, backendFunction, sharedSchema } from "@backend/shared"
import { createTRPCProxyClient, httpBatchLink } from "@trpc/client"
import type { TrpcRouter } from "@backend/trpc"

const trpcClient = createTRPCProxyClient<TrpcRouter>({
  links: [
    httpBatchLink({
      url: "http://localhost:5555/trpc",
    }),
  ],
})

const useSharedApi = (count: number) => {
  const [apiResponse, setApiResponse] = useState<SharedOutput | null>(null)

  const fetchShared = async () => {
    const data = sharedSchema.parse({ name: "Frontend", count })
    const query = new URLSearchParams({ name: data.name, count: data.count.toString() }).toString()
    const response = await fetch(`http://localhost:5555/shared?${query.toString()}`)
    const responseData = await response.json()
    setApiResponse(responseData)
  }

  const fetchTrpc = async () => {
    const data = await trpcClient.hello.query({ name: "Frontend", count })
    setApiResponse(data)
  }

  useEffect(() => {
    // void fetchShared()
    void fetchTrpc()
  }, [count])
  return apiResponse
}

function App() {
  const [count, setCount] = useState(0)
  const response = backendFunction({ name: "Frontend", count })

  const apiResponse = useSharedApi(count)

  return (
    <>
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
      <div className='card'>
        <button onClick={() => setCount((count) => count + 1)}>count is {count}</button>
        <p>
          Frontend Response: {response.message} {response.count}
        </p>
        <p>
          Backend Response: {apiResponse?.message} {apiResponse?.count}
        </p>
      </div>
    </>
  )
}

export default App
