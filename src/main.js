const debug = require(`debug`)(`contentful-text-search`)
const ContentfulSyncRedis = require(`contentful-sync-redis`)
const ElasticsearchClient = require(`./elasticsearch-client`)
const Indexer = require(`./indexer`)
const Update = require(`./update`)
const transform = require(`./transform`)
const config = require(`./index-config`)

// TODO: add support for fallback locale codes
// NOTE: should we use space name instead of ID when creating index name?

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
    this.updater = new Update(space, contentfulHost, this.indexer)
    this.generatedQuery = false
  }

  async regenerateQuery() {
    try {
      const contentTypesResponse = await this.contentful.client.getContentTypes()
      const contentTypes = transform.reduceContentTypes(
        contentTypesResponse.items
      )
      this.generatedQuery = config.generateQuery(contentTypes)
      this.indexer.queryGeneratedSinceLastIndexChange = true
    } catch (err) {
      debug(`Error: failed generating query: %s`, err)
      throw new Error(err)
    }
  }

  async query(searchTerm, locale) {
    if (!searchTerm || !locale) {
      console.log(
        `Please provide the mandatory parameters searchTerm and locale when querying`
      )
      return {}
    }
    try {
      if (
        !this.generatedQuery ||
        !this.indexer.queryGeneratedSinceLastIndexChange
      ) {
        await this.regenerateQuery()
      }
      this.generatedQuery.query.multi_match.query = searchTerm
      const result = await this.elasticsearch.client.search({
        index: `contentful_${this.space}_${locale.toLowerCase()}`,
        body: this.generatedQuery,
      })
      return result
    } catch (err) {
      debug(`Error querying: %s`, err)
      throw new Error(err)
    }
  }
}
