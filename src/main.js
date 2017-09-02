const debug = require(`debug`)(`contentful-text-search`)
const ContentfulSyncRedis = require(`contentful-sync-redis`)
const ElasticsearchClient = require(`./elasticsearch-client`)
const Indexer = require(`./indexer`)

// TODO: add support for fallback locale codes
// NOTE: should we use space name instead of ID when creating index name?
const log = obj => {
  console.log(JSON.stringify(obj, null, 2))
}

module.exports = class ContentfulTextSearch {
  constructor(args) {
    const { space, token, contentfulHost, redisHost } = args
    this.space = space
    this.contentful = new ContentfulSyncRedis({
      space,
      token,
      contentfulHost,
      redisHost,
    })
    this.elasticsearch = new ElasticsearchClient({
      host: args.elasticHost,
      user: args.elasticUser,
      password: args.elasticPassword,
      logLevel: args.elasticLogLevel,
    })
    this.indexer = new Indexer(space, this.contentful, this.elasticsearch)
  }
}
