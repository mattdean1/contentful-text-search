const redis = require(`redis`)
const { promisify } = require(`util`)

const client = redis.createClient(
  process.env.REDIS_URL || `redis://localhost:6379`
)
client.on(`error`, function(err) {
  console.log(`Redis error ` + err)
})

/*
  Promisify some Redis operations
  now we can await client.exampleAsync
*/

module.exports = {
  client,
  getAsync: promisify(client.get),
  setAsync: promisify(client.set),
  delAsync: promisify(client.del),
  keysAsync: promisify(client.keys),
  mgetAsync: promisify(client.mget),
}
