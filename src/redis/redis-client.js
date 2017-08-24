const debug = require(`debug`)(`contentful-text-search:redis`)
const redis = require(`redis`)
const bluebird = require(`bluebird`)

/*
  Promisify some Redis operations
  now we can e.g. await client.getAsync
*/
bluebird.promisifyAll(redis.RedisClient.prototype)

const client = redis.createClient(
  process.env.REDIS_URL || `redis://localhost:6379`
)
client.on(`error`, function(err) {
  debug(err)
})

module.exports = client
