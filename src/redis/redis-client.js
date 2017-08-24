import redis from "redis"
import { promisify } from "util"

const client = redis.createClient(
  process.env.REDIS_URL || `redis://localhost:6379`
)
client.on(`error`, function(err) {
  console.log(`Redis error ` + err)
})
export default client

/*
  Promisify some Redis operations
  e.g. export const exampleAsync = promisify(client.example)
  now we can await client.exampleAsync
*/

const promisifyAll = (obj, arr) => {
  arr.map(prop => promisify(obj[prop]))
}
export const {
  getAsync,
  setAsync,
  delAsync,
  keysAsync,
  mgetAsync,
} = promisifyAll(client, [`get`, `set`, `del`, `keys`, `mget`])
