const debug = require(`debug`)(`contentful-text-search`)
const ContentfulSyncRedis = require(`contentful-sync-redis`)
const ElasticsearchClient = require(`./elasticsearch-client`)
const Indexer = require(`./indexer`)
const transform = require(`./transform`)
const config = require(`./index-config`)

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
    this.generatedQuery = false
  }

  async regenerateQuery() {
    const contentTypesResponse = await this.contentful.client.getContentTypes()
    const contentTypes = transform.reduceContentTypes(
      contentTypesResponse.items
    )
    this.generatedQuery = config.generateQuery(contentTypes)
    this.indexer.queryGeneratedSinceLastIndexChange = true
  }

  async query(searchTerm, locale) {
    if (
      !this.generatedQuery ||
      !this.indexer.queryGeneratedSinceLastIndexChange
    ) {
      await this.regenerateQuery()
    }
    this.generatedQuery.query.bool.must[0].multi_match.query = searchTerm
    const result = await this.elasticsearch.client.search({
      index: `contentful_${this.space}_${locale.toLowerCase()}`,
      body: this.generatedQuery,
    })
    log(result)
  }
}
